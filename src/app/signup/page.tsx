
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
import { UserPlus } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { signUp, type SignUpData, type SignUpResponse } from '@/services/auth-service';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const form = event.currentTarget;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value;
    let birthDateValue = (form.elements.namedItem('birthDate') as HTMLInputElement)?.value;
    const userName = (form.elements.namedItem('userName') as HTMLInputElement)?.value;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement)?.value;
    
    const middleName = (form.elements.namedItem('middleName') as HTMLInputElement)?.value;
    const phoneNumber = (form.elements.namedItem('phoneNumber') as HTMLInputElement)?.value;

    if (!firstName || !lastName || !birthDateValue || !userName || !email || !password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Signup Error",
        description: "Please fill all required fields (First Name, Last Name, Date of Birth, Username, Email, Password).",
      });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Signup Error",
        description: "Passwords do not match.",
      });
      setIsLoading(false);
      return;
    }

    if (birthDateValue && birthDateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      birthDateValue = `${birthDateValue}T00:00:00.000Z`;
    }

    const userData: SignUpData = { 
      firstName, 
      lastName, 
      userName, 
      email, 
      password,
      confirmPassword,
      birthDate: birthDateValue, 
    };
    if (middleName) userData.middleName = middleName;
    if (phoneNumber) userData.phoneNumber = phoneNumber;
      
    try {
      const response: SignUpResponse = await signUp(userData);
      
      toast({
        title: "Signup Successful",
        description: response.message || "Account created successfully. You can now log in.",
      });
      router.push('/'); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during signup.";
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-transparent bg-card/80 backdrop-blur-lg">
        <CardHeader className="space-y-2 text-center p-6 sm:p-8">
           <div className="flex justify-center mb-6">
             <UserPlus className="h-12 w-12 text-primary drop-shadow-lg" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground !mt-1">
            Join EmployTrack today!
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  name="firstName"
                  type="text" 
                  placeholder="Ex: Alex" 
                  required 
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  name="lastName"
                  type="text" 
                  placeholder="Ex: Dubois" 
                  required 
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="middleName">Middle Name (Optional)</Label>
                <Input 
                  id="middleName" 
                  name="middleName"
                  type="text" 
                  placeholder="Ex: Charles" 
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthDate">Date of Birth *</Label>
                <Input 
                  name="birthDate" 
                  id="birthDate" 
                  type="date" 
                  required 
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="userName">Username *</Label>
                <Input 
                  id="userName" 
                  name="userName"
                  type="text" 
                  placeholder="Ex: alexd" 
                  required 
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
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
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input 
                id="phoneNumber" 
                name="phoneNumber"
                type="tel" 
                placeholder="Ex: +1234567890" 
                className="text-base py-3"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
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
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="text-base py-3"
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8 pt-0">
            <Button className="w-full text-lg py-3 h-auto font-semibold" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
