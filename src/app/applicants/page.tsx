
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Users, AlertTriangle, ShieldAlert, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUnhiredUsers, type User } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    setCurrentUserRole(role);
    setIsRoleLoading(false);
  }, []);

  const isAdmin = useMemo(() => {
    if (!isClient || isRoleLoading) return false;
    return currentUserRole?.toLowerCase().includes('admin') ?? false;
  }, [isClient, isRoleLoading, currentUserRole]);

  useEffect(() => {
    const loadApplicants = async () => {
      if (!isAdmin) {
        setIsLoading(false);
        setError("Access Denied: You do not have permission to view this page.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUnhiredUsers();
        setApplicants(data || []);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
          await signOut();
          router.push('/');
          return;
        }
        if (err instanceof HttpError && err.status === 403) {
             setError("Access Denied: You do not have permission to view unhired users.");
             toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view unhired users."});
        } else {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching applicants.';
            setError(errorMessage);
            toast({ variant: "destructive", title: "Failed to load applicants", description: errorMessage });
        }
        setApplicants([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isClient && !isRoleLoading) {
      loadApplicants();
    }
  }, [isClient, isRoleLoading, isAdmin, toast, router]);

  const handleHireApplicant = (applicant: User) => {
    const queryParams = new URLSearchParams();
    if (applicant.id) queryParams.append('userIdToHire', applicant.id);
    if (applicant.firstName) queryParams.append('firstName', applicant.firstName);
    if (applicant.lastName) queryParams.append('lastName', applicant.lastName);
    if (applicant.email) queryParams.append('email', applicant.email);
    if (applicant.phoneNumber) queryParams.append('phoneNumber', applicant.phoneNumber);
    // Add other pre-fillable fields if available and desired

    router.push(`/employees/add?${queryParams.toString()}`);
  };
  
  if (isRoleLoading || !isClient) {
    return (
      <Card className="shadow-lg p-6">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-6 w-3/4 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Applicants for Hire</CardTitle>
        <CardDescription>View users who have registered but are not yet hired as employees.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isAdmin && !isRoleLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShieldAlert className="h-16 w-16 mb-6 text-destructive" />
            <p className="text-2xl font-semibold text-foreground mb-2">Access Denied</p>
            <p className="text-md">You do not have permission to view this page.</p>
          </div>
        )}
        {isAdmin && isLoading && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-applicant-${index}`}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {isAdmin && !isLoading && error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load applicants</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {isAdmin && !isLoading && !error && applicants.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No applicants found.
          </p>
        )}
        {isAdmin && !isLoading && !error && applicants.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell className="font-medium">{applicant.name || `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'N/A'}</TableCell>
                    <TableCell>{applicant.email}</TableCell>
                    <TableCell>{applicant.userName || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleHireApplicant(applicant)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Hire
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
