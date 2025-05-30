
// src/services/auth-service.ts
import { apiClient, parseJsonResponse, API_BASE_URL, UnauthorizedError } from './api-client';

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

// This interface represents what the signup endpoint *actually* returns (from user's Swagger)
interface ActualSignUpApiResponse {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessToken: string;
  durationInMinutes: number;
  message?: string; // Keep for flexibility, though not primary
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
 * Uses the user-provided fetch logic.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  const { 
    firstName, 
    lastName, 
    middleName, 
    birthDate, 
    userName, 
    email, 
    password, 
    confirmPassword, 
    phoneNumber 
  } = userData;

  const requestBody: any = {
    firstName,
    lastName,
    userName,
    email,
    password,
    confirmPassword,
    birthDate, // Ensure this is correctly formatted (e.g., ISO string)
  };

  if (middleName) requestBody.middleName = middleName;
  if (phoneNumber) requestBody.phoneNumber = phoneNumber; // Add if your API uses it

  console.log('Auth Service (signUp) - Sending request to /auth/signup with body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text(); // Read text first
    console.log('Auth Service (signUp) - RAW RESPONSE TEXT from /auth/signup:', responseText);

    if (!response.ok) {
      let errorMsg = `Signup failed with status ${response.status}.`;
      try {
        const errorData = JSON.parse(responseText); // Try to parse error
        errorMsg = errorData.message || errorData.title || errorMsg; // ASP.NET Core might use 'title' for problem details
         if (errorData.errors) { // ASP.NET Core validation errors
          const validationErrors = Object.values(errorData.errors).flat().join(', ');
          errorMsg += ` Details: ${validationErrors}`;
        }
      } catch (e) {
        // If parsing error json fails, use the raw text
        errorMsg = responseText || errorMsg;
      }
      console.error('Auth Service (signUp) - Error response:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!responseText.trim()) {
      console.error('Auth Service (signUp) - Received empty successful response.');
      throw new Error("Signup attempt returned an empty successful response from the server.");
    }
    
    const rawData: ActualSignUpApiResponse = JSON.parse(responseText);
    console.log('Auth Service (signUp) - Parsed successful response data:', rawData);

    // Transform the raw API response to what the user's localStorage logic expects
    // (which is { token: "...", user: {...} })
    // based on their Swagger, signup returns accessToken and user details at root.
    if (rawData && rawData.accessToken && rawData.id) {
      const transformedData = {
        token: rawData.accessToken,
        user: {
          id: rawData.id,
          userName: rawData.userName,
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          email: rawData.email,
          role: rawData.role,
        }
      };

      console.log('Auth Service (signUp) - Transformed data for localStorage:', transformedData);
      localStorage.setItem('user', JSON.stringify(transformedData.user));
      localStorage.setItem('token', transformedData.token);
      console.log('Auth Service (signUp) - User and token stored in localStorage.');

      return {
        message: "Inscription réussie! Vous pouvez maintenant vous connecter.",
        userId: transformedData.user.id
      };
    } else {
      console.error('Auth Service (signUp) - Signup successful but API response missing accessToken or user ID. Raw data:', rawData);
      throw new Error("Signup successful, but the server's response was incomplete (missing token or user ID).");
    }

  } catch (error) {
    console.error('Auth Service (signUp) - General error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred during sign up.");
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
      if (response.status !== 204 && response.headers.get("content-length") !== "0" && response.headers.get("content-type")?.includes("application/json")) {
        try {
          const parsed = await response.json().catch(() => null) as { message?: string } | null;
          serverMessage = parsed?.message || "Successfully signed out from server.";
        } catch (e) {
          console.warn("Auth Service: Server sign-out response was OK but body parsing failed. Error:", e instanceof Error ? e.message : String(e));
          serverMessage = "Successfully signed out from server (response body issue).";
        }
      } else if (response.status === 204 || response.headers.get("content-length") === "0") {
         serverMessage = "Successfully signed out from server (no content).";
      } else {
        // Fallback for OK response but not JSON and not empty
        const textResponse = await response.text().catch(() => "Could not read server response text.");
        serverMessage = `Successfully signed out from server. Response: ${textResponse || "(empty)"}`;
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      // Attempt to read error message if it's JSON, otherwise use status text
      let errorDetail = response.statusText || 'No additional error message from server.';
      if (response.headers.get("content-type")?.includes("application/json")) {
        try {
            const errorJson = await response.json().catch(() => null) as {message?: string, title?: string, detail?: string} | null;
            if (errorJson) {
                errorDetail = errorJson.message || errorJson.title || errorJson.detail || errorDetail;
            }
        } catch (e) { /* ignore parsing error if not json */ }
      } else {
          const errorText = await response.text().catch(() => "");
          if (errorText) errorDetail = errorText;
      }
      serverMessage = `Server sign-out attempt failed with status ${response.status}: ${errorDetail}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken'); // Ensure this key matches what signIn uses
    localStorage.removeItem('token');     // Also remove 'token' as per user's new signUp
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');      // Also remove 'user' as per user's new signUp
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
