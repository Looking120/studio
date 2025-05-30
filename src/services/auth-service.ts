
// src/services/auth-service.ts
import { apiClient, parseJsonResponse } from './api-client';

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
  [key: string]: any;
}

export interface SignUpResponse {
  message: string;
  userId?: string;
  // other relevant fields
}

/**
 * Signs in a user.
 * Corresponds to: POST /api/auth/signin
 * @param credentials Email and password.
 */
export async function signIn(credentials: { email?: string; username?: string; password?: string }): Promise<SignInResponse> {
  console.log('API CALL: POST /api/auth/signin. Attempting with:', credentials.email || credentials.username);
  const response = await apiClient('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  const parsedResponse = await parseJsonResponse<SignInResponse>(response);
  
  // Storing the token and user info should happen in the component calling signIn
  // For example, after a successful call:
  // if (typeof window !== 'undefined' && parsedResponse.token) {
  //   localStorage.setItem('authToken', parsedResponse.token);
  //   localStorage.setItem('userName', parsedResponse.user?.name || `${parsedResponse.user?.firstName} ${parsedResponse.user?.lastName}`);
  //   localStorage.setItem('userRole', parsedResponse.user?.role || 'Employee');
  //   localStorage.setItem('userEmail', parsedResponse.user?.email || '');
  //   console.log('Auth token and user info could be stored here.');
  // }
  
  return parsedResponse;
}

/**
 * Signs up a new user.
 * Corresponds to: POST /api/auth/signup
 * @param userData User details for registration.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('API CALL: POST /api/auth/signup. User data being sent:', { 
    firstName: userData.firstName, 
    lastName: userData.lastName, 
    userName: userData.userName, 
    email: userData.email,
    middleName: userData.middleName,
    phoneNumber: userData.phoneNumber,
    birthDate: userData.birthDate,
    // Not logging password or confirmPassword
  });
  const response = await apiClient('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return parseJsonResponse<SignUpResponse>(response);
}

/**
 * Signs out the current user. Attempts server-side sign-out but prioritizes local cleanup.
 * Corresponds to: POST /api/auth/signout
 * @returns A promise with the sign-out status.
 */
export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  console.log('API CALL: POST /api/auth/signout.');
  let serverSignOutOk = false;
  let serverResponseMessage = 'Server sign-out status unknown.';

  try {
    const response = await apiClient('/auth/signout', {
      method: 'POST',
    });

    if (response.ok) {
      // Only parse if the response was OK (e.g. 200, 204).
      // A 204 No Content is valid for sign-out.
      if (response.status === 204) {
        serverResponseMessage = 'Signed out successfully from server (No Content).';
      } else {
        const result = await parseJsonResponse<{ message: string }>(response);
        serverResponseMessage = result?.message || 'Signed out successfully from server.';
      }
      serverSignOutOk = true;
    } else {
      // API call was made but was not successful (e.g., 401 Unauthorized, 500 Server Error)
      const responseText = await response.text();
      serverResponseMessage = `Sign out API call failed with status ${response.status}.`;
      if (responseText.trim()) {
        serverResponseMessage += ` Server response: ${responseText}`;
      }
      console.warn(serverResponseMessage); 
      // We are not calling parseJsonResponse here for non-OK responses to avoid its specific console.error
      // if the goal is to suppress that for sign-out failures.
    }
  } catch (error) {
    // Network error or other issue with apiClient itself (e.g., fetch failing)
    serverResponseMessage = 'Sign out API call failed due to a network or client error.';
    if (error instanceof Error) {
      console.error(`Error during sign out API call: ${error.message}`);
      serverResponseMessage += ` Error: ${error.message}`;
    } else {
      console.error('Unknown error during sign out API call:', error);
    }
  }

  // Perform local sign-out tasks regardless of API call outcome
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    console.log('Auth token and user info removed from localStorage.');
  }

  return { 
    message: serverSignOutOk ? serverResponseMessage : `Local sign-out successful. ${serverResponseMessage}`,
    serverSignOutOk 
  };
}
