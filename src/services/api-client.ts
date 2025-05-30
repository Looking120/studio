// src/services/api-client.ts

export const API_BASE_URL = 'https://localhost:7294/api';

interface FetchOptions extends RequestInit {
  // You can add custom options if needed
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
  // This assumes you store the token after a successful login.
  // Ensure this code only runs on the client-side.
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
    return null as T;
  }
  // Try to parse JSON even if response is not ok, as it might contain error details
  const responseText = await response.text();
  try {
    const json = JSON.parse(responseText);
    if (!response.ok) {
      console.error(`API Error (${response.status}) - JSON Response:`, json);
      // You might want to throw an error object that includes the parsed JSON
      throw new Error(`API request failed with status ${response.status}: ${json.message || responseText}`);
    }
    return json as T;
  } catch (e) {
    // If parsing failed, and response was not ok, throw with original text
    if (!response.ok) {
        console.error(`API Error (${response.status}) - Non-JSON Response: ${responseText}`);
        throw new Error(`API request failed with status ${response.status}: ${responseText}`);
    }
    // If response was ok but parsing failed (should not happen with well-formed JSON API)
    console.error('Failed to parse JSON response:', responseText, e);
    throw new Error('Failed to parse JSON response.');
  }
}
