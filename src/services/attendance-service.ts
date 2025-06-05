
// src/services/attendance-service.ts
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used in mock
import type { ActivityLog } from '@/lib/data';

export interface AttendanceReport {
  totalHours: number;
  daysPresent: number;
  daysAbsent: number;
  [key: string]: any;
}

export interface CheckInData {
  location?: string;
  notes?: string;
}

export interface CheckOutData {
  notes?: string;
}

export async function checkIn(employeeId: string, checkInData?: CheckInData): Promise<ActivityLog> {
  console.log(`MOCK checkIn for employee ${employeeId} with data:`, checkInData);
  const logData: ActivityLog = {
    id: `mock-checkin-${Date.now()}`,
    employeeId: employeeId,
    employeeName: "Mock Employee",
    activityType: "Checked In",
    startTime: new Date().toISOString(),
    location: checkInData?.location || "Mock Location (Check-In)",
    description: checkInData?.notes
  };
  return Promise.resolve(logData);
}

export async function checkOut(employeeId: string, checkOutData?: CheckOutData): Promise<ActivityLog> {
  console.log(`MOCK checkOut for employee ${employeeId} with data:`, checkOutData);
  const logData: ActivityLog = {
    id: `mock-checkout-${Date.now()}`,
    employeeId: employeeId,
    employeeName: "Mock Employee",
    activityType: "Checked Out",
    endTime: new Date().toISOString(),
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // Assume 8 hr shift
    location: "Mock Location (Check-Out)",
    description: checkOutData?.notes
  };
  return Promise.resolve(logData);
}

export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`MOCK getAttendanceReport for employee ${employeeId} with params:`, reportParams);
  return Promise.resolve({
    totalHours: 40,
    daysPresent: 5,
    daysAbsent: 0,
    // Add more mock fields if your UI uses them
  });
}
