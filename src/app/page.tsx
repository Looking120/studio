
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

    // Initialize with fallback values that will be used if API data is incomplete
    let finalUserName = 'User'; 
    let finalUserRole = 'Employee'; 
    let finalUserEmail = email || 'user@example.com';

    try {
      if (!email || !password) {
        toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
        setIsLoading(false);
        return;
      }
      const response = await signIn({ email, password });
      
      console.log('Login page - API signIn raw response object:', response); 
      if (response && response.user) {
        console.log('Login page - API signIn response.user object:', response.user);
      } else {
        console.log('Login page - API signIn response did NOT contain a "user" object or response itself is null/undefined.');
      }
      
      if (response && response.token && typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
        console.log('Login page - Auth token stored in localStorage.');
        
        const userFromApi = response.user;
        if (userFromApi && typeof userFromApi === 'object') {
          let displayName = '';
          if (userFromApi.firstName && userFromApi.lastName) {
            displayName = `${userFromApi.firstName} ${userFromApi.lastName}`;
          } else if (userFromApi.name) { // Fallback to 'name' if firstName/lastName are not present
            displayName = userFromApi.name;
          }
          
          finalUserName = displayName.trim() || 'User'; // Default to 'User' if name fields are empty or not found
          finalUserRole = userFromApi.role || 'Employee'; // Use API role, fallback to 'Employee'
          finalUserEmail = userFromApi.email || email || 'user@example.com'; // Prioritize API email, then form email, then fallback
          
          console.log(`Login page - Extracted from API response.user: Name='${finalUserName}', Role='${finalUserRole}', Email='${finalUserEmail}'`);
        } else {
          console.warn('Login page - User object in API response was missing, not an object, or did not contain expected fields. Using default/fallback user info for storage.');
          // Fallbacks initialized above (finalUserName, finalUserRole, finalUserEmail) will be used.
        }
        
        // Store derived or default values
        localStorage.setItem('userName', finalUserName);
        localStorage.setItem('userRole', finalUserRole);
        localStorage.setItem('userEmail', finalUserEmail);
        console.log(`Login page - Stored in localStorage: userName='${finalUserName}', userRole='${finalUserRole}', userEmail='${finalUserEmail}'`);
        
        toast({ title: "Login Successful", description: `Welcome back, ${finalUserName}!`});
        router.push('/dashboard'); 
      } else {
         console.warn('Login page - No token received from API or not in browser environment. User info not stored from API.');
         toast({ variant: "destructive", title: "Login Failed", description: "Authentication failed: No token received from server." });
      }
      
    } catch (error) {
      console.error('Login page - Sign in failed:', error);
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

    