// Format stock data
const formatStock = (q, symbol) => {
  if (!q) return null;
  
  const ltp = q.regularMarketPrice || 0;
  const prev = q.regularMarketPreviousClose || ltp;
  const chg = q.regularMarketChange ?? (ltp - prev);
  const pchg = q.regularMarketChangePercent ?? (prev ? (chg / prev) * 100 : 0);
  
  return {
    symbol,
    name: q.shortName || q.longName || symbol,
    open: Math.round((q.regularMarketOpen || 0) * 100) / 100,
    high: Math.round((q.regularMarketDayHigh || 0) * 100) / 100,
    low: Math.round((q.regularMarketDayLow || 0) * 100) / 100,
    ltp: Math.round(ltp * 100) / 100,
    previousClose: Math.round(prev * 100) / 100,
    change: Math.round(chg * 100) / 100,
    pChange: Math.round(pchg * 100) / 100,
    volume: q.regularMarketVolume || 0,
    weekHigh52: q.fiftyTwoWeekHigh || 0,
    weekLow52: q.fiftyTwoWeekLow || 0,
    marketCap: q.marketCap || 0,
    pe: q.trailingPE || null,
    series: 'EQ',
  };
};

// Format index data
const formatIndex = (q, name) => {
  if (!q) return null;
  
  const ltp = q.regularMarketPrice || 0;
  const prev = q.regularMarketPreviousClose || ltp;
  const chg = q.regularMarketChange ?? (ltp - prev);
  const pchg = q.regularMarketChangePercent ?? (prev ? (chg / prev) * 100 : 0);
  
  return {
    index: name,
    last: Math.round(ltp * 100) / 100,
    open: q.regularMarketOpen || 0,
    high: q.regularMarketDayHigh || 0,
    low: q.regularMarketDayLow || 0,
    previousClose: Math.round(prev * 100) / 100,
    variation: Math.round(chg * 100) / 100,
    percentChange: Math.round(pchg * 100) / 100,
    yearHigh: q.fiftyTwoWeekHigh || 0,
    yearLow: q.fiftyTwoWeekLow || 0,
    volume: q.regularMarketVolume || 0,
    marketState: q.marketState || 'CLOSED',
  };
};

// Format gainers/losers data
const formatGainerLoser = ({ symbol, ltp, change, pChange, volume }) => ({
  symbol, ltp, change, pChange, volume
});

// Format market status
const formatMarketStatus = (state, date) => ({
  market: 'Capital Market',
  marketStatus: state === 'REGULAR' ? 'Open' : 'Closed',
  marketState: state,
  tradeDate: date,
  index: 'NIFTY 50'
});

module.exports = {
  formatStock,
  formatIndex,
  formatGainerLoser,
  formatMarketStatus
};