
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockActivityLogs, mockEmployees, mockOffices, mockAttendanceSummary, type Employee, type Office, type Task, type ActivityLog } from "@/lib/data";
import { Users, MapPin, ListChecks, Building2, CheckCircle, Clock, Briefcase, Home, UserPlus } from "lucide-react";
import Link from "next/link";
import { fetchTasksForEmployee, updateTaskStatus } from '@/services/task-service';
import { fetchUnhiredUsers } from '@/services/user-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import MapComponent, { type MapMarkerData } from '@/components/map-component';

interface ProcessedActivityLog extends ActivityLog {
  displayTime: string;
}

interface ProcessedTask extends Task {
  displayDueDate?: string;
  isOverdue?: boolean;
}

const GOMEL_COORDS = { lat: 52.4345, lng: 30.9754 };
const DEFAULT_CITY_ZOOM_DASHBOARD = 11;

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [assignedOffice, setAssignedOffice] = useState<Office | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(true);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true); // For admin specific data like unhired count

  const { toast } = useToast();

  const [processedActivityLogs, setProcessedActivityLogs] = useState<ProcessedActivityLog[]>([]);
  const [processedEmployeeTasks, setProcessedEmployeeTasks] = useState<ProcessedTask[]>([]);
  const [isClient, setIsClient] = useState(false);

  const [hqMapMarkers, setHqMapMarkers] = useState<MapMarkerData[]>([]);
  const [hqMapCenter, setHqMapCenter] = useState<{ lat: number; lng: number }>(GOMEL_COORDS);
  const [hqMapZoom, setHqMapZoom] = useState(DEFAULT_CITY_ZOOM_DASHBOARD);

  const [unhiredUserCount, setUnhiredUserCount] = useState<number | null>(null);
  const [isUnhiredCountLoading, setIsUnhiredCountLoading] = useState(true);

  useEffect(() => {
    setIsClient(true); 
    const roleFromStorage = localStorage.getItem('userRole');
    const emailFromStorage = localStorage.getItem('userEmail');
    
    setUserRole(roleFromStorage);

    if (roleFromStorage && !roleFromStorage.toLowerCase().includes('admin')) {
      const employeeDetails = mockEmployees.find(emp => emp.email === emailFromStorage);
      setCurrentEmployee(employeeDetails || null);
    }
    setIsRoleLoading(false);
  }, []);

  useEffect(() => {
    if (isClient && !isRoleLoading) {
      const isAdmin = userRole && userRole.toLowerCase().includes('admin');

      if (isAdmin) {
        setIsLoadingAdminData(true);
        const headquarters = mockOffices.find(office => office.name.toLowerCase() === 'headquarters');
        if (headquarters) {
          setHqMapMarkers([{
            id: headquarters.id,
            latitude: headquarters.latitude,
            longitude: headquarters.longitude,
            title: headquarters.name,
            description: headquarters.address,
            icon: <Building2 className="text-primary h-6 w-6" />
          }]);
          setHqMapCenter({ lat: headquarters.latitude, lng: headquarters.longitude });
          setHqMapZoom(12);
        } else {
          setHqMapMarkers([]);
          setHqMapCenter(GOMEL_COORDS); 
          setHqMapZoom(DEFAULT_CITY_ZOOM_DASHBOARD); 
        }

        setIsUnhiredCountLoading(true);
        fetchUnhiredUsers()
          .then(data => {
            setUnhiredUserCount(data ? data.length : 0);
          })
          .catch(err => {
            console.error("Failed to fetch unhired users for dashboard:", err);
            toast({ variant: "destructive", title: "Error Loading Applicants", description: "Could not load applicants count."});
            setUnhiredUserCount(null);
          })
          .finally(() => {
            setIsUnhiredCountLoading(false);
            setIsLoadingAdminData(false); // Assuming this is the last piece of admin data
          });
        
        const processedLogs = mockActivityLogs.slice(0, 5).map(log => ({
          ...log,
          displayTime: log.startTime ? new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
        }));
        setProcessedActivityLogs(processedLogs);

      } else { // Employee view
        setIsLoadingEmployeeData(true);
        if (currentEmployee) {
          if (currentEmployee.officeId) {
            setAssignedOffice(mockOffices.find(office => office.id === currentEmployee.officeId) || null);
          }
          fetchTasksForEmployee(currentEmployee.id)
            .then(tasks => {
              setEmployeeTasks(tasks); 
              const processed = tasks.map(task => ({
                ...task,
                displayDueDate: formatDate(task.dueDate),
                isOverdue: task.dueDate ? new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && !task.isCompleted : false,
              }));
              setProcessedEmployeeTasks(processed);
            })
            .catch(err => {
              console.error("Failed to fetch tasks:", err);
              toast({ variant: "destructive", title: "Error Loading Tasks", description: "Could not load tasks."});
            })
            .finally(() => setIsLoadingEmployeeData(false));
        } else {
          setIsLoadingEmployeeData(false); 
        }
      }
    }
  }, [isClient, isRoleLoading, userRole, currentEmployee, toast]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };
  
  const handleTaskStatusChange = async (taskId: string, isCompleted: boolean) => {
    const originalTasks = [...employeeTasks];
    const originalProcessedTasks = [...processedEmployeeTasks];

    setEmployeeTasks(prevTasks => 
      prevTasks.map(task => task.id === taskId ? { ...task, isCompleted } : task)
    );
    setProcessedEmployeeTasks(prevTasks =>
      prevTasks.map(task => task.id === taskId ? { ...task, isCompleted, isOverdue: task.dueDate ? new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && !isCompleted : false } : task)
    );

    try {
      await updateTaskStatus(taskId, isCompleted);
      toast({ title: "Task Updated", description: `Task has been marked as ${isCompleted ? 'completed' : 'incomplete'}.`});
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not update task."});
      setEmployeeTasks(originalTasks); 
      setProcessedEmployeeTasks(originalProcessedTasks);
    }
  };
  
  if (!isClient || isRoleLoading) { 
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <Skeleton className="h-8 w-2/5 mb-6" /> 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const isAdminView = userRole && userRole.toLowerCase().includes('admin');

  if (!isAdminView) { // Employee Dashboard View
    if (isLoadingEmployeeData) {
      return (
        <div className="space-y-6 p-2 sm:p-4 animate-pulse">
          <h1 className="text-2xl font-semibold text-foreground mb-4"><Skeleton className="h-8 w-3/5" /></h1>
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent><Skeleton className="h-5 w-3/4" /></CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6 p-2 sm:p-4">
        <h1 className="text-2xl font-semibold text-foreground">My Dashboard</h1>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-5 w-5 text-primary" /> My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedEmployeeTasks.length > 0 ? (
              <ul className="space-y-3">
                {processedEmployeeTasks.map(task => (
                  <li key={task.id} className="flex items-start justify-between p-3 bg-background/70 rounded-md shadow-sm hover:bg-muted/60 transition-colors">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.isCompleted}
                        onCheckedChange={(checked) => handleTaskStatusChange(task.id, !!checked)}
                        className="mt-1 flex-shrink-0"
                        aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
                      />
                      <div className="flex-grow">
                        <label htmlFor={`task-${task.id}`} className={`font-medium text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </label>
                        {task.description && <p className={`text-xs ${task.isCompleted ? 'line-through text-muted-foreground/80' : 'text-muted-foreground'}`}>{task.description}</p>}
                      </div>
                    </div>
                    {task.displayDueDate && (
                      <Badge variant={task.isOverdue ? "destructive" : "outline"} className="text-xs whitespace-nowrap ml-2">
                        {task.displayDueDate}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks assigned at the moment.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-primary" /> My Workplace
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedOffice ? (
              <>
                <p className="text-md font-semibold">{assignedOffice.name}</p>
                <p className="text-sm text-muted-foreground">{assignedOffice.address}</p>
              </>
            ) : currentEmployee ? (
              <p className="text-sm text-muted-foreground">No primary office assigned. Contact your administrator.</p>
            ) : (
               <p className="text-sm text-muted-foreground">Employee information not available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin dashboard view
  const adminSummaryData = [
    { title: "Total Employees", value: mockEmployees.length, icon: Users, href: "/employees" },
    { title: "Active Today", value: mockAttendanceSummary.activeToday, icon: CheckCircle, href: "/activity" },
    { title: "Total Offices", value: mockOffices.length, icon: Building2, href: "/offices" },
    { 
      title: "Applicants", 
      value: isUnhiredCountLoading ? <Skeleton className="h-6 w-10 inline-block" /> : (unhiredUserCount !== null ? unhiredUserCount : "N/A"), 
      icon: UserPlus, 
      href: "/applicants" 
    },
  ];


  return (
    <div className="space-y-6">
      {isLoadingAdminData && isAdminView && ( // Show skeleton for entire admin summary section if admin data is loading
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: adminSummaryData.length}).map((_, i) => <Skeleton key={`admin-summary-skel-${i}`} className="h-28 w-full" />)}
        </div>
      )}
      {!isLoadingAdminData && isAdminView && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {adminSummaryData.map((item) => (
            <Link href={item.href} key={item.title} legacyBehavior>
              <a className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
                <Card className="bg-card text-card-foreground hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <p className="text-xs text-muted-foreground pt-1">View Details</p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAdminData && isAdminView && processedActivityLogs.length === 0 && (
                 Array.from({ length: 3 }).map((_, index) => (
                    <div key={`skeleton-log-${index}`} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 animate-pulse">
                        <div>
                            <Skeleton className="h-5 w-24 mb-1" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))
            )}
            {!isLoadingAdminData && isAdminView && processedActivityLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity to display.</p>
            )}
            {processedActivityLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{log.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{log.activityType} at {log.location}</p>
                </div>
                <p className="text-xs text-muted-foreground">{log.displayTime}</p>
              </div>
            ))}
            {!isLoadingAdminData && processedActivityLogs.length > 0 && (
              <Link href="/activity" className="text-sm text-primary hover:underline mt-4 block text-center">
                View All Activity Logs
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Quick Map Overview (HQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-0 rounded-b-lg overflow-hidden">
             {isLoadingAdminData && isAdminView && (
                <Skeleton className="h-full w-full" />
             )}
             {!isLoadingAdminData && isAdminView && (
                <MapComponent 
                    markers={hqMapMarkers}
                    center={hqMapCenter}
                    zoom={hqMapZoom}
                />
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

