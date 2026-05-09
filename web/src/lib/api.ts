import axios from "axios";
import { auth } from "./firebase";

const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_FUNCTIONS_URL ?? "";

export const api = axios.create({
  baseURL: FUNCTIONS_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Always fetch a fresh token from Firebase Auth — SDK auto-refreshes it
// when expired (every 1 hour), so we never send a stale token.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
