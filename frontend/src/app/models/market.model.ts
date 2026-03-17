export interface StockData {
  symbol: string;
  open: number;
  high: number;
  low: number;
  ltp: number;
  previousClose: number;
  change: number;
  pChange: number;
  volume: number;
  value: number;
  weekHigh52: number;
  weekLow52: number;
  perChange365d?: number;
  perChange30d?: number;
  nearWKH?: number;
  nearWKL?: number;
  series?: string;
}

export interface IndexData {
  index: string;
  last: number;
  open?: number;
  high?: number;
  low?: number;
  variation: number;
  percentChange: number;
  previousClose?: number;
  yearHigh?: number;
  yearLow?: number;
  advances?: number;
  declines?: number;
  unchanged?: number;
  pe?: number;
  pb?: number;
  dy?: number;
}

export interface Nifty50Response {
  indexData: any;
  stocks: StockData[];
  timestamp: string;
}

export interface IndexResponse {
  nifty50: IndexData;
  bankNifty: IndexData;
  niftyIt: IndexData;
  niftyMidcap50: IndexData;
  timestamp: string;
}

export interface GainersLosersResponse {
  gainers: { symbol: string; ltp: number; change: number; pChange: number; volume: number }[];
  losers: { symbol: string; ltp: number; change: number; pChange: number; volume: number }[];
  timestamp: string;
}

export interface MarketStatus {
  marketState: { market: string; marketStatus: string; tradeDate: string; index: string }[];
}
