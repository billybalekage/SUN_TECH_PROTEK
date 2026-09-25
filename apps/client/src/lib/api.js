import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

const AUTH_PATHS_WITHOUT_RETRY = ["/auth/refresh-token", "/auth/login"];

let refreshPromise = null;

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

    config._retry = true;

    try {
      refreshPromise ??= api.post("clients/auth/refresh");
      await refreshPromise;
      refreshPromise = null;
      return api(config);
    } catch (refreshError) {
      refreshPromise = null;
      return Promise.reject(refreshError);
    }
  },
);
