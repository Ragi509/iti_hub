const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { recalculateStock, calculateFifoBatches } = require('../utils/stockHelper');

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { item_id, type, department, date_from, date_to } = req.query;
    let sql = `
      SELECT t.*, i.name as item_name, i.unit, i.register_type, i.category 
      FROM transactions t 
      JOIN items i ON t.item_id = i.id 
      WHERE 1=1
    `;
    const params = [];

    if (item_id) {
      sql += ' AND t.item_id = ?';
      params.push(item_id);
    }
    if (type && type !== 'all') {
      sql += ' AND t.type = ?';
      params.push(type);
    }
    if (department && department !== 'all') {
      sql += ' AND t.department = ?';
      params.push(department);
    }
    if (date_from) {
      sql += ' AND t.date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      sql += ' AND t.date <= ?';
      params.push(date_to);
    }

    sql += ' ORDER BY t.date DESC, t.id DESC';
    const transactions = await db.all(sql, params);

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/fifo-suggestion/:itemId
// Business Rule 4: Suggest stock issue batches based on FIFO
router.get('/fifo-suggestion/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const quantity = Number(req.query.quantity || 1);

    const suggestion = await calculateFifoBatches(itemId, quantity);
    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/transactions (Add purchase, issue, or adjustment stock transaction)
// Business Rule 1: Automatically recalculates current_stock after every transaction
router.post('/', async (req, res) => {
  try {
    const {
      item_id,
      type,
      quantity,
      date = new Date().toISOString().split('T')[0],
      price,
      department,
      remarks,
      created_by = 'Storekeeper'
    } = req.body;

    if (!item_id || !type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'item_id, type (purchase/issue/adjustment), and quantity are required'
      });
    }

    const item = await db.get('SELECT * FROM items WHERE id = ?', [item_id]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const unitPrice = price !== undefined ? Number(price) : item.price_per_unit;

    // Check stock for issues
    if (type === 'issue' && Number(quantity) > item.current_stock) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock! Current stock: ${item.current_stock} ${item.unit}, requested issue: ${quantity} ${item.unit}`
      });
    }

    // Insert transaction
    const resTx = await db.query(
      `INSERT INTO transactions (item_id, type, quantity, date, price, department, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_id,
        type,
        Number(quantity),
        date,
        unitPrice,
        department || item.department || 'Main Store',
        remarks || `${type.toUpperCase()} transaction recorded`,
        created_by
      ]
    );

    // Business Rule 1: Automatically recalculates current_stock
    const newStock = await recalculateStock(item_id);

    // Business Rule 6: DSR item issue creates matching distribution_register entry
    if (type === 'issue' && item.register_type === 'dsr') {
      await db.query(
        `INSERT INTO distribution_register (item_id, department, issued_date, current_holder, status, remarks)
         VALUES (?, ?, ?, ?, 'active', ?)`,
        [
          item_id,
          department || 'Department',
          date,
          created_by || 'Department Head',
          remarks || 'Issued via store transaction'
        ]
      );
    }

    const updatedItem = await db.get('SELECT * FROM items WHERE id = ?', [item_id]);
    const createdTx = await db.get('SELECT * FROM transactions WHERE id = ?', [resTx.lastID]);

    res.status(201).json({
      success: true,
      message: 'Transaction recorded and stock auto-reconciled',
      transaction: createdTx,
      item: updatedItem,
      recalculated_stock: newStock
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
