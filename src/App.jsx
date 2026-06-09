import { useEffect, useRef, useState } from "react";

// A reusable realtime price feed over a Binance-style aggTrade/trade websocket.
// AsterDex mirrors Binance's stream format, so the same hook drives both.
function useLivePrice(wsUrl, field) {
  const [price, setPrice] = useState(null);
  const [direction, setDirection] = useState("neutral"); // up | down | neutral
  const [status, setStatus] = useState("connecting"); // live | disconnected | error
  const lastPriceRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    let latest = null;

    ws.onopen = () => setStatus("live");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (event) => {
      // Trades arrive many times per second; keep only the newest value.
      latest = parseFloat(JSON.parse(event.data)[field]);
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
  }, [wsUrl, field]);

  return { price, direction, status };
}

export default function App() {
  // BTC/USDT realtime from Binance.
  const btc = useLivePrice("wss://stream.binance.com:9443/ws/btcusdt@trade", "p");
  // ASTER/USDT realtime from AsterDex (Binance-compatible futures stream).
  const aster = useLivePrice(
    "wss://fstream.asterdex.com/ws/asterusdt@aggTrade",
    "p"
  );

  const [thbRate, setThbRate] = useState(null); // 1 USDT in THB

  // --- USDT->THB rate from our Express backend, kept live via polling ---
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
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const usd = (n, digits = 2) =>
    n == null
      ? "—"
      : n.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });

  const thb = (n, digits = 0) =>
    n == null
      ? "—"
      : n.toLocaleString("th-TH", {
          style: "currency",
          currency: "THB",
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });

  // Worst connection state across both feeds drives the header badge.
  const overall =
    btc.status === "live" && aster.status === "live"
      ? "live"
      : btc.status === "error" || aster.status === "error"
      ? "error"
      : btc.status === "disconnected" || aster.status === "disconnected"
      ? "disconnected"
      : "connecting";

  return (
    <div className="page">
      <div className="card">
        <header>
          <h1>
            <span className="btc">฿</span> Live Crypto · THB
          </h1>
          <span className={`badge ${overall}`}>
            <span className="dot" /> {overall}
          </span>
        </header>

        {/* The headline: 1 USDT in Thai Baht, refreshed live. */}
        <div className="fx">
          <span className="fx-label">1 USDT</span>
          <span className="fx-eq">=</span>
          <span className="fx-value">{thb(thbRate, 2)}</span>
        </div>

        <Coin
          name="BTC / USDT"
          source="Binance"
          feed={btc}
          thbRate={thbRate}
          usd={usd}
          thb={thb}
          priceDigits={2}
        />
        <Coin
          name="ASTER / USDT"
          source="AsterDex"
          feed={aster}
          thbRate={thbRate}
          usd={usd}
          thb={thb}
          priceDigits={5}
        />

        <footer>
          Prices: Binance &amp; AsterDex (realtime) · FX: open.er-api.com · USDT
          ≈ USD
        </footer>
      </div>
    </div>
  );
}

function Coin({ name, source, feed, thbRate, usd, thb, priceDigits }) {
  const inThb =
    feed.price != null && thbRate != null ? feed.price * thbRate : null;

  return (
    <div className="coin">
      <div className="coin-head">
        <span className="coin-name">{name}</span>
        <span className={`badge ${feed.status}`}>
          <span className="dot" /> {source}
        </span>
      </div>
      <div className={`price ${feed.direction}`}>
        {usd(feed.price, priceDigits)}
      </div>
      <div className="box">
        <span className="label">1 {name.split(" ")[0]} in THB</span>
        <span className="value">{thb(inThb, 2)}</span>
      </div>
    </div>
  );
}
