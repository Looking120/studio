
// src/services/api-client.ts

export const API_BASE_URL = 'https://localhost:7294/api';

interface FetchOptions extends RequestInit {
  // You can add custom options if needed
}

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
 * A wrapper around the native fetch function to centralize API calls.
 * It automatically includes an Authorization header if a token is found in localStorage.
 * @param endpoint The API endpoint to call (e.g., '/employees').
 * @param options Fetch options (method, body, headers, etc.).
 * @returns Promise<Response>
 */
export async function apiClient(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Attempt to retrieve the auth token from localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

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
    console.warn(`API Info: Request to ${response.url} returned 204 No Content. Returning null.`);
    return null as T;
  }
  
  const responseText = await response.text();

  if (!response.ok) {
    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      const errorMessage = `API request failed with status 401: Unauthorized. ${responseText.trim() === '' ? 'Server returned an empty error response.' : responseText}`;
      console.warn(errorMessage); 
      throw new UnauthorizedError(errorMessage);
    }

    // Handle other non-OK responses (errors)
    let errorMessage = `API request failed with status ${response.status}`;
    if (responseText.trim() === '') {
      errorMessage += ". The server returned an empty error response.";
      // The console.error line that was here (line 81 in your log) has been removed.
      // The error will be thrown and can be logged by the calling service function.
    } else {
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage += `: ${errorJson.message || responseText}`;
        console.error(`API Error (${response.status}) - JSON Response:`, errorJson);
      } catch (e) {
        errorMessage += `: ${responseText}`;
        console.error(`API Error (${response.status}) - Non-JSON Response: ${responseText}`);
      }
    }
    throw new Error(errorMessage);
  }

  // Handle OK responses
  try {
    if (responseText.trim() === '' && response.ok) { // Specifically for 200 OK with empty body
      console.warn(`API Info: Request to ${response.url} was successful (${response.status} OK) but server returned an empty response body. Returning null as parsed JSON.`);
      return null as T; 
    }
    const json = JSON.parse(responseText);
    return json as T;
  } catch (e) {
    console.error(`Failed to parse JSON response for an OK request. Status: ${response.status}, URL: ${response.url}, Body: "${responseText}"`, e);
    throw new Error(`Failed to parse JSON response from a successful request. Status: ${response.status}, URL: ${response.url}`);
  }
}
