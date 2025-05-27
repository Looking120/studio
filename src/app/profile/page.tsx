
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, Shield, Edit3 } from 'lucide-react';

// Placeholder user data - replace with actual data from auth context or API
const currentUser = {
  name: "Utilisateur Modèle",
  email: "user.modele@example.com",
  jobTitle: "Manager Principal", // Poste
  role: "Administrateur", // Rôle
  avatarUrl: "https://placehold.co/100x100.png?text=UM",
  department: "Direction Générale",
  joinDate: "01 Janvier 2020",
};

export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Avatar className="h-32 w-32 border-4 border-primary shadow-lg">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="user profile avatar" />
              <AvatarFallback className="text-4xl">{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-bold">{currentUser.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {currentUser.jobTitle} - {currentUser.role}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem icon={<Mail className="h-5 w-5 text-primary" />} label="Email" value={currentUser.email} />
            <InfoItem icon={<Briefcase className="h-5 w-5 text-primary" />} label="Département" value={currentUser.department} />
            <InfoItem icon={<Shield className="h-5 w-5 text-primary" />} label="Rôle Système" value={currentUser.role} />
            <InfoItem icon={<User className="h-5 w-5 text-primary" />} label="Membre Depuis" value={currentUser.joinDate} />
          </div>
          <div className="pt-6 flex justify-center">
            <Button variant="outline">
              <Edit3 className="mr-2 h-4 w-4" /> Modifier le Profil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for additional sections like activity, settings quick links etc. */}
      {/* 
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune activité récente à afficher.</p>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
    <span className="flex-shrink-0 mt-1">{icon}</span>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-md font-semibold">{value}</p>
    </div>
  </div>
);
