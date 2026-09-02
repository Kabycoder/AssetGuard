export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
}
