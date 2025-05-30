
// src/services/auth-service.ts
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed

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
}

export interface SignUpResponse {
  message: string;
  userId?: string;
  // other relevant fields
}

/**
 * Signs in a user. (MOCKED)
 * @param credentials Email and password.
 */
export async function signIn(credentials: { email?: string; username?: string; password?: string }): Promise<SignInResponse> {
  console.log('MOCK API CALL: POST /api/auth/signin. Attempting with:', credentials.email || credentials.username);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock successful response
  const mockUser = {
    id: 'mockUser123',
    firstName: 'Mock',
    lastName: 'AdminUser',
    email: credentials.email || 'mock@example.com',
    role: 'Admin', // Or 'Employé' based on credentials for testing
  };
  if (credentials.email === 'user@example.com') {
    mockUser.firstName = 'Mock';
    mockUser.lastName = 'EmployeeUser';
    mockUser.role = 'Employé';
  }

  const mockResponse: SignInResponse = {
    token: 'mock-jwt-token-' + Date.now(),
    user: mockUser,
  };
  console.log('Mock Auth Service - Returning from signIn:', mockResponse);
  return Promise.resolve(mockResponse);
}

/**
 * Signs up a new user. (MOCKED)
 * @param userData User details for registration.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('MOCK API CALL: POST /api/auth/signup. User data being sent:', { 
    firstName: userData.firstName, 
    lastName: userData.lastName, 
    userName: userData.userName, 
    email: userData.email,
    middleName: userData.middleName,
    phoneNumber: userData.phoneNumber,
    birthDate: userData.birthDate,
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockResponse: SignUpResponse = {
    message: "Inscription réussie (simulation)!",
    userId: 'mockNewUser-' + Date.now(),
  };
  return Promise.resolve(mockResponse);
}

/**
 * Signs out the current user. (MOCKED)
 * @returns A promise with the sign-out status.
 */
export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  console.log('MOCK API CALL: POST /api/auth/signout.');
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    console.log('Auth token and user info removed from localStorage (mock sign out).');
  }

  return Promise.resolve({ 
    message: "Déconnexion locale effectuée (simulation).",
    serverSignOutOk: true // Simulate server sign out also being ok
  });
}
