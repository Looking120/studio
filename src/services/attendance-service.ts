
// src/services/attendance-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';
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
  console.log(`API CALL (axios): POST /attendance/${employeeId}/check-in. Data:`, checkInData);
  if (!employeeId) {
    throw new Error("employeeId is required for check-in.");
  }
  try {
    const response = await apiClient<any>(`/attendance/${employeeId}/check-in`, {
      method: 'POST',
      body: checkInData || {},
    });
    const logData = response.data;
    return {
        id: logData.id,
        employeeId: logData.employeeId,
        employeeName: logData.employeeName || "N/A", 
        activityType: "Checked In", 
        startTime: logData.startTime || new Date().toISOString(),
        location: logData.location || checkInData?.location || "N/A",
        // date field is not standard in ActivityLog, ensure consistency or remove
    } as ActivityLog;
  } catch (error) {
    console.error(`Error during check-in for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Check-in failed for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Records a check-out for an employee. (POST /api/attendance/{employeeId}/check-out)
 * @param employeeId The ID of the employee.
 * @param checkOutData Optional data for the check-out.
 */
export async function checkOut(employeeId: string, checkOutData?: CheckOutData): Promise<ActivityLog> {
  console.log(`API CALL (axios): POST /attendance/${employeeId}/check-out. Data:`, checkOutData);
  if (!employeeId) {
    throw new Error("employeeId is required for check-out.");
  }
  try {
    const response = await apiClient<any>(`/attendance/${employeeId}/check-out`, {
      method: 'POST',
      body: checkOutData || {},
    });
    const logData = response.data;
    return {
        id: logData.id,
        employeeId: logData.employeeId,
        employeeName: logData.employeeName || "N/A",
        activityType: "Checked Out",
        endTime: logData.endTime || new Date().toISOString(),
        location: logData.location || "N/A",
        // date field is not standard in ActivityLog
    } as ActivityLog;
  } catch (error) {
    console.error(`Error during check-out for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Check-out failed for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches an attendance report for a specific employee. (GET /api/attendance/{employeeId}/report)
 * @param employeeId The ID of the employee.
 * @param reportParams Optional parameters for the report (e.g., date range).
 */
export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`API CALL (axios): GET /attendance/${employeeId}/report. Params:`, reportParams);
  if (!employeeId) {
    throw new Error("employeeId is required to get attendance report.");
  }
  try {
    const response = await apiClient<AttendanceReport>(`/attendance/${employeeId}/report`, {
        params: reportParams
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendance report for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch attendance report for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}
