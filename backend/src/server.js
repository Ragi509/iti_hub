const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const transactionRoutes = require('./routes/transactions');
const requisitionRoutes = require('./routes/requisitions');
const syllabusRoutes = require('./routes/syllabus');
const dsrRoutes = require('./routes/dsr');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/requisitions', requisitionRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/dsr', dsrRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'StoreSync ITI Inventory API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`================================================`);
  console.log(` StoreSync Backend API Server running on port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`================================================`);
});
