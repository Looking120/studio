"use client";

import React from 'react';
import { mockAttendanceSummary, mockEmployees, mockActivityLogs, Employee } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { BarChart, Users, Clock, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const getEmployeeAttendanceStatus = (employeeId: string) => {
  const today = new Date().toDateString();
  const logsToday = mockActivityLogs.filter(
    log => log.employeeId === employeeId && new Date(log.date).toDateString() === today
  );
  const checkInLog = logsToday.find(log => log.activity === 'Checked In' && log.checkInTime);
  const checkOutLog = logsToday.find(log => log.activity === 'Checked Out' && log.checkOutTime);

  if (checkInLog && !checkOutLog) return { status: "Present", time: new Date(checkInLog.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  if (checkInLog && checkOutLog) return { status: "Completed", time: `${new Date(checkInLog.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(checkOutLog.checkOutTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` };
  return { status: "Absent", time: "N/A" };
};

const attendanceData = [
  { day: 'Mon', present: 18, absent: 2 },
  { day: 'Tue', present: 20, absent: 0 },
  { day: 'Wed', present: 19, absent: 1 },
  { day: 'Thu', present: 17, absent: 3 },
  { day: 'Fri', present: 15, absent: 5 },
];

const chartConfig = {
  present: { label: "Present", color: "hsl(var(--chart-2))" },
  absent: { label: "Absent", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export default function AttendancePage() {
  const overallAttendancePercentage = mockAttendanceSummary.totalEmployees > 0 
    ? (mockAttendanceSummary.checkedInToday / mockAttendanceSummary.totalEmployees) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendanceSummary.totalEmployees}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendanceSummary.checkedInToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendanceSummary.totalEmployees - mockAttendanceSummary.checkedInToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAttendanceSummary.avgWorkHours}h</div>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEmployees.map((employee: Employee) => {
                  const attendance = getEmployeeAttendanceStatus(employee.id);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          attendance.status === 'Present' ? 'bg-green-100 text-green-700' :
                          attendance.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {attendance.status}
                        </span>
                      </TableCell>
                      <TableCell>{attendance.time}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5 text-primary" /> Weekly Attendance Trend</CardTitle>
            <CardDescription>Presence vs. absence over the past week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] p-2">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <RechartsBarChart data={attendanceData} accessibilityLayer>
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
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-muted"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="2.5" />
                <path className="text-primary"
                  strokeDasharray={`${overallAttendancePercentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{Math.round(overallAttendancePercentage)}%</span>
              </div>
            </div>
            <Progress value={overallAttendancePercentage} className="w-3/4 mt-4 h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {mockAttendanceSummary.checkedInToday} of {mockAttendanceSummary.totalEmployees} employees are present.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
