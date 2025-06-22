
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityLog } from '@/lib/data';
import type { Employee } from '@/services/employee-service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ListFilter, Search, AlertTriangle, UserX, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchActivityLogsByEmployee } from '@/services/activity-service';
import { fetchEmployees } from '@/services/employee-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { UnauthorizedError, HttpError } from '@/services/api-client';
import { signOut } from '@/services/auth-service';

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const potentiallyValidDate = new Date(year, month, day);
        if (!isNaN(potentiallyValidDate.getTime())) {
          return format(potentiallyValidDate, 'MMM d, yyyy, h:mm a');
        }
      }
      console.warn("Invalid Date encountered in formatDate:", dateString);
      return 'Invalid Date';
    }
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};


export default function ActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const { toast } = useToast();
  const router = useRouter();
  
  // This effect runs ONCE on mount to determine user type and set up the page.
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    const isAdmin = email === 'joshuandayiadm@gmail.com' || (role?.toLowerCase().includes('admin') ?? false);
    
    setIsUserAdmin(isAdmin);

    if (isAdmin) {
      setIsLoading(true); // Start loading state for fetching employees
      fetchEmployees()
        .then(employees => {
          setAllEmployees(employees);
          if (employees.length > 0) {
            // This will trigger the second useEffect to fetch logs
            setSelectedEmployeeId(employees[0].id);
          } else {
            // No employees, so nothing to load
            setIsLoading(false);
          }
        })
        .catch(err => {
           const errorMessage = err instanceof Error ? err.message : "Could not load employee list.";
           setFetchError(errorMessage);
           toast({ variant: "destructive", title: "Error", description: errorMessage });
           setIsLoading(false);
        });
    } else {
      // This is the logic path for a regular user
      const userId = localStorage.getItem('userId');
      if (userId) {
        // This will trigger the second useEffect to fetch logs
        setSelectedEmployeeId(userId);
      } else {
        setFetchError("Could not determine your user ID. Please log in again.");
        setIsLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // This effect reacts to changes in selectedEmployeeId and fetches the logs.
  useEffect(() => {
    if (!selectedEmployeeId) {
      // If we are not an admin, and have no ID yet, we are not done loading.
      // If we are an admin and have no employees, then we are done.
      if (isUserAdmin && allEmployees.length === 0) {
         setIsLoading(false);
      }
      return;
    }

    const loadLogData = async () => {
      setIsLoading(true); // Start loading logs
      setFetchError(null);
      setActivityLogs([]); // Clear old logs
      try {
        const data = await fetchActivityLogsByEmployee(selectedEmployeeId);
        setActivityLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        let errorMessage = 'An unknown error occurred while fetching activity logs.';
        if (err instanceof UnauthorizedError) {
          toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
          signOut().finally(() => router.push('/'));
          return;
        } else if (err instanceof Error) { // Catches HttpError as well since it extends Error
          errorMessage = err.message;
        }
        
        console.error("Failed to fetch activity logs:", err);
        setFetchError(errorMessage);
        toast({ variant: "destructive", title: "Failed to load activity logs", description: errorMessage });
        setActivityLogs([]);
      } finally {
        setIsLoading(false); // Finish loading logs
      }
    };
    loadLogData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId]); // This effect ONLY depends on the ID to fetch.

  const uniqueActivities = useMemo(() => {
    if (!activityLogs || activityLogs.length === 0) return ['all'];
    const activities = new Set(activityLogs.map(log => log.activityType).filter(Boolean));
    return ['all', ...Array.from(activities)];
  }, [activityLogs]);

  const filteredLogs = useMemo(() => {
    if (!activityLogs) return [];
    return activityLogs
    .filter(log =>
      (log.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.activityType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .filter(log => activityFilter === 'all' || log.activityType === activityFilter)
    .sort((a, b) => {
        const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return dateB - dateA;
    });
  }, [activityLogs, searchTerm, activityFilter]);


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Employee Activity Logs</CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {isUserAdmin && (
             <Select value={selectedEmployeeId || ''} onValueChange={setSelectedEmployeeId} disabled={isLoading && allEmployees.length === 0}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select an employee to view logs" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(isLoading && allEmployees.length === 0) ? (
                    <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                  ) : allEmployees.length > 0 ? (
                     allEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name || emp.email}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="none" disabled>No employees found</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-full md:w-[200px] lg:w-[250px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || !!fetchError || (!isUserAdmin && !activityLogs.length) || (isUserAdmin && !selectedEmployeeId) }
            />
          </div>
          <Select
            value={activityFilter}
            onValueChange={setActivityFilter}
            disabled={isLoading || !!fetchError || uniqueActivities.length <= 1 || (!isUserAdmin && !activityLogs.length) || (isUserAdmin && !selectedEmployeeId)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <ListFilter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {uniqueActivities.map(activity => (
                  <SelectItem key={activity} value={activity}>
                    {activity === 'all' ? 'All Activities' : activity}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {fetchError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            {isUserAdmin && selectedEmployeeId ? <AlertTriangle className="h-12 w-12 mb-4" /> : <UserX className="h-12 w-12 mb-4" />}
            <p className="text-xl font-semibold">Failed to load activity logs</p>
            <p className="text-sm">{fetchError}</p>
            {isUserAdmin && selectedEmployeeId && <p className="text-xs mt-2">Ensure the API server at the configured base URL is running and accessible, and that the selected employee has logs.</p>}
          </div>
        )}
        
        {isUserAdmin && !selectedEmployeeId && !isLoading && !fetchError && (
             <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <UserX className="h-12 w-12 mb-4" />
                <p className="text-xl font-semibold">No Employee Selected</p>
                <p className="text-sm">Please select an employee from the dropdown to view their logs.</p>
            </div>
        )}

        {(isUserAdmin ? !!selectedEmployeeId : true) && !fetchError && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.employeeName || 'N/A'}</TableCell><TableCell><Badge variant={ log.activityType?.toLowerCase().includes('checkin') ? 'default' : log.activityType?.toLowerCase().includes('checkout') ? 'secondary' : log.activityType?.toLowerCase().includes('break') ? 'outline' : 'outline' }>{log.activityType || 'N/A'}</Badge></TableCell><TableCell>{log.description || 'N/A'}</TableCell><TableCell>{log.location || 'N/A'}</TableCell><TableCell>{formatDate(log.startTime)}</TableCell><TableCell>{formatDate(log.endTime)}</TableCell></TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No activity logs found for the selected employee and filters.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
