
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { mockActivityLogs, mockEmployees, mockOffices, mockAttendanceSummary, type Employee, type Office, type Task } from "@/lib/data";
import { Users, MapPin, ListChecks, Building2, CheckCircle, Clock, Briefcase, Home, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTasksForEmployee, updateTaskStatus } from '@/services/task-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      const email = localStorage.getItem('userEmail');
      setUserRole(role);

      if (isMobile && role && !role.toLowerCase().includes('admin')) {
        setIsLoadingEmployeeData(true);
        const employee = mockEmployees.find(emp => emp.email === email);
        setCurrentEmployee(employee || null);

        if (employee) {
          if (employee.officeId) {
            setAssignedOffice(mockOffices.find(office => office.id === employee.officeId) || null);
          }
          fetchTasksForEmployee(employee.id)
            .then(setEmployeeTasks)
            .catch(err => {
              console.error("Failed to fetch tasks:", err);
              toast({ variant: "destructive", title: "Erreur Tâches", description: "Impossible de charger les tâches."});
            })
            .finally(() => setIsLoadingEmployeeData(false));
        } else {
          setIsLoadingEmployeeData(false);
        }
      } else {
        setIsLoadingEmployeeData(false);
      }
    }
  }, [isMobile, toast]);

  const handleTaskStatusChange = async (taskId: string, isCompleted: boolean) => {
    const originalTasks = [...employeeTasks];
    setEmployeeTasks(prevTasks => 
      prevTasks.map(task => task.id === taskId ? { ...task, isCompleted } : task)
    );
    try {
      await updateTaskStatus(taskId, isCompleted);
      toast({ title: "Tâche mise à jour", description: `La tâche a été marquée comme ${isCompleted ? 'complétée' : 'non complétée'}.`});
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la tâche."});
      setEmployeeTasks(originalTasks); // Revert optimistic update
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (isMobile && userRole && !userRole.toLowerCase().includes('admin')) {
    // Employee Mobile Dashboard
    if (isLoadingEmployeeData) {
      return (
        <div className="space-y-6 p-4 animate-pulse">
          <Skeleton className="h-10 w-3/4 mb-4" />
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
            {employeeTasks.length > 0 ? (
              <ul className="space-y-3">
                {employeeTasks.map(task => (
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
                    {task.dueDate && (
                      <Badge variant={new Date(task.dueDate) < new Date() && !task.isCompleted ? "destructive" : "outline"} className="text-xs whitespace-nowrap ml-2">
                        {formatDate(task.dueDate)}
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

        {/* Possible future cards for mobile employee: Quick Check-in/out, My Schedule, etc. */}
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
            {mockActivityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{log.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{log.activityType} at {log.location}</p>
                </div>
                <p className="text-xs text-muted-foreground">{log.startTime ? new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
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
