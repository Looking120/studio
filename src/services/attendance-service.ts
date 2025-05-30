
// src/services/attendance-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';
import type { ActivityLog } from '@/lib/data'; // Using frontend ActivityLog for now

// Define a type for the attendance report, adjust as per your API response
export interface AttendanceReport {
  totalHours: number;
  daysPresent: number;
  daysAbsent: number;
  // Add other fields your backend DTO for AttendanceReport might have
  [key: string]: any;
}

export interface CheckInData {
  location?: string;
  notes?: string;
  // Add any other fields your backend /api/attendance/{employeeId}/check-in expects
}

export interface CheckOutData {
  notes?: string;
  // Add any other fields your backend /api/attendance/{employeeId}/check-out expects
}

/**
 * Records a check-in for an employee. (POST /api/attendance/{employeeId}/check-in)
 * @param employeeId The ID of the employee.
 * @param checkInData Optional data for the check-in.
 */
export async function checkIn(employeeId: string, checkInData?: CheckInData): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/attendance/${employeeId}/check-in. Data:`, checkInData);
  if (!employeeId) {
    throw new Error("employeeId is required for check-in.");
  }
  try {
    const response = await apiClient(`/attendance/${employeeId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(checkInData || {}),
    });
    // Assuming the response is an ActivityLog or similar structure representing the check-in
    const logData = await parseJsonResponse<any>(response);
    return {
        id: logData.id,
        employeeId: logData.employeeId,
        employeeName: logData.employeeName || "N/A", // Adjust if name is available
        activityType: "Checked In", // Or derive from response
        startTime: logData.startTime || new Date().toISOString(),
        location: logData.location || checkInData?.location || "N/A",
        date: logData.startTime || new Date().toISOString(),
        // map other fields as necessary
    } as ActivityLog;
  } catch (error) {
    console.error(`Error during check-in for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Check-in failed for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Records a check-out for an employee. (POST /api/attendance/{employeeId}/check-out)
 * @param employeeId The ID of the employee.
 * @param checkOutData Optional data for the check-out.
 */
export async function checkOut(employeeId: string, checkOutData?: CheckOutData): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/attendance/${employeeId}/check-out. Data:`, checkOutData);
  if (!employeeId) {
    throw new Error("employeeId is required for check-out.");
  }
  try {
    const response = await apiClient(`/attendance/${employeeId}/check-out`, {
      method: 'POST',
      body: JSON.stringify(checkOutData || {}),
    });
    const logData = await parseJsonResponse<any>(response);
    return {
        id: logData.id,
        employeeId: logData.employeeId,
        employeeName: logData.employeeName || "N/A",
        activityType: "Checked Out",
        endTime: logData.endTime || new Date().toISOString(),
        location: logData.location || "N/A",
        date: logData.endTime || new Date().toISOString(),
        // map other fields
    } as ActivityLog;
  } catch (error) {
    console.error(`Error during check-out for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Check-out failed for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches an attendance report for a specific employee. (GET /api/attendance/{employeeId}/report)
 * @param employeeId The ID of the employee.
 * @param reportParams Optional parameters for the report (e.g., date range).
 */
export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`API CALL: GET /api/attendance/${employeeId}/report. Params:`, reportParams);
  if (!employeeId) {
    throw new Error("employeeId is required to get attendance report.");
  }
  try {
    let endpoint = `/attendance/${employeeId}/report`;
    if (reportParams) {
      const query = new URLSearchParams(reportParams as any).toString();
      if (query) endpoint += `?${query}`;
    }
    const response = await apiClient(endpoint);
    return await parseJsonResponse<AttendanceReport>(response);
  } catch (error) {
    console.error(`Error fetching attendance report for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch attendance report for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}
