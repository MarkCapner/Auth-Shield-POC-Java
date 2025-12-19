import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const API_TARGET =
  process.env.VITE_API_TARGET || "http://server:8080";

const WS_TARGET =
  process.env.VITE_WS_TARGET ||
  API_TARGET.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws"));

const certDir = path.resolve(import.meta.dirname, "certs");
const hasHttpsCerts =
  fs.existsSync(path.join(certDir, "localhost.pem")) &&
  fs.existsSync(path.join(certDir, "localhost-key.pem"));

export default defineConfig({
  // 🔑 IMPORTANT: repo root is the app root
  root: path.resolve(import.meta.dirname, ".."),

  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },

  server: {
    host: true,

    ...(hasHttpsCerts
      ? {
          https: {
            key: fs.readFileSync(
              path.join(certDir, "localhost-key.pem"),
            ),
            cert: fs.readFileSync(
              path.join(certDir, "localhost.pem"),
            ),
          },
        }
      : {}),

    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
      "/ws": {
        target: WS_TARGET,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
