const express = require('express');
const router = express.Router();

const { getConstituents, getIndices, getGainersLosers } = require('../controllers/indexController');
const { getMarketStatus } = require('../controllers/marketStatusController');
const { getStock } = require('../controllers/stocksController');
const { apiLimiter, stockLimiter } = require('../utils/rateLimiter');

// Apply rate limiting to all routes
router.use(apiLimiter);

// Index routes
router.get('/constituents', getConstituents);
router.get('/index', getIndices);
router.get('/gainers-losers', getGainersLosers);
router.get('/market-status', getMarketStatus);

// Stock routes with stricter rate limiting
router.get('/stock/:symbol', stockLimiter, getStock);

module.exports = router;