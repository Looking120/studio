
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
import { signIn, type SignInResponse } from '@/services/auth-service'; // Ensure SignInResponse is imported if not already
import { useToast } from '@/hooks/use-toast'; // Added useToast

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;

    if (!email || !password) {
      toast({ variant: "destructive", title: "Erreur de Connexion", description: "L'email et le mot de passe sont requis." });
      setIsLoading(false);
      return;
    }

    try {
      // signIn expects an object: { email, password }
      const response: SignInResponse | null = await signIn({ email, password });
      console.log('Login page - signIn service call returned:', response);

      // Aggressive logging to check the response structure
      console.log('Login page - DEBUG: Raw response object received in handleSubmit:', JSON.stringify(response, null, 2));
      if (response && typeof response === 'object') {
        console.log('Login page - DEBUG: Keys in response object:', Object.keys(response));
        console.log('Login page - DEBUG: Value of response.token:', response.token);
        console.log('Login page - DEBUG: Type of response.token:', typeof response.token);
        console.log('Login page - DEBUG: Value of response.user:', response.user);
      }

      if (response && response.token && typeof response.token === 'string' && response.token.trim() !== '') {
        // IMPORTANT: Use 'authToken' as the key for consistency if apiClient expects that.
        // If apiClient uses 'token', then use 'token' here. Let's assume 'authToken' for now.
        localStorage.setItem('authToken', response.token);
        console.log('Login page - Auth token stored in localStorage (key: authToken).');

        let finalUserName = 'Utilisateur'; // Default
        let finalUserRole = 'Employé';   // Default
        let finalUserEmail = email;       // Default to input email

        const userFromApi = response.user;
        if (userFromApi && typeof userFromApi === 'object') {
          console.log('Login page - API response.user object:', JSON.stringify(userFromApi, null, 2));
          let displayName = '';
          if (userFromApi.firstName && userFromApi.lastName) {
            displayName = `${userFromApi.firstName} ${userFromApi.lastName}`;
          } else if (userFromApi.name) { // Fallback to name if firstName/lastName not present
            displayName = userFromApi.name;
          }
          
          finalUserName = displayName.trim() || 'Utilisateur'; // Ensure no empty string
          finalUserRole = userFromApi.role || 'Employé';
          finalUserEmail = userFromApi.email || email; // Prefer API email if available
          
          console.log(`Login page - Extracted from API response.user: Name='${finalUserName}', Role='${finalUserRole}', Email='${finalUserEmail}'`);
        } else {
          console.warn('Login page - User object in API response was missing or not as expected. Using default/fallback user info for storage. User object received:', userFromApi);
        }
      
        localStorage.setItem('userName', finalUserName);
        localStorage.setItem('userRole', finalUserRole);
        localStorage.setItem('userEmail', finalUserEmail);
        console.log(`Login page - Stored in localStorage: userName='${finalUserName}', userRole='${finalUserRole}', userEmail='${finalUserEmail}'`);
        
        toast({ title: "Connexion Réussie", description: `Bienvenue, ${finalUserName}!`});
        router.push('/dashboard');
      } else {
        console.warn('Login page - Token validation failed. Detailed diagnostics:');
        if (!response) {
          console.warn('Login page - The response object from signIn service is null or undefined.');
        } else {
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
          title: "Échec de l'Authentification",
          description: "Authentication failed: No valid token received from server. Please check server logs and API response format.",
        });
      }
    } catch (error) {
      console.error('Login page - Sign in failed:', error);
      setIsLoading(false); 
      toast({
        variant: "destructive",
        title: "Échec de la Connexion",
        description: error instanceof Error ? error.message : "Erreur inconnue lors de la connexion."
      });
    } finally {
      // Ensure isLoading is always set to false, even if redirection occurs before this.
      // However, if redirection happens, this might not execute if the component unmounts.
      // The setIsLoading(false) inside the error blocks handles those cases better.
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
