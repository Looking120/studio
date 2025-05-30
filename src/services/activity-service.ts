
// src/services/activity-service.ts
import type { ActivityLog as FrontendActivityLog } from '@/lib/data'; // Renamed to avoid conflict
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

// Assuming backend DTO might look like this, adjust as needed
interface ApiActivityLogDto {
  id: string;
  employeeId: string;
  activityType: string | number; // Could be an enum string or number from backend
  description?: string;
  startTime: string; // ISO Date string
  endTime?: string; // ISO Date string
  // Add other fields that your backend DTO includes and might be useful
  employeeName?: string; // If backend provides it directly
  location?: string;     // If backend provides it
}

// Payload for logging a new activity
export interface LogActivityPayload {
  activityType: string; // Should match a value your backend ActivityType enum can parse
  description?: string;
  location?: string; // If your backend accepts location for LogActivityAsync
}

// Payload for ending an activity (might be empty if backend doesn't need specifics)
export interface EndActivityPayload {
  notes?: string;
}

// Helper to map backend ActivityType to a user-friendly string
// IMPORTANT: Adjust this mapping based on your actual backend ActivityType enum
const mapActivityTypeToString = (type: string | number): string => {
  if (typeof type === 'string') return type; // If backend already sends a good string
  // Example mapping if backend sends numbers
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
  console.log(`API CALL: GET /api/activity-logs/${employeeId}?startDate=${startDate}&endDate=${endDate}`);
  if (!employeeId) {
    console.warn("fetchActivityLogsByEmployee called with no employeeId");
    return [];
  }
  try {
    // Assuming your API takes startDate and endDate as query parameters
    const response = await apiClient(`/activity-logs/${employeeId}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`);
    const logsDto = await parseJsonResponse<ApiActivityLogDto[]>(response);
    return (logsDto || []).map(log => ({
      id: log.id,
      employeeId: log.employeeId,
      employeeName: log.employeeName || 'N/A', // Or fetch separately if needed
      activityType: mapActivityTypeToString(log.activityType),
      description: log.description,
      location: log.location || 'N/A',
      startTime: log.startTime,
      endTime: log.endTime,
      // Deprecated fields from old ActivityLog type - ensure mapping or removal
      date: log.startTime, // Or a specific date field if your DTO has one
      checkInTime: log.startTime,
      checkOutTime: log.endTime,
      activity: mapActivityTypeToString(log.activityType) // Keep for compatibility if pages use it
    })) as FrontendActivityLog[];
  } catch (error) {
    console.error(`Error fetching activity logs for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch activity logs for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Adds a new activity for an employee. (POST /api/activity-logs/{employeeId}/activities)
 * This maps to LogActivityAsync(Guid employeeId, ActivityType activityType, string? description = null)
 * The frontend needs to send what the backend expects for ActivityType.
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
      body: JSON.stringify(activityData), // Backend expects { activityType: "string/enum", description: "string" }
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
      date: logDto.startTime,
      checkInTime: logDto.startTime,
      checkOutTime: logDto.endTime,
      activity: mapActivityTypeToString(logDto.activityType)
    } as FrontendActivityLog;
  } catch (error) {
    console.error(`Error adding activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to add activity for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Ends the current activity for an employee. (POST /api/activity-logs/{employeeId}/end-current-activity)
 * Maps to EndCurrentActivityAsync(Guid employeeId)
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
      body: JSON.stringify(endActivityData || {}), // Send empty object if no data or if backend expects no body
    });
    if (response.status === 204 || !response.body) { // Handle No Content or empty response
        // Potentially refetch the last activity or the employee's status to confirm
        console.log(`Activity ended for employee ${employeeId}. Backend returned no content.`);
        return null; // Or fetch updated log
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
      date: logDto.startTime,
      checkInTime: logDto.startTime,
      checkOutTime: logDto.endTime,
      activity: mapActivityTypeToString(logDto.activityType)
    } as FrontendActivityLog;
  } catch (error) {
    console.error(`Error ending activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to end activity for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}
