// src/services/auth-service.ts
import { apiClient, parseJsonResponse } from './api-client';

// Define types for auth responses, adjust as per your API
export interface SignInResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    // other user details
  };
}

export interface SignUpResponse {
  message: string;
  userId?: string;
  // other relevant fields
}

/**
 * Signs in a user.
 * Corresponds to: POST /api/auth/signin
 * @param credentials Email and password.
 */
export async function signIn(credentials: { email?: string; username?: string; password?: string }): Promise<SignInResponse> {
  console.log('API CALL: POST /api/auth/signin. Credentials:', credentials);
  const response = await apiClient('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return parseJsonResponse<SignInResponse>(response);
}

/**
 * Signs up a new user.
 * Corresponds to: POST /api/auth/signup
 * @param userData User details for registration.
 */
export async function signUp(userData: any): Promise<SignUpResponse> {
  console.log('API CALL: POST /api/auth/signup. User data:', userData);
  const response = await apiClient('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return parseJsonResponse<SignUpResponse>(response);
}

/**
 * Signs out the current user.
 * Corresponds to: POST /api/auth/signout
 */
export async function signOut(): Promise<{ message: string }> {
  console.log('API CALL: POST /api/auth/signout.');
  const response = await apiClient('/auth/signout', {
    method: 'POST',
    // No body typically needed, but depends on your API
  });
  // If API returns 204 No Content, parseJsonResponse will return null.
  // Adjust if a specific message is expected even on 204.
  const result = await parseJsonResponse<{ message: string }>(response);
  return result || { message: 'Signed out successfully' };
}
