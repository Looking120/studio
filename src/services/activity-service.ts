// src/services/activity-service.ts
import type { ActivityLog } from '@/lib/data';
import { apiClient, parseJsonResponse } from './api-client';

/**
 * Fetches all activity logs.
 * Assumes an endpoint GET /api/activity-logs exists for all logs.
 * If your API only provides logs per employee, this function will need adjustment
 * or the page using it will need to be redesigned.
 */
export async function fetchAllActivityLogs(): Promise<ActivityLog[]> {
  console.log('API CALL: GET /api/activity-logs - Fetching all activity logs.');
  const response = await apiClient('/activity-logs');
  return parseJsonResponse<ActivityLog[]>(response);
}

/**
 * Fetches activity logs for a specific employee.
 * Corresponds to: GET /api/activity-logs/{employeeId}
 * @param employeeId The ID of the employee.
 */
export async function fetchActivityLogsByEmployee(employeeId: string): Promise<ActivityLog[]> {
  console.log(`API CALL: GET /api/activity-logs/${employeeId}`);
  const response = await apiClient(`/activity-logs/${employeeId}`);
  return parseJsonResponse<ActivityLog[]>(response);
}

/**
 * Adds a new activity for an employee.
 * Corresponds to: POST /api/activity-logs/{employeeId}/activities
 * @param employeeId The ID of the employee.
 * @param activityData The data for the new activity. Expects fields like 'activity', 'location', etc.
 */
export async function addEmployeeActivity(employeeId: string, activityData: { activity: string; location?: string; details?: any }): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/activities. Data:`, activityData);
  const response = await apiClient(`/activity-logs/${employeeId}/activities`, {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
  return parseJsonResponse<ActivityLog>(response);
}

/**
 * Ends the current activity for an employee (e.g., records a check-out time).
 * Corresponds to: POST /api/activity-logs/{employeeId}/end-current-activity
 * @param employeeId The ID of the employee.
 * @param endActivityData Optional data for ending the activity.
 */
export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: any): Promise<ActivityLog> {
  console.log(`API CALL: POST /api/activity-logs/${employeeId}/end-current-activity. Data:`, endActivityData);
  const response = await apiClient(`/activity-logs/${employeeId}/end-current-activity`, {
    method: 'POST',
    body: JSON.stringify(endActivityData), // API might not need a body
  });
  return parseJsonResponse<ActivityLog>(response);
}
