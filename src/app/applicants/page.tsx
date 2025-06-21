
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Users, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUnhiredUsers, type User } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    
    // HACK: Temporarily treat a specific email as admin.
    // TODO: Remove this hack when backend sends the correct "Admin" role.
    const isSuperAdmin = email === 'joshuandayiadm@gmail.com';
    const isAdmin = isSuperAdmin || (role?.toLowerCase().includes('admin') ?? false);

    if (!isAdmin) {
      setError("Access Denied: You do not have permission to view this page.");
      setIsLoading(false);
      return;
    }

    const loadApplicants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchUnhiredUsers();
        setApplicants(data || []);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
          signOut().finally(() => router.push('/'));
          return;
        }
        
        let errorMessage = "An unknown error occurred while fetching applicants.";
        if (err instanceof HttpError && err.status === 403) {
             errorMessage = "Access Denied: You do not have permission to view unhired users.";
             toast({ variant: "destructive", title: "Access Denied", description: errorMessage});
        } else if (err instanceof Error) {
            errorMessage = err.message;
            toast({ variant: "destructive", title: "Failed to load applicants", description: errorMessage });
        }
        setError(errorMessage);
        setApplicants([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplicants();
  }, [toast, router]);

  const handleHireApplicant = (applicant: User) => {
    const queryParams = new URLSearchParams();
    if (applicant.id) queryParams.append('userIdToHire', applicant.id);
    if (applicant.firstName) queryParams.append('firstName', applicant.firstName);
    if (applicant.lastName) queryParams.append('lastName', applicant.lastName);
    if (applicant.email) queryParams.append('email', applicant.email);
    if (applicant.phoneNumber) queryParams.append('phoneNumber', applicant.phoneNumber);
    
    router.push(`/employees/add?${queryParams.toString()}`);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
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
      );
    }

    if (error) {
        const isAccessDenied = error.toLowerCase().includes("access denied");
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                {isAccessDenied 
                    ? <ShieldAlert className="h-16 w-16 mb-6 text-destructive" />
                    : <AlertTriangle className="h-16 w-16 mb-6 text-destructive" />
                }
                <p className="text-2xl font-semibold text-foreground mb-2">
                    {isAccessDenied ? "Access Denied" : "Failed to load applicants"}
                </p>
                <p className="text-md">{error}</p>
            </div>
        );
    }
    
    if (applicants.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No applicants found.
        </p>
      );
    }

    return (
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
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Applicants for Hire</CardTitle>
        <CardDescription>View users who have registered but are not yet hired as employees.</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
