
// src/services/api-client.ts
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export const API_BASE_URL = 'http://192.168.0.119:5125/api'; // Changed to HTTP and port 5125

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
    // This is for request errors (e.g. network issue before request is sent)
    console.error('Axios request error:', error);
    return Promise.reject(new HttpError(error.message || 'Failed to send request.', 0, null));
  }
);

// Heuristic to check if a string looks like an IP address based URL's hostname
const isHostnameIpAddress = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    // Basic IPv4 regex
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(hostname);
  } catch (e) {
    // If it's a relative URL (like from error.config.url), new URL will fail.
    // In that case, we assume it's not an IP for this specific check.
    return false;
  }
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // For successful responses (2xx range)
    // Axios automatically parses JSON, so response.data is the parsed body
    // If status is 204 No Content, response.data will be null or an empty string.
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      let errorMessage = 'An error occurred';
      if (data && typeof data === 'object') {
        errorMessage = (data as any).message || (data as any).title || (data as any).detail || JSON.stringify(data);
      } else if (typeof data === 'string' && data.trim() !== '') {
        errorMessage = data;
      } else {
        errorMessage = error.message || `Request failed with status code ${status}`;
      }
      
      if (status === 401) {
        console.warn(`API request to ${error.config?.url} failed with status 401: Unauthorized. Message: ${errorMessage}`);
        throw new UnauthorizedError(`Unauthorized: ${errorMessage}`);
      }
      
      // Conditionally log error for non-404 statuses, as 404s might be handled specifically by services
      if (status !== 404 && status !== 500) {
        console.error(`API request to ${error.config?.url} failed with status ${status}. Message: ${errorMessage}`, data);
      } else if (status === 500) {
        console.warn(`API request to ${error.config?.url} resulted in a ${status} Internal Server Error. Message: "${errorMessage}". The page should handle this.`, data);
      }
      throw new HttpError(errorMessage, status, data);
    } else if (error.request) {
      // The request was made but no response was received
      const targetUrl = error.config?.baseURL && error.config?.url ? `${error.config.baseURL}${error.config.url}` : error.config?.url || 'unknown URL';
      const logMessage = `Network error or no response received from ${targetUrl}:`;
      
      let detailedErrorMessage = `Network error: No response from server at ${targetUrl}.`;
      if (isHostnameIpAddress(error.config?.baseURL || API_BASE_URL)) {
        detailedErrorMessage += ' When accessing a local IP, ensure the server is listening on that IP (not just localhost), and check firewall/HTTPS certificate validity from this device.';
      }
      // Explicitly use console.warn for the "no response" scenario
      console.warn(logMessage, "Details:", error.message);
      throw new HttpError(detailedErrorMessage, 0, null);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Axios setup error for request to ' + error.config?.url + ':', error.message);
      throw new HttpError(error.message || 'An unknown error occurred while setting up the request.', 0, null);
    }
  }
);

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any; // For axios, this will be 'data'
  headers?: Record<string, string | null> | {}; // Allow null to remove header
  params?: Record<string, any>; // For URL query parameters
}

/**
 * A wrapper around an axios instance to centralize API calls.
 * @param endpoint The API endpoint to call (e.g., '/employees').
 * @param options Options including method, body (as data), headers, params.
 * @returns Promise<AxiosResponse<T>> which includes .data property with parsed body
 */
export async function apiClient<T = any>(endpoint: string, options: ApiClientOptions = {}): Promise<AxiosResponse<T>> {
  const { method = 'GET', body, headers, params } = options;

  try {
    const response = await axiosInstance.request<T>({
      url: endpoint,
      method: method,
      data: body, // 'data' is the Axios equivalent of 'body' in fetch
      headers: headers as Record<string, string>, // Cast because axios expects string values for headers
      params: params,
    });
    return response;
  } catch (error) {
    // The error will be processed by the response interceptor and re-thrown
    // as UnauthorizedError or HttpError. We just re-throw it here.
    throw error;
  }
}

