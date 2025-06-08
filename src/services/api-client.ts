
// src/services/api-client.ts
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export const API_BASE_URL = 'https://localhost:7294/api'; // Mis à jour pour localhost

/**
 * Custom error class for Unauthorized (401) responses.
 */
export class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message || "Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Custom error class for general HTTP errors.
 */
export class HttpError extends Error {
  public responseData: any;
  constructor(message: string, public status: number, responseData: any) {
    super(message);
    this.name = "HttpError";
    this.responseData = responseData;
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Axios request error:', error);
    return Promise.reject(new HttpError(error.message || 'Failed to send request.', 0, null));
  }
);

const isHostnameIpAddress = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(hostname);
  } catch (e) {
    return false;
  }
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage: string;

      if (status === 500) {
        // For 500 errors, try to get a specific message, otherwise be generic for the HttpError instance.
        if (data && typeof data === 'object' && (data.message || data.title || data.detail)) {
          errorMessage = (data as any).message || (data as any).title || (data as any).detail;
        } else {
          errorMessage = "Internal Server Error"; // Generic message for the HttpError instance itself
        }
      } else if (data && typeof data === 'object') { // For non-500 errors
        // Attempt to parse a structured error message
        errorMessage = (data as any).message || (data as any).title || (data as any).detail || JSON.stringify(data);
      } else if (typeof data === 'string' && data.trim() !== '') {
        // Use the string data if it's not empty
        errorMessage = data;
      } else {
        // Fallback to Axios error message or a generic status code message
        errorMessage = error.message || `Request failed with status code ${status}`;
      }
      
      if (status === 401) {
        console.warn(`API request to ${error.config?.url} failed with status 401: Unauthorized. Message: ${errorMessage}`);
        throw new UnauthorizedError(`Unauthorized: ${errorMessage}`);
      }
      
      const logMessageBase = `API request to ${error.config?.url} failed with status ${status}.`;
      
      if (status === 500) {
         console.warn(`${logMessageBase} Error: "${errorMessage}". The page should handle this. Full response data:`, data);
      } else if (status === 415 && error.config?.url?.includes('/auth/signout')) {
        console.warn(`${logMessageBase} Message: ${errorMessage}. This might be related to Content-Type on signout. Data:`, data);
      } else if (status !== 404) { // Avoid console.error for 404s as they are common "not found" scenarios
        console.error(`${logMessageBase} Message: ${errorMessage}. Data:`, data);
      }
      // For 404, HttpError is thrown, but no specific console.error here, page component can decide how to log/handle.
      
      throw new HttpError(errorMessage, status, data);
    } else if (error.request) {
      const targetUrl = error.config?.baseURL && error.config?.url ? `${error.config.baseURL}${error.config.url}` : error.config?.url || 'unknown URL';
      let detailedErrorMessage = `Network error: No response from server at ${targetUrl}.`;
      const logMessageBase = `[apiClient] Network request to ${targetUrl} failed. No response received from server. Original Axios error: ${error.message}.`;

      if (isHostnameIpAddress(error.config?.baseURL || API_BASE_URL) && targetUrl.startsWith('https://')) {
        detailedErrorMessage += ' When accessing a local IP via HTTPS, ensure you have accepted/bypassed any SSL certificate warnings in your browser for this IP address.';
      } else if (targetUrl.startsWith('https://localhost') && error.message.includes('Network Error')) {
         detailedErrorMessage += ' Ensure the backend server is running and the Kestrel development certificate is trusted (run `dotnet dev-certs https --trust`).';
      } else {
        detailedErrorMessage += ' Check backend server, firewall, and (if HTTPS) SSL certificate validity.';
      }
      console.warn(`${logMessageBase} ${detailedErrorMessage}`, error.request);
      throw new HttpError(detailedErrorMessage, 0, null);
    } else {
      console.error('Axios setup error for request to ' + error.config?.url + ':', error.message);
      throw new HttpError(error.message || 'An unknown error occurred while setting up the request.', 0, null);
    }
  }
);

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string | null> | {};
  params?: Record<string, any>;
}

export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<AxiosResponse<T>> {
  const { method = 'GET', body, headers, params } = options;

  try {
    const response = await axiosInstance.request<T>({
      url: endpoint,
      method: method,
      data: body,
      headers: headers as Record<string, string>,
      params: params,
    });
    return response;
  } catch (error) {
    throw error;
  }
}
