
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Employee } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, AlertTriangle, UserCog, Info, Eye, Briefcase, CheckCircle, XCircle, Coffee, Plane, Laptop, UserRoundCheck, UserRoundX, Clock, CircleOff, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEmployees, updateEmployeeActivityStatus as apiUpdateEmployeeActivityStatus } from '@/services/employee-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Corresponds to RealTimeEmployee.DataAccess.Enums.ActivityStatus
const activityStatusOptions = [
  { value: "Online", label: "Online", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: "Available", label: "Available", icon: <UserRoundCheck className="h-4 w-4 text-green-500" /> },
  { value: "Offline", label: "Offline", icon: <XCircle className="h-4 w-4 text-red-500" /> },
  { value: "Busy", label: "Busy", icon: <Briefcase className="h-4 w-4 text-orange-500" /> },
  { value: "Away", label: "Away", icon: <Plane className="h-4 w-4 text-yellow-500" /> },
  { value: "OnBreak", label: "On Break", icon: <Coffee className="h-4 w-4 text-purple-500" /> },
  { value: "OnTask", label: "On Task", icon: <Laptop className="h-4 w-4 text-blue-500" /> },
  { value: "InMeeting", label: "In Meeting", icon: <Users className="h-4 w-4 text-indigo-500" /> },
  { value: "DoNotDisturb", label: "Do Not Disturb", icon: <UserRoundX className="h-4 w-4 text-pink-500" /> },
  { value: "OnLeave", label: "On Leave", icon: <Clock className="h-4 w-4 text-gray-500" /> },
  // Add other statuses as needed
];

const getActivityStatusDisplay = (statusValue?: string) => {
    const option = activityStatusOptions.find(opt => opt.value === statusValue);
    return option ? (
        <div className="flex items-center gap-1.5">
            {React.cloneElement(option.icon, { className: `h-3 w-3 ${option.icon.props.className}` })}
            <span className="text-xs">{option.label}</span>
        </div>
    ) : (
        <div className="flex items-center gap-1.5">
            <CircleOff className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs">{statusValue || 'N/A'}</span>
        </div>
    );
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    setCurrentUserRole(role);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!isClient || currentUserRole === null) {
        setIsLoading(true);
        return;
      }

      const isAdmin = currentUserRole.toLowerCase().includes('admin');

      if (!isAdmin) {
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError(null);
      try {
        console.log("Attempting to fetch employees from service...");
        const data = await fetchEmployees();
        console.log("Employees fetched:", data);
        setEmployees(data);
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
          });
          await signOut();
          router.push('/');
        } else {
          console.error("Failed to fetch employees:", err);
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching employees.';
          setFetchError(errorMessage);
          toast({
            variant: "destructive",
            title: "Failed to load employees",
            description: errorMessage,
          });
          setEmployees([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isClient, currentUserRole, toast, router]);


  const handleActivityStatusChange = async (employeeId: string, newActivityStatus: string) => {
    if (!currentUserRole?.toLowerCase().includes('admin')) {
        toast({ variant: "destructive", title: "Permission Denied", description: "You are not authorized to change employee status."});
        return;
    }

    const originalEmployees = [...employees];
    setEmployees(prevEmployees =>
      prevEmployees.map(emp =>
        emp.id === employeeId ? { ...emp, currentStatus: newActivityStatus } : emp
      )
    );

    try {
      await apiUpdateEmployeeActivityStatus(employeeId, newActivityStatus);
      toast({
        title: "Activity Status Updated",
        description: `Employee activity status has been changed to ${newActivityStatus}.`,
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      setEmployees(originalEmployees); // Revert optimistic update on error
      const errorMessage = error instanceof Error ? error.message : 'Could not update activity status.';
      toast({
        variant: "destructive",
        title: "Update Error",
        description: `Could not update employee activity status. ${errorMessage}`,
      });
      console.error(`Failed to update employee ${employeeId} activity status to ${newActivityStatus}:`, error);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(employee =>
        (employee.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.currentStatus?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const isAdminAccess = isClient && currentUserRole !== null && currentUserRole.toLowerCase().includes('admin');
  const isAccessDetermined = isClient && currentUserRole !== null;

  return (
    <TooltipProvider>
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Employee Directory</CardTitle>
        {isAdminAccess && (
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees (ID, name, email...)"
                className="pl-8 w-full sm:w-[200px] md:w-[250px] lg:w-[300px] bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading || !!fetchError}
              />
            </div>
            <Button asChild variant="default" disabled={isLoading || !!fetchError} className="w-full sm:w-auto">
              <Link href="/employees/add">
                <UserPlus className="mr-2 h-4 w-4" /> Add Employee
              </Link>
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!isAccessDetermined && isLoading && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableHead>
                  <TableHead className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-emp-initial-${index}`}>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-8 w-24 mx-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {isAccessDetermined && !isAdminAccess && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UserCog className="h-16 w-16 mb-6 text-destructive" />
            <p className="text-2xl font-semibold text-foreground mb-2">Access Denied</p>
            <p className="text-md">You do not have permission to view this page.</p>
            <p className="text-sm mt-1">This section is for administrators only.</p>
          </div>
        )}

        {isAdminAccess && (
          <>
            {fetchError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-xl font-semibold">Failed to load employees</p>
                <p className="text-sm">{fetchError}</p>
                <p className="text-xs mt-2">Please ensure the API server is running and accessible at the configured URL.</p>
              </div>
            )}
            {!fetchError && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead className="text-center">Activity Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-emp-admin-${index}`}>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <Skeleton className="h-5 w-32" />
                            </div>
                          </TableCell>
                          <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-8 w-[160px] mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center">
                                        <span className="truncate font-mono text-xs w-[100px]">{employee.id || 'N/A'}</span>
                                        <Info className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="start">
                                    <p>{employee.id || 'N/A'}</p>
                                </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Link href={`/employees/${employee.id}`} className="flex items-center gap-3 group hover:underline">
                              <Avatar>
                                <AvatarImage src={employee.avatarUrl || `https://placehold.co/40x40.png?text=${employee.name?.substring(0,2)}`} alt={employee.name || ''} data-ai-hint="person portrait" />
                                <AvatarFallback>{employee.name?.substring(0, 2).toUpperCase() || 'N/A'}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium group-hover:text-primary">{employee.name || 'N/A'}</span>
                            </Link>
                          </TableCell>
                          <TableCell>{employee.email || 'N/A'}</TableCell>
                          <TableCell>{employee.department || 'N/A'}</TableCell>
                          <TableCell>{employee.jobTitle || 'N/A'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={employee.currentStatus === "Online" || employee.currentStatus === "Available" ? "default" : employee.currentStatus === "Offline" ? "secondary" : "outline"} className="min-w-[90px] justify-center">
                                {getActivityStatusDisplay(employee.currentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center space-x-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <Link href={`/employees/${employee.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View Profile</p></TooltipContent>
                            </Tooltip>
                            <Select
                              value={employee.currentStatus || ""}
                              onValueChange={(value: string) => handleActivityStatusChange(employee.id, value)}
                              disabled={!employee.id}
                            >
                              <SelectTrigger className="w-auto max-w-[130px] h-8 text-xs inline-flex">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                {activityStatusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex items-center gap-2">
                                            {React.cloneElement(opt.icon, {className: "h-4 w-4"})}
                                            {opt.label}
                                        </div>
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {!isLoading && !fetchError && filteredEmployees.length === 0 && isAdminAccess && (
                <p className="text-center text-muted-foreground py-8">No employees found matching your search criteria.</p>
            )}
             {!isLoading && !fetchError && employees.length === 0 && isAdminAccess && searchTerm === '' && (
                <p className="text-center text-muted-foreground py-8">No employees found in the system.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
