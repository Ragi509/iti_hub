const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/syllabus (Lists syllabus requirements with real-time stock gap analysis)
router.get('/', async (req, res) => {
  try {
    const { department } = req.query;
    let sql = 'SELECT * FROM syllabus_requirements WHERE 1=1';
    const params = [];

    if (department && department !== 'all') {
      sql += ' AND department = ?';
      params.push(department);
    }

    sql += ' ORDER BY department ASC, item_name ASC';
    const requirements = await db.all(sql, params);

    // Calculate stock gap for each requirement by matching with items table
    const result = [];
    for (const reqObj of requirements) {
      // Find matching item in inventory
      const matchingItem = await db.get(
        'SELECT id, current_stock, unit, price_per_unit, location_code FROM items WHERE name LIKE ? LIMIT 1',
        [`%${reqObj.item_name}%`]
      );

      const currentStock = matchingItem ? Number(matchingItem.current_stock) : 0;
      const requiredQty = Number(reqObj.required_quantity);
      const stockGap = currentStock - requiredQty;
      const isSufficient = stockGap >= 0;

      result.push({
        ...reqObj,
        item_id: matchingItem ? matchingItem.id : null,
        current_stock: currentStock,
        unit: matchingItem ? matchingItem.unit : 'Units',
        stock_gap: stockGap,
        status_flag: isSufficient ? 'sufficient' : 'deficit'
      });
    }

    res.json({ success: true, syllabus_requirements: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/syllabus (Add syllabus requirement)
router.post('/', async (req, res) => {
  try {
    const { department, item_name, required_quantity, syllabus_reference, updated_by = 'Instructor' } = req.body;

    if (!department || !item_name || required_quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'department, item_name, and required_quantity are required'
      });
    }

    const resObj = await db.query(
      `INSERT INTO syllabus_requirements (department, item_name, required_quantity, syllabus_reference, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [department, item_name, Number(required_quantity), syllabus_reference, updated_by]
    );

    const created = await db.get('SELECT * FROM syllabus_requirements WHERE id = ?', [resObj.lastID]);
    res.status(201).json({ success: true, syllabus_requirement: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/syllabus/:id (Update syllabus requirement)
router.put('/:id', async (req, res) => {
  try {
    const { department, item_name, required_quantity, syllabus_reference, updated_by } = req.body;

    const existing = await db.get('SELECT * FROM syllabus_requirements WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Syllabus requirement not found' });
    }

    await db.query(
      `UPDATE syllabus_requirements SET 
        department = COALESCE(?, department),
        item_name = COALESCE(?, item_name),
        required_quantity = COALESCE(?, required_quantity),
        syllabus_reference = COALESCE(?, syllabus_reference),
        updated_by = COALESCE(?, updated_by),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [department, item_name, required_quantity, syllabus_reference, updated_by, req.params.id]
    );

    const updated = await db.get('SELECT * FROM syllabus_requirements WHERE id = ?', [req.params.id]);
    res.json({ success: true, syllabus_requirement: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/syllabus/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM syllabus_requirements WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Syllabus requirement removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
