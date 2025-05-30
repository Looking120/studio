
// src/services/auth-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// Define types for auth responses, adjust as per your API
export interface SignInResponse {
  token: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    name?: string; // Kept for fallback
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
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  birthDate?: string;
}

export interface SignUpResponse {
  message: string;
  userId?: string;
  // other relevant fields
}

/**
 * Signs in a user.
 * @param credentials Email and password.
 */
export async function signIn(credentials: { email?: string; password?: string }): Promise<SignInResponse> {
  console.log('Auth Service: Attempting to sign in with:', credentials.email);
  try {
    const response = await apiClient('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    console.log('Auth Service - Raw response from /api/auth/signin:', response);
    const parsedResponse = await parseJsonResponse<SignInResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedResponse);
    if (!parsedResponse || !parsedResponse.token) {
        throw new Error('Authentication failed: No token received from server response.');
    }
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signIn error:', error);
    if (error instanceof UnauthorizedError) {
      throw error; // Re-throw specific error for page to handle
    }
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during sign in.');
  }
}

/**
 * Signs up a new user. (MOCKED)
 * @param userData User details for registration.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('MOCK API CALL: POST /api/auth/signup. User data being sent:', {
    firstName: userData.firstName,
    lastName: userData.lastName,
    userName: userData.userName,
    email: userData.email,
    middleName: userData.middleName,
    phoneNumber: userData.phoneNumber,
    birthDate: userData.birthDate,
    // Password is not logged for security
  });
  // To connect this:
  // const response = await apiClient('/auth/signup', {
  //   method: 'POST',
  //   body: JSON.stringify(userData),
  // });
  // return parseJsonResponse<SignUpResponse>(response);

  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  const mockResponse: SignUpResponse = {
    message: `Inscription réussie (simulation) pour ${userData.userName}!`,
    userId: 'mockNewUser-' + Date.now(),
  };
  return Promise.resolve(mockResponse);
}

/**
 * Signs out the current user.
 * Clears local authentication data and optionally attempts to sign out from the server.
 * @returns A promise with the sign-out status.
 */
export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  let serverSignOutOk = false;
  let serverMessage = "Server sign-out not attempted or failed.";

  try {
    // Optional: Call your backend's signout endpoint
    // const response = await apiClient('/auth/signout', { method: 'POST' });
    // if (response.ok) {
    //   serverSignOutOk = true;
    //   serverMessage = "Successfully signed out from server.";
    //   console.log('Auth Service: Successfully signed out from server.');
    // } else {
    //   const errorText = await response.text();
    //   serverMessage = `Server sign-out failed: ${response.status} ${errorText || response.statusText}`;
    //   console.warn(`Auth Service: Server sign-out failed: ${response.status} ${errorText || response.statusText}`);
    // }
    // For now, let's simulate a successful server sign out for mock purposes.
    // Remove this line when connecting to a real backend signout.
    await new Promise(resolve => setTimeout(resolve, 200));
    serverSignOutOk = true; 
    serverMessage = "Server sign-out successful (simulated).";
    console.log('Auth Service: Server sign-out successful (simulated).');

  } catch (error) {
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: Error during server sign-out attempt:`, error);
  }

  // Always clear local storage regardless of server response
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    console.log('Auth Service: Auth token and user info removed from localStorage.');
  }

  return {
    message: `Local sign-out successful. ${serverMessage}`,
    serverSignOutOk,
  };
}
