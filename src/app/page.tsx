
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
import { signIn } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter(); 
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const emailInput = (event.currentTarget.elements.namedItem('email') as HTMLInputElement);
    const passwordInput = (event.currentTarget.elements.namedItem('password') as HTMLInputElement);
    
    const email = emailInput?.value;
    const password = passwordInput?.value;
    
    console.log("Login page - Attempting login with email:", email); 

    let finalUserName = 'User'; 
    let finalUserRole = 'Employee'; 
    let finalUserEmail = email || 'user@example.com';

    try {
      if (!email || !password) {
        toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
        setIsLoading(false);
        return;
      }
      const response = await signIn({ email, password }); // This is the parsedResponse from auth-service
      
      console.log('Login page - signIn service call returned (this is the parsed response object):', response);

      if (response && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        console.log('Login page - Token successfully validated. Token:', response.token.substring(0, 20) + "..."); // Log part of the token
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.token);
          console.log('Login page - Auth token stored in localStorage.');
        
          const userFromApi = response.user;
          if (userFromApi && typeof userFromApi === 'object') {
            console.log('Login page - API signIn response.user object:', JSON.stringify(userFromApi, null, 2));
            let displayName = '';
            if (userFromApi.firstName && userFromApi.lastName) {
              displayName = `${userFromApi.firstName} ${userFromApi.lastName}`;
            } else if (userFromApi.name) { 
              displayName = userFromApi.name;
            }
            
            finalUserName = displayName.trim() || 'User'; 
            finalUserRole = userFromApi.role || 'Employee'; 
            finalUserEmail = userFromApi.email || email || 'user@example.com'; 
            
            console.log(`Login page - Extracted from API response.user: Name='${finalUserName}', Role='${finalUserRole}', Email='${finalUserEmail}'`);
          } else {
            console.warn('Login page - User object in API response was missing, not an object, or did not contain expected fields. Using default/fallback user info for storage. User object received:', userFromApi);
          }
        
          localStorage.setItem('userName', finalUserName);
          localStorage.setItem('userRole', finalUserRole);
          localStorage.setItem('userEmail', finalUserEmail);
          console.log(`Login page - Stored in localStorage: userName='${finalUserName}', userRole='${finalUserRole}', userEmail='${finalUserEmail}'`);
          
          toast({ title: "Login Successful", description: `Welcome back, ${finalUserName}!`});
          router.push('/dashboard'); 
        }
      } else {
         console.warn('Login page - Token validation failed. Detailed diagnostics:');
         if (!response) {
           console.warn('Login page - The parsed response object itself is null or undefined.');
           console.warn('Login page - This might happen if the API returned 200 OK with an empty body, or a non-JSON 200 OK response, or if parseJsonResponse returned null for other reasons.');
         } else {
           console.warn('Login page - Parsed response object received (raw):', response);
           console.warn('Login page - Parsed response object (stringified):', JSON.stringify(response, null, 2));
           if (!response.token) {
             console.warn('Login page - "token" field is missing or falsy in the parsed response.');
           } else if (typeof response.token !== 'string') {
             console.warn(`Login page - "token" field exists, but is not a string. Actual type: ${typeof response.token}, Value:`, response.token);
           } else if (response.token.trim() === '') {
             console.warn('Login page - "token" field is a string, but it is empty or contains only whitespace.');
           } else {
             console.warn('Login page - "token" field seems to be a non-empty string, but the overall condition failed. Token value for inspection:', response.token);
           }
         }
         toast({ variant: "destructive", title: "Login Failed", description: "Authentication failed: No valid token received from server. Please check server logs and API response format." });
      }
      
    } catch (error) {
      console.error('Login page - Sign in failed with an exception:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during login.";
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
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
                required 
                placeholder="••••••••"
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
    
