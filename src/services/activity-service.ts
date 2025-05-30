
// src/services/activity-service.ts
import type { ActivityLog } from '@/lib/data';
import { mockActivityLogs } from '@/lib/data'; // Import mock data
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed

/**
 * Fetches all activity logs. (MOCKED)
 */
export async function fetchAllActivityLogs(): Promise<ActivityLog[]> {
  console.log('MOCK API CALL: GET /api/activity-logs - Fetching all activity logs.');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve([...mockActivityLogs]); // Return a copy
}

/**
 * Fetches activity logs for a specific employee. (MOCKED)
 * @param employeeId The ID of the employee.
 */
export async function fetchActivityLogsByEmployee(employeeId: string): Promise<ActivityLog[]> {
  console.log(`MOCK API CALL: GET /api/activity-logs/${employeeId}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const filteredLogs = mockActivityLogs.filter(log => log.employeeId === employeeId);
  return Promise.resolve(filteredLogs);
}

/**
 * Adds a new activity for an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param activityData The data for the new activity. Expects fields like 'activity', 'location', etc.
 */
export async function addEmployeeActivity(employeeId: string, activityData: { activity: string; location?: string; details?: any }): Promise<ActivityLog> {
  console.log(`MOCK API CALL: POST /api/activity-logs/${employeeId}/activities. Data:`, activityData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newLog: ActivityLog = {
    id: `log${Date.now()}`,
    employeeId,
    employeeName: "Mock Employee", // Or fetch employee name if needed
    activity: activityData.activity,
    location: activityData.location || "Mock Location",
    date: new Date().toISOString(),
    checkInTime: activityData.activity.toLowerCase().includes('check in') ? new Date().toISOString() : undefined,
  };
  // mockActivityLogs.push(newLog); // If you want to modify shared mock array
  return Promise.resolve(newLog);
}

/**
 * Ends the current activity for an employee (e.g., records a check-out time). (MOCKED)
 * @param employeeId The ID of the employee.
 * @param endActivityData Optional data for ending the activity.
 */
export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: any): Promise<ActivityLog> {
  console.log(`MOCK API CALL: POST /api/activity-logs/${employeeId}/end-current-activity. Data:`, endActivityData);
  await new Promise(resolve => setTimeout(resolve, 300));
  // Find a mock check-in to "complete"
  const recentCheckIn = mockActivityLogs.find(log => log.employeeId === employeeId && log.checkInTime && !log.checkOutTime);
  if (recentCheckIn) {
    const updatedLog = { ...recentCheckIn, checkOutTime: new Date().toISOString(), activity: "Checked Out (mock)" };
    return Promise.resolve(updatedLog);
  }
  const newLog: ActivityLog = { // Fallback if no check-in found
    id: `log${Date.now()}`,
    employeeId,
    employeeName: "Mock Employee",
    activity: "Checked Out (mock)",
    location: "Mock Location",
    date: new Date().toISOString(),
    checkOutTime: new Date().toISOString(),
  };
  return Promise.resolve(newLog);
}
