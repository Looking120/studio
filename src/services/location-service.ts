
// src/services/location-service.ts
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used in mock

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
  address?: string;
  [key: string]: any;
}

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export async function updateEmployeeLocation(employeeId: string, locationData: UpdateLocationPayload): Promise<any> {
  console.log(`MOCK updateEmployeeLocation for employee ${employeeId} with data:`, locationData);
  return Promise.resolve({ success: true, message: "Mock location updated successfully." });
}

export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`MOCK getEmployeeLocation for employee ${employeeId}`);
  // Simulate finding a location for a known mock employee
  if (employeeId.startsWith("emp") || employeeId.startsWith("mock")) {
    return Promise.resolve({
      latitude: 34.0522,
      longitude: -118.2437,
      timestamp: new Date().toISOString(),
      address: "Mock Address, Los Angeles, CA",
    });
  }
  return Promise.resolve(null);
}
