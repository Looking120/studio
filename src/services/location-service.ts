// src/services/location-service.ts
import { apiClient, parseJsonResponse } from './api-client';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string; // Optional: if your API returns it
  address?: string; // Optional: if your API returns it
}

/**
 * Updates the location for a specific employee.
 * Corresponds to: PUT /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 * @param locationData The new latitude and longitude.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`API CALL: PUT /api/location/${employeeId} - Placeholder. Data:`, locationData);
  // const response = await apiClient(`/location/${employeeId}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(locationData),
  // });
  // return parseJsonResponse<any>(response); // Or handle specific response type / no content
  return Promise.resolve({ success: true, message: 'Location updated (mock)' });
}

/**
 * Fetches the location for a specific employee.
 * Corresponds to: GET /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 */
export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`API CALL: GET /api/location/${employeeId} - Placeholder.`);
  // const response = await apiClient(`/location/${employeeId}`);
  // return parseJsonResponse<LocationData>(response);
  return Promise.resolve(null); // Or mock data: { latitude: 0, longitude: 0 }
}
