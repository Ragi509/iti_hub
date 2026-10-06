const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/reports/summary (High level KPI metrics for dashboard & reports header)
router.get('/summary', async (req, res) => {
  try {
    const totalItemsObj = await db.get('SELECT COUNT(*) as count FROM items');
    const registerCounts = await db.all('SELECT register_type, COUNT(*) as count FROM items GROUP BY register_type');
    const totalValuationObj = await db.get('SELECT SUM(current_stock * price_per_unit) as total_val FROM items');
    const pendingReqsObj = await db.get("SELECT COUNT(*) as count FROM requisitions WHERE status = 'pending'");
    const activeDsrObj = await db.get("SELECT COUNT(*) as count FROM distribution_register WHERE status = 'active'");

    const lowStockObj = await db.get("SELECT COUNT(*) as count FROM items WHERE current_stock <= 5 AND register_type != 'dsr'");

    res.json({
      success: true,
      summary: {
        total_items: Number(totalItemsObj?.count || 0),
        bin_items: Number(registerCounts.find(r => r.register_type === 'bin')?.count || 0),
        misc_items: Number(registerCounts.find(r => r.register_type === 'miscellaneous')?.count || 0),
        dsr_items: Number(registerCounts.find(r => r.register_type === 'dsr')?.count || 0),
        total_valuation_inr: Number(totalValuationObj?.total_val || 0),
        pending_requisitions: Number(pendingReqsObj?.count || 0),
        active_dsr_assets: Number(activeDsrObj?.count || 0),
        low_stock_items: Number(lowStockObj?.count || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/inventory (Full inventory exportable report)
router.get('/inventory', async (req, res) => {
  try {
    const { register_type, department, format } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (register_type && register_type !== 'all') {
      sql += ' AND register_type = ?';
      params.push(register_type);
    }

    if (department && department !== 'all') {
      sql += " AND (department = ? OR department = 'General')";
      params.push(department);
    }

    sql += ' ORDER BY register_type ASC, name ASC';
    const items = await db.all(sql, params);

    const formatted = items.map(item => ({
      ...item,
      total_value: item.current_stock * item.price_per_unit
    }));

    if (format === 'csv') {
      let csv = 'ID,Item Name,Register Type,Category,Unit,Current Stock,Price Per Unit (INR),Total Value (INR),Department,Location Code,DSR Code\n';
      formatted.forEach(i => {
        csv += `"${i.id}","${i.name.replace(/"/g, '""')}","${i.register_type}","${i.category}","${i.unit}",${i.current_stock},${i.price_per_unit},${i.total_value},"${i.department || ''}","${i.location_code || ''}","${i.dsr_code || ''}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory_report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, items: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/reports/transactions (Exportable transaction ledger report)
router.get('/transactions', async (req, res) => {
  try {
    const { type, department, date_from, date_to, format } = req.query;
    let sql = `
      SELECT t.*, i.name as item_name, i.unit, i.register_type, (t.quantity * t.price) as total_transaction_value
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE 1=1
    `;
    const params = [];

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

    if (format === 'csv') {
      let csv = 'ID,Date,Item Name,Register Type,Type,Quantity,Unit,Price (INR),Total Value (INR),Department,Remarks,Recorded By\n';
      transactions.forEach(t => {
        csv += `"${t.id}","${t.date}","${t.item_name.replace(/"/g, '""')}","${t.register_type}","${t.type}",${t.quantity},"${t.unit}",${t.price},${t.total_transaction_value},"${t.department || ''}","${(t.remarks || '').replace(/"/g, '""')}","${t.created_by}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions_report.csv"');
      return res.send(csv);
    }

    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
