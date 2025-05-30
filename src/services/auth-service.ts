
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
  birthDate?: string; // Expected as "YYYY-MM-DDTHH:mm:ss.sssZ" by backend
  phoneNumber?: string;
}

export interface SignUpResponse {
  message: string;
  userId?: string;
}

// This interface represents what the signup endpoint *actually* returns
// which looks like a sign-in response.
interface ActualSignUpApiResponse {
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  accessToken?: string;
  durationInMinutes?: number;
  message?: string; // Adding message here just in case it's sometimes present
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

    const rawText = await response.clone().text();
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);
    
    const parsedRawResponse = await parseJsonResponse<ApiSignInRawResponse>(response);
    console.log('Auth Service - Parsed RAW API JSON response from /api/auth/signin:', parsedRawResponse);

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG: parsedRawResponse from parseJsonResponse is null or undefined. This can happen if the server returns 204 No Content or an empty body for a 200 OK. Raw text was:', rawText);
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
    if (error instanceof UnauthorizedError || error instanceof Error) {
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

    const parsedApiResponse = await parseJsonResponse<ActualSignUpApiResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signup (as ActualSignUpApiResponse):', parsedApiResponse);

    if (!parsedApiResponse) {
      console.error('Auth Service - DEBUG (signUp): parsedApiResponse is null or undefined after parseJsonResponse. Raw text was:', rawText);
      throw new Error('Signup failed: No valid JSON data received from server for signup confirmation.');
    }
    if (typeof parsedApiResponse !== 'object') {
      console.error('Auth Service - DEBUG (signUp): parsedApiResponse is not an object after parseJsonResponse. Parsed response:', parsedApiResponse, 'Raw text was:', rawText);
      throw new Error('Signup failed: Server response for signup confirmation was not a JSON object.');
    }

    // Check if the response looks like a sign-in response (has accessToken)
    // OR if it has the originally expected 'message' field for signup confirmation.
    if (parsedApiResponse.accessToken && typeof parsedApiResponse.accessToken === 'string' && parsedApiResponse.accessToken.trim() !== '') {
      console.log('Auth Service - INFO (signUp): Signup response contains an accessToken. Treating as successful registration.');
      // Construct the SignUpResponse that the frontend page expects
      return {
        message: "User registered successfully! You might be automatically logged in.", // Provide a generic success message
        userId: parsedApiResponse.id 
      };
    } else if (parsedApiResponse.message && typeof parsedApiResponse.message === 'string') {
      // This is the originally expected path, if the server sends a direct confirmation message
      console.log('Auth Service - INFO (signUp): Signup response contains an explicit message field.');
      return {
        message: parsedApiResponse.message,
        userId: parsedApiResponse.id 
      };
    } else {
      // If neither an accessToken nor an explicit message is found
      console.error('Auth Service - DEBUG (signUp): The parsed JSON response from signup does not contain an "accessToken" or a "message" field. Full parsedResponse:', parsedApiResponse, 'Raw text was:', rawText);
      throw new Error('Signup failed: No confirmation message or token received in server response.');
    }
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
          // Try to parse, but don't fail catastrophically if it's not JSON or has no message
          const parsed = await response.json().catch(() => null) as { message?: string } | null;
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
      // For non-OK responses (like 401 if token already expired), don't try to parse as JSON error.
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
