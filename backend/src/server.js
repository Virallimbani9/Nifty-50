const express = require('express');
const cors = require('cors');
const https = require('https');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

app.use(cors({ origin: process.env.FRONTEND_URL || '*', methods: ['GET'] }));
app.use(express.json());
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 60 }));

// ─── Nifty 50 Symbols ────────────────────────────────────────────────────────
const NIFTY50_SYMBOLS = [
  'ADANIENT','ADANIPORTS','APOLLOHOSP','ASIANPAINT','AXISBANK',
  'BAJAJ-AUTO','BAJFINANCE','BAJAJFINSV','BEL','BPCL',
  'BHARTIARTL','BRITANNIA','CIPLA','COALINDIA','DRREDDY',
  'EICHERMOT','GRASIM','HCLTECH','HDFCBANK','HDFCLIFE',
  'HEROMOTOCO','HINDALCO','HINDUNILVR','ICICIBANK','ITC',
  'INDUSINDBK','INFY','JSWSTEEL','KOTAKBANK','LT',
  'MM','MARUTI','NESTLEIND','NTPC','ONGC',
  'POWERGRID','RELIANCE','SBILIFE','SHRIRAMFIN','SBIN',
  'SUNPHARMA','TCS','TATACONSUM','TATAMOTORS','TATASTEEL',
  'TECHM','TITAN','TRENT','ULTRACEMCO','WIPRO'
];

function toTicker(sym) { return sym + '.NS'; }

const INDEX_TICKERS = ['^NSEI', '^NSEBANK', '^CNXIT', '^NSEMDCP50'];
const INDEX_NAMES   = { '^NSEI': 'NIFTY 50', '^NSEBANK': 'NIFTY BANK', '^CNXIT': 'NIFTY IT', '^NSEMDCP50': 'NIFTY MIDCAP 50' };
const INDEX_KEYS    = { '^NSEI': 'nifty50', '^NSEBANK': 'bankNifty', '^CNXIT': 'niftyIt', '^NSEMDCP50': 'niftyMidcap50' };

// ─── HTTP fetch with redirect support ────────────────────────────────────────
function fetchJSON(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    };

    const req = https.get(url, options, (res) => {
      // Follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        return fetchJSON(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse failed. Status: ${res.statusCode}. Body: ${data.slice(0, 200)}`)); }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ─── Fetch quotes using Yahoo Finance v8 crumb-free endpoint ─────────────────
// Yahoo Finance v8 /finance/quote works without crumb for most tickers
async function fetchQuotes(tickers) {
  const symbols = tickers.map(encodeURIComponent).join('%2C');
  
  // Try v8 first (no crumb needed for basic quotes)
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${tickers[0]}?interval=1d&range=1d`;
  
  // Use the quoteSummary endpoint which is more reliable
  const batchUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&lang=en-US&region=IN&corsDomain=finance.yahoo.com`;

  try {
    const data = await fetchJSON(batchUrl);
    const results = data?.quoteResponse?.result;
    if (results && results.length > 0) return results;
    throw new Error('Empty quoteResponse');
  } catch (err) {
    console.error('v7 failed:', err.message, '— trying v6...');
    // Fallback to v6
    const v6url = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=${symbols}&lang=en-US&region=IN`;
    const data2 = await fetchJSON(v6url);
    const results2 = data2?.quoteResponse?.result;
    if (results2 && results2.length > 0) return results2;
    throw new Error('Both v7 and v6 failed: ' + JSON.stringify(data2).slice(0, 200));
  }
}

// ─── Single ticker fetch via chart API (most reliable) ───────────────────────
async function fetchSingleQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false`;
  const data = await fetchJSON(url);
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error('No chart data for ' + ticker);
  return {
    symbol:                        ticker,
    shortName:                     meta.shortName || ticker,
    regularMarketPrice:            meta.regularMarketPrice || meta.chartPreviousClose,
    regularMarketPreviousClose:    meta.chartPreviousClose,
    regularMarketOpen:             meta.regularMarketPrice, // best we have from chart
    regularMarketDayHigh:          meta.regularMarketDayHigh,
    regularMarketDayLow:           meta.regularMarketDayLow,
    regularMarketChange:           (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0),
    regularMarketChangePercent:    meta.chartPreviousClose
                                    ? (((meta.regularMarketPrice || 0) - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
                                    : 0,
    regularMarketVolume:           meta.regularMarketVolume,
    fiftyTwoWeekHigh:              meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow:               meta.fiftyTwoWeekLow,
    marketState:                   meta.marketState || 'CLOSED',
    currency:                      meta.currency || 'INR',
    exchangeName:                  meta.exchangeName,
  };
}

// ─── Batch fetch: try bulk endpoint first, fall back to individual chart calls ─
async function batchFetchQuotes(tickers) {
  try {
    const results = await fetchQuotes(tickers);
    console.log(`✅ Bulk fetch OK: ${results.length}/${tickers.length} quotes`);
    return results;
  } catch (bulkErr) {
    console.warn(`⚠️  Bulk fetch failed (${bulkErr.message}), falling back to individual chart calls...`);
    // Fetch individually with small delay to avoid rate limiting
    const results = [];
    for (let i = 0; i < tickers.length; i++) {
      try {
        const q = await fetchSingleQuote(tickers[i]);
        results.push(q);
        if (i > 0 && i % 10 === 0) await sleep(300); // small pause every 10
      } catch (e) {
        console.error(`  ✗ ${tickers[i]}: ${e.message}`);
      }
    }
    console.log(`✅ Individual fetch done: ${results.length}/${tickers.length} quotes`);
    return results;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatStock(q, symbol) {
  if (!q) return null;
  const ltp  = q.regularMarketPrice || 0;
  const prev = q.regularMarketPreviousClose || ltp;
  const chg  = q.regularMarketChange  ?? (ltp - prev);
  const pchg = q.regularMarketChangePercent ?? (prev ? (chg / prev) * 100 : 0);
  return {
    symbol,
    name:          q.shortName || q.longName || symbol,
    open:          Math.round((q.regularMarketOpen  || 0) * 100) / 100,
    high:          Math.round((q.regularMarketDayHigh || 0) * 100) / 100,
    low:           Math.round((q.regularMarketDayLow  || 0) * 100) / 100,
    ltp:           Math.round(ltp  * 100) / 100,
    previousClose: Math.round(prev * 100) / 100,
    change:        Math.round(chg  * 100) / 100,
    pChange:       Math.round(pchg * 100) / 100,
    volume:        q.regularMarketVolume  || 0,
    weekHigh52:    q.fiftyTwoWeekHigh     || 0,
    weekLow52:     q.fiftyTwoWeekLow      || 0,
    marketCap:     q.marketCap            || 0,
    pe:            q.trailingPE           || null,
    series:        'EQ',
  };
}

function formatIndex(q, name) {
  if (!q) return null;
  const ltp  = q.regularMarketPrice || 0;
  const prev = q.regularMarketPreviousClose || ltp;
  const chg  = q.regularMarketChange  ?? (ltp - prev);
  const pchg = q.regularMarketChangePercent ?? (prev ? (chg / prev) * 100 : 0);
  return {
    index:         name,
    last:          Math.round(ltp  * 100) / 100,
    open:          q.regularMarketOpen         || 0,
    high:          q.regularMarketDayHigh      || 0,
    low:           q.regularMarketDayLow       || 0,
    previousClose: Math.round(prev * 100) / 100,
    variation:     Math.round(chg  * 100) / 100,
    percentChange: Math.round(pchg * 100) / 100,
    yearHigh:      q.fiftyTwoWeekHigh          || 0,
    yearLow:       q.fiftyTwoWeekLow           || 0,
    volume:        q.regularMarketVolume       || 0,
    marketState:   q.marketState               || 'CLOSED',
  };
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/nifty50/constituents', async (req, res) => {
  const key = 'constituents';
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  try {
    const tickers = NIFTY50_SYMBOLS.map(toTicker);
    const allQuotes = [];

    // Fetch in chunks of 20
    for (const c of chunk(tickers, 20)) {
      const quotes = await batchFetchQuotes(c);
      allQuotes.push(...quotes);
    }

    // Map Yahoo ticker → NSE symbol
    const tickerMap = {};
    NIFTY50_SYMBOLS.forEach(s => { tickerMap[toTicker(s)] = s; });

    const stocks = allQuotes
      .map(q => formatStock(q, tickerMap[q.symbol] || q.symbol.replace('.NS', '')))
      .filter(Boolean);

    console.log(`📊 Constituents: ${stocks.length} stocks loaded`);
    const result = { stocks, timestamp: new Date().toISOString() };
    cache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error('Constituents error:', err.message);
    res.status(500).json({ error: 'Failed to fetch Nifty 50 data', details: err.message });
  }
});

app.get('/api/nifty50/index', async (req, res) => {
  const key = 'index';
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  try {
    const quotes = await batchFetchQuotes(INDEX_TICKERS);
    const byTicker = {};
    quotes.forEach(q => { byTicker[q.symbol] = q; });

    const result = { timestamp: new Date().toISOString() };
    INDEX_TICKERS.forEach(t => {
      result[INDEX_KEYS[t]] = formatIndex(byTicker[t], INDEX_NAMES[t]);
    });

    cache.set(key, result);
    res.json(result);
  } catch (err) {
    console.error('Index error:', err.message);
    res.status(500).json({ error: 'Failed to fetch index data', details: err.message });
  }
});

app.get('/api/nifty50/gainers-losers', async (req, res) => {
  const key = 'gainers-losers';
  const cached = cache.get(key);
  if (cached) return res.json(cached);

  try {
    let stocks = cache.get('constituents')?.stocks;
    if (!stocks || stocks.length === 0) {
      const tickers   = NIFTY50_SYMBOLS.map(toTicker);
      const allQuotes = [];
      for (const c of chunk(tickers, 20)) {
        const quotes = await batchFetchQuotes(c);
        allQuotes.push(...quotes);
      }
      const tickerMap = {};
      NIFTY50_SYMBOLS.forEach(s => { tickerMap[toTicker(s)] = s; });
      stocks = allQuotes.map(q => formatStock(q, tickerMap[q.symbol] || q.symbol.replace('.NS',''))).filter(Boolean);
    }

    const sorted  = [...stocks].sort((a, b) => b.pChange - a.pChange);
    const gainers = sorted.slice(0, 10).map(({ symbol, ltp, change, pChange, volume }) => ({ symbol, ltp, change, pChange, volume }));
    const losers  = sorted.slice(-10).reverse().map(({ symbol, ltp, change, pChange, volume }) => ({ symbol, ltp, change, pChange, volume }));

    const result = { gainers, losers, timestamp: new Date().toISOString() };
    cache.set(key, result, 30);
    res.json(result);
  } catch (err) {
    console.error('Gainers/Losers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch gainers/losers', details: err.message });
  }
});

app.get('/api/nifty50/market-status', async (req, res) => {
  try {
    const quotes = await batchFetchQuotes(['^NSEI']);
    const q      = quotes[0];
    const state  = q?.marketState || 'CLOSED';
    res.json({ marketState: [{ market: 'Capital Market', marketStatus: state === 'REGULAR' ? 'Open' : 'Closed', marketState: state, tradeDate: new Date().toDateString(), index: 'NIFTY 50' }] });
  } catch {
    const now = new Date();
    const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
    const mins = ist.getHours() * 60 + ist.getMinutes();
    const isOpen = ist.getDay() >= 1 && ist.getDay() <= 5 && mins >= 555 && mins <= 930;
    res.json({ marketState: [{ market: 'Capital Market', marketStatus: isOpen ? 'Open' : 'Closed', tradeDate: ist.toDateString(), index: 'NIFTY 50' }] });
  }
});

app.get('/api/nifty50/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const key = `stock_${symbol}`;
  const cached = cache.get(key);
  if (cached) return res.json(cached);
  try {
    const quotes = await batchFetchQuotes([toTicker(symbol.toUpperCase())]);
    const result = formatStock(quotes[0], symbol.toUpperCase());
    cache.set(key, result, 15);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch ${symbol}`, details: err.message });
  }
});

// Debug endpoint — test Yahoo Finance connectivity
app.get('/debug/yahoo', async (req, res) => {
  try {
    const quotes = await batchFetchQuotes(['RELIANCE.NS', '^NSEI']);
    res.json({ ok: true, sample: quotes.slice(0, 2).map(q => ({ symbol: q.symbol, price: q.regularMarketPrice, state: q.marketState })) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/health', (req, res) =>
  res.json({ status: 'ok', dataSource: 'Yahoo Finance', timestamp: new Date().toISOString() })
);

app.listen(PORT, () =>
  console.log(`✅ Nifty 50 API on port ${PORT}`)
);

module.exports = app;
