/** Cấu hình chung (có thể override bằng VITE_API_URL trong .env) */
/** Dev: để rỗng để gọi /api qua proxy Vite (tránh CORS / Failed to fetch). Prod: URL backend thật. */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "" : "http://localhost:5000");
