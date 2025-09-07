import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, LoginResponse, RegisterRequest, VerifyOTPRequest, ResendOTPRequest } from '@/services/api';

interface User {
  id: string;
  email: string;
  username: string;
  fullname?: string;
}

interface AcademicInfo {
  course_of_study: string;
  level_of_study: string;
  subjects: string;
  daily_attention_target: number;
  course_outline?: string;
}

// Academic Info Request type for API
export interface AcademicInfoRequest {
  course_of_study: string;
  level_of_study: string;
  subjects: string;
  daily_attention_target: number;
}

export interface CourseOutlineRequest {
  course_of_study: string;
  subjects: string;
  daily_attention_target: number;
  learning_preferences?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  academicInfo: AcademicInfo | null;
  hasCompleteAcademicInfo: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  resendOTP: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  saveAcademicInfo: (info: AcademicInfoRequest) => Promise<void>;
  generateAndSaveCourseOutline: (academicInfo: CourseOutlineRequest) => Promise<string>;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ACADEMIC_INFO: 'academic_info',
} as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [hasCompleteAcademicInfo, setHasCompleteAcademicInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Check if academic info is complete
  const checkAcademicInfoComplete = (info: AcademicInfo | null): boolean => {
    if (!info) return false;
    return !!(
      info.course_of_study &&
      info.subjects &&
      info.level_of_study &&
      info.daily_attention_target
    );
  };

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();

    // Set up callback for when token refresh fails
    apiService.onTokenRefreshFailed(() => {
      handleLogout();
    });
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      const [token, userData, academicData] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.ACADEMIC_INFO,
      ]);

      const accessTokenValue = token[1];
      const userDataValue = userData[1];
      const academicDataValue = academicData[1];

      if (accessTokenValue && userDataValue) {
        const parsedUser = JSON.parse(userDataValue);

        setAccessToken(accessTokenValue);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Handle academic info
        if (academicDataValue) {
          const parsedAcademicInfo = JSON.parse(academicDataValue);
          setAcademicInfo(parsedAcademicInfo);
          setHasCompleteAcademicInfo(checkAcademicInfoComplete(parsedAcademicInfo));
        } else {
          // Try to fetch from API if not in local storage
          await fetchAcademicInfo();
        }

        // Set token in API service
        await apiService.setAuthToken(accessTokenValue);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear potentially corrupted data
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademicInfo = async (): Promise<void> => {
    try {
      const response = await apiService.getAcademicInfo();

      if (response.success && response.data) {
        const academicData = response.data;
        await AsyncStorage.setItem(STORAGE_KEYS.ACADEMIC_INFO, JSON.stringify(academicData));
        setAcademicInfo(academicData);
        setHasCompleteAcademicInfo(checkAcademicInfoComplete(academicData));
      } else {
        // If no academic info found, set flags appropriately
        setAcademicInfo(null);
        setHasCompleteAcademicInfo(false);
      }
    } catch (error: any) {
      console.error('Error fetching academic info:', error);
      // If 404 or academic info not found, user needs onboarding
      if (error?.response?.status === 404) {
        setAcademicInfo(null);
        setHasCompleteAcademicInfo(false);
      } else {
        // For other errors, assume no academic info
        setAcademicInfo(null);
        setHasCompleteAcademicInfo(false);
      }
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ email, password });

      if (response.success && response.data) {
        const loginData = response.data;

        const accessTokenValue = loginData.tokens.access;
        const refreshToken = loginData.tokens.refresh;

        if (!accessTokenValue || !refreshToken) {
          throw new Error('Invalid response: missing authentication tokens');
        }

        const userData: User = {
          id: loginData.user_id || loginData.id || 'unknown',
          email: loginData.email || email,
          username: loginData.username || '',
          fullname: loginData.fullname || loginData.full_name || '',
        };

        await AsyncStorage.multiSet([
          [STORAGE_KEYS.ACCESS_TOKEN, accessTokenValue],
          [STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
          [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
        ]);

        setAccessToken(accessTokenValue);
        setUser(userData);
        setIsAuthenticated(true);

        await apiService.setAuthToken(accessTokenValue);

        // Fetch academic info and let the layout handle navigation
        await fetchAcademicInfo();

        // Don't navigate here - let the layout components handle it based on state
      } else {
        const errorMessage = response.message || 'Login failed';
        if (errorMessage.toLowerCase().includes('not verified')) {
          throw new Error('Email is not verified');
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveAcademicInfo = async (info: AcademicInfoRequest): Promise<void> => {
    try {
      setIsLoading(true);
      // Save to API
      const response = await apiService.saveAcademicInfo(info);

      if (response.success) {
        // Save locally
        const academicInfo = response.data || info;
        await AsyncStorage.setItem(STORAGE_KEYS.ACADEMIC_INFO, JSON.stringify(academicInfo));
        setAcademicInfo(academicInfo);
        setHasCompleteAcademicInfo(checkAcademicInfoComplete(academicInfo));
      } else {
        throw new Error(response.message || 'Failed to save academic info');
      }
    } catch (error: any) {
      console.error('⚠️ Save academic info error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAndSaveCourseOutline = async (academicInfo: CourseOutlineRequest): Promise<string> => {
    try {
      setIsLoading(true);
      // Call AI endpoint to generate course outline
      const response = await apiService.generateCourseOutline(academicInfo);

      if (response.success && response.data) {
        // Save course outline as JSON string
        const courseOutlineJson = JSON.stringify(response.data);

        // Update local academic info with course outline
        const currentAcademicInfo = await AsyncStorage.getItem(STORAGE_KEYS.ACADEMIC_INFO);
        if (currentAcademicInfo) {
          const updatedAcademicInfo = {
            ...JSON.parse(currentAcademicInfo),
            course_outline: courseOutlineJson
          };

          await AsyncStorage.setItem(STORAGE_KEYS.ACADEMIC_INFO, JSON.stringify(updatedAcademicInfo));
          setAcademicInfo(updatedAcademicInfo);
        }
        return courseOutlineJson;
      } else {
        throw new Error(response.message || 'Failed to generate course outline');
      }
    } catch (error: any) {
      console.error('⚠️ Generate course outline error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);

      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      // Store email for OTP verification
      await AsyncStorage.setItem('pending_verification_email', userData.email);
    } catch (error: any) {
      console.error('Registration error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.verifyOTP({ email, otp });

      if (!response.success) {
        throw new Error(response.message || 'OTP verification failed');
      }

      // Clear pending verification email
      await AsyncStorage.removeItem('pending_verification_email');
    } catch (error: any) {
      console.error('OTP verification error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.resendOTP({ email });

      if (!response.success) {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.ACADEMIC_INFO,
        'pending_verification_email',
      ]);

      // Clear state
      setIsAuthenticated(false);
      setUser(null);
      setAcademicInfo(null);
      setHasCompleteAcademicInfo(false);
      setAccessToken(null);

      // Remove token from API service
      await apiService.removeAuthToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    await handleLogout();
    setIsLoading(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    academicInfo,
    hasCompleteAcademicInfo,
    isLoading,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    saveAcademicInfo,
    generateAndSaveCourseOutline,
    accessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}