// src/services/api-client.ts

export const API_BASE_URL = 'https://localhost:7294/api';

interface FetchOptions extends RequestInit {
  // You can add custom options if needed
}

/**
 * A wrapper around the native fetch function to centralize API calls.
 * You can add common headers, error handling, etc., here.
 * @param endpoint The API endpoint to call (e.g., '/employees').
 * @param options Fetch options (method, body, headers, etc.).
 * @returns Promise<Response>
 */
export async function apiClient(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Add any other common headers, like Authorization tokens if needed
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Basic error handling example:
    // if (!response.ok) {
    //   // You might want to parse the error response body if your API provides one
    //   const errorData = await response.text();
    //   console.error(`API Error (${response.status}) for ${url}: ${errorData}`);
    //   throw new Error(`API request failed with status ${response.status}`);
    // }

    return response;
  } catch (error) {
    console.error(`Network or other error for ${url}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Helper function to parse JSON response.
 * @param response The Response object from a fetch call.
 * @returns Promise<T> The parsed JSON data.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) { // No Content
    return null as T; // Or handle as appropriate for your app
  }
  if (!response.ok) {
    const errorData = await response.text();
    console.error(`API Error (${response.status}): ${errorData}`);
    throw new Error(`API request failed with status ${response.status}: ${errorData}`);
  }
  return response.json() as Promise<T>;
}
