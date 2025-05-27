
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Bell, ShieldCheck, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Paramètres du Compte</CardTitle>
          <CardDescription>Gérez les informations de votre compte et vos préférences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" defaultValue="Utilisateur Modèle" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input id="email" type="email" defaultValue="user.modele@example.com" />
          </div>
          <Button>Enregistrer les modifications</Button>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Notifications</CardTitle>
          <CardDescription>Choisissez comment vous souhaitez être notifié.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
              <span>Notifications par e-mail</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Recevoir des notifications importantes par e-mail.
              </span>
            </Label>
            <Switch id="emailNotifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
              <span>Notifications push</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Recevoir des notifications push sur vos appareils.
              </span>
            </Label>
            <Switch id="pushNotifications" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apparence</CardTitle>
          <CardDescription>Personnalisez l'apparence de l'application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Le changement de thème (clair/sombre) est disponible via l'icône dans l'en-tête de l'application.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Sécurité</CardTitle>
          <CardDescription>Gérez vos paramètres de sécurité.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Changer le mot de passe</Button>
          <div className="flex items-center justify-between">
            <Label htmlFor="twoFactorAuth" className="flex flex-col space-y-1">
              <span>Authentification à deux facteurs</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Ajoutez une couche de sécurité supplémentaire à votre compte.
              </span>
            </Label>
            <Switch id="twoFactorAuth" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
