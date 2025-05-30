// src/services/location-service.ts
import { apiClient, parseJsonResponse } from './api-client';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string; // Optional: if your API returns it
  address?: string; // Optional: if your API returns it
  // Add other relevant fields from your API response
  [key: string]: any;
}

/**
 * Updates the location for a specific employee.
 * Corresponds to: PUT /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 * @param locationData The new latitude and longitude.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`API CALL: PUT /api/location/${employeeId}. Data:`, locationData);
  const response = await apiClient(`/location/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(locationData),
  });
  // If API returns 204 No Content, parseJsonResponse will return null.
  // Adjust if a specific success object is expected.
  return parseJsonResponse<any>(response); 
}

/**
 * Fetches the location for a specific employee.
 * Corresponds to: GET /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 */
export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`API CALL: GET /api/location/${employeeId}.`);
  const response = await apiClient(`/location/${employeeId}`);
  return parseJsonResponse<LocationData>(response);
}
