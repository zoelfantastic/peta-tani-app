import axios from "axios";

// Firebase Cloud Functions base URL — set NEXT_PUBLIC_FUNCTIONS_URL in .env.local
const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_FUNCTIONS_URL ?? "";

export const api = axios.create({
  baseURL: FUNCTIONS_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
