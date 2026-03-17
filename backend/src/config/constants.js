// Nifty 50 Symbols
const NIFTY50_SYMBOLS = [
  'ADANIENT', 'ADANIPORTS', 'APOLLOHOSP', 'ASIANPAINT', 'AXISBANK',
  'BAJAJ-AUTO', 'BAJFINANCE', 'BAJAJFINSV', 'BEL', 'BPCL',
  'BHARTIARTL', 'BRITANNIA', 'CIPLA', 'COALINDIA', 'DRREDDY',
  'EICHERMOT', 'GRASIM', 'HCLTECH', 'HDFCBANK', 'HDFCLIFE',
  'HEROMOTOCO', 'HINDALCO', 'HINDUNILVR', 'ICICIBANK', 'ITC',
  'INDUSINDBK', 'INFY', 'JSWSTEEL', 'KOTAKBANK', 'LT',
  'MM', 'MARUTI', 'NESTLEIND', 'NTPC', 'ONGC',
  'POWERGRID', 'RELIANCE', 'SBILIFE', 'SHRIRAMFIN', 'SBIN',
  'SUNPHARMA', 'TCS', 'TATACONSUM', 'TATAMOTORS', 'TATASTEEL',
  'TECHM', 'TITAN', 'TRENT', 'ULTRACEMCO', 'WIPRO'
];

// Index tickers and mappings
const INDEX_TICKERS = ['^NSEI', '^NSEBANK', '^CNXIT', '^NSEMDCP50'];
const INDEX_NAMES = {
  '^NSEI': 'NIFTY 50',
  '^NSEBANK': 'NIFTY BANK',
  '^CNXIT': 'NIFTY IT',
  '^NSEMDCP50': 'NIFTY MIDCAP 50'
};
const INDEX_KEYS = {
  '^NSEI': 'nifty50',
  '^NSEBANK': 'bankNifty',
  '^CNXIT': 'niftyIt',
  '^NSEMDCP50': 'niftyMidcap50'
};

// Yahoo Finance endpoints
const YAHOO_ENDPOINTS = {
  V7_QUOTE: 'https://query1.finance.yahoo.com/v7/finance/quote',
  V6_QUOTE: 'https://query2.finance.yahoo.com/v6/finance/quote',
  V8_CHART: 'https://query1.finance.yahoo.com/v8/finance/chart'
};

// Request headers
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
};

module.exports = {
  NIFTY50_SYMBOLS,
  INDEX_TICKERS,
  INDEX_NAMES,
  INDEX_KEYS,
  YAHOO_ENDPOINTS,
  REQUEST_HEADERS,
  toTicker: (sym) => sym + '.NS'
};