
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { mockEmployees, mockActivityLogs, Employee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Users, Clock, CheckCircle, XCircle, CalendarDays, LogIn, LogOut, FileText } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
// import { checkIn, checkOut, getAttendanceReport } from '@/services/attendance-service'; 
// import { useToast } from '@/hooks/use-toast';

interface EmployeeAttendanceStatus {
  status: string;
  time: string;
}

interface AttendanceSummaryData {
  checkedInToday: number;
  absentToday: number;
  overallAttendancePercentage: number;
  totalEmployees: number;
  avgWorkHours: number;
}

const currentUserId = mockEmployees[0]?.id || 'emp001'; 

export default function AttendancePage() {
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, EmployeeAttendanceStatus>>({});
  const [summaryData, setSummaryData] = useState<AttendanceSummaryData | null>(null);
  const [isClient, setIsClient] = useState(false);
  // const { toast } = useToast();

  const getEmployeeAttendanceStatus = (employeeId: string, activityLogs: typeof mockActivityLogs): EmployeeAttendanceStatus => {
    const today = new Date().toDateString();
    const logsToday = activityLogs.filter(
      log => log.employeeId === employeeId && new Date(log.startTime!).toDateString() === today // Assuming startTime is checkInTime
    );
    const checkInLog = logsToday.find(log => log.activityType === 'Checked In' && log.startTime);
    const checkOutLog = logsToday.find(log => log.activityType === 'Checked Out' && log.endTime);

    if (checkInLog && !checkOutLog) return { status: "Present", time: new Date(checkInLog.startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    if (checkInLog && checkOutLog) return { status: "Completed", time: `${new Date(checkInLog.startTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(checkOutLog.endTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` };
    return { status: "Absent", time: "N/A" };
  };
  
  const attendanceChartData = [ 
    { day: 'Mon', present: 18, absent: 2 },
    { day: 'Tue', present: 20, absent: 0 },
    { day: 'Wed', present: 19, absent: 1 },
    { day: 'Thu', present: 17, absent: 3 },
    { day: 'Fri', present: 15, absent: 5 },
  ];

  const chartConfig = {
    present: { label: "Present", color: "hsl(var(--chart-2))" }, 
    absent: { label: "Absent", color: "hsl(var(--destructive))" },
  } satisfies ChartConfig;

  useEffect(() => {
    setIsClient(true); 

    const statuses: Record<string, EmployeeAttendanceStatus> = {};
    mockEmployees.forEach(employee => {
      statuses[employee.id] = getEmployeeAttendanceStatus(employee.id, mockActivityLogs);
    });
    setEmployeeStatuses(statuses);

    const todayString = new Date().toDateString();
    const checkedInTodayCount = new Set(
      mockActivityLogs
        .filter(log => log.startTime && new Date(log.startTime!).toDateString() === todayString && log.activityType === 'Checked In')
        .map(log => log.employeeId)
    ).size;
    
    const totalEmployees = mockEmployees.length;
    const absentTodayCount = totalEmployees - checkedInTodayCount;
    const percentage = totalEmployees > 0 ? (checkedInTodayCount / totalEmployees) * 100 : 0;

    setSummaryData({
      checkedInToday: checkedInTodayCount,
      absentToday: absentTodayCount,
      overallAttendancePercentage: percentage,
      totalEmployees: totalEmployees,
      avgWorkHours: 7.5, 
    });
  }, []);

  const handleCheckIn = async (employeeId: string) => {
    console.log(`Placeholder: Check-in for employee ${employeeId}`);
    alert(`Placeholder: Check-in for ${employeeId}`);
  };

  const handleCheckOut = async (employeeId: string) => {
    console.log(`Placeholder: Check-out for employee ${employeeId}`);
    alert(`Placeholder: Check-out for ${employeeId}`);
  };
  
  const handleViewReport = async (employeeId: string) => {
    console.log(`Placeholder: View report for employee ${employeeId}`);
    alert(`Placeholder: View report for ${employeeId}`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? summaryData.totalEmployees : <Skeleton className="h-8 w-1/2" />}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? summaryData.checkedInToday : <Skeleton className="h-8 w-1/2" />}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? summaryData.absentToday : <Skeleton className="h-8 w-1/2" />}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData ? `${summaryData.avgWorkHours}h` : <Skeleton className="h-8 w-1/4" />}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary"/> Daily Attendance Status</CardTitle>
          <CardDescription>Overview of employee attendance for today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-center">Actions</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isClient ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-row-${index}`}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  mockEmployees.map((employee: Employee) => {
                    const attendance = employeeStatuses[employee.id] || { status: "Loading...", time: "..." };
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            attendance.status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                            attendance.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' :
                            attendance.status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {attendance.status}
                          </span>
                        </TableCell>
                        <TableCell>{attendance.time}</TableCell>
                        <TableCell className="text-center space-x-1">
                          {attendance.status === "Absent" && (
                            <Button variant="outline" size="xs" onClick={() => handleCheckIn(employee.id)} title="Check In">
                                <LogIn className="h-3 w-3" />
                            </Button>
                          )}
                          {attendance.status === "Present" && (
                             <Button variant="outline" size="xs" onClick={() => handleCheckOut(employee.id)} title="Check Out">
                                <LogOut className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="xs" onClick={() => handleViewReport(employee.id)} title="View Report">
                            <FileText className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" /> Weekly Attendance Trend</CardTitle>
            <CardDescription>Presence vs. absence over the past week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-2">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <RechartsBarChart data={attendanceChartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="present" fill="var(--color-present)" radius={4} />
                <Bar dataKey="absent" fill="var(--color-absent)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Attendance Rate</CardTitle>
            <CardDescription>Percentage of employees checked in today.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[300px]">
            {!summaryData ? (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Skeleton className="w-32 h-32 rounded-full" />
                <Skeleton className="w-3/4 h-2 mt-4" />
                <Skeleton className="w-1/2 h-4 mt-2" />
              </div>
            ) : (
              <>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-muted"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <path className="text-primary"
                      strokeDasharray={`${summaryData.overallAttendancePercentage}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{Math.round(summaryData.overallAttendancePercentage)}%</span>
                  </div>
                </div>
                <Progress value={summaryData.overallAttendancePercentage} className="w-3/4 mt-4 h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {summaryData.checkedInToday} of {summaryData.totalEmployees} employees are present.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


    