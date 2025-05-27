
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, Shield, Edit3, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// import { fetchUserById } from '@/services/user-service'; // Or a dedicated profile service
// import { useToast } from '@/hooks/use-toast';

// Placeholder: Assume we get the current user's ID from an auth context or similar
const currentUserId = "user123"; // Replace with actual dynamic user ID

interface UserProfile {
  name: string;
  email: string;
  jobTitle: string;
  role: string;
  avatarUrl: string;
  department: string;
  joinDate: string; // Consider using Date object and formatting it
}

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      setIsLoading(true);
      // Example: Fetch user profile data
      // try {
      //   // const profileData = await fetchUserById(currentUserId); // Assuming fetchUserById returns UserProfile compatible data
      //   // if (profileData) {
      //   //   setUserProfile({
      //   //       name: profileData.name,
      //   //       email: profileData.email,
      //   //       jobTitle: profileData.jobTitle || "N/A",
      //   //       role: profileData.role || "N/A", // Assuming 'role' comes from user data
      //   //       avatarUrl: profileData.avatarUrl || `https://placehold.co/120x120.png?text=${profileData.name.substring(0,2)}`,
      //   //       department: profileData.department || "N/A",
      //   //       joinDate: profileData.joinDate ? new Date(profileData.joinDate).toLocaleDateString() : "N/A" // Example formatting
      //   //   });
      //   // } else {
      //   //    throw new Error("User profile not found.");
      //   // }
      //   console.log(`Placeholder: Would fetch profile for user ${currentUserId}`);
      //   // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserProfile({
          name: "Alex Dubois", 
          email: "alex.dubois@example.com", 
          jobTitle: "Product Design Lead", 
          role: "Team Lead", 
          avatarUrl: "https://placehold.co/120x120.png?text=AD", 
          department: "UX/UI Design", 
          joinDate: "15 Mars 2021", 
        });
      // } catch (error) {
      //   console.error("Failed to load user profile:", error);
      //   // toast({ variant: "destructive", title: "Error", description: "Could not load profile data." });
      //   // Fallback or redirect
      // } finally {
      //   setIsLoading(false);
      // }
      setIsLoading(false);
    };

    loadUserProfile();
  }, []);

  if (isLoading) {
    return (
        <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
            <Card className="shadow-xl overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <CardHeader className="text-center -mt-20">
                    <div className="flex justify-center mb-4">
                        <Skeleton className="h-36 w-36 rounded-full border-4 border-background" />
                    </div>
                    <Skeleton className="h-10 w-1/2 mx-auto mb-2" />
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                    <Skeleton className="h-4 w-1/4 mx-auto mt-1" />
                </CardHeader>
                <CardContent className="mt-6 px-6 sm:px-8 pb-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({length: 4}).map((_, i) => (
                            <div key={i} className="flex items-start space-x-4 p-4 bg-background/70 rounded-lg shadow-sm">
                                <Skeleton className="h-6 w-6 rounded" />
                                <div className="w-full">
                                    <Skeleton className="h-4 w-1/3 mb-2" />
                                    <Skeleton className="h-5 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <Skeleton className="h-12 w-36 rounded-md" />
                        <Skeleton className="h-12 w-40 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The user profile could not be loaded.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
      <Card className="shadow-xl overflow-hidden border-transparent bg-card/90 backdrop-blur-md">
        <div className="h-32 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center -mt-20">
          <div className="flex justify-center mb-4">
            <Avatar className="h-36 w-36 border-4 border-background shadow-2xl">
              <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} data-ai-hint="user profile avatar" />
              <AvatarFallback className="text-5xl bg-muted text-muted-foreground">
                {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight">{userProfile.name}</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-1">
            {userProfile.jobTitle}
          </CardDescription>
           <p className="text-sm text-accent font-medium mt-0.5">{userProfile.role}</p>
        </CardHeader>
        <CardContent className="mt-6 px-6 sm:px-8 pb-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Mail className="h-5 w-5 text-primary" />} label="Email Address" value={userProfile.email} />
            <InfoItem icon={<Briefcase className="h-5 w-5 text-primary" />} label="Department" value={userProfile.department} />
            <InfoItem icon={<Shield className="h-5 w-5 text-primary" />} label="System Role" value={userProfile.role} />
            <InfoItem icon={<CalendarDays className="h-5 w-5 text-primary" />} label="Joined On" value={userProfile.joinDate} />
          </div>
          <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="outline" size="lg">
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-4 p-4 bg-background/70 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <span className="flex-shrink-0 mt-1 text-primary">{icon}</span>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-md font-semibold text-foreground">{value}</p>
    </div>
  </div>
);
