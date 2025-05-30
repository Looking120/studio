
// src/services/auth-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// Interface for the RAW response from the API /api/auth/signin
interface ApiSignInRawResponse {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessToken: string;
  durationInMinutes: number;
}

// Interface for what the signIn service returns to the application (expected by components)
export interface SignInUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // For compatibility, can be constructed from firstName and lastName
  userName?: string;
  email: string;
  role: string;
}
export interface SignInResponse {
  token: string; // The application expects 'token'
  user: SignInUser;
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

    const rawText = await response.clone().text(); // Clone to read text, then allow parseJsonResponse to read body again
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);

    // Check if the raw text is an empty object string before parsing
    if (rawText.trim() === '{}') {
        console.error('Auth Service - DEBUG: The server sent a JSON response, but it was an empty object {}. An "accessToken" field is expected.');
        throw new Error('Authentication failed: The server responded with an empty JSON object {}. Expected an "accessToken" field in the JSON response.');
    }
    
    const parsedRawResponse = await parseJsonResponse<ApiSignInRawResponse>(response);
    console.log('Auth Service - Parsed RAW API JSON response from /api/auth/signin:', parsedRawResponse);

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG: parsedRawResponse from parseJsonResponse is null or undefined. This can happen if the server returns 204 No Content or an empty body for a 200 OK.');
      throw new Error('Authentication failed: No valid JSON data received from server response.');
    }
    
    if (typeof parsedRawResponse !== 'object' || Object.keys(parsedRawResponse).length === 0) {
        console.error('Auth Service - DEBUG: The server sent a JSON response, but it was an empty object {} (or not an object). Full parsed JSON response:', parsedRawResponse);
        throw new Error('Authentication failed: The server responded with an empty or non-object JSON. Expected an "accessToken" field. Response received: ' + JSON.stringify(parsedRawResponse));
    }

    if (!parsedRawResponse.accessToken) {
      console.error('Auth Service - DEBUG: The server sent a JSON response, but it did not contain an "accessToken" field, or the accessToken was falsy. Full parsed JSON response:', parsedRawResponse);
      throw new Error('Authentication failed: The server\'s JSON response did not include an "accessToken" field. Response received: ' + JSON.stringify(parsedRawResponse));
    }
    if (typeof parsedRawResponse.accessToken !== 'string' || parsedRawResponse.accessToken.trim() === '') {
      console.error('Auth Service - DEBUG: parsedRawResponse.accessToken is present, but it is not a non-empty string. Token value:', parsedRawResponse.accessToken, 'Type:', typeof parsedRawResponse.accessToken);
      throw new Error('Authentication failed: Access token received from server is not a valid string or is empty. Access Token: ' + JSON.stringify(parsedRawResponse.accessToken));
    }
    
    // Adapt the raw API response to the SignInResponse structure expected by the rest of the application
    const appResponse: SignInResponse = {
      token: parsedRawResponse.accessToken,
      user: {
        id: parsedRawResponse.id,
        firstName: parsedRawResponse.firstName,
        lastName: parsedRawResponse.lastName,
        name: `${parsedRawResponse.firstName || ''} ${parsedRawResponse.lastName || ''}`.trim(),
        userName: parsedRawResponse.userName,
        email: parsedRawResponse.email,
        role: parsedRawResponse.role,
      }
    };
    console.log('Auth Service - Adapted response for the app:', appResponse);
    return appResponse;

  } catch (error) {
    console.error('Auth Service - signIn error:', error);
    if (error instanceof UnauthorizedError || error instanceof Error) { // Keep throwing specific errors if they are already specific
      throw error; 
    }
    throw new Error('An unknown error occurred during sign in.');
  }
}

/**
 * Signs up a new user.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('Auth Service: Attempting to sign up user:', userData.userName);
  try {
    const response = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const rawText = await response.clone().text();
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signup:', rawText);

    const parsedResponse = await parseJsonResponse<SignUpResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signup:', parsedResponse);

    if (!parsedResponse) {
      console.error('Auth Service - DEBUG (signUp): parsedResponse is null or undefined. Raw text was:', rawText);
      throw new Error('Signup failed: No valid JSON data received from server for signup confirmation.');
    }
    if (typeof parsedResponse !== 'object') {
      console.error('Auth Service - DEBUG (signUp): parsedResponse is not an object. Parsed response:', parsedResponse, 'Raw text was:', rawText);
      throw new Error('Signup failed: Server response for signup confirmation was not a JSON object.');
    }
    if (!parsedResponse.message) {
        console.error('Auth Service - DEBUG (signUp): The parsed JSON response from signup does not contain a "message" field. Full parsedResponse:', parsedResponse, 'Raw text was:', rawText);
        throw new Error('Signup failed: No confirmation message received from server.');
    }
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signUp error:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred during sign up.');
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
  let finalMessage = "";

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
          console.warn("Auth Service: Server sign-out response was OK but body parsing failed or was empty. Error:", e instanceof Error ? e.message : String(e));
          serverMessage = "Successfully signed out from server (response body issue or empty).";
        }
      } else {
         serverMessage = "Successfully signed out from server (no content).";
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      const errorText = await response.text().catch(() => "Could not read error text from server response."); 
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
    finalMessage = `Local sign-out successful. ${serverMessage}`;
  } else {
    finalMessage = `Local storage not available. ${serverMessage}`;
  }
  
  return {
    message: finalMessage,
    serverSignOutOk,
  };
}
