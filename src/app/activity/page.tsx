
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityLog } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ListFilter, Search, AlertTriangle, UserX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchActivityLogsByEmployee } from '@/services/activity-service';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const { toast } = useToast();
  const router = useRouter();
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    const userIdFromStorage = localStorage.getItem('userId');
    if (userIdFromStorage) {
      setCurrentEmployeeId(userIdFromStorage);
    } else {
      console.warn("ActivityLogsPage: No userId found in localStorage. User might not be logged in or ID not stored.");
      // Potentially set an error or a message to the user.
      // For now, it will prevent fetching data if no ID.
      setIsLoading(false);
      setFetchError("Could not determine the user to fetch logs for. Please ensure you are logged in.");
    }
  }, []);

  useEffect(() => {
    if (!currentEmployeeId) {
      setIsLoading(false); // Stop loading if no employee ID
      if (!fetchError) { // Avoid overwriting specific "no userId" error
          setFetchError("No employee selected to fetch logs for.");
      }
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        console.log(`ActivityLogsPage: Fetching logs for employeeId: ${currentEmployeeId}`);
        const data = await fetchActivityLogsByEmployee(currentEmployeeId);
        setActivityLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        let errorMessage = 'An unknown error occurred while fetching activity logs.';
        if (err instanceof UnauthorizedError) {
          toast({
            variant: "destructive",
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
          });
          await signOut();
          router.push('/');
          return; 
        } else if (err instanceof HttpError) {
          errorMessage = err.message;
          if (err.status === 400) {
            errorMessage = "Failed to load activity logs. There was an issue with the request (e.g., invalid employee ID format or no logs for this ID). Details: " + err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        console.error("Failed to fetch activity logs:", err);
        setFetchError(errorMessage);
        toast({
          variant: "destructive",
          title: "Failed to load activity logs",
          description: errorMessage,
        });
        setActivityLogs([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentEmployeeId, toast, router]);

  const uniqueActivities = useMemo(() => {
    if (isLoading || fetchError || !activityLogs || activityLogs.length === 0) return ['all'];
    const activities = new Set(activityLogs.map(log => log.activityType).filter(Boolean));
    return ['all', ...Array.from(activities)];
  }, [activityLogs, isLoading, fetchError]);

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
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-full md:w-[200px] lg:w-[250px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || !!fetchError || !currentEmployeeId}
            />
          </div>
          <Select
            value={activityFilter}
            onValueChange={setActivityFilter}
            disabled={isLoading || !!fetchError || uniqueActivities.length <= 1 || !currentEmployeeId}
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
            {currentEmployeeId ? <AlertTriangle className="h-12 w-12 mb-4" /> : <UserX className="h-12 w-12 mb-4" />}
            <p className="text-xl font-semibold">Failed to load activity logs</p>
            <p className="text-sm">{fetchError}</p>
            {currentEmployeeId && <p className="text-xs mt-2">Ensure the API server at the configured base URL (e.g., https://localhost:7294) is running and accessible, and that the selected employee has logs.</p>}
            {!currentEmployeeId && <p className="text-xs mt-2">Could not determine user. Please log in again. If the issue persists, contact support.</p>}
          </div>
        )}
        {!fetchError && currentEmployeeId && (
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
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.employeeName || 'N/A'}</TableCell><TableCell><Badge variant={ log.activityType?.toLowerCase().includes('checked in') ? 'default' : log.activityType?.toLowerCase().includes('checked out') ? 'secondary' : log.activityType?.toLowerCase().includes('break') ? 'outline' : 'outline' }>{log.activityType || 'N/A'}</Badge></TableCell><TableCell>{log.description || 'N/A'}</TableCell><TableCell>{log.location || 'N/A'}</TableCell><TableCell>{formatDate(log.startTime)}</TableCell><TableCell>{formatDate(log.endTime)}</TableCell></TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && !fetchError && currentEmployeeId && filteredLogs.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No activity logs found for the current employee and filters.</p>
        )}
         {!isLoading && !currentEmployeeId && !fetchError && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">No User Selected</p>
            <p className="text-sm">Cannot fetch activity logs without a user context.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

