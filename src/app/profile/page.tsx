
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, Shield, Edit3, CalendarDays } from 'lucide-react';

// Placeholder user data - replace with actual data from auth context or API
const currentUser = {
  name: "Alex Dubois", // Changed name
  email: "alex.dubois@example.com", // Changed email
  jobTitle: "Product Design Lead", // Changed Job Title
  role: "Team Lead", // Changed Role
  avatarUrl: "https://placehold.co/120x120.png", // Updated placeholder
  department: "UX/UI Design", // Changed department
  joinDate: "15 Mars 2021", // Changed date
};

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
      <Card className="shadow-xl overflow-hidden border-transparent bg-card/90 backdrop-blur-md">
        <div className="h-32 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center -mt-20">
          <div className="flex justify-center mb-4">
            <Avatar className="h-36 w-36 border-4 border-background shadow-2xl">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="user profile avatar" />
              <AvatarFallback className="text-5xl bg-muted text-muted-foreground">
                {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight">{currentUser.name}</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-1">
            {currentUser.jobTitle}
          </CardDescription>
           <p className="text-sm text-accent font-medium mt-0.5">{currentUser.role}</p>
        </CardHeader>
        <CardContent className="mt-6 px-6 sm:px-8 pb-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Mail className="h-5 w-5 text-primary" />} label="Email Address" value={currentUser.email} />
            <InfoItem icon={<Briefcase className="h-5 w-5 text-primary" />} label="Department" value={currentUser.department} />
            <InfoItem icon={<Shield className="h-5 w-5 text-primary" />} label="System Role" value={currentUser.role} />
            <InfoItem icon={<CalendarDays className="h-5 w-5 text-primary" />} label="Joined On" value={currentUser.joinDate} />
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
