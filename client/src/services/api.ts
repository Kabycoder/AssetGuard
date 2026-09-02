import axios from 'axios';
import { ApiResponse, AuthResponseData, LoginCredentials, User } from '../types';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Centralized Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized Response Interceptor: Handle 401 Expired Token Cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on protected endpoint, remove stale token
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponseData>> => {
    const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/auth/logout');
      return response.data;
    } catch {
      return { success: true, message: 'Logged out' };
    }
  },
};

export const apiService = {
  checkHealth: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/health');
    return response.data;
  },
};
