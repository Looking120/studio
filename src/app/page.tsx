
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react"; // Added useState
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Added useToast

// Define the expected structure of the sign-in API response
interface SignInApiResponse {
  token: string;
  user: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string; // Fallback if firstName/lastName not present
    email: string;
    role: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true); // Set loading state

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    if (!email || !password) {
      toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
      setIsLoading(false);
      return;
    }

    try {
      // The local signIn function now returns the parsed response directly
      const response = await signIn({ email, password }); 
      console.log('Login page - signIn service call returned:', response);

      // Aggressive logging before the IF condition
      console.log('Login page - DEBUG: Raw response object received in handleSubmit:', JSON.stringify(response, null, 2));
      if (response && typeof response === 'object') {
        console.log('Login page - DEBUG: Keys in response object:', Object.keys(response));
        console.log('Login page - DEBUG: Value of response.token:', response.token);
        console.log('Login page - DEBUG: Type of response.token:', typeof response.token);
      }


      if (response && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        localStorage.setItem('token', response.token); // Using 'token' as key, consistent with fetchApi
        console.log('Login page - Auth token stored in localStorage (key: token).');

        let finalUserName = 'User';
        let finalUserRole = 'Employee';
        let finalUserEmail = email; 

        const userFromApi = response.user;
        if (userFromApi && typeof userFromApi === 'object') {
          console.log('Login page - API response.user object:', JSON.stringify(userFromApi, null, 2));
          let displayName = '';
          if (userFromApi.firstName && userFromApi.lastName) {
            displayName = `${userFromApi.firstName} ${userFromApi.lastName}`;
          } else if (userFromApi.name) {
            displayName = userFromApi.name;
          }
          
          finalUserName = displayName.trim() || 'User'; 
          finalUserRole = userFromApi.role || 'Employee';
          finalUserEmail = userFromApi.email || email; 
          
          console.log(`Login page - Extracted from API response.user: Name='${finalUserName}', Role='${finalUserRole}', Email='${finalUserEmail}'`);
        } else {
          console.warn('Login page - User object in API response was missing or not as expected. Using default/fallback user info for storage. User object received:', userFromApi);
        }
      
        localStorage.setItem('userName', finalUserName);
        localStorage.setItem('userRole', finalUserRole);
        localStorage.setItem('userEmail', finalUserEmail);
        console.log(`Login page - Stored in localStorage: userName='${finalUserName}', userRole='${finalUserRole}', userEmail='${finalUserEmail}'`);
        
        toast({ title: "Login Successful", description: `Welcome back, ${finalUserName}!`});
        router.push('/dashboard');
      } else {
        console.warn('Login page - Token validation failed. Detailed diagnostics:');
        if (!response) {
          console.warn('Login page - The response object from signIn service is null or undefined.');
        } else {
          console.warn('Login page - Response object received (raw from signIn):', JSON.stringify(response, null, 2));
          if (!response.token) {
            console.warn('Login page - "token" field is missing or falsy in the response.');
          } else if (typeof response.token !== 'string') {
            console.warn(`Login page - "token" field exists, but is not a string. Actual type: ${typeof response.token}, Value:`, response.token);
          } else if (response.token.trim() === '') {
            console.warn('Login page - "token" field is a string, but it is empty or contains only whitespace.');
          }
        }
        setIsLoading(false); 
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Authentication failed: No valid token received from server. Please check server logs and API response format.",
        });
      }
    } catch (error) {
      console.error('Login page - Sign in failed:', error);
      setIsLoading(false); 
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error during login."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-transparent bg-card/80 backdrop-blur-lg">
        <CardHeader className="space-y-2 text-center p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary drop-shadow-lg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 7L12 12M12 12L22 7M12 12V22M12 2V12M17 4.5L7 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome Back!</CardTitle>
          <CardDescription className="text-muted-foreground !mt-1">
            Sign in to access your EmployTrack dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6 p-6 sm:p-8">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="text-base py-3"
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm text-muted-foreground hover:text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="text-base py-3"
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8 pt-0">
            <Button className="w-full text-lg py-3 h-auto font-semibold" type="submit" disabled={isLoading}>
              {isLoading ? "Signing In..." : <><LogIn className="mr-2 h-5 w-5" /> Sign In</>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// API Configuration and Helper
const API_BASE_URL = 'https://localhost:7294/api'; // Ensure this is your correct API base URL

async function fetchApi<T>(endpoint: string, method = 'GET', body?: any): Promise<T> {
  const token = localStorage.getItem('token'); // Using 'token' as key

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Ensure server knows we expect JSON
  });
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    method,
    headers,
    // credentials: 'include', // Removed 'credentials: include' as it might cause issues if not specifically needed and configured on server
  };

  if (body) {
    config.body = JSON.stringify(body);
  }
  
  console.log(`FETCH_API_DEBUG: Calling API: ${method} ${API_BASE_URL}${endpoint}`);
  if (body) console.log('FETCH_API_DEBUG: Request body:', body);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  const responseStatus = response.status;
  const responseStatusText = response.statusText;
  const contentType = response.headers.get('content-type');
  console.log(`FETCH_API_DEBUG: Response Status: ${responseStatus} ${responseStatusText}`);
  console.log(`FETCH_API_DEBUG: Response Content-Type: ${contentType}`);

  const responseText = await response.text(); 
  console.log(`FETCH_API_DEBUG: Raw Response Text for ${API_BASE_URL}${endpoint}: ${responseText}`);


  if (!response.ok) {
    let errorMsg = `Error ${responseStatus}: ${responseStatusText}. Response: ${responseText}`;
    try {
        const errorJson = JSON.parse(responseText); 
        errorMsg = errorJson.title || errorJson.message || errorMsg; 
        if (errorJson.errors) { 
            const validationErrors = Object.values(errorJson.errors).flat().join(', ');
            errorMsg += ` Details: ${validationErrors}`;
        }
    } catch (e) {
        // Parsing as JSON failed, stick with the text response
    }
    console.error("FETCH_API_DEBUG: API Error Details:", errorMsg);
    throw new Error(errorMsg);
  }

  if (responseStatus === 204) { 
    console.warn(`FETCH_API_DEBUG: Request to ${API_BASE_URL}${endpoint} returned 204 No Content. Returning null.`);
    return null as T;
  }

  if (contentType?.includes('application/json')) {
    try {
      if (responseText.trim() === '') { // Specifically for 200 OK with empty body
        console.warn(`FETCH_API_DEBUG: Request to ${API_BASE_URL}${endpoint} was successful (status ${responseStatus}) but server returned an empty JSON response body. Returning null.`);
        return null as T; 
      }
      const jsonData = JSON.parse(responseText);
      console.log(`FETCH_API_DEBUG: Parsed JSON Data for ${API_BASE_URL}${endpoint}:`, jsonData);
      return jsonData as T;
    } catch (e) {
      console.error(`FETCH_API_DEBUG: Failed to parse API response as JSON, even though Content-Type was application/json. Status: ${responseStatus}, URL: ${API_BASE_URL}${endpoint}. Error:`, e);
      throw new Error(`API returned status ${responseStatus} with Content-Type application/json but body was not valid JSON: ${responseText}`);
    }
  } else {
    if (endpoint === '/auth/signin') {
        console.error(`FETCH_API_DEBUG: /auth/signin endpoint did NOT return application/json. Content-Type: ${contentType}. Raw Text: ${responseText}`);
        throw new Error(`API for /auth/signin returned status ${responseStatus} but Content-Type was not application/json. This is required for login. Received: ${responseText}`);
    }
    console.warn(`FETCH_API_DEBUG: Request to ${API_BASE_URL}${endpoint} was successful (status ${responseStatus}) but Content-Type ('${contentType}') was not application/json. Returning raw text.`);
    return responseText as unknown as T; 
  }
}

//
// Auth (as an example if you need to type the response)
//
export const signIn = (credentials: { email: string; password?: string }) : Promise<SignInApiResponse> => 
  fetchApi<SignInApiResponse>('/auth/signin', 'POST', credentials);

// ... (rest of your API functions: signUp, signOut, getEmployees, etc. remain unchanged but should be moved to service files ideally)
// Type for SignUpData - adjust based on what your /api/auth/signup endpoint expects
export interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  userName: string;
  email: string;
  password?: string; // Password can be optional if not sending cleartext
  confirmPassword?: string; // Often required by backend
  phoneNumber?: string;
  birthDate?: string; // e.g., "YYYY-MM-DD"
}

// Type for SignUpResponse - adjust based on what your /api/auth/signup endpoint returns
export interface SignUpResponse {
  message: string;
  userId?: string;
}

export const signUp = (userData: SignUpData): Promise<SignUpResponse> =>
  fetchApi<SignUpResponse>('/auth/signup', 'POST', userData);

export const signOut = () =>
  fetchApi('/auth/signout', 'POST');

//
// Employees
//
export const getEmployees = () => fetchApi('/employees', 'GET');

export const getEmployeeById = (id: number) =>
  fetchApi(`/employees/${id}`, 'GET');

export const getEmployeesByStatus = (status: string) =>
  fetchApi(`/employees/status/${status}`, 'GET');

export const updateEmployeeStatus = (employeeId: number, isActive: boolean) =>
  fetchApi(`/employees/${employeeId}/status`, 'PUT', { isActive });

export const getEmployeeCurrentLocation = (employeeId: number) =>
  fetchApi(`/employees/${employeeId}/location/current`, 'GET');

export const getNearbyEmployees = (employeeId: number) =>
  fetchApi(`/employees/${employeeId}/location/nearby`, 'GET');

//
// Locations
//
export const updateLocation = (employeeId: number, locationData: any) =>
  fetchApi(`/location/${employeeId}`, 'PUT', locationData);

export const getLocation = (employeeId: number) =>
  fetchApi(`/location/${employeeId}`, 'GET');

//
// Messages
//
export const sendMessage = (messageData: any) =>
  fetchApi('/messages/send', 'POST', messageData);

export const getConversations = () =>
  fetchApi('/messages/conversation', 'GET');

export const getUnreadMessages = (employeeId: number) =>
  fetchApi(`/messages/${employeeId}/unread`, 'GET');

export const markMessagesRead = (messageIds: number[]) =>
  fetchApi('/messages/mark-read', 'POST', { messageIds });

//
// Organizations - Offices
//
export const createOffice = (officeData: any) =>
  fetchApi('/organization/offices', 'POST', officeData);

export const getOffices = () =>
  fetchApi('/organization/offices', 'GET');

export const getOfficeById = (officeId: number) =>
  fetchApi(`/organization/offices/${officeId}`, 'GET');

export const updateOffice = (officeId: number, officeData: any) =>
  fetchApi(`/organization/offices/${officeId}`, 'PUT', officeData);

export const deleteOffice = (officeId: number) =>
  fetchApi(`/organization/offices/${officeId}`, 'DELETE');

//
// Organizations - Departments
//
export const createDepartment = (departmentData: any) =>
  fetchApi('/organization/departments', 'POST', departmentData);

export const getDepartments = () =>
  fetchApi('/organization/departments', 'GET');

//
// Organizations - Positions
//
export const createPosition = (positionData: any) =>
  fetchApi('/organization/positions', 'POST', positionData);

export const getPositions = () =>
  fetchApi('/organization/positions', 'GET');

export const assignPosition = (positionId: number, assignData: any) =>
  fetchApi(`/organization/positions/${positionId}/assign`, 'PUT', assignData);

//
// Users
//
export const hireUser = (userData: any) =>
  fetchApi('/users/hire', 'POST', userData);

export const getUsers = () =>
  fetchApi('/users', 'GET');

export const getUserById = (id: string) =>
  fetchApi(`/users/${id}`, 'GET');

export const deleteUser = (id: string) =>
  fetchApi(`/users/${id}`, 'DELETE');

export const updateUserRole = (id: string, role: string) =>
  fetchApi(`/users/${id}/role`, 'PUT', { role });
    
    
