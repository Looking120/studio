
"use client";

import React, { useState } from 'react';
import { mockActivityLogs, ActivityLog } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from 'date-fns';
import { ListFilter, Search } from 'lucide-react';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM d, yyyy, h:mm a');
  } catch (error) {
    return 'Invalid Date';
  }
};

export default function ActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(mockActivityLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');

  const filteredLogs = activityLogs
    .filter(log => 
      log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(log => activityFilter === 'all' || log.activity === activityFilter)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by most recent

  const uniqueActivities = ['all', ...new Set(mockActivityLogs.map(log => log.activity))];

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
            />
          </div>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
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
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.employeeName}</TableCell>
                  <TableCell>
                    <Badge variant={log.activity.toLowerCase().includes('in') ? 'default' : 'secondary'}>
                      {log.activity}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.location || 'N/A'}</TableCell>
                  <TableCell>{formatDate(log.checkInTime)}</TableCell>
                  <TableCell>{formatDate(log.checkOutTime)}</TableCell>
                  <TableCell>{format(parseISO(log.date), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
         {filteredLogs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No activity logs found for the current filters.</p>
        )}
      </CardContent>
    </Card>
  );
}
