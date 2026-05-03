import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Chat uses direct http://127.0.0.1:8080/chat (see src/api.js — no /api proxy).
  },
});
