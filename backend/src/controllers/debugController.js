const { batchFetchQuotes } = require('../services/yahooFinanceService');

// Debug endpoint to test Yahoo Finance connectivity
const testYahooFinance = async (req, res, next) => {
  try {
    const quotes = await batchFetchQuotes(['RELIANCE.NS', '^NSEI']);
    res.json({ 
      ok: true, 
      sample: quotes.slice(0, 2).map(q => ({ 
        symbol: q.symbol, 
        price: q.regularMarketPrice, 
        state: q.marketState 
      }))
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

module.exports = {
  testYahooFinance
};