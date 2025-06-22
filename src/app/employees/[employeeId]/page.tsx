
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEmployeeById, type Employee } from '@/services/employee-service';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Briefcase, Building2, ShieldAlert, AlertTriangle, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  isLoading?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, isLoading }) => (
  <div className="flex items-start space-x-3 p-3 bg-muted/30 dark:bg-muted/50 rounded-lg shadow-sm">
    <span className="flex-shrink-0 mt-1 text-primary">{icon}</span>
    <div className="flex-grow">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {isLoading ? <Skeleton className="h-5 w-3/4 mt-0.5" /> : <p className="text-sm font-semibold text-foreground">{value || 'N/A'}</p>}
    </div>
  </div>
);

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { 
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) -1; 
            const day = parseInt(parts[2], 10);
            const potentiallyValidDate = new Date(year, month, day);
            if (!isNaN(potentiallyValidDate.getTime())) {
                 return potentiallyValidDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            }
        }
        console.warn("Invalid Date encountered in formatDate:", dateString);
        return 'Invalid Date';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const employeeId = params.employeeId as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setIsRoleLoading(false);
  }, []);

  const isAdmin = useMemo(() => {
    if (!isClient || isRoleLoading) return false;
    // HACK: Temporarily treat a specific email as admin.
    // TODO: Remove this hack when backend sends the correct "Admin" role.
    const isSuperAdmin = currentUserEmail === 'joshuandayiadm@gmail.com';
    return isSuperAdmin || (currentUserRole?.toLowerCase().includes('admin') ?? false);
  }, [isClient, isRoleLoading, currentUserRole, currentUserEmail]);


  useEffect(() => {
    if (!employeeId || !isClient || isRoleLoading) return;

    if (!isAdmin) {
      setError("Access Denied: You do not have permission to view this page.");
      setIsLoading(false);
      return;
    }

    const loadEmployeeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedEmployee = await fetchEmployeeById(employeeId);
        setEmployee(fetchedEmployee);

      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
          await signOut();
          router.push('/');
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to load employee data: ${errorMessage}`);
        toast({ variant: "destructive", title: "Loading Error", description: `Could not load employee: ${errorMessage}` });
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, [employeeId, isAdmin, isClient, isRoleLoading, toast, router]);

  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'N/A';
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isRoleLoading || (!isClient && isLoading)) {
     return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <Card className="shadow-xl">
                <CardHeader className="relative">
                    <Skeleton className="h-32 w-full rounded-t-lg" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <Skeleton className="h-28 w-28 rounded-full border-4 border-card" />
                    </div>
                </CardHeader>
                <CardContent className="pt-20 text-center">
                    <Skeleton className="h-7 w-1/2 mx-auto mb-2" />
                    <Skeleton className="h-5 w-1/3 mx-auto mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                             <div key={i} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                                <Skeleton className="h-6 w-6 rounded-sm mt-1" />
                                <div className="w-full"><Skeleton className="h-4 w-1/4 mb-1.5" /><Skeleton className="h-5 w-3/4" /></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!isAdmin && !isRoleLoading) {
    return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <Card className="shadow-xl text-center">
                <CardHeader>
                    <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You do not have permission to view this page.</p>
                    <Button asChild className="mt-6">
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  if (error && !isLoading) {
     return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <Card className="shadow-xl text-center">
                <CardHeader>
                     <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
                    <CardTitle className="text-2xl">Error Loading Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{error}</p>
                     <Button onClick={() => router.back()} className="mt-6 mr-2">Go Back</Button>
                    <Button asChild variant="outline" className="mt-6">
                        <Link href="/employees">View Employee List</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!employee && !isLoading) {
    return (
        <div className="max-w-xl mx-auto py-12 px-4">
            <Card className="shadow-xl text-center">
                <CardHeader>
                    <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="text-2xl">Employee Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The employee with ID "{employeeId}" could not be found.</p>
                    <Button asChild className="mt-6">
                        <Link href="/employees">View Employee List</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Button variant="outline" size="sm" onClick={() => router.push('/employees')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Employee List
      </Button>
      <Card className="shadow-xl border-transparent bg-card/90 backdrop-blur-md overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/70 to-accent/70" />
        <CardHeader className="text-center -mt-20">
            <div className="flex justify-center mb-3">
                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
                    <AvatarImage src={employee?.avatarUrl} alt={employee?.name} data-ai-hint="employee avatar" />
                    <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                        {getInitials(employee?.name)}
                    </AvatarFallback>
                </Avatar>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
                {isLoading ? <Skeleton className="h-8 w-3/5 mx-auto" /> : employee?.name || 'N/A'}
            </CardTitle>
            {isLoading ? (
                <Skeleton className="h-6 w-2/5 mx-auto mt-0.5" />
            ) : (
                <CardDescription className="text-lg text-muted-foreground mt-0.5">
                    {employee?.jobTitle || 'N/A'}
                </CardDescription>
            )}
            {isLoading ? (
                <Skeleton className="h-5 w-1/4 mx-auto mt-1.5" />
            ) : (
                employee?.status && (
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="mt-2 text-xs">
                       {employee.status === 'Active' ? <CheckCircle className="mr-1.5 h-3 w-3" /> : <XCircle className="mr-1.5 h-3 w-3" />}
                       {employee.status}
                    </Badge>
                )
            )}
        </CardHeader>
        <CardContent className="px-6 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <InfoItem icon={<User />} label="Employee ID" value={employee?.id || 'N/A'} isLoading={isLoading} />
                <InfoItem icon={<Mail />} label="Email Address" value={employee?.email || 'N/A'} isLoading={isLoading} />
                <InfoItem icon={<Briefcase />} label="Department" value={employee?.department || 'N/A'} isLoading={isLoading} />
                <InfoItem 
                    icon={<Building2 />} 
                    label="Office" 
                    value={employee?.officeName || 'N/A'} 
                    isLoading={isLoading} 
                />
                <InfoItem icon={<CalendarDays />} label="Hire Date" value={formatDate(employee?.hireDate)} isLoading={isLoading} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
