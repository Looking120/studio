
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
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>Manage your account information and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="Example User" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="user.example@example.com" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="emailNotifications" className="flex flex-col space-y-1">
              <span>Email notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive important notifications by email.
              </span>
            </Label>
            <Switch id="emailNotifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pushNotifications" className="flex flex-col space-y-1">
              <span>Push notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive push notifications on your devices.
              </span>
            </Label>
            <Switch id="pushNotifications" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Theme switching (light/dark) is available via the icon in the application header.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Security</CardTitle>
          <CardDescription>Manage your security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
          <div className="flex items-center justify-between">
            <Label htmlFor="twoFactorAuth" className="flex flex-col space-y-1">
              <span>Two-factor authentication</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Add an extra layer of security to your account.
              </span>
            </Label>
            <Switch id="twoFactorAuth" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
