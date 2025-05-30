
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
  accessToken: string; // API sends 'accessToken'
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
  birthDate?: string; // "YYYY-MM-DDTHH:mm:ss.sssZ"
  userName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
}

// This interface represents what the signup endpoint *actually* returns
// based on Swagger, it's similar to a sign-in response.
interface ActualSignUpApiResponse {
  id?: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  accessToken?: string; // Key from Swagger output
  durationInMinutes?: number;
  message?: string; // Keep for flexibility, though not seen in Swagger output for signup
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
  let rawText = '';
  try {
    const response = await apiClient('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    rawText = await response.clone().text();
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);
    
    const parsedRawResponse = await parseJsonResponse<ApiSignInRawResponse>(response);
    console.log('Auth Service - Parsed RAW API JSON response from /api/auth/signin:', JSON.stringify(parsedRawResponse, null, 2));

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG (signIn): parsedRawResponse from parseJsonResponse is null or undefined. This can happen if the server returns 204 No Content or an empty body for a 200 OK. Raw text was:', rawText);
      throw new Error('Authentication failed: No valid JSON data received from server response.');
    }
    
    if (typeof parsedRawResponse !== 'object' || Object.keys(parsedRawResponse).length === 0) {
        console.error('Auth Service - DEBUG (signIn): The server sent a JSON response, but it was an empty object {} (or not an object). Full parsed JSON response:', parsedRawResponse);
        throw new Error('Authentication failed: The server responded with an empty or non-object JSON. Expected an "accessToken" field. Response received: ' + JSON.stringify(parsedRawResponse));
    }

    if (!parsedRawResponse.accessToken) {
      console.error('Auth Service - DEBUG (signIn): The server sent a JSON response, but it did not contain an "accessToken" field, or the accessToken was falsy. Full parsed JSON response:', parsedRawResponse);
      throw new Error('Authentication failed: The server\'s JSON response did not include an "accessToken" field. Response received: ' + JSON.stringify(parsedRawResponse));
    }
    if (typeof parsedRawResponse.accessToken !== 'string' || parsedRawResponse.accessToken.trim() === '') {
      console.error('Auth Service - DEBUG (signIn): parsedRawResponse.accessToken is present, but it is not a non-empty string. Token value:', parsedRawResponse.accessToken, 'Type:', typeof parsedRawResponse.accessToken);
      throw new Error('Authentication failed: Access token received from server is not a valid string or is empty. Access Token: ' + JSON.stringify(parsedRawResponse.accessToken));
    }
    
    const appResponse: SignInResponse = {
      token: parsedRawResponse.accessToken, // Use accessToken from API
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
    console.log('Auth Service - Adapted response for the app (signIn):', JSON.stringify(appResponse, null, 2));
    return appResponse;

  } catch (error) {
    console.error('Auth Service - signIn error. Raw text from server (if available):', rawText, 'Error:', error);
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
  let rawText = '';
  try {
    const response = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    rawText = await response.clone().text();
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signup:', rawText);

    const parsedApiResponse = await parseJsonResponse<ActualSignUpApiResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signup (as ActualSignUpApiResponse):', JSON.stringify(parsedApiResponse, null, 2));

    if (!parsedApiResponse) {
      console.error('Auth Service - DEBUG (signUp): parsedApiResponse is null or undefined after parseJsonResponse. Raw text was:', rawText);
      throw new Error('Signup failed: No valid JSON data received from server for signup confirmation.');
    }
    if (typeof parsedApiResponse !== 'object') {
      console.error('Auth Service - DEBUG (signUp): parsedApiResponse is not an object after parseJsonResponse. Parsed:', parsedApiResponse, 'Raw text was:', rawText);
      throw new Error('Signup failed: Server response for signup confirmation was not a JSON object.');
    }

    // Granular checks for accessToken
    const hasAccessTokenProperty = parsedApiResponse.hasOwnProperty('accessToken');
    const accessTokenValue = parsedApiResponse.accessToken;
    const accessTokenIsString = typeof accessTokenValue === 'string';
    const accessTokenIsNotEmpty = accessTokenIsString && accessTokenValue.trim() !== '';
    const isAccessTokenValid = hasAccessTokenProperty && accessTokenIsString && accessTokenIsNotEmpty;

    console.log(`Auth Service - DEBUG (signUp): accessToken checks: hasProperty=${hasAccessTokenProperty}, value="${accessTokenValue}", isString=${accessTokenIsString}, isNotEmpty=${accessTokenIsNotEmpty}, isValid=${isAccessTokenValid}`);

    if (isAccessTokenValid) {
      console.log('Auth Service - INFO (signUp): Signup response contains a valid accessToken. Treating as successful registration.');
      return {
        message: "User registered successfully! You can now log in.",
        userId: parsedApiResponse.id
      };
    }
    
    // Granular checks for message (only if accessToken was not valid)
    const hasMessageProperty = parsedApiResponse.hasOwnProperty('message');
    const messageValue = parsedApiResponse.message;
    const messageIsString = typeof messageValue === 'string';
    const isMessageValid = hasMessageProperty && messageIsString;
    
    console.log(`Auth Service - DEBUG (signUp): message checks: hasProperty=${hasMessageProperty}, value="${messageValue}", isString=${messageIsString}, isValid=${isMessageValid}`);

    if (isMessageValid) {
      console.log('Auth Service - INFO (signUp): Signup response contains an explicit and valid message field.');
      return {
        message: messageValue as string, // We know it's a string here
        userId: parsedApiResponse.id
      };
    }
    
    // If neither a valid accessToken nor a valid message is found
    console.error('Auth Service - DEBUG (signUp): The parsed JSON response from signup does not contain a valid "accessToken" or a valid "message" field. ParsedApiResponse:', JSON.stringify(parsedApiResponse, null, 2), 'Raw text was:', rawText);
    throw new Error('Signup failed: No valid confirmation (accessToken or message) received in server response.');

  } catch (error) {
    console.error('Auth Service - signUp error. Raw text (if available):', rawText, 'Error:', error);
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
