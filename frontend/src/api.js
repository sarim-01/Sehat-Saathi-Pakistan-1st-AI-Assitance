/**
 * Direct POST target (same origin as browser → backend; CORS is open on FastAPI).
 * Override with VITE_API_BASE (no trailing slash) for production.
 */
export const API_URL = "http://127.0.0.1:8080/chat"

export function chatUrl() {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") ?? ""
  if (base) return `${base}/chat`
  return API_URL
}
