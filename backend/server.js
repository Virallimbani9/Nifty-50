require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const niftyRoutes = require('./src/routes/niftyRoutes');
const debugRoutes = require('./src/routes/debugRoutes');
const errorHandler = require('./src/middleware/errorHandler');

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET'] }));
app.use(express.json());

// Routes
app.use('/api/nifty50', niftyRoutes);
app.use('/debug', debugRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    dataSource: 'Yahoo Finance', 
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Nifty 50 API running on port ${PORT}`);
});

module.exports = app;