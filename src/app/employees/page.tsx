
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Employee } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEmployees, updateEmployeeStatus as apiUpdateEmployeeStatus } from '@/services/employee-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const loadEmployees = async () => {
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
    loadEmployees();
  }, [toast, router]);


  const handleStatusChange = async (employeeId: string, newStatus: 'Active' | 'Inactive') => {
    const originalEmployees = [...employees];
    setEmployees(prevEmployees =>
      prevEmployees.map(emp =>
        emp.id === employeeId ? { ...emp, status: newStatus } : emp
      )
    );

    try {
      await apiUpdateEmployeeStatus(employeeId, newStatus);
      toast({
        title: "Status Updated",
        description: `Employee status has been changed to ${newStatus}.`,
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
        await signOut();
        router.push('/');
        return;
      }
      setEmployees(originalEmployees); 
      const errorMessage = error instanceof Error ? error.message : 'Could not update status.';
      toast({
        variant: "destructive",
        title: "Update Error",
        description: `Could not update employee status. ${errorMessage}`,
      });
      console.error(`Failed to update employee ${employeeId} status to ${newStatus}:`, error);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter(employee =>
        (employee.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (employee.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Employee Directory</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || !!fetchError}
            />
          </div>
          <Button asChild variant="default" disabled={isLoading || !!fetchError}>
            <Link href="/employees/add">
              <UserPlus className="mr-2 h-4 w-4" /> Add Employee
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-emp-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-[120px] mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={employee.avatarUrl || `https://placehold.co/40x40.png?text=${employee.name?.substring(0,2)}`} alt={employee.name || ''} data-ai-hint="person portrait" />
                            <AvatarFallback>{employee.name?.substring(0, 2).toUpperCase() || 'N/A'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{employee.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{employee.email || 'N/A'}</TableCell>
                      <TableCell>{employee.department || 'N/A'}</TableCell>
                      <TableCell>{employee.jobTitle || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                          {employee.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={employee.status}
                          onValueChange={(value: 'Active' | 'Inactive') => handleStatusChange(employee.id, value)}
                          disabled={!employee.id}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
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
        {!isLoading && !fetchError && filteredEmployees.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No employees found.</p>
        )}
      </CardContent>
    </Card>
  );
}
