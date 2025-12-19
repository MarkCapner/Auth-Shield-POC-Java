import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

/**
 * Backend targets
 * - Defaults to HTTPS backend
 * - Can be overridden via env (Docker / CI)
 */
const API_TARGET =
  process.env.VITE_API_TARGET || "https://localhost:8443";

const WS_TARGET =
  process.env.VITE_WS_TARGET ||
  API_TARGET.replace(/^https?/, (m) => (m === "https" ? "wss" : "ws"));

/**
 * Conditional HTTPS (Docker-safe)
 * Enable Vite HTTPS ONLY if certs exist
 */
const certDir = path.resolve(
  import.meta.dirname,
  "client",
  "certs",
);

const keyPath = path.join(certDir, "localhost-key.pem");
const certPath = path.join(certDir, "localhost.pem");

const hasHttpsCerts =
  fs.existsSync(keyPath) && fs.existsSync(certPath);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    /**
     * 🔐 HTTPS — enabled ONLY when certs exist
     * - Host dev: enabled
     * - Docker / CI: disabled (no crash)
     */
    ...(hasHttpsCerts
      ? {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        }
      : {}),

    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        secure: false, // allow self-signed / mkcert
      },
      "/ws": {
        target: WS_TARGET,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },

    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
