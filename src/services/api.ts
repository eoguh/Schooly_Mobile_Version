// api.ts - Enhanced version with password reset functionality
import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config/env';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface LoginResponse {
  email: string;
  username: string;
  tokens: {
    access: string;
    refresh: string;
  };
  user_id?: string;
  id?: string;
  fullname?: string;
  full_name?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  fullname: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ResendOTPRequest {
  email: string;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  otp: string;
  new_password: string;
  confirm_new_password: string;
}

// Academic Info Types
export interface AcademicInfoRequest {
  course_of_study: string;
  subjects: string;
  level_of_study: string;
  daily_attention_target: number;
}

export interface SubTopic {
  id: number;
  sub_topic: string;
  class_time_start: string;
  class_time_end: string;
  class_days: string;
  youtube_link: string;
  topic: number;
}

export interface Topic {
  id: number;
  name: string;
  sub_topics: SubTopic[];
}

export interface CourseOutlineRequest {
  course_of_study: string;
  subjects: string;
  daily_attention_target: number;
  learning_preferences?: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// API Service Class
class ApiService {
  private api: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private tokenRefreshFailedCallback?: () => void;

  constructor() {
    this.api = axios.create({
      baseURL: config.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Use a clean axios instance for refresh to avoid interceptor loops
      const refreshResponse = await axios.post(
        `${config.API_BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const { access, refresh } = refreshResponse.data;

      if (!access) {
        throw new Error('No access token in refresh response');
      }

      // Store new access token
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, access],
        [STORAGE_KEYS.REFRESH_TOKEN, refresh]
      ]);

      // Update default headers for future requests
      this.api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      return access;
    } catch (error: any) {
      // Clear invalid tokens
      await this.clearTokens();
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
      delete this.api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add token if not already present and we have one stored
        if (!config.headers?.Authorization) {
          const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with improved token refresh logic
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only handle 401 errors for token refresh
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {

          // If we're already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.api(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);

            // Update the original request with new token
            if (originalRequest.headers && newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }

            return this.api(originalRequest);

          } catch (refreshError) {
            this.processQueue(refreshError, null);

            // Notify that refresh failed - user needs to login again
            if (this.tokenRefreshFailedCallback) {
              this.tokenRefreshFailedCallback();
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): ApiResponse {
    console.error('API Error:', error.response?.data || error.message);

    let errorMessage = 'An error occurred';

    if (error.response) {
      const data = error.response.data as any;

      // Handle different error formats
      if (data.error && Array.isArray(data.error)) {
        errorMessage = data.error.join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (typeof data === 'string') {
        errorMessage = data;
      }

      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          errorMessage = errorMessage || 'Invalid request';
          break;
        case 401:
          errorMessage = errorMessage || 'Authentication failed';
          break;
        case 403:
          errorMessage = errorMessage || 'Access denied';
          break;
        case 404:
          errorMessage = errorMessage || 'Resource not found';
          break;
        case 422:
          errorMessage = errorMessage || 'Validation error';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = errorMessage || 'An error occurred';
      }

      return {
        success: false,
        message: errorMessage,
        data: data,
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Authentication APIs
  async register(userData: RegisterRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/register/', userData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.api.post<LoginResponse>('/auth/login/', credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async verifyOTP(otpData: VerifyOTPRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/verify-otp/', otpData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async resendOTP(emailData: ResendOTPRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/resend-otp/', emailData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Password Reset APIs
  async requestPasswordReset(emailData: PasswordResetRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/password-reset/', emailData);
      return {
        success: true,
        data: response.data,
        message: 'Password reset OTP sent successfully'
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async confirmPasswordReset(resetData: PasswordResetConfirmRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/auth/password-reset-confirm/', resetData);
      return {
        success: true,
        data: response.data,
        message: 'Password reset successful'
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Academic Info APIs
  async getAcademicInfo(): Promise<ApiResponse> {
    try {
      const response = await this.api.get('/schooly/academic-info/');

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async saveAcademicInfo(academicData: AcademicInfoRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/schooly/academic-info/', academicData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async getTopics(): Promise<ApiResponse<Topic[]>> {
    try {
      const response = await this.api.get<Topic[]>('/schooly/topics');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  async generateCourseOutline(outlineData: CourseOutlineRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.post('/ai/generate-course-outline/', outlineData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  // Token management methods
  async setAuthToken(token: string): Promise<void> {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  async removeAuthToken(): Promise<void> {
    delete this.api.defaults.headers.common['Authorization'];
    await this.clearTokens();
  }

  // Method to handle refresh failure callback
  onTokenRefreshFailed(callback: () => void): void {
    this.tokenRefreshFailedCallback = callback;
  }

  // Get the axios instance for custom requests if needed
  getApiInstance(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();