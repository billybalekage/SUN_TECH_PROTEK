import axios from "axios";
import { queryClient } from "./queryClient";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const AUTH_PATHS_WITHOUT_RETRY = [
  "clients/auth/refresh",
  "clients/auth/login/password",
  "clients/auth/otp/request",
  "clients/auth/otp/verify",
  "clients/auth/signup",
  "clients/auth/logout",
];

let isRefreshing = false;
let refreshQueue = [];

const flushRefreshQueue = (error, token) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });

  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    if (AUTH_PATHS_WITHOUT_RETRY.some((path) => config.url?.includes(path))) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: () => resolve(api(config)),
          reject,
        });
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      await api.post("clients/auth/refresh");
      flushRefreshQueue(null, true);
      return api(config);
    } catch (refreshError) {
      flushRefreshQueue(refreshError, null);
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      window.location.assign("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
