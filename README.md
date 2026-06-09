# BTC/USDT → THB Tracker

A realtime Bitcoin price tracker. Shows the live **BTC/USDT** price from Binance
and converts it to **Thai Baht (THB)**.

- **Frontend:** React + Vite
- **Backend:** Express (serves the built app + a `/api/usdthb` exchange-rate endpoint)
- **Realtime price:** Binance WebSocket (in the browser)
- **FX rate:** open.er-api.com (cached on the server)

## Run locally

```bash
npm install
npm run build   # builds the React app into ./dist
npm start       # serves it on http://localhost:3000
```

Open http://localhost:3000

### Dev mode (hot reload)

In one terminal run `npm start` (the API), in another run `npm run dev` (Vite on
:5173, which proxies `/api` to :3000).

## Deploy

Push to GitHub; Hostinger auto-deploys (install → build → start).
