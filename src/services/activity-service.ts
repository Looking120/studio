
// src/services/activity-service.ts
import type { ActivityLog } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

export interface AddActivityPayload {
  activity: string;
  location?: string;
  details?: any; // Based on your previous mock
  checkInTime?: string; // Optional, if this is how you log check-ins
  checkOutTime?: string; // Optional, if this is how you log check-outs
}

export interface EndActivityPayload {
  notes?: string; // Example, adjust as per your API needs
  checkOutTime?: string; // Usually set by the backend, but can be an option
}


/**
 * Fetches all activity logs.
 * Assumes a GET /api/activity-logs endpoint exists on the backend.
 */
export async function fetchAllActivityLogs(): Promise<ActivityLog[]> {
  console.log('API CALL: GET /api/activity-logs - Fetching all activity logs.');
  try {
    const response = await apiClient('/activity-logs');
    const logs = await parseJsonResponse<any[]>(response);
    return (logs || []).map(log => ({
        ...log,
        // Ensure date/time fields are properly formatted if necessary,
        // or if they come with different names from the API
        date: log.date || new Date().toISOString(), // Fallback if date is missing
    })) as ActivityLog[];
  } catch (error) {
    console.error('Error fetching all activity logs:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch all activity logs. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches activity logs for a specific employee.
 * @param employeeId The ID of the employee.
 */
export async function fetchActivityLogsByEmployee(employeeId: string): Promise<ActivityLog[]> {
  console.log(`API CALL: GET /api/activity-logs/${employeeId}`);
  if (!employeeId) {
    console.warn("fetchActivityLogsByEmployee called with no employeeId");
    return [];
  }
  try {
    const response = await apiClient(`/activity-logs/${employeeId}`);
    const logs = await parseJsonResponse<any[]>(response);
     return (logs || []).map(log => ({
        ...log,
        date: log.date || new Date().toISOString(),
    })) as ActivityLog[];
  } catch (error) {
    console.error(`Error fetching activity logs for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch activity logs for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Adds a new activity for an employee.
 * @param employeeId The ID of the employee.
 * @param activityData The data for the new activity.
 */
export async function addEmployeeActivity(employeeId: string, activityData: AddActivityPayload): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/activities. Data:`, activityData);
  if (!employeeId) {
    throw new Error("employeeId is required to add employee activity.");
  }
  try {
    const response = await apiClient(`/activity-logs/${employeeId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    const log = await parseJsonResponse<any>(response);
    return {
        ...log,
        date: log.date || new Date().toISOString(),
    } as ActivityLog;
  } catch (error) {
    console.error(`Error adding activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to add activity for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Ends the current activity for an employee (e.g., records a check-out time).
 * @param employeeId The ID of the employee.
 * @param endActivityData Optional data for ending the activity.
 */
export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: EndActivityPayload): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/end-current-activity. Data:`, endActivityData);
   if (!employeeId) {
    throw new Error("employeeId is required to end employee activity.");
  }
  try {
    const response = await apiClient(`/activity-logs/${employeeId}/end-current-activity`, {
      method: 'POST',
      body: JSON.stringify(endActivityData || {}), // Send empty object if no data
    });
    const log = await parseJsonResponse<any>(response);
     return {
        ...log,
        date: log.date || new Date().toISOString(),
    } as ActivityLog;
  } catch (error) {
    console.error(`Error ending activity for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to end activity for employee ${employeeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}
