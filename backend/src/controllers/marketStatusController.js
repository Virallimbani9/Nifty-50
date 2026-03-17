const { batchFetchQuotes } = require('../services/yahooFinanceService');
const { formatMarketStatus } = require('../utils/formatters');

// Get market status from Yahoo Finance or calculate manually
const getMarketStatus = async (req, res, next) => {
  try {
    const quotes = await batchFetchQuotes(['^NSEI']);
    const q = quotes[0];
    
    if (q?.marketState) {
      const result = { 
        marketState: [formatMarketStatus(q.marketState, new Date().toDateString())] 
      };
      return res.json(result);
    }
    
    // Fallback: calculate based on IST time
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    const mins = ist.getHours() * 60 + ist.getMinutes();
    const isOpen = ist.getDay() >= 1 && ist.getDay() <= 5 && mins >= 555 && mins <= 930;
    const state = isOpen ? 'REGULAR' : 'CLOSED';
    
    const result = { 
      marketState: [formatMarketStatus(state, ist.toDateString())] 
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMarketStatus
};