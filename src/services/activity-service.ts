
// src/services/activity-service.ts
import type { ActivityLog as FrontendActivityLog } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

export interface LogActivityPayload {
  activityType: string;
  description?: string;
  location?: string;
}

export interface EndActivityPayload {
  notes?: string;
}

// L'API peut retourner un type différent, ex: ActivityLogDto
// Pour l'instant, on suppose que l'API retourne une structure compatible avec FrontendActivityLog
interface ApiActivityLog extends FrontendActivityLog {} // Placeholder

export async function fetchActivityLogsByEmployee(employeeId: string): Promise<FrontendActivityLog[]> {
  console.log(`API CALL: GET /activity-logs/${employeeId}`);
  try {
    const response = await apiClient<ApiActivityLog[]>(`/activity-logs/${employeeId}`, {
      method: 'GET',
      // Removed params: { startDate, endDate }
    });
    return response.data; 
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchActivityLogsByEmployee:", error);
    throw new HttpError('Failed to fetch activity logs.', 0, null);
  }
}

export async function addEmployeeActivity(employeeId: string, activityData: LogActivityPayload): Promise<FrontendActivityLog> {
  console.log(`API CALL: POST /activity-logs/${employeeId}/activities with data:`, activityData);
  try {
    const response = await apiClient<ApiActivityLog>(`/activity-logs/${employeeId}/activities`, {
      method: 'POST',
      body: activityData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in addEmployeeActivity:", error);
    throw new HttpError('Failed to add employee activity.', 0, null);
  }
}

export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: EndActivityPayload): Promise<FrontendActivityLog | null> {
  console.log(`API CALL: POST /activity-logs/${employeeId}/end-current-activity with data:`, endActivityData);
  try {
    const response = await apiClient<ApiActivityLog | null>(`/activity-logs/${employeeId}/end-current-activity`, {
      method: 'POST',
      body: endActivityData || {}, // Envoyer un objet vide si endActivityData est undefined
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in endCurrentEmployeeActivity:", error);
    throw new HttpError('Failed to end current employee activity.', 0, null);
  }
}

