
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { ActivityLog } from '@/lib/data'; // Keep type definition
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { ListFilter, Search, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = 'https://localhost:7294';

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};

async function fetchActivityLogsFromAPI(): Promise<ActivityLog[]> {
  const response = await fetch(`${API_BASE_URL}/api/activity-logs`);
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to fetch activity logs: ${response.status} ${errorData}`);
  }
  return response.json();
}

export default function ActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await fetchActivityLogsFromAPI();
        setActivityLogs(data);
      } catch (err) {
        if (err instanceof Error) {
          setFetchError(err.message);
        } else {
          setFetchError('An unknown error occurred');
        }
        setActivityLogs([]); // Clear logs on error
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const uniqueActivities = useMemo(() => {
    if (isLoading || fetchError) return ['all']; // Default while loading or on error
    const activities = new Set(activityLogs.map(log => log.activity).filter(Boolean));
    return ['all', ...Array.from(activities)];
  }, [activityLogs, isLoading, fetchError]);
  
  const filteredLogs = useMemo(() => {
    return activityLogs
    .filter(log =>
      (log.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.activity?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.location?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .filter(log => activityFilter === 'all' || log.activity === activityFilter)
    .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
  }, [activityLogs, searchTerm, activityFilter]);


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle>Employee Activity Logs</CardTitle>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              className="pl-8 w-full md:w-[200px] lg:w-[250px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading || !!fetchError}
            />
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter} disabled={isLoading || !!fetchError || uniqueActivities.length <= 1}>
            <SelectTrigger className="w-full md:w-[180px]">
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
        {fetchError && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold">Failed to load activity logs</p>
            <p className="text-sm">{fetchError}</p>
            <p className="text-xs mt-2">Ensure the API server at {API_BASE_URL} is running and accessible.</p>
          </div>
        )}
        {!fetchError && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.employeeName || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={log.activity?.toLowerCase().includes('checked in') ? 'default' : log.activity?.toLowerCase().includes('checked out') ? 'secondary' : 'outline'}>
                          {log.activity || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.location || 'N/A'}</TableCell>
                      <TableCell>{formatDate(log.checkInTime)}</TableCell>
                      <TableCell>{formatDate(log.checkOutTime)}</TableCell>
                      <TableCell>{log.date ? format(new Date(log.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && !fetchError && filteredLogs.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No activity logs found for the current filters.</p>
        )}
      </CardContent>
    </Card>
  );
}
