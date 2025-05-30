
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
  password?: string; // Made optional again to match previous, will make required in component
  confirmPassword?: string; // Made optional, will make required in component
  phoneNumber?: string;
  birthDate?: string; // Added birthDate
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
  
  if (typeof window !== 'undefined' && parsedResponse.token) {
    localStorage.setItem('authToken', parsedResponse.token);
    console.log('Auth token stored in localStorage.');
  } else if (typeof window !== 'undefined') {
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
    birthDate: userData.birthDate,
    // Not logging password or confirmPassword
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
  });
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    console.log('Auth token removed from localStorage.');
  }

  const result = await parseJsonResponse<{ message: string }>(response);
  return result || { message: 'Signed out successfully' };
}

