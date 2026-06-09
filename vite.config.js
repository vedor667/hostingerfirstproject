import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Builds the React app into ./dist, which Express serves in production.
// In dev (`npm run dev`), proxy /api calls to the Express server on :3000.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
