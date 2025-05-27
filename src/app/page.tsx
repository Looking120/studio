
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
import React from "react";
import { useRouter } from 'next/navigation'; 
// import { signIn } from '@/services/auth-service'; // Import your auth service

export default function LoginPage() {
  const router = useRouter(); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = (event.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (event.currentTarget.elements.namedItem('password') as HTMLInputElement)?.value;
    
    console.log("Login form submitted with:", { email, password });

    // Example: Call signIn service function
    // try {
    //   if (!email || !password) {
    //     alert("Email and password are required.");
    //     return;
    //   }
    //   const response = await signIn({ email, password });
    //   console.log('Sign in successful:', response);
    //   // Store token, user data, etc.
    //   router.push('/dashboard'); 
    // } catch (error) {
    //   console.error('Sign in failed:', error);
    //   // Display error message to the user, e.g., using a toast
    //   alert(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    // }
    router.push('/dashboard'); // Remove this line once API call is implemented
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
                name="email" // Added name attribute
                type="email" 
                placeholder="you@example.com" 
                required 
                className="text-base py-3"
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
                name="password" // Added name attribute
                type="password" 
                required 
                placeholder="••••••••"
                className="text-base py-3"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8 pt-0">
            <Button className="w-full text-lg py-3 h-auto font-semibold" type="submit">
              <LogIn className="mr-2 h-5 w-5" /> Sign In
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
