const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/dsr (List all DSR assets and distribution history)
router.get('/', async (req, res) => {
  try {
    const { department, status } = req.query;
    
    // Fetch DSR items with their current active distribution record
    let sql = `
      SELECT i.*, 
             dr.id as distribution_id, 
             dr.department as holding_department, 
             dr.issued_date, 
             dr.returned_date, 
             dr.current_holder, 
             dr.status as distribution_status,
             dr.remarks as distribution_remarks
      FROM items i
      LEFT JOIN distribution_register dr ON i.id = dr.item_id AND dr.status = 'active'
      WHERE i.register_type = 'dsr'
    `;
    const params = [];

    if (department && department !== 'all') {
      sql += ' AND (i.department = ? OR dr.department = ?)';
      params.push(department, department);
    }

    sql += ' ORDER BY i.name ASC';
    const dsrItems = await db.all(sql, params);

    // Get distribution history for all items
    const distributions = await db.all(
      `SELECT dr.*, i.name as item_name, i.dsr_code 
       FROM distribution_register dr 
       JOIN items i ON dr.item_id = i.id 
       ORDER BY dr.issued_date DESC, dr.id DESC`
    );

    res.json({ success: true, dsr_items: dsrItems, distribution_history: distributions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dsr/issue (Issue DSR item to a department / holder)
// Business Rule 6: Create distribution register entry
router.post('/issue', async (req, res) => {
  try {
    const { item_id, department, current_holder, issued_date = new Date().toISOString().split('T')[0], remarks } = req.body;

    if (!item_id || !department || !current_holder) {
      return res.status(400).json({
        success: false,
        error: 'item_id, department, and current_holder are required'
      });
    }

    const item = await db.get('SELECT * FROM items WHERE id = ? AND register_type = "dsr"', [item_id]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'DSR item not found' });
    }

    // Close any previous active distributions for this item
    await db.query(
      `UPDATE distribution_register SET status = 'returned', returned_date = ? WHERE item_id = ? AND status = 'active'`,
      [issued_date, item_id]
    );

    // Create new distribution record
    const resDist = await db.query(
      `INSERT INTO distribution_register (item_id, department, issued_date, current_holder, status, remarks)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [item_id, department, issued_date, current_holder, remarks || 'DSR Asset Distribution']
    );

    // Update item department holder reference
    await db.query('UPDATE items SET department = ? WHERE id = ?', [department, item_id]);

    const created = await db.get('SELECT * FROM distribution_register WHERE id = ?', [resDist.lastID]);
    res.status(201).json({ success: true, message: 'DSR asset issued successfully', distribution: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/dsr/:id/return (Return DSR asset and close distribution record)
// Business Rule 6: Return sets returned_date and status = 'returned'
router.put('/:id/return', async (req, res) => {
  try {
    const { returned_date = new Date().toISOString().split('T')[0], remarks } = req.body;

    const distribution = await db.get('SELECT * FROM distribution_register WHERE id = ?', [req.params.id]);
    if (!distribution) {
      return res.status(404).json({ success: false, error: 'Distribution record not found' });
    }

    await db.query(
      `UPDATE distribution_register SET 
        status = 'returned',
        returned_date = ?,
        remarks = COALESCE(?, remarks)
       WHERE id = ?`,
      [returned_date, remarks, req.params.id]
    );

    const updated = await db.get('SELECT * FROM distribution_register WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'DSR asset returned to Main Store', distribution: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
