// src/services/auth-service.ts
import { apiClient, parseJsonResponse } from './api-client';

// Define types for auth responses, adjust as per your API
export interface SignInResponse {
  token: string;
  user: {
    id: string;
    name: string; // This might need to change to firstName, lastName if API returns that
    email: string;
    role: string;
    // other user details
  };
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  userName: string;
  email: string;
  password?: string; // Changed to non-optional
  phoneNumber?: string;
  // role?: string; // Removed role from here
  [key: string]: any;
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
  console.log('API CALL: POST /api/auth/signin. Attempting with email:', credentials.email);
  const response = await apiClient('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  const parsedResponse = await parseJsonResponse<SignInResponse>(response);
  
  // You should store the token upon successful login.
  // For example, in localStorage:
  if (typeof window !== 'undefined' && parsedResponse.token) {
    localStorage.setItem('authToken', parsedResponse.token);
    console.log('Auth token stored in localStorage.');
  } else if (typeof window !== 'undefined') {
    // This case might occur if the API doesn't return a token or if not in a browser environment.
    console.warn('No token received from sign-in, or not in browser environment.');
  }
  
  return parsedResponse;
}

/**
 * Signs up a new user.
 * Corresponds to: POST /api/auth/signup
 * @param userData User details for registration.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('API CALL: POST /api/auth/signup. User data being sent:', { 
    firstName: userData.firstName, 
    lastName: userData.lastName, 
    userName: userData.userName, 
    email: userData.email,
    middleName: userData.middleName,
    phoneNumber: userData.phoneNumber,
    // Not logging password
  });
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
  
  // You should remove the stored token upon sign-out.
  // For example, from localStorage:
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    console.log('Auth token removed from localStorage.');
  }

  const result = await parseJsonResponse<{ message: string }>(response);
  return result || { message: 'Signed out successfully' }; // Handle 204 No Content
}
