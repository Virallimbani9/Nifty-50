// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Chunk array into smaller arrays
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Convert symbol to ticker
const toTicker = (sym) => sym + '.NS';

// Extract symbol from ticker
const fromTicker = (ticker) => ticker.replace('.NS', '');

// Create ticker map for Nifty 50 symbols
const createTickerMap = (symbols) => {
  const map = {};
  symbols.forEach(sym => {
    map[toTicker(sym)] = sym;
  });
  return map;
};

module.exports = {
  sleep,
  chunk,
  toTicker,
  fromTicker,
  createTickerMap
};