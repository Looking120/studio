
// src/services/attendance-service.ts
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed
import type { ActivityLog } from '@/lib/data'; 

// Define a type for the attendance report, adjust as per your API response
export interface AttendanceReport {
  totalHours: number;
  daysPresent: number;
  daysAbsent: number;
  [key: string]: any; 
}

/**
 * Records a check-in for an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param checkInData Optional data for the check-in (e.g., location, notes).
 */
export async function checkIn(employeeId: string, checkInData?: { location?: string; notes?: string }): Promise<ActivityLog> {
  console.log(`MOCK API CALL: POST /api/attendance/${employeeId}/check-in. Data:`, checkInData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const mockLog: ActivityLog = {
    id: `att_log_${Date.now()}`,
    employeeId,
    employeeName: "Mock Employee", // Replace with actual name if available
    activity: "Checked In (mock)",
    location: checkInData?.location || "Mock Office",
    date: new Date().toISOString(),
    checkInTime: new Date().toISOString(),
  };
  return Promise.resolve(mockLog);
}

/**
 * Records a check-out for an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param checkOutData Optional data for the check-out.
 */
export async function checkOut(employeeId: string, checkOutData?: { notes?: string }): Promise<ActivityLog> {
  console.log(`MOCK API CALL: POST /api/attendance/${employeeId}/check-out. Data:`, checkOutData);
  await new Promise(resolve => setTimeout(resolve, 300));
   const mockLog: ActivityLog = {
    id: `att_log_${Date.now()}`,
    employeeId,
    employeeName: "Mock Employee",
    activity: "Checked Out (mock)",
    location: "Mock Office",
    date: new Date().toISOString(),
    checkOutTime: new Date().toISOString(),
  };
  return Promise.resolve(mockLog);
}

/**
 * Fetches an attendance report for a specific employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param reportParams Optional parameters for the report (e.g., date range).
 */
export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`MOCK API CALL: GET /api/attendance/${employeeId}/report. Params:`, reportParams);
  await new Promise(resolve => setTimeout(resolve, 300));
  const mockReport: AttendanceReport = {
    totalHours: 160,
    daysPresent: 20,
    daysAbsent: 2,
    details: "Mock report details for " + employeeId,
  };
  return Promise.resolve(mockReport);
}
