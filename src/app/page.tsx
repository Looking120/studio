
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

// Type for the expected sign-in response structure
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
  const [isLoading, setIsLoading] = useState(false); // Initialize isLoading state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    if (!email || !password) {
      toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
      setIsLoading(false);
      return;
    }

    try {
      // Call the local signIn function
      const response = await signIn({ email, password }) as SignInApiResponse; // Assuming signIn returns SignInApiResponse
      
      console.log('Login page - API response:', response);

      if (response && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        // Store token (using 'token' as key, matching user's fetchApi)
        localStorage.setItem('token', response.token);
        console.log('Login page - Auth token stored in localStorage (key: token).');

        let finalUserName = 'User';
        let finalUserRole = 'Employee';
        let finalUserEmail = email; // Fallback to entered email

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
          console.warn('Login page - The response object itself is null or undefined.');
        } else {
          console.warn('Login page - Response object received (raw):', response);
          if (!response.token) {
            console.warn('Login page - "token" field is missing or falsy in the response.');
          } else if (typeof response.token !== 'string') {
            console.warn(`Login page - "token" field exists, but is not a string. Actual type: ${typeof response.token}, Value:`, response.token);
          } else if (response.token.trim() === '') {
            console.warn('Login page - "token" field is a string, but it is empty or contains only whitespace.');
          }
        }
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Authentication failed: No valid token received from server. Please check server logs and API response format.",
        });
      }
    } catch (error) {
      console.error('Sign in failed:', error);
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
            {/* EmployTrack Logo SVG */}
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
const API_BASE_URL = 'https://localhost:7294/api';

async function fetchApi<T>(endpoint: string, method = 'GET', body?: any): Promise<T> {
  const token = localStorage.getItem('token'); // Using 'token' as key

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    method,
    headers,
    // credentials: 'include', // 'credentials' might cause issues with simple local setups if not configured on server
  };

  if (body) {
    config.body = JSON.stringify(body);
  }
  
  console.log(`Calling API: ${method} ${API_BASE_URL}${endpoint}`);
  if (body) console.log('Request body:', body);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  const responseText = await response.text(); // Get text for logging, then try to parse
  console.log(`API Response Status: ${response.status} for ${API_BASE_URL}${endpoint}`);
  console.log(`API Response Text: ${responseText}`);


  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}. Response: ${responseText}`;
    try {
        const errorJson = JSON.parse(responseText);
        // Use specific error message from server if available (e.g., ASP.NET Core problem details)
        errorMsg = errorJson.title || errorJson.message || errorMsg; 
        if (errorJson.errors) { // For ASP.NET Core validation problem details
            const validationErrors = Object.values(errorJson.errors).flat().join(', ');
            errorMsg += ` Details: ${validationErrors}`;
        }
    } catch (e) {
        // Parsing as JSON failed, stick with the text response
    }
    console.error("API Error Details:", errorMsg);
    throw new Error(errorMsg);
  }

  if (response.status === 204) { // No Content
    return null as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch (e) {
    console.error("Failed to parse API response as JSON, even though status was OK. Response Text:", responseText, e);
    // If response.ok but body is not JSON (or empty and not 204), this could be an issue.
    // For now, we'll throw an error, as we generally expect JSON from this API.
    throw new Error("API returned a non-JSON response for a successful request.");
  }
}

//
// Auth
//
export const signIn = (credentials: { email: string; password: string }) =>
  fetchApi<SignInApiResponse>('/auth/signin', 'POST', credentials); // Specified return type

export const signUp = (userData: any) => // TODO: Define SignUpData type
  fetchApi('/auth/signup', 'POST', userData);

export const signOut = () =>
  fetchApi('/auth/signout', 'POST');

// The rest of your API functions (getActivityLogs, getEmployees, etc.) would go here
// Example:
// export const getEmployees = () => fetchApi<Employee[]>('/employees', 'GET');
// Define Employee[] type or import if available elsewhere
