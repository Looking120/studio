
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockActivityLogs, mockEmployees, mockOffices, mockAttendanceSummary, type Employee, type Office, type Task, type ActivityLog } from "@/lib/data";
import { Users, MapPin, ListChecks, Building2, CheckCircle, Clock, Briefcase, Home } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTasksForEmployee, updateTaskStatus } from '@/services/task-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Define interfaces for processed data to avoid hydration issues
interface ProcessedActivityLog extends ActivityLog {
  displayTime: string;
}

interface ProcessedTask extends Task {
  displayDueDate?: string;
  isOverdue?: boolean;
}

export default function DashboardPage() {
  const summaryData = [
    { title: "Total Employees", value: mockEmployees.length, icon: Users, href: "/employees" },
    { title: "Active Today", value: mockAttendanceSummary.activeToday, icon: CheckCircle, href: "/activity" },
    { title: "Total Offices", value: mockOffices.length, icon: Building2, href: "/offices" },
    { title: "Avg. Work Hours", value: `${mockAttendanceSummary.avgWorkHours}h`, icon: Clock, href: "/attendance" },
  ];

  const isMobile = useIsMobile();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [assignedOffice, setAssignedOffice] = useState<Office | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[]>([]);
  const [isLoadingEmployeeData, setIsLoadingEmployeeData] = useState(true);
  const { toast } = useToast();

  // State for client-side processed data
  const [processedActivityLogs, setProcessedActivityLogs] = useState<ProcessedActivityLog[]>([]);
  const [processedEmployeeTasks, setProcessedEmployeeTasks] = useState<ProcessedTask[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicate component has mounted on client
  }, []);

  // Effect for processing recent activity logs (for admin dashboard)
  useEffect(() => {
    if (isClient) {
      const processed = mockActivityLogs.slice(0, 5).map(log => ({
        ...log,
        displayTime: log.startTime ? new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      }));
      setProcessedActivityLogs(processed);
    }
  }, [isClient]); // Depends on isClient to ensure it runs client-side

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // This function is now only called within useEffect or event handlers on the client
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };
  
  // Effect for fetching and processing employee-specific data (for mobile employee dashboard)
  useEffect(() => {
    if (isClient) { // Ensure localStorage access is client-side only
      const roleFromStorage = localStorage.getItem('userRole');
      const emailFromStorage = localStorage.getItem('userEmail');
      setUserRole(roleFromStorage);

      if (isMobile && roleFromStorage && !roleFromStorage.toLowerCase().includes('admin')) {
        setIsLoadingEmployeeData(true);
        const employee = mockEmployees.find(emp => emp.email === emailFromStorage);
        setCurrentEmployee(employee || null);

        if (employee) {
          if (employee.officeId) {
            setAssignedOffice(mockOffices.find(office => office.id === employee.officeId) || null);
          }
          fetchTasksForEmployee(employee.id)
            .then(tasks => {
              setEmployeeTasks(tasks); // Original tasks
              // Process tasks for display (client-side)
              const processed = tasks.map(task => ({
                ...task,
                displayDueDate: formatDate(task.dueDate),
                isOverdue: task.dueDate ? new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && !task.isCompleted : false,
              }));
              setProcessedEmployeeTasks(processed);
            })
            .catch(err => {
              console.error("Failed to fetch tasks:", err);
              toast({ variant: "destructive", title: "Erreur Tâches", description: "Impossible de charger les tâches."});
            })
            .finally(() => setIsLoadingEmployeeData(false));
        } else {
          setIsLoadingEmployeeData(false);
        }
      } else {
        setIsLoadingEmployeeData(false); // Not mobile employee or no role/email
      }
    }
  }, [isMobile, toast, isClient]); // Added isClient dependency

  const handleTaskStatusChange = async (taskId: string, isCompleted: boolean) => {
    const originalTasks = [...employeeTasks];
    const originalProcessedTasks = [...processedEmployeeTasks];

    // Optimistic update for UI
    setEmployeeTasks(prevTasks => 
      prevTasks.map(task => task.id === taskId ? { ...task, isCompleted } : task)
    );
    setProcessedEmployeeTasks(prevTasks =>
      prevTasks.map(task => task.id === taskId ? { ...task, isCompleted, isOverdue: task.dueDate ? new Date(task.dueDate).getTime() < new Date().setHours(0,0,0,0) && !isCompleted : false } : task)
    );

    try {
      await updateTaskStatus(taskId, isCompleted);
      toast({ title: "Tâche mise à jour", description: `La tâche a été marquée comme ${isCompleted ? 'complétée' : 'non complétée'}.`});
      // Optionally re-fetch or re-process if backend returns updated task
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la tâche."});
      setEmployeeTasks(originalTasks); // Revert optimistic update
      setProcessedEmployeeTasks(originalProcessedTasks);
    }
  };
  

  if (!isClient) { // Render skeletons or minimal content on server / before client mount
    return (
      <div className="space-y-6 p-4 animate-pulse">
        <Skeleton className="h-24 w-full" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }


  if (isMobile && userRole && !userRole.toLowerCase().includes('admin')) {
    // Employee Mobile Dashboard
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
        <h1 className="text-2xl font-semibold text-foreground">Tableau de Bord Employé</h1>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-5 w-5 text-primary" /> Mes Tâches
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
                        aria-label={`Marquer la tâche ${task.title} comme ${task.isCompleted ? 'non complétée' : 'complétée'}`}
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
              <p className="text-sm text-muted-foreground">Aucune tâche assignée pour le moment.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Home className="h-5 w-5 text-primary" /> Mon Lieu de Travail
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedOffice ? (
              <>
                <p className="text-md font-semibold">{assignedOffice.name}</p>
                <p className="text-sm text-muted-foreground">{assignedOffice.address}</p>
              </>
            ) : currentEmployee ? (
              <p className="text-sm text-muted-foreground">Aucun bureau principal assigné. Contactez votre administrateur.</p>
            ) : (
               <p className="text-sm text-muted-foreground">Informations sur l'employé non disponibles.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Dashboard (Admin or Desktop Employee - though desktop employee should be redirected by AppClientLayout)
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedActivityLogs.length === 0 && !isLoadingEmployeeData && ( // isLoadingEmployeeData is not relevant here
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
            {processedActivityLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{log.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{log.activityType} at {log.location}</p>
                </div>
                <p className="text-xs text-muted-foreground">{log.displayTime}</p>
              </div>
            ))}
            <Link href="/activity" className="text-sm text-primary hover:underline mt-4 block text-center">
              View All Activity Logs
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Quick Map Overview (HQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-0">
            <div className="w-full h-full bg-muted rounded-b-lg flex items-center justify-center">
               <img 
                src="https://placehold.co/600x300.png" 
                alt="Map placeholder" 
                data-ai-hint="map office"
                className="object-cover w-full h-full rounded-b-lg"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

