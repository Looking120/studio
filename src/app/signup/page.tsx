
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
import React from "react";
import { useRouter } from 'next/navigation';
// import { signUp } from '@/services/auth-service'; // Import your auth service
// import { useToast } from '@/hooks/use-toast'; // For showing notifications

export default function SignupPage() {
  const router = useRouter();
  // const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = (event.currentTarget.elements.namedItem('name') as HTMLInputElement)?.value;
    const email = (event.currentTarget.elements.namedItem('email') as HTMLInputElement)?.value;
    const password = (event.currentTarget.elements.namedItem('password') as HTMLInputElement)?.value;
    
    console.log("Signup form submitted with:", { name, email, password });

    // Example: Call signUp service function
    // try {
    //   if (!name || !email || !password) {
    //     alert("All fields are required.");
    //     return;
    //   }
    //   const response = await signUp({ name, email, password /*, other fields if needed */ });
    //   console.log('Sign up successful:', response);
    //   toast({
    //     title: "Signup Successful",
    //     description: response.message || "You can now log in.",
    //   });
    //   router.push('/'); // Redirect to login page
    // } catch (error) {
    //   console.error('Sign up failed:', error);
    //   toast({
    //     variant: "destructive",
    //     title: "Signup Failed",
    //     description: error instanceof Error ? error.message : "Unknown error during signup.",
    //   });
    // }
    alert("Signup functionality not fully implemented yet. Redirecting to login.");
    router.push('/'); // Placeholder redirect
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-transparent bg-card/80 backdrop-blur-lg">
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
          <CardContent className="grid gap-6 p-6 sm:p-8">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name"
                type="text" 
                placeholder="Ex: Alex Dubois" 
                required 
                className="text-base py-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="you@example.com" 
                required 
                className="text-base py-3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                placeholder="••••••••"
                className="text-base py-3"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 sm:p-8 pt-0">
            <Button className="w-full text-lg py-3 h-auto font-semibold" type="submit">
              <UserPlus className="mr-2 h-5 w-5" /> Sign Up
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Log in here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
