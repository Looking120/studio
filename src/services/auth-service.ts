
// src/services/auth-service.ts
import { UnauthorizedError } from './api-client'; // HttpError might not be needed if all calls are removed

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
  console.log('MOCK Auth Service: signIn attempt for email:', credentials.email);

  if (credentials.email === "admin@example.com" && credentials.password === "password") {
    console.log('MOCK Auth Service: Admin login successful');
    const adminUser: SignInUser = {
      id: 'mock-admin-id',
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      userName: 'admin',
      email: 'admin@example.com',
      role: 'Admin',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', 'mock-admin-token');
      localStorage.setItem('userName', adminUser.name!);
      localStorage.setItem('userRole', adminUser.role);
      localStorage.setItem('userEmail', adminUser.email);
      localStorage.setItem('userId', adminUser.id!);
    }
    return Promise.resolve({
      token: 'mock-admin-token',
      user: adminUser
    });
  } else if (credentials.email === "employee@example.com" && credentials.password === "password") {
    console.log('MOCK Auth Service: Employee login successful');
    const employeeUser: SignInUser = {
      id: 'mock-employee-id',
      firstName: 'Employee',
      lastName: 'User',
      name: 'Employee User',
      userName: 'employee',
      email: 'employee@example.com',
      role: 'Employee',
    };
     if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', 'mock-employee-token');
      localStorage.setItem('userName', employeeUser.name!);
      localStorage.setItem('userRole', employeeUser.role);
      localStorage.setItem('userEmail', employeeUser.email);
      localStorage.setItem('userId', employeeUser.id!);
    }
    return Promise.resolve({
      token: 'mock-employee-token',
      user: employeeUser
    });
  }

  console.warn("MOCK Auth Service: signIn failed for", credentials.email);
  throw new UnauthorizedError("Mock Auth: Invalid credentials. Try admin@example.com or employee@example.com with password 'password'");
}

export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('MOCK Auth Service: signUp attempt for email:', userData.email);
  // Simulate a successful signup
  const mockUserId = `mock-user-${Date.now()}`;
  return Promise.resolve({
    message: "Mock signup successful! Please log in.",
    userId: mockUserId,
    // No token or auto-login for mock signUp, user should explicitly login
  });
}

export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  console.log('MOCK Auth Service: signOut called');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user'); // Kept for consistency, though not explicitly set by mock signIn
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    console.log('MOCK Auth Service: LocalStorage cleared.');
  }
  return Promise.resolve({ message: "Mock sign out successful. Local session cleared.", serverSignOutOk: true });
}
