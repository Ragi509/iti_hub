const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { recalculateStock, calculateFifoBatches } = require('../utils/stockHelper');

// GET /api/requisitions (List all requisitions with line items)
router.get('/', async (req, res) => {
  try {
    const { department, status, requested_by } = req.query;
    let sql = 'SELECT * FROM requisitions WHERE 1=1';
    const params = [];

    if (department && department !== 'all') {
      sql += ' AND department = ?';
      params.push(department);
    }
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (requested_by) {
      sql += ' AND requested_by = ?';
      params.push(requested_by);
    }

    sql += ' ORDER BY created_at DESC, id DESC';
    const requisitions = await db.all(sql, params);

    // Attach requisition items with item details
    for (const reqObj of requisitions) {
      const items = await db.all(
        `SELECT ri.*, i.name as item_name, i.unit, i.current_stock, i.register_type, i.category 
         FROM requisition_items ri 
         JOIN items i ON ri.item_id = i.id 
         WHERE ri.requisition_id = ?`,
        [reqObj.id]
      );
      reqObj.items = items;
    }

    res.json({ success: true, requisitions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/requisitions/:id (Single requisition with FIFO stock suggestion details)
router.get('/:id', async (req, res) => {
  try {
    const requisition = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    if (!requisition) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    const items = await db.all(
      `SELECT ri.*, i.name as item_name, i.unit, i.current_stock, i.register_type, i.category, i.price_per_unit 
       FROM requisition_items ri 
       JOIN items i ON ri.item_id = i.id 
       WHERE ri.requisition_id = ?`,
      [req.params.id]
    );

    // Calculate FIFO batch suggestions for storekeeper issue review
    for (const item of items) {
      item.fifo_suggestion = await calculateFifoBatches(item.item_id, item.quantity_requested);
    }

    requisition.items = items;
    res.json({ success: true, requisition });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/requisitions (Create new requisition)
// Business Rule 7: Instructor-initiated only
// Business Rule 5: Insufficient stock marks in_stock_flag = false without blocking requisition
router.post('/', async (req, res) => {
  try {
    const { department, requested_by, job_or_practical, student_count = 1, items } = req.body;

    if (!department || !requested_by || !job_or_practical || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Department, requested_by, job_or_practical, and non-empty items array are required'
      });
    }

    // Insert requisition header
    const resReq = await db.query(
      `INSERT INTO requisitions (department, requested_by, job_or_practical, student_count, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [department, requested_by, job_or_practical, Number(student_count)]
    );

    const requisitionId = resReq.lastID;

    // Process line items & check stock availability
    for (const line of items) {
      const item = await db.get('SELECT current_stock FROM items WHERE id = ?', [line.item_id]);
      const currentStock = item ? item.current_stock : 0;
      const requestedQty = Number(line.quantity_requested);

      // Business Rule 5: Mark in_stock_flag = 0 if insufficient stock, but do NOT block requisition creation
      const inStockFlag = (currentStock >= requestedQty) ? 1 : 0;

      await db.query(
        `INSERT INTO requisition_items (requisition_id, item_id, quantity_requested, quantity_issued, in_stock_flag)
         VALUES (?, ?, ?, 0, ?)`,
        [requisitionId, line.item_id, requestedQty, inStockFlag]
      );
    }

    const newReq = await db.get('SELECT * FROM requisitions WHERE id = ?', [requisitionId]);
    const reqItems = await db.all(
      `SELECT ri.*, i.name as item_name, i.unit, i.current_stock 
       FROM requisition_items ri 
       JOIN items i ON ri.item_id = i.id 
       WHERE ri.requisition_id = ?`,
      [requisitionId]
    );

    newReq.items = reqItems;
    res.status(201).json({
      success: true,
      message: 'Requisition submitted successfully',
      requisition: newReq
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/requisitions/:id/approve (Approve or Reject Requisition)
router.put('/:id/approve', async (req, res) => {
  try {
    const { action, approved_by, rejection_reason } = req.body; // action: 'approve' or 'reject'

    const reqObj = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    if (!reqObj) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    if (action === 'approve') {
      if (!approved_by) {
        return res.status(400).json({ success: false, error: 'approver name (approved_by) is required to approve' });
      }

      await db.query(
        `UPDATE requisitions SET 
          status = 'approved',
          approved_by = ?,
          approved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [approved_by, req.params.id]
      );
    } else if (action === 'reject') {
      await db.query(
        `UPDATE requisitions SET 
          status = 'rejected',
          approved_by = ?,
          rejection_reason = ?,
          approved_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [approved_by || 'Approver', rejection_reason || 'Rejected by Vice-Principal / Approver', req.params.id]
      );
    } else {
      return res.status(400).json({ success: false, error: 'Invalid action. Must be approve or reject' });
    }

    const updated = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Requisition ${action}d successfully`, requisition: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/requisitions/:id/issue (Issue Stock for Approved Requisition)
// Business Rule 3: STRICT ENFORCEMENT - Cannot issue without approved_by set first!
router.put('/:id/issue', async (req, res) => {
  try {
    const { issued_by = 'Storekeeper', items } = req.body;

    const requisition = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    if (!requisition) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    // Business Rule 3 ENFORCEMENT: Requisitions cannot move to "issued" status without approved_by set first
    if (!requisition.approved_by || requisition.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden! Requisition cannot be issued without prior approval (approved_by must be set).'
      });
    }

    // Fetch existing requisition line items
    const reqLines = await db.all('SELECT * FROM requisition_items WHERE requisition_id = ?', [req.params.id]);

    for (const line of reqLines) {
      // Check if custom issued quantity passed in request body
      const customLine = items ? items.find(i => i.item_id === line.item_id) : null;
      const qtyToIssue = customLine ? Number(customLine.quantity_issued) : Number(line.quantity_requested);

      if (qtyToIssue > 0) {
        const item = await db.get('SELECT * FROM items WHERE id = ?', [line.item_id]);

        // Create issue transaction in database
        await db.query(
          `INSERT INTO transactions (item_id, type, quantity, date, price, department, remarks, created_by)
           VALUES (?, 'issue', ?, DATE('now'), ?, ?, ?, ?)`,
          [
            line.item_id,
            qtyToIssue,
            item.price_per_unit,
            requisition.department,
            `Issued for Requisition #${requisition.id} (${requisition.job_or_practical})`,
            issued_by
          ]
        );

        // Business Rule 1: Auto recalculate current_stock
        await recalculateStock(line.item_id);

        // Business Rule 6: If DSR item, create matching distribution_register entry
        if (item.register_type === 'dsr') {
          await db.query(
            `INSERT INTO distribution_register (item_id, department, issued_date, current_holder, status, remarks)
             VALUES (?, ?, DATE('now'), ?, 'active', ?)`,
            [
              line.item_id,
              requisition.department,
              requisition.requested_by,
              `Issued via Requisition #${requisition.id}`
            ]
          );
        }

        // Update line item issued quantity
        await db.query(
          `UPDATE requisition_items SET quantity_issued = ? WHERE id = ?`,
          [qtyToIssue, line.id]
        );
      }
    }

    // Update requisition status to 'issued'
    await db.query(
      `UPDATE requisitions SET 
        status = 'issued',
        issued_by = ?,
        issued_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [issued_by, req.params.id]
    );

    const updated = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Stock successfully issued for requisition',
      requisition: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/requisitions/:id/receive (Mark requisition received by instructor)
router.put('/:id/receive', async (req, res) => {
  try {
    const requisition = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    if (!requisition) {
      return res.status(404).json({ success: false, error: 'Requisition not found' });
    }

    await db.query(
      `UPDATE requisitions SET 
        status = 'received',
        received_confirmation_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );

    const updated = await db.get('SELECT * FROM requisitions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Requisition marked as received by department', requisition: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
