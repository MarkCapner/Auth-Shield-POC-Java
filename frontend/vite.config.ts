import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
proxy: {
  "/api": {
    target: "https://backend:8443",
    changeOrigin: true,
    secure: false, // allow self-signed cert
  },
  "/ws": {
    target: "wss://backend:8443",
    ws: true,
    changeOrigin: true,
    secure: false,
  },
}

  },
});
