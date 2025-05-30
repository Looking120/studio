
// src/services/auth-service.ts
import { API_BASE_URL, apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

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
  message?: string; // Keep for flexibility
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

    rawText = await response.clone().text(); // Clone before parsing in parseJsonResponse
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);
    
    const parsedRawResponse = await parseJsonResponse<ApiSignInRawResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedRawResponse);
    
    if (!parsedRawResponse && rawText.trim() !== '') { // If parseJsonResponse returned null but there was text
        console.error('Auth Service - DEBUG: parseJsonResponse returned null, but raw text was not empty. Raw text:', rawText);
        throw new Error('Authentication failed: Server response was not valid JSON as expected.');
    }
    if (!parsedRawResponse && rawText.trim() === '') {
        console.error('Auth Service - DEBUG: parseJsonResponse returned null and raw text was empty. This means server sent 204 No Content or empty 200 OK.');
         throw new Error('Authentication failed: Server sent an empty successful response. Expected token and user data.');
    }
    if (!parsedRawResponse) { // General catch for null/undefined parsedResponse
        console.error('Auth Service - DEBUG: parsedRawResponse from parseJsonResponse is null or undefined.');
        throw new Error('Authentication failed: No valid data received from server response.');
    }
    
    if (Object.keys(parsedRawResponse).length === 0) {
      console.error('Auth Service - DEBUG: The server sent a JSON response, but it was an empty object {}. Full parsed JSON response:', parsedRawResponse);
      throw new Error('Authentication failed: The server responded with an empty JSON object {}. Expected an "accessToken" field in the JSON response.');
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
 * Signs up a new user using the user's provided fetch logic, adapted.
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
    birthDate, // Assumes this is already in "YYYY-MM-DDTHH:mm:ss.sssZ" format from signup/page.tsx
    userName,
    email,
    password,
    confirmPassword,
  };

  if (middleName && middleName.trim() !== '') {
    requestBody.middleName = middleName;
  }
  if (phoneNumber && phoneNumber.trim() !== '') {
    requestBody.phoneNumber = phoneNumber;
  }

  console.log('Auth Service (signUp) - Sending request to /auth/signup with body:', JSON.stringify(requestBody, null, 2));

  let responseText = '';
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    responseText = await response.text();
    console.log('Auth Service (signUp) - RAW RESPONSE TEXT from /auth/signup:', responseText);

    if (!response.ok) {
      let errorMsg = `Signup failed with status ${response.status}.`;
      if (responseText.trim()) {
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.message || errorData.title || responseText || errorMsg;
          if (errorData.errors) { // ASP.NET Core validation errors
            const validationErrors = Object.values(errorData.errors).flat().join(', ');
            errorMsg += ` Details: ${validationErrors}`;
          }
        } catch (e) {
          // If parsing error json fails, use the raw text
           errorMsg = `Signup failed with status ${response.status}: ${responseText || 'Server returned an empty error response.'}`;
        }
      } else {
         errorMsg = `Signup failed with status ${response.status}: Server returned an empty error response.`;
      }
      console.error('Auth Service (signUp) - Error response:', errorMsg);
      throw new Error(errorMsg);
    }

    // Handle cases where signup might return empty body on success (e.g. 201 Created or 204 No Content)
    if (!responseText.trim()) {
      console.warn('Auth Service (signUp) - Signup was successful (status OK) but API returned an empty response body. Assuming success.');
      // Attempt to derive a user ID from somewhere if possible, or return a generic success.
      // This path is tricky if no user ID is returned. For now, generic success.
      return {
        message: "Inscription réussie! (Le serveur n'a pas renvoyé de détails supplémentaires)",
        // userId: undefined, // explicitly
      };
    }
    
    // If we reach here, response.ok is true and responseText is not empty.
    // Assuming the API returns a structure similar to SignIn on successful signup
    const parsedApiResponse: ActualSignUpApiResponse = JSON.parse(responseText);
    console.log('Auth Service (signUp) - Parsed successful response data:', parsedApiResponse);

    // Check if the response structure from signup is what we expect (contains accessToken and user details)
    if (parsedApiResponse && parsedApiResponse.accessToken && parsedApiResponse.id) {
       console.log('Auth Service - DEBUG (signUp): accessToken checks: Found valid accessToken:', parsedApiResponse.accessToken);
      const userToStore: SignInUser = {
        id: parsedApiResponse.id,
        userName: parsedApiResponse.userName,
        firstName: parsedApiResponse.firstName,
        lastName: parsedApiResponse.lastName,
        email: parsedApiResponse.email,
        role: parsedApiResponse.role,
        name: `${parsedApiResponse.firstName || ''} ${parsedApiResponse.lastName || ''}`.trim(),
      };
      localStorage.setItem('user', JSON.stringify(userToStore));
      localStorage.setItem('token', parsedApiResponse.accessToken); // Store as 'token' for consistency with login
      console.log('Auth Service (signUp) - User details and accessToken stored in localStorage.');
      return {
        message: "Inscription et connexion initiales réussies!",
        userId: parsedApiResponse.id,
      };
    } else if (parsedApiResponse && parsedApiResponse.message) {
      // Case where API might just return a message (less likely for successful signup with token)
      console.log('Auth Service - DEBUG (signUp): message checks: Found message:', parsedApiResponse.message);
      return {
        message: parsedApiResponse.message,
        userId: parsedApiResponse.id, // id might still be present
      };
    } else {
      // Fallback if the response is not empty, but doesn't match expected structures
      console.error('Auth Service - DEBUG (signUp): Signup successful, but response structure is unexpected (no accessToken or message). Full parsedResponse:', parsedApiResponse, "Raw text was:", responseText);
      throw new Error('Signup successful, but the server\'s response format was unexpected.');
    }

  } catch (error) {
    console.error('Auth Service (signUp) - General error:', error, 'Raw response text was:', responseText);
    // Ensure we throw an actual Error object
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error) || "An unknown error occurred during sign up.");
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
    // No need to parse response for signout if it's just a POST and we don't care about its body
    const response = await apiClient('/auth/signout', { method: 'POST' });

    if (response.ok) {
      serverSignOutOk = true;
      // Try to get a message if available, otherwise default success
      try {
        const contentType = response.headers.get("content-type");
        if (response.status !== 204 && contentType && contentType.includes("application/json")) {
            const parsed = await response.json().catch(() => null) as { message?: string } | null;
            serverMessage = parsed?.message || "Successfully signed out from server.";
        } else if (response.status === 204) {
            serverMessage = "Successfully signed out from server (No Content).";
        } else {
             const textResponse = await response.text().catch(() => "(Could not read server response)");
             serverMessage = `Successfully signed out from server. Response: ${textResponse || "(empty)"}`;
        }
      } catch (e) {
          console.warn("Auth Service: Server sign-out response was OK but body processing failed. Error:", e instanceof Error ? e.message : String(e));
          serverMessage = "Successfully signed out from server (response body issue).";
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      let errorDetail = `Status: ${response.status} ${response.statusText || ''}`.trim();
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorJson = await response.json().catch(() => null) as {message?: string, title?: string, detail?: string} | null;
            if (errorJson) {
                errorDetail = errorJson.message || errorJson.title || errorJson.detail || errorDetail;
            }
        } else {
            const errorText = await response.text().catch(() => "");
            if (errorText) errorDetail = errorText;
        }
      } catch(e) { /* ignore, use status text */ }
      serverMessage = `Server sign-out attempt failed: ${errorDetail}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken'); // For sign-in
    localStorage.removeItem('token');     // For sign-up storage
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');      // For sign-up storage
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

    