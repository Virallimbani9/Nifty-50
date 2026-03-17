const express = require('express');
const router = express.Router();
const { testYahooFinance } = require('../controllers/debugController');

// Debug route (should be disabled in production)
if (process.env.NODE_ENV !== 'production') {
  router.get('/yahoo', testYahooFinance);
}

module.exports = router;