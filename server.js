const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Cache the USD->THB rate so we don't hit the forex API on every request.
let cache = { thb: null, ts: 0 };
const ONE_MINUTE = 60 * 1000;

app.get("/api/usdthb", async (req, res) => {
  const now = Date.now();
  if (cache.thb && now - cache.ts < ONE_MINUTE) {
    return res.json({ thb: cache.thb, cached: true });
  }
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await r.json();
    const thb = data && data.rates && data.rates.THB;
    if (!thb) throw new Error("THB rate missing in response");
    cache = { thb, ts: now };
    res.json({ thb, cached: false });
  } catch (err) {
    // If the API fails but we have an old value, serve it rather than erroring.
    if (cache.thb) return res.json({ thb: cache.thb, stale: true });
    res.status(502).json({ error: "Could not fetch USD/THB rate" });
  }
});

// Serve the built React app (Vite output) and let client-side routing work.
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
