
// src/services/auth-service.ts
import { API_BASE_URL, apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

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

export interface SignInUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string; 
  userName?: string;
  email: string;
  role: string;
}
export interface SignInResponse {
  token: string; 
  user: SignInUser;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string; 
  userName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
}

interface ActualSignUpApiResponse {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessToken: string; 
  durationInMinutes: number;
  message?: string; 
}

export interface SignUpResponse {
  message: string;
  userId?: string;
  token?: string;
  user?: SignInUser;
}

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
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedRawResponse);

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG: parsedRawResponse from parseJsonResponse is null or undefined.');
      throw new Error('Authentication failed: No valid data received from server response.');
    }
    if (Object.keys(parsedRawResponse).length === 0 && rawText.trim() === '{}') {
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
    if (error instanceof UnauthorizedError || error instanceof HttpError || error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during sign in.');
  }
}

export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  const requestBody: any = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    birthDate: userData.birthDate, 
    userName: userData.userName,
    email: userData.email,
    password: userData.password,
    confirmPassword: userData.confirmPassword,
  };

  if (userData.middleName && userData.middleName.trim() !== '') {
    requestBody.middleName = userData.middleName;
  }
  if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
    requestBody.phoneNumber = userData.phoneNumber;
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
          if (errorData.errors) {
            const validationErrors = Object.values(errorData.errors).flat().join(', ');
            errorMsg += ` Details: ${validationErrors}`;
          }
        } catch (e) {
          errorMsg = `Signup failed with status ${response.status}: ${responseText || 'Server returned an empty error response.'}`;
        }
      } else {
        errorMsg = `Signup failed with status ${response.status}: Server returned an empty error response.`;
      }
      console.error('Auth Service (signUp) - Error response:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!responseText.trim()) {
      console.warn('Auth Service (signUp) - Signup was successful but API returned an empty response body.');
      return {
        message: "Signup successful! (Server did not return additional details)",
      };
    }

    const parsedApiResponse = JSON.parse(responseText) as ActualSignUpApiResponse;
    console.log('Auth Service (signUp) - Parsed successful response data:', parsedApiResponse);

    if (parsedApiResponse && parsedApiResponse.accessToken && typeof parsedApiResponse.accessToken === 'string' && parsedApiResponse.accessToken.trim() !== '') {
      console.log('Auth Service - DEBUG (signUp): accessToken checks: Found valid accessToken:', parsedApiResponse.accessToken);
      const userToStore: SignInUser = {
        id: parsedApiResponse.id,
        userName: parsedApiResponse.userName,
        firstName: parsedApiResponse.firstName,
        lastName: parsedApiResponse.lastName,
        name: `${parsedApiResponse.firstName || ''} ${parsedApiResponse.lastName || ''}`.trim(),
        email: parsedApiResponse.email,
        role: parsedApiResponse.role,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', parsedApiResponse.accessToken); 
        localStorage.setItem('user', JSON.stringify(userToStore));
        console.log('Auth Service (signUp) - User details and accessToken stored in localStorage.');
      }
      return {
        message: "Initial signup and login successful!",
        userId: parsedApiResponse.id,
        token: parsedApiResponse.accessToken,
        user: userToStore
      };
    } else if (parsedApiResponse && parsedApiResponse.message) {
      console.log('Auth Service - DEBUG (signUp): message checks: Found message:', parsedApiResponse.message);
      return {
        message: parsedApiResponse.message,
        userId: parsedApiResponse.id,
      };
    } else {
      console.error('Auth Service - DEBUG (signUp): Signup successful, but response structure is unexpected. Full parsedResponse:', parsedApiResponse, "Raw text was:", responseText);
      throw new Error('Signup successful, but the server\'s response format was unexpected (no accessToken or message).');
    }
  } catch (error) {
    console.error('Auth Service (signUp) - General error:', error, 'Raw response text was:', responseText);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error) || "An unknown error occurred during sign up.");
  }
}

export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  let serverSignOutOk = false;
  let serverMessage = "Server sign-out not attempted or failed.";
  let finalMessage = "";

  try {
    console.log('Auth Service: Attempting server sign-out via POST /api/auth/signout...');
    const response = await apiClient('/auth/signout', { method: 'POST' });

    if (response.ok) {
      serverSignOutOk = true;
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
          const errorJson = await response.json().catch(() => null) as { message?: string, title?: string, detail?: string } | null;
          if (errorJson) {
            errorDetail = errorJson.message || errorJson.title || errorJson.detail || errorDetail;
          }
        } else {
          const errorText = await response.text().catch(() => "");
          if (errorText) errorDetail = errorText;
        }
      } catch (e) { /* ignore, use status text */ }
      serverMessage = `Server sign-out attempt failed: ${errorDetail}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('token');     
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('user');      
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
