
// src/services/api-client.ts
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export const API_BASE_URL = 'https://localhost:7294/api';

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
      console.error(`API request to ${error.config?.url} failed with status ${status}. Message: ${errorMessage}`, data);
      throw new HttpError(errorMessage, status, data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network error or no response received for request to ' + error.config?.url + ':', error.request);
      throw new HttpError('Network error or no response from server. Please check your connection and the server status.', 0, null);
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
  headers?: Record<string, string>;
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
      headers: headers,
      params: params,
    });
    return response;
  } catch (error) {
    // The error will be processed by the response interceptor and re-thrown
    // as UnauthorizedError or HttpError. We just re-throw it here.
    throw error;
  }
}
