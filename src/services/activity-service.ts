
// src/services/activity-service.ts
import type { ActivityLog as FrontendActivityLog } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

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
    // If backend already sends "CheckedIn", "Working", etc.
    // You might want to normalize or map them to more user-friendly terms if needed
    // e.g. if (type.toLowerCase() === "checkedin") return "Checked In";
    return type;
  }
  // Example mapping if backend sends numbers that correspond to an enum
  switch (type) {
    case 0: return 'Checked In';
    case 1: return 'Working'; // Example, adjust to your actual enum
    case 2: return 'Break';   // Example
    case 3: return 'Checked Out'; // Example
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
  console.log(`API CALL: GET /api/activity-logs/${employeeId}?StartDate=${startDate}&EndDate=${endDate}`);
  if (!employeeId) {
    console.warn("fetchActivityLogsByEmployee called with no employeeId");
    return [];
  }
  try {
    // Using StartDate and EndDate to match typical C# model binding for ActivityTimeRangeRequest
    const response = await apiClient(`/activity-logs/${employeeId}?StartDate=${encodeURIComponent(startDate)}&EndDate=${encodeURIComponent(endDate)}`);
    const logsDto = await parseJsonResponse<ApiActivityLogDto[]>(response);

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
    // Generic fallback for other errors
    throw new HttpError(`Failed to fetch activity logs for employee ${employeeId}. An unexpected error occurred.`, 500, String(error));
  }
}

/**
 * Adds a new activity for an employee. (POST /api/activity-logs/{employeeId}/activities)
 * @param employeeId The ID of the employee.
 * @param activityData The data for the new activity.
 */
export async function addEmployeeActivity(employeeId: string, activityData: LogActivityPayload): Promise<FrontendActivityLog> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/activities. Data:`, activityData);
  if (!employeeId) {
    throw new Error("employeeId is required to add employee activity.");
  }
  try {
    const response = await apiClient(`/activity-logs/${employeeId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    const logDto = await parseJsonResponse<ApiActivityLogDto>(response);
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
    throw new HttpError(`Failed to add activity for employee ${employeeId}. An unexpected error occurred.`, 500, String(error));
  }
}

/**
 * Ends the current activity for an employee. (POST /api/activity-logs/{employeeId}/end-current-activity)
 * @param employeeId The ID of the employee.
 * @param endActivityData Optional data for ending the activity (may not be needed by backend).
 */
export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: EndActivityPayload): Promise<FrontendActivityLog | null> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/end-current-activity. Data:`, endActivityData);
  if (!employeeId) {
    throw new Error("employeeId is required to end employee activity.");
  }
  try {
    const response = await apiClient(`/activity-logs/${employeeId}/end-current-activity`, {
      method: 'POST',
      body: JSON.stringify(endActivityData || {}),
    });
    if (response.status === 204 || !response.body) {
        console.log(`Activity ended for employee ${employeeId}. Backend returned no content.`);
        return null;
    }
    const logDto = await parseJsonResponse<ApiActivityLogDto>(response);
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
    throw new HttpError(`Failed to end activity for employee ${employeeId}. An unexpected error occurred.`, 500, String(error));
  }
}
