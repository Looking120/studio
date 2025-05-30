
// src/services/location-service.ts
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string; 
  address?: string; 
  [key: string]: any;
}

/**
 * Updates the location for a specific employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param locationData The new latitude and longitude.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`MOCK API CALL: PUT /api/location/${employeeId}. Data:`, locationData);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve({ success: true, message: `Location for ${employeeId} updated (mock)` }); 
}

/**
 * Fetches the location for a specific employee. (MOCKED)
 * @param employeeId The ID of the employee.
 */
export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`MOCK API CALL: GET /api/location/${employeeId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const mockLocation: LocationData = {
    latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
    longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
    timestamp: new Date().toISOString(),
    address: "Mock Address, Mock City",
    employeeId: employeeId,
  };
  return Promise.resolve(mockLocation);
}
