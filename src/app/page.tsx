
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
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { signIn, type SignInResponse } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';
import { UnauthorizedError } from "@/services/api-client";


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    console.log(`Login Page: Attempting login for email: ${email}`);

    if (!email || !password) {
      toast({ variant: "destructive", title: "Login Error", description: "Email and password are required." });
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Login page - Attempting signIn service call with email: ${email}`);
      const response: SignInResponse | null = await signIn({ email, password });
      console.log('Login page - signIn service call returned (raw):', JSON.stringify(response, null, 2));

      if (response && typeof response === 'object' && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        console.log('Login page - Token received:', response.token ? response.token.substring(0, 20) + "..." : "N/A");
        localStorage.setItem('authToken', response.token);
        console.log('Login page - Auth token stored in localStorage (key: authToken).');

        let finalUserName = 'User';
        let finalUserRole = 'Employee';
        let finalUserEmail = email; // Default to form input email initially
        let finalUserId = '';

        const userFromApi = response.user;
        console.log('Login page - Processing userFromApi object:', JSON.stringify(userFromApi, null, 2));

        if (userFromApi && typeof userFromApi === 'object') {
          let displayName = '';
          if (userFromApi.firstName && userFromApi.lastName) {
            displayName = `${userFromApi.firstName} ${userFromApi.lastName}`;
          } else if (userFromApi.name) {
            displayName = userFromApi.name;
          }
          console.log(`Login page - API User Name: ${displayName || 'Not provided'}, API Role: ${userFromApi.role || 'Not provided'}, API Email: ${userFromApi.email || 'Not provided'}, API User ID: ${userFromApi.id || 'Not provided'}`);

          finalUserName = displayName.trim() || 'User';
          finalUserRole = userFromApi.role || 'Employee';
          
          // Explicitly check and prioritize API email
          if (userFromApi.email && typeof userFromApi.email === 'string' && userFromApi.email.trim() !== '') {
            finalUserEmail = userFromApi.email.trim();
            console.log(`Login page - Determined finalUserEmail from API: ${finalUserEmail}`);
          } else {
            finalUserEmail = email; // Fallback to form input email
            console.warn(`Login page - API did not provide a valid email in userFromApi.email. Falling back to form input email: ${email}. API email was: [${userFromApi.email}]`);
          }
          
          finalUserId = userFromApi.id || '';
          console.log(`Login page - Determined finalUserId: ${finalUserId} (Source: ${userFromApi.id ? 'API' : 'Empty Fallback'})`);
        } else {
          console.warn('Login page - User object (response.user) in API response was missing, null, or not an object. Using form input email for storage. User object received:', userFromApi);
          finalUserEmail = email; // Fallback to form input email
          finalUserId = ''; // No ID if user object is missing
          console.log(`Login page - Determined finalUserEmail (due to missing API user object): ${finalUserEmail} (Source: Form Input)`);
          console.log(`Login page - Determined finalUserId (due to missing API user object): ${finalUserId} (Source: Empty Fallback)`);
        }
        
        console.log(`Login page - About to store in localStorage: userName='${finalUserName}', userRole='${finalUserRole}', userEmail='${finalUserEmail}', userId='${finalUserId || 'Not Stored'}'`);
        localStorage.setItem('userName', finalUserName);
        localStorage.setItem('userRole', finalUserRole);
        localStorage.setItem('userEmail', finalUserEmail);
        if (finalUserId) {
          localStorage.setItem('userId', finalUserId);
        } else {
          localStorage.removeItem('userId'); // Ensure no stale ID if API didn't provide one
        }
        console.log(`Login page - Successfully Stored in localStorage: userName='${localStorage.getItem('userName')}', userRole='${localStorage.getItem('userRole')}', userEmail='${localStorage.getItem('userEmail')}', userId='${localStorage.getItem('userId') || 'Not Stored'}'`);

        toast({ title: "Login Successful", description: `Welcome, ${finalUserName}!` });
        router.push('/dashboard');
      } else {
        setIsLoading(false);
        let validationErrorReason = "Unknown reason for token validation failure.";
        if (!response) {
          validationErrorReason = "The response object from signIn service is null or undefined.";
        } else if (!response.token) {
          validationErrorReason = "'token' field is missing or falsy in the response.";
        } else if (typeof response.token !== 'string') {
          validationErrorReason = `"token" exists, but is not a string. Type: ${typeof response.token}`;
        } else if (response.token.trim() === '') {
          validationErrorReason = "'token' field is a string, but it is empty or contains only whitespace.";
        }
        console.warn(`Login page - Token validation failed in page.tsx. Reason: ${validationErrorReason} Full response:`, JSON.stringify(response, null, 2));
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: `Authentication failed: No valid token received. ${validationErrorReason}`,
        });
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Login page - Sign in failed with error:', error);
      if (error instanceof UnauthorizedError) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Incorrect email or password."
        });
      } else {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error instanceof Error ? error.message : "Unknown error during login."
        });
      }
    } finally {
      if (isLoading) setIsLoading(false); 
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

