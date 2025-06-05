
// src/services/attendance-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';
import type { ActivityLog } from '@/lib/data'; // Using frontend type for now

export interface AttendanceReport {
  totalHours: number;
  daysPresent: number;
  daysAbsent: number;
  [key: string]: any; // Pour d'autres champs potentiels
}

export interface CheckInData {
  location?: string;
  notes?: string;
}

export interface CheckOutData {
  notes?: string;
}

// Supposons que l'API retourne un type compatible avec ActivityLog
interface ApiActivityLog extends ActivityLog {} 
interface ApiAttendanceReport extends AttendanceReport {}

export async function checkIn(employeeId: string, checkInData?: CheckInData): Promise<ActivityLog> {
  console.log(`API CALL: POST /attendance/${employeeId}/check-in with data:`, checkInData);
  try {
    const response = await apiClient<ApiActivityLog>(`/attendance/${employeeId}/check-in`, {
      method: 'POST',
      body: checkInData || {},
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in checkIn:", error);
    throw new HttpError('Failed to check in.', 0, null);
  }
}

export async function checkOut(employeeId: string, checkOutData?: CheckOutData): Promise<ActivityLog> {
  console.log(`API CALL: POST /attendance/${employeeId}/check-out with data:`, checkOutData);
  try {
    const response = await apiClient<ApiActivityLog>(`/attendance/${employeeId}/check-out`, {
      method: 'POST',
      body: checkOutData || {},
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in checkOut:", error);
    throw new HttpError('Failed to check out.', 0, null);
  }
}

export async function getAttendanceReport(employeeId: string, reportParams?: { startDate?: string; endDate?: string }): Promise<AttendanceReport> {
  console.log(`API CALL: GET /attendance/${employeeId}/report with params:`, reportParams);
  try {
    const response = await apiClient<ApiAttendanceReport>(`/attendance/${employeeId}/report`, {
      method: 'GET',
      params: reportParams,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getAttendanceReport:", error);
    throw new HttpError('Failed to get attendance report.', 0, null);
  }
}
