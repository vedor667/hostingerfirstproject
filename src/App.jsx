import { useEffect, useRef, useState } from "react";

export default function App() {
  const [price, setPrice] = useState(null); // BTC/USDT, realtime from Binance
  const [direction, setDirection] = useState("neutral"); // up | down | neutral
  const [thbRate, setThbRate] = useState(null); // 1 USDT in THB
  const [status, setStatus] = useState("connecting"); // ws connection state
  const lastPriceRef = useRef(null);

  // --- Realtime BTC/USDT price via Binance WebSocket ---
  useEffect(() => {
    const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
    let latest = null;

    ws.onopen = () => setStatus("live");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (event) => {
      // Trades arrive many times per second; keep only the newest value.
      latest = parseFloat(JSON.parse(event.data).p);
    };

    // Commit the latest price to the UI ~7x/sec — realtime feel, no overload.
    const flush = setInterval(() => {
      if (latest == null) return;
      const last = lastPriceRef.current;
      if (last != null && latest !== last) {
        setDirection(latest > last ? "up" : "down");
      }
      lastPriceRef.current = latest;
      setPrice(latest);
    }, 150);

    return () => {
      clearInterval(flush);
      ws.close();
    };
  }, []);

  // --- USDT->THB rate from our Express backend, refreshed every 60s ---
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/usdthb");
        const data = await res.json();
        if (active && data.thb) setThbRate(data.thb);
      } catch {
        /* keep last known rate on failure */
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const usd = (n) =>
    n == null
      ? "—"
      : n.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        });

  const thb = (n) =>
    n == null
      ? "—"
      : n.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        });

  const btcInThb = price != null && thbRate != null ? price * thbRate : null;

  return (
    <div className="page">
      <div className="card">
        <header>
          <h1>
            <span className="btc">₿</span> BTC / USDT
          </h1>
          <span className={`badge ${status}`}>
            <span className="dot" /> {status}
          </span>
        </header>

        <div className={`price ${direction}`}>{usd(price)}</div>

        <div className="grid">
          <div className="box">
            <span className="label">1 USDT in THB</span>
            <span className="value">{thb(thbRate)}</span>
          </div>
          <div className="box highlight">
            <span className="label">1 BTC in THB</span>
            <span className="value">{thb(btcInThb)}</span>
          </div>
        </div>

        <footer>
          Price: Binance (realtime) · FX: open.er-api.com (hourly) · USDT ≈ USD
        </footer>
      </div>
    </div>
  );
}
