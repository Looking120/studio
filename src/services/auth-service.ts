
// src/services/auth-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

export interface SignInResponse {
  token: string;
  user: {
    id?: string;
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
  password?: string; // Made optional to align with previous structure if needed, but should be required for signup
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
 */
export async function signIn(credentials: { email?: string; password?: string }): Promise<SignInResponse> {
  console.log('Auth Service: Attempting to sign in with email:', credentials.email);
  try {
    const response = await apiClient('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Log raw response text BEFORE parsing
    // const rawText = await response.clone().text();
    // console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);

    const parsedResponse = await parseJsonResponse<SignInResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedResponse);

    if (!parsedResponse) {
      console.error('Auth Service - DEBUG: parsedResponse is null or undefined. This likely means the server sent a 204 No Content or an empty 200 OK response, which is not expected for sign-in.');
      throw new Error('Authentication failed: No valid JSON response received from server. The server might have sent an empty successful response.');
    }
    if (!parsedResponse.token) {
      console.error('Auth Service - DEBUG: The parsed JSON response from the server did not contain a "token" field, or the token was falsy. Full parsed JSON response:', parsedResponse);
      throw new Error('Authentication failed: The server\'s JSON response did not include a "token" field. Response received: ' + JSON.stringify(parsedResponse));
    }
    if (typeof parsedResponse.token !== 'string' || parsedResponse.token.trim() === '') {
      console.error('Auth Service - DEBUG: parsedResponse.token is not a non-empty string. Token value:', parsedResponse.token, 'Type:', typeof parsedResponse.token);
      throw new Error('Authentication failed: Token received from server is not a valid string. Token: ' + JSON.stringify(parsedResponse.token));
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signIn error:', error);
    if (error instanceof UnauthorizedError) {
      throw error; 
    }
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during sign in.');
  }
}

/**
 * Signs up a new user.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('Auth Service: Attempting to sign up user:', userData.userName);
  // Remove password and confirmPassword before sending if your API doesn't hash/handle them directly but expects them for validation
  // const { password, confirmPassword, ...dataToSend } = userData; 
  // For now, sending all as API might handle it.
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
      if (response.status !== 204 && response.headers.get("content-length") !== "0") {
        try {
          const parsed = await parseJsonResponse<{ message?: string }>(response);
          serverMessage = parsed?.message || "Successfully signed out from server.";
        } catch (e) {
          console.warn("Auth Service: Server sign-out response was OK but body parsing failed. Assuming success.", e);
          serverMessage = "Successfully signed out from server (response body parsing error).";
        }
      } else {
         serverMessage = "Successfully signed out from server (no content).";
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      const errorText = await response.text(); 
      serverMessage = `Server sign-out attempt failed with status ${response.status}: ${errorText || response.statusText || 'No additional error message from server.'}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
  }

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
