# Nifty 50 Live Trading Dashboard

A real-time Nifty 50 market data dashboard built with **Node.js + Express** (backend) and **Angular 17** (frontend).

---

## 🏗️ Architecture

```
nifty50-dashboard/
├── backend/           # Node.js Express API (proxies NSE India)
└── frontend/          # Angular 17 SPA (standalone components)
```

**Data flow:**
```
NSE India (nseindia.com) → Node.js Backend (proxy + cache) → Angular Frontend
```

---

## ✨ Features

- 📈 **Live Nifty 50 data** — all 50 stocks with LTP, change, volume, 52W high/low
- 🔄 **Auto-refresh every 30 seconds** via Angular RxJS polling
- ⚡ **Price flash animations** — green flash on price up, red on price down
- 📊 **Index strip** — Nifty 50, Bank Nifty, Nifty IT, Nifty Midcap 50
- 🏆 **Top Gainers & Losers** panel
- 📉 **Market breadth bar** — advances vs declines visualization
- 🔍 **Live search** and **sortable columns**
- 💀 **Skeleton loading states**
- 🌙 **Dark theme** (auto light/dark via `prefers-color-scheme`)
- ⏰ **IST clock** and market open/closed status

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Angular CLI: `npm install -g @angular/cli`

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
# API running at http://localhost:3000
```

### 2. Start Frontend
```bash
cd frontend
npm install
ng serve
# App running at http://localhost:4200
```

---

## 📡 Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nifty50/constituents` | All 50 stocks with live prices |
| GET | `/api/nifty50/index` | Nifty50, BankNifty, NiftyIT, Midcap indices |
| GET | `/api/nifty50/gainers-losers` | Top 10 gainers and top 10 losers |
| GET | `/api/nifty50/market-status` | Is market currently open/closed |
| GET | `/api/nifty50/stock/:symbol` | Detailed data for a single stock |
| GET | `/health` | Health check |

**Caching:** All responses cached for 30 seconds server-side to avoid hammering NSE.

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17 (standalone components), RxJS, SCSS |
| Backend | Node.js, Express, Axios |
| Data Source | NSE India public endpoints |
| Caching | node-cache (30s TTL) |
| Deployment | Vercel (both frontend & backend) |

---

## ⚠️ Important Notes

1. **NSE Data**: NSE India doesn't provide an official public API. The backend scrapes their web endpoints, which is a common approach for Indian market data apps.

2. **Market Hours**: Live data is available during NSE trading hours:
   - Monday–Friday: 9:15 AM – 3:30 PM IST
   - Outside hours: last available closing prices

3. **Not Financial Advice**: This dashboard is for informational/educational purposes only.

---

## 🗂️ Project Structure (Detailed)

```
backend/
├── server.js
├── package.json
├── .env
├── .gitignore
├── src/
│   ├── config/
│   │   └── constants.js
│   ├── controllers/
│   │   ├── indexController.js
│   │   ├── stocksController.js
│   │   ├── marketStatusController.js
│   │   └── debugController.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── niftyRoutes.js
│   │   └── debugRoutes.js
│   ├── services/
│   │   └── yahooFinanceService.js
│   ├── utils/
│   │   ├── cache.js
│   │   ├── formatters.js
│   │   ├── helpers.js
│   │   └── rateLimiter.js
│   └── middleware/
│       └── errorHandler.js

frontend/
├── src/
│   ├── app/
│   │   ├── app.component.*        # Root layout
│   │   ├── app.config.ts          # Angular providers
│   │   ├── models/
│   │   │   └── market.model.ts    # TypeScript interfaces
│   │   ├── services/
│   │   │   └── market.service.ts  # HTTP + RxJS polling
│   │   └── components/
│   │       ├── navbar/            # Top navigation bar
│   │       ├── index-header/      # Indices strip + market status
│   │       ├── stock-table/       # Main Nifty 50 table
│   │       └── gainers-losers/    # Sidebar panel
│   ├── environments/
│   │   ├── environment.ts         # Dev: localhost:3000
│   │   └── environment.prod.ts    # Prod: your Vercel backend URL
│   ├── styles.scss                # Global CSS variables + theme
│   ├── index.html
│   └── main.ts
├── angular.json
├── tsconfig.json
├── package.json
└── vercel.json
```
