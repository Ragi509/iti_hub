const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { recalculateStock } = require('../utils/stockHelper');

// GET /api/items (Searchable, filterable by register_type, category, department)
router.get('/', async (req, res) => {
  try {
    const { register_type, category, department, search } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (register_type && register_type !== 'all') {
      sql += ' AND register_type = ?';
      params.push(register_type);
    }

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (department && department !== 'all') {
      sql += " AND (department = ? OR department IS NULL OR department = 'General')";
      params.push(department);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR location_code LIKE ? OR dsr_code LIKE ? OR category LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY register_type ASC, name ASC';
    const items = await db.all(sql, params);

    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/items/:id (Single item detail with full transaction history - Digital Bin Card)
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Get full transaction history
    const transactions = await db.all(
      `SELECT * FROM transactions WHERE item_id = ? ORDER BY date DESC, id DESC`,
      [req.params.id]
    );

    // Get distribution register if DSR item
    let distributions = [];
    if (item.register_type === 'dsr') {
      distributions = await db.all(
        `SELECT * FROM distribution_register WHERE item_id = ? ORDER BY id DESC`,
        [req.params.id]
      );
    }

    // Calculate total purchased & total issued
    const totals = await db.get(
      `SELECT 
        SUM(CASE WHEN type = 'purchase' THEN quantity ELSE 0 END) as total_purchased,
        SUM(CASE WHEN type = 'issue' THEN quantity ELSE 0 END) as total_issued
       FROM transactions WHERE item_id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      item,
      transactions,
      distributions,
      summary: {
        total_purchased: Number(totals?.total_purchased || 0),
        total_issued: Number(totals?.total_issued || 0),
        current_stock: item.current_stock
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/items (Add new item)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      register_type,
      category,
      unit,
      price_per_unit = 0,
      department = null,
      location_code = null,
      dsr_code = null,
      initial_stock = 0,
      created_by = 'Storekeeper'
    } = req.body;

    if (!name || !register_type || !category || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Name, register_type, category, and unit are required fields'
      });
    }

    // Insert item with initial stock = 0
    const result = await db.query(
      `INSERT INTO items (name, register_type, category, unit, current_stock, price_per_unit, department, location_code, dsr_code)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [name, register_type, category, unit, Number(price_per_unit), department, location_code, dsr_code]
    );

    const newItem = await db.get('SELECT * FROM items WHERE id = ?', [result.lastID]);

    // If initial stock is specified on item creation, create a purchase transaction
    if (Number(initial_stock) > 0) {
      await db.query(
        `INSERT INTO transactions (item_id, type, quantity, date, price, department, remarks, created_by)
         VALUES (?, 'purchase', ?, DATE('now'), ?, ?, 'Initial inventory stock intake', ?)`,
        [newItem.id, Number(initial_stock), Number(price_per_unit), department || 'Main Store', created_by]
      );
      await recalculateStock(newItem.id);
    }

    const updatedItem = await db.get('SELECT * FROM items WHERE id = ?', [newItem.id]);
    res.status(201).json({ success: true, item: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/items/:id (Edit item details - Note: stock is recalculated from transactions, never edited directly!)
router.put('/:id', async (req, res) => {
  try {
    const { name, register_type, category, unit, price_per_unit, department, location_code, dsr_code } = req.body;

    const existing = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    await db.query(
      `UPDATE items SET 
        name = COALESCE(?, name),
        register_type = COALESCE(?, register_type),
        category = COALESCE(?, category),
        unit = COALESCE(?, unit),
        price_per_unit = COALESCE(?, price_per_unit),
        department = COALESCE(?, department),
        location_code = COALESCE(?, location_code),
        dsr_code = COALESCE(?, dsr_code),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, register_type, category, unit, price_per_unit, department, location_code, dsr_code, req.params.id]
    );

    const updated = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
