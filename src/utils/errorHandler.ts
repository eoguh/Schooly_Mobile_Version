// utils/errorHandler.ts
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class NetworkError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof NetworkError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
    };
  }

  // Handle different types of errors
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    let message = 'An error occurred';

    switch (status) {
      case 400:
        message = error.response.data?.message || 'Invalid request';
        break;
      case 401:
        message = 'Invalid credentials';
        break;
      case 403:
        message = 'Access denied';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 422:
        message = error.response.data?.message || 'Validation error';
        break;
      case 500:
        message = 'Server error. Please try again later';
        break;
      default:
        message = error.response.data?.message || `Error ${status}`;
    }

    return { message, status };
  }

  if (error.request) {
    // Network error
    return {
      message: 'Network error. Please check your connection.',
    };
  }

  return {
    message: error.message || 'An unexpected error occurred',
  };
};

// Network status checker
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // Try to fetch a simple endpoint or use a connectivity library
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch {
    return false;
  }
};