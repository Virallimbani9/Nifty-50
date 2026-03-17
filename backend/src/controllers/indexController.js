const { NIFTY50_SYMBOLS, INDEX_TICKERS, INDEX_NAMES, INDEX_KEYS, toTicker } = require('../config/constants');
const { batchFetchQuotes } = require('../services/yahooFinanceService');
const { formatStock, formatIndex } = require('../utils/formatters');
const { chunk, createTickerMap } = require('../utils/helpers');
const { getCached, setCached, CACHE_KEYS } = require('../utils/cache');

// Get Nifty 50 constituents
const getConstituents = async (req, res, next) => {
  try {
    const cached = getCached(CACHE_KEYS.CONSTITUENTS);
    if (cached) return res.json(cached);

    const tickers = NIFTY50_SYMBOLS.map(toTicker);
    const allQuotes = [];

    // Fetch in chunks of 20
    for (const c of chunk(tickers, 20)) {
      const quotes = await batchFetchQuotes(c);
      allQuotes.push(...quotes);
    }

    // Map Yahoo ticker to NSE symbol
    const tickerMap = createTickerMap(NIFTY50_SYMBOLS);

    const stocks = allQuotes
      .map(q => formatStock(q, tickerMap[q.symbol] || q.symbol.replace('.NS', '')))
      .filter(Boolean);

    console.log(`📊 Constituents: ${stocks.length} stocks loaded`);
    const result = { stocks, timestamp: new Date().toISOString() };
    setCached(CACHE_KEYS.CONSTITUENTS, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get index data
const getIndices = async (req, res, next) => {
  try {
    const cached = getCached(CACHE_KEYS.INDEX);
    if (cached) return res.json(cached);

    const quotes = await batchFetchQuotes(INDEX_TICKERS);
    const byTicker = {};
    quotes.forEach(q => { byTicker[q.symbol] = q; });

    const result = { timestamp: new Date().toISOString() };
    INDEX_TICKERS.forEach(t => {
      result[INDEX_KEYS[t]] = formatIndex(byTicker[t], INDEX_NAMES[t]);
    });

    setCached(CACHE_KEYS.INDEX, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get gainers and losers
const getGainersLosers = async (req, res, next) => {
  try {
    const cached = getCached(CACHE_KEYS.GAINERS_LOSERS);
    if (cached) return res.json(cached);

    // Try to get from cache first
    let stocks = getCached(CACHE_KEYS.CONSTITUENTS)?.stocks;
    
    if (!stocks || stocks.length === 0) {
      const tickers = NIFTY50_SYMBOLS.map(toTicker);
      const allQuotes = [];
      for (const c of chunk(tickers, 20)) {
        const quotes = await batchFetchQuotes(c);
        allQuotes.push(...quotes);
      }
      const tickerMap = createTickerMap(NIFTY50_SYMBOLS);
      stocks = allQuotes.map(q => formatStock(q, tickerMap[q.symbol] || q.symbol.replace('.NS', ''))).filter(Boolean);
    }

    const sorted = [...stocks].sort((a, b) => b.pChange - a.pChange);
    const gainers = sorted.slice(0, 10).map(({ symbol, ltp, change, pChange, volume }) => ({ symbol, ltp, change, pChange, volume }));
    const losers = sorted.slice(-10).reverse().map(({ symbol, ltp, change, pChange, volume }) => ({ symbol, ltp, change, pChange, volume }));

    const result = { gainers, losers, timestamp: new Date().toISOString() };
    setCached(CACHE_KEYS.GAINERS_LOSERS, result, 30);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getConstituents,
  getIndices,
  getGainersLosers
};