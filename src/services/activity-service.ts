
// src/services/activity-service.ts
import type { ActivityLog as FrontendActivityLog } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Backend DTO for ActivityLog (example, adjust to your actual API response)
interface ApiActivityLogDto {
  id: string;
  employeeId: string;
  activityType: string | number; // Could be an enum string or number from backend
  description?: string;
  startTime: string; // ISO Date string
  endTime?: string; // ISO Date string
  employeeName?: string; // If backend provides it directly
  location?: string;     // If backend provides it
}

export interface LogActivityPayload {
  activityType: string; // Should match a value your backend ActivityType enum can parse
  description?: string;
  location?: string;
}

export interface EndActivityPayload {
  notes?: string;
}

const mapActivityTypeToString = (type: string | number): string => {
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    case 0: return 'Checked In';
    case 1: return 'Working'; 
    case 2: return 'Break';   
    case 3: return 'Checked Out'; 
    default: return `Unknown Activity (${type})`;
  }
};

/**
 * Fetches activity logs for a specific employee within a date range.
 * @param employeeId The ID of the employee.
 * @param startDate ISO string for the start date.
 * @param endDate ISO string for the end date.
 */
export async function fetchActivityLogsByEmployee(employeeId: string, startDate: string, endDate: string): Promise<FrontendActivityLog[]> {
  console.log(`API CALL (axios): GET /activity-logs/${employeeId}?StartDate=${startDate}&EndDate=${endDate}`);
  if (!employeeId) {
    console.warn("fetchActivityLogsByEmployee called with no employeeId");
    return [];
  }
  try {
    const response = await apiClient<ApiActivityLogDto[]>(`/activity-logs/${employeeId}`, {
      params: { StartDate: startDate, EndDate: endDate }
    });
    const logsDto = response.data;

    return (logsDto || []).map(log => ({
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employeeName || 'N/A',
      activityType: mapActivityTypeToString(log.activityType),
      description: log.description,
      location: log.location || 'N/A',
      startTime: log.startTime,
      endTime: log.endTime,
    }));
  } catch (error) {
    console.error(`Error fetching activity logs for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch activity logs for employee ${employeeId}. An unexpected error occurred.`, (error as any).status || 500, String(error));
  }
}

/**
 * Adds a new activity for an employee. (POST /api/activity-logs/{employeeId}/activities)
 * @param employeeId The ID of the employee.
 * @param activityData The data for the new activity.
 */
export async function addEmployeeActivity(employeeId: string, activityData: LogActivityPayload): Promise<FrontendActivityLog> {
  console.log(`API CALL (axios): POST /activity-logs/${employeeId}/activities. Data:`, activityData);
  if (!employeeId) {
    throw new Error("employeeId is required to add employee activity.");
  }
  try {
    const response = await apiClient<ApiActivityLogDto>(`/activity-logs/${employeeId}/activities`, {
      method: 'POST',
      body: activityData,
    });
    const logDto = response.data;
    return {
      id: logDto.id,
      employeeId: logDto.employeeId,
      employeeName: logDto.employeeName || 'N/A',
      activityType: mapActivityTypeToString(logDto.activityType),
      description: logDto.description,
      location: logDto.location || 'N/A',
      startTime: logDto.startTime,
      endTime: logDto.endTime,
    };
  } catch (error) {
    console.error(`Error adding activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to add activity for employee ${employeeId}. An unexpected error occurred.`, (error as any).status || 500, String(error));
  }
}

/**
 * Ends the current activity for an employee. (POST /api/activity-logs/{employeeId}/end-current-activity)
 * @param employeeId The ID of the employee.
 * @param endActivityData Optional data for ending the activity (may not be needed by backend).
 */
export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: EndActivityPayload): Promise<FrontendActivityLog | null> {
  console.log(`API CALL (axios): POST /activity-logs/${employeeId}/end-current-activity. Data:`, endActivityData);
  if (!employeeId) {
    throw new Error("employeeId is required to end employee activity.");
  }
  try {
    const response = await apiClient<ApiActivityLogDto | null>(`/activity-logs/${employeeId}/end-current-activity`, {
      method: 'POST',
      body: endActivityData || {},
    });
    
    const logDto = response.data;
    if (!logDto) { // Handles 204 No Content or empty body response
        console.log(`Activity ended for employee ${employeeId}. Backend returned no content.`);
        return null;
    }
    return {
      id: logDto.id,
      employeeId: logDto.employeeId,
      employeeName: logDto.employeeName || 'N/A',
      activityType: mapActivityTypeToString(logDto.activityType),
      description: logDto.description,
      location: logDto.location || 'N/A',
      startTime: logDto.startTime,
      endTime: logDto.endTime,
    };
  } catch (error) {
    console.error(`Error ending activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to end activity for employee ${employeeId}. An unexpected error occurred.`, (error as any).status || 500, String(error));
  }
}
