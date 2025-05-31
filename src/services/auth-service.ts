
// src/services/auth-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

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
  try {
    const response = await apiClient<ApiSignInRawResponse>('/auth/signin', {
      method: 'POST',
      body: credentials,
    });

    const parsedRawResponse = response.data;
    console.log('Auth Service - Parsed JSON response from /api/auth/signin:', parsedRawResponse);

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG: parsedRawResponse from apiClient is null or undefined.');
      throw new Error('Authentication failed: No valid data received from server response.');
    }
    if (Object.keys(parsedRawResponse).length === 0 && JSON.stringify(parsedRawResponse) === '{}') { // Check for empty object
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
    console.error('Auth Service - signIn error:', error);
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

  try {
    const response = await apiClient<ActualSignUpApiResponse>('/auth/signup', {
        method: 'POST',
        body: requestBody,
    });
    
    const parsedApiResponse = response.data;
    console.log('Auth Service (signUp) - Parsed successful response data:', parsedApiResponse);

    if (!parsedApiResponse) {
        console.warn('Auth Service (signUp) - Signup was successful but API returned an empty response body.');
        return { message: "Signup successful! (Server did not return additional details)" };
    }
    
    if (parsedApiResponse.accessToken && typeof parsedApiResponse.accessToken === 'string' && parsedApiResponse.accessToken.trim() !== '') {
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
        localStorage.setItem('authToken', parsedApiResponse.accessToken); // Changed 'token' to 'authToken' for consistency
        localStorage.setItem('user', JSON.stringify(userToStore)); // Storing full user object for potential use
        console.log('Auth Service (signUp) - User details and authToken stored in localStorage.');
      }
      return {
        message: parsedApiResponse.message || "Initial signup and login successful!",
        userId: parsedApiResponse.id,
        token: parsedApiResponse.accessToken,
        user: userToStore
      };
    } else if (parsedApiResponse.message) {
      console.log('Auth Service - DEBUG (signUp): message checks: Found message:', parsedApiResponse.message);
      return {
        message: parsedApiResponse.message,
        userId: parsedApiResponse.id,
      };
    } else {
      console.error('Auth Service - DEBUG (signUp): Signup successful, but response structure is unexpected. Full parsedResponse:', parsedApiResponse);
      throw new Error('Signup successful, but the server\'s response format was unexpected (no accessToken or message).');
    }
  } catch (error) {
    console.error('Auth Service (signUp) - General error:', error);
     if (error instanceof HttpError) {
        let errorMessage = error.message;
        if (error.responseData && typeof error.responseData === 'object' && (error.responseData as any).errors) {
             const validationErrors = Object.values((error.responseData as any).errors).flat().join(', ');
             errorMessage += ` Details: ${validationErrors}`;
        }
        throw new Error(errorMessage);
    }
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
    // Attempt to send no body and explicitly remove Content-Type header for this request
    const response = await apiClient('/auth/signout', {
      method: 'POST',
      body: undefined, // Ensure no body is sent
      headers: {
        'Content-Type': null, // Attempt to remove the Content-Type header
      },
    });

    serverSignOutOk = true; 
    
    if (response.status === 204 || !response.data) { 
      serverMessage = "Successfully signed out from server (No Content or empty response).";
    } else if ((response.data as any).message) {
      serverMessage = (response.data as any).message;
    } else {
      serverMessage = "Successfully signed out from server.";
    }
    console.log(`Auth Service: ${serverMessage}`);

  } catch (error) {
    if (error instanceof UnauthorizedError) {
        serverMessage = `Server sign-out failed (401 Unauthorized). Session might have already been invalid. Proceeding with local sign-out. Message: ${error.message}`;
        console.warn(`Auth Service: ${serverMessage}`, error);
    } else if (error instanceof HttpError) {
        serverMessage = `Server sign-out attempt failed with HTTP error: ${error.status} ${error.message}`;
        console.warn(`Auth Service: ${serverMessage}`, error); 
    } else if (error instanceof Error) {
        serverMessage = `Error during server sign-out attempt: ${error.message}`;
        console.warn(`Auth Service: ${serverMessage}`, error); 
    } else {
        serverMessage = "Unknown error during server sign-out attempt.";
        console.warn(`Auth Service: ${serverMessage}`, error); 
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken'); 
    localStorage.removeItem('user'); 
    localStorage.removeItem('userName'); 
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
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
