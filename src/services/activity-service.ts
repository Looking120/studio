
// src/services/activity-service.ts
import type { ActivityLog as FrontendActivityLog } from '@/lib/data';
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used in mock

export interface LogActivityPayload {
  activityType: string;
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

export async function fetchActivityLogsByEmployee(employeeId: string, startDate: string, endDate: string): Promise<FrontendActivityLog[]> {
  console.log(`MOCK fetchActivityLogsByEmployee for employee ${employeeId} from ${startDate} to ${endDate}`);
  // Simulate returning some mock logs or an empty array
  const mockLog: FrontendActivityLog = {
    id: `mocklog-${Date.now()}`,
    employeeId: employeeId,
    employeeName: `Mock Employee ${employeeId.substring(0,3)}`,
    activityType: "Checked In",
    startTime: new Date().toISOString(),
    location: "Mock Office",
    description: "Mock activity log entry"
  };
  if (employeeId === "emp001") { // Example: return one log for a specific employee
      return Promise.resolve([mockLog]);
  }
  return Promise.resolve([]);
}

export async function addEmployeeActivity(employeeId: string, activityData: LogActivityPayload): Promise<FrontendActivityLog> {
  console.log(`MOCK addEmployeeActivity for employee ${employeeId} with data:`, activityData);
  const newLog: FrontendActivityLog = {
    id: `mocklog-new-${Date.now()}`,
    employeeId: employeeId,
    employeeName: `Mock Employee ${employeeId.substring(0,3)}`,
    activityType: activityData.activityType,
    description: activityData.description || 'Mocked new activity',
    location: activityData.location || 'Mock Location',
    startTime: new Date().toISOString(),
  };
  return Promise.resolve(newLog);
}

export async function endCurrentEmployeeActivity(employeeId: string, endActivityData?: EndActivityPayload): Promise<FrontendActivityLog | null> {
  console.log(`MOCK endCurrentEmployeeActivity for employee ${employeeId} with data:`, endActivityData);
  // Simulate ending an activity and returning the updated log
  const endedLog: FrontendActivityLog = {
    id: `mocklog-ended-${Date.now()}`,
    employeeId: employeeId,
    employeeName: `Mock Employee ${employeeId.substring(0,3)}`,
    activityType: "Checked Out", // Assuming this is the typical end activity
    description: endActivityData?.notes || 'Mocked activity ended',
    location: 'Mock Location',
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    endTime: new Date().toISOString(),
  };
  return Promise.resolve(endedLog);
}
