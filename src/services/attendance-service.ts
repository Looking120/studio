// src/services/attendance-service.ts
import { apiClient, parseJsonResponse } from './api-client';
import type { ActivityLog } from '@/lib/data'; // Assuming check-in/out might return an activity log

// Define a type for the attendance report, adjust as per your API response
export interface AttendanceReport {
  totalHours: number;
  daysPresent: number;
  daysAbsent: number;
  // Add other relevant fields from your API response
  [key: string]: any; // Allow other fields
}

/**
 * Records a check-in for an employee.
 * Corresponds to: POST /api/attendance/{employeeId}/check-in
 * @param employeeId The ID of the employee.
 * @param checkInData Optional data for the check-in (e.g., location, notes).
 */
export async function checkIn(employeeId: string, checkInData?: { location?: string; notes?: string }): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/attendance/${employeeId}/check-in. Data:`, checkInData);
  const response = await apiClient(`/attendance/${employeeId}/check-in`, {
    method: 'POST',
    body: JSON.stringify(checkInData),
  });
  return parseJsonResponse<ActivityLog>(response);
}

/**
 * Records a check-out for an employee.
 * Corresponds to: POST /api/attendance/{employeeId}/check-out
 * @param employeeId The ID of the employee.
 * @param checkOutData Optional data for the check-out.
 */
export async function checkOut(employeeId: string, checkOutData?: { notes?: string }): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/attendance/${employeeId}/check-out. Data:`, checkOutData);
  const response = await apiClient(`/attendance/${employeeId}/check-out`, {
    method: 'POST',
    body: JSON.stringify(checkOutData),
  });
  return parseJsonResponse<ActivityLog>(response);
}

/**
 * Fetches an attendance report for a specific employee.
 * Corresponds to: GET /api/attendance/{employeeId}/report
 * @param employeeId The ID of the employee.
 * @param reportParams Optional parameters for the report (e.g., date range).
 */
export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`API CALL: GET /api/attendance/${employeeId}/report. Params:`, reportParams);
  let endpoint = `/attendance/${employeeId}/report`;
  if (reportParams) {
    const query = new URLSearchParams(reportParams as any).toString();
    if (query) {
      endpoint += `?${query}`;
    }
  }
  const response = await apiClient(endpoint);
  return parseJsonResponse<AttendanceReport>(response);
}
