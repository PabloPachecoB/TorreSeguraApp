import axios from "axios";
import { API_BASE } from "@env";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from "./tokenStorage";

const baseURL = `${API_BASE}/api/v1`;

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    const url = originalRequest?.url || "";
    const isAuthCall =
      url.includes("/auth/token/") || url.includes("/auth/token/refresh/");

    if (!originalRequest || status !== 401 || originalRequest._retry || isAuthCall) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refresh = await getRefreshToken();
    if (!refresh) {
      await clearTokens();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(
        `${baseURL}/auth/token/refresh/`,
        { refresh },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const newAccess = refreshResponse?.data?.access;
      if (!newAccess) {
        await clearTokens();
        return Promise.reject(error);
      }

      await setAccessToken(newAccess);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newAccess}`,
      };

      return api(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

export function normalizeApiError(err) {
  const status = err?.response?.status ?? null;
  const data = err?.response?.data ?? null;

  const message =
    data?.error ||
    data?.mensaje ||
    data?.detail ||
    (typeof data === "string" ? data : null) ||
    err?.message ||
    "Error inesperado";

  return { status, data, message };
}
