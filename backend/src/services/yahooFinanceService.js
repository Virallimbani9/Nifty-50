const https = require('https');
const { YAHOO_ENDPOINTS, REQUEST_HEADERS } = require('../config/constants');
const { sleep } = require('../utils/helpers');

// HTTP fetch with redirect support
function fetchJSON(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));

    const options = { headers: REQUEST_HEADERS };

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
        try { 
          resolve(JSON.parse(data)); 
        } catch (e) { 
          reject(new Error(`JSON parse failed. Status: ${res.statusCode}. Body: ${data.slice(0, 200)}`)); 
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(20000, () => { 
      req.destroy(); 
      reject(new Error('Request timeout')); 
    });
  });
}

// Fetch quotes using Yahoo Finance v7 endpoint
async function fetchQuotesV7(tickers) {
  const symbols = tickers.map(encodeURIComponent).join('%2C');
  const url = `${YAHOO_ENDPOINTS.V7_QUOTE}?symbols=${symbols}&lang=en-US&region=IN&corsDomain=finance.yahoo.com`;
  
  try {
    const data = await fetchJSON(url);
    const results = data?.quoteResponse?.result;
    if (results && results.length > 0) return results;
    throw new Error('Empty quoteResponse from v7');
  } catch (err) {
    console.warn(`⚠️ v7 failed for ${tickers.length} tickers:`, err.message);
    throw err;
  }
}

// Fetch quotes using Yahoo Finance v6 endpoint (fallback)
async function fetchQuotesV6(tickers) {
  const symbols = tickers.map(encodeURIComponent).join('%2C');
  const url = `${YAHOO_ENDPOINTS.V6_QUOTE}?symbols=${symbols}&lang=en-US&region=IN`;
  
  try {
    const data = await fetchJSON(url);
    const results = data?.quoteResponse?.result;
    if (results && results.length > 0) return results;
    throw new Error('Empty quoteResponse from v6');
  } catch (err) {
    console.warn(`⚠️ v6 failed for ${tickers.length} tickers:`, err.message);
    throw err;
  }
}

// Fetch single ticker via chart API (most reliable fallback)
async function fetchSingleQuote(ticker) {
  const url = `${YAHOO_ENDPOINTS.V8_CHART}/${encodeURIComponent(ticker)}?interval=1d&range=1d&includePrePost=false`;
  
  try {
    const data = await fetchJSON(url);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No chart data for ' + ticker);
    
    return {
      symbol: ticker,
      shortName: meta.shortName || ticker,
      regularMarketPrice: meta.regularMarketPrice || meta.chartPreviousClose,
      regularMarketPreviousClose: meta.chartPreviousClose,
      regularMarketOpen: meta.regularMarketPrice,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      regularMarketChange: (meta.regularMarketPrice || 0) - (meta.chartPreviousClose || 0),
      regularMarketChangePercent: meta.chartPreviousClose
        ? (((meta.regularMarketPrice || 0) - meta.chartPreviousClose) / meta.chartPreviousClose) * 100
        : 0,
      regularMarketVolume: meta.regularMarketVolume,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      marketState: meta.marketState || 'CLOSED',
      currency: meta.currency || 'INR',
      exchangeName: meta.exchangeName,
    };
  } catch (err) {
    console.error(`  ✗ ${ticker}: ${err.message}`);
    throw err;
  }
}

// Batch fetch with fallback to individual calls
async function batchFetchQuotes(tickers) {
  if (!tickers || tickers.length === 0) return [];
  
  try {
    // Try v7 first
    return await fetchQuotesV7(tickers);
  } catch (err) {
    try {
      // Try v6 as first fallback
      console.log(`  ⚠️ Falling back to v6 for ${tickers.length} tickers...`);
      return await fetchQuotesV6(tickers);
    } catch (v6Err) {
      // Finally fall back to individual chart calls
      console.log(`  ⚠️ Falling back to individual chart calls for ${tickers.length} tickers...`);
      const results = [];
      for (let i = 0; i < tickers.length; i++) {
        try {
          const q = await fetchSingleQuote(tickers[i]);
          results.push(q);
          if (i > 0 && i % 10 === 0) await sleep(300); // small pause every 10
        } catch (e) {
          // Skip failed tickers
        }
      }
      return results;
    }
  }
}

module.exports = {
  fetchJSON,
  fetchQuotesV7,
  fetchQuotesV6,
  fetchSingleQuote,
  batchFetchQuotes
};