const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/auth/users (for quick user switcher and testing)
router.get('/users', async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, name, role, department FROM users ORDER BY id ASC');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }

    const user = await db.get(
      'SELECT id, username, name, role, department, password FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Simple password check for v1
    if (password && user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
