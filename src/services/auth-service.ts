
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
  birthDate?: string;
  phoneNumber?: string;
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
  console.log('Auth Service: Attempting to sign in with email:', credentials.email);
  try {
    const response = await apiClient('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Log raw response text BEFORE parsing if not already done by apiClient
    // const rawText = await response.clone().text(); // Clone to read body multiple times if needed
    // console.log('Auth Service - Raw response text from /api/auth/signin:', rawText);

    const parsedResponse = await parseJsonResponse<SignInResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedResponse);

    if (!parsedResponse) {
      console.error('Auth Service - DEBUG: parsedResponse is null or undefined.');
      throw new Error('Authentication failed: No valid JSON response received from server.');
    }
    if (!parsedResponse.token) {
      console.error('Auth Service - DEBUG: parsedResponse.token is missing or falsy. Full parsedResponse:', parsedResponse);
      throw new Error('Authentication failed: No token received from server response.');
    }
    if (typeof parsedResponse.token !== 'string' || parsedResponse.token.trim() === '') {
      console.error('Auth Service - DEBUG: parsedResponse.token is not a non-empty string. Token value:', parsedResponse.token, 'Type:', typeof parsedResponse.token);
      throw new Error('Authentication failed: Token received is not a valid string.');
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signIn error:', error);
    if (error instanceof UnauthorizedError) {
      throw error; // Re-throw specific error for page to handle
    }
    // Make sure to re-throw other errors or handle them appropriately
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during sign in.');
  }
}

/**
 * Signs up a new user.
 * @param userData User details for registration.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('Auth Service: Attempting to sign up user:', userData.userName);
  try {
    const response = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const parsedResponse = await parseJsonResponse<SignUpResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signup:', parsedResponse);
    if (!parsedResponse || !parsedResponse.message) {
        throw new Error('Signup failed: No confirmation message received from server.');
    }
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signUp error:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during sign up.');
  }
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
    console.log('Auth Service: Attempting server sign-out...');
    const response = await apiClient('/auth/signout', { method: 'POST' });

    if (response.ok) {
      serverSignOutOk = true;
      // Try to parse if there's content, otherwise assume success
      if (response.status !== 204 && response.headers.get("content-length") !== "0") {
        try {
          const parsed = await parseJsonResponse<{ message?: string }>(response);
          serverMessage = parsed?.message || "Successfully signed out from server.";
        } catch (e) {
          // If parsing fails but status is OK, still consider it a success
          console.warn("Auth Service: Server sign-out response was OK but body parsing failed. Assuming success.", e);
          serverMessage = "Successfully signed out from server (response body parsing error).";
        }
      } else {
         serverMessage = "Successfully signed out from server (no content).";
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      // Handle non-OK responses for signout more gracefully
      const errorText = await response.text(); // Read error text if any
      serverMessage = `Server sign-out attempt failed: ${response.status} ${errorText || response.statusText}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    // Catch network errors or other issues with the apiClient call itself
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
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
