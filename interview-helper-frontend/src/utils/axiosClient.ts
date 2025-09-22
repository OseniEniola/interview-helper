// lib/axiosClient.ts

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// You should implement or import this function to retrieve the refresh token
const getRefreshToken = (): string | null => {
  // Example: return localStorage.getItem('refreshToken');
  return null;
};

// You should implement or import this function to retrieve the access token
const getAccessToken = (): string | null => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    const session = JSON.parse(userData);
    return session?.token || null;
  }
  return null;
};

export const createAxiosClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL:baseUrl,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken?.();
    if (!refreshToken) return null;

    try {
      const res = await axios.post(`${baseUrl}/auth/refresh-token`, {
        refreshToken,
      });

      const newToken = res.data?.data?.tokens?.accessToken;
      if (newToken) {
        // You must set the new token yourself where it lives (e.g. in a cookie)
        return newToken;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error('[ERROR] Failed to refresh access token:', err.response?.data);
      } else {
        console.error('[ERROR] Failed to refresh access token:', err);
      }
    }

    return null;
  };

  client.interceptors.request.use((config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers = config.headers || {} as any;
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
      if (err.response?.status === 401) {
        window.location.href = '/'
      }

      return Promise.reject(err);
    }
  );

  return client;
};
export default createAxiosClient;