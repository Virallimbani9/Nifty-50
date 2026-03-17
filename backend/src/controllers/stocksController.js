const { NIFTY50_SYMBOLS, toTicker } = require('../config/constants');
const { batchFetchQuotes } = require('../services/yahooFinanceService');
const { formatStock } = require('../utils/formatters');
const { getCached, setCached, CACHE_KEYS } = require('../utils/cache');

// Get individual stock data
const getStock = async (req, res, next) => {
  const { symbol } = req.params;
  const upperSymbol = symbol.toUpperCase();
  
  // Validate if symbol is in Nifty 50
  if (!NIFTY50_SYMBOLS.includes(upperSymbol)) {
    return res.status(404).json({ 
      error: 'Symbol not found', 
      message: `${upperSymbol} is not a Nifty 50 constituent` 
    });
  }
  
  const key = CACHE_KEYS.stock(upperSymbol);
  const cached = getCached(key);
  
  if (cached) return res.json(cached);
  
  try {
    const quotes = await batchFetchQuotes([toTicker(upperSymbol)]);
    if (!quotes || quotes.length === 0) {
      return res.status(404).json({ error: `No data found for ${upperSymbol}` });
    }
    
    const result = formatStock(quotes[0], upperSymbol);
    setCached(key, result, 15);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStock
};