
// src/services/location-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
  address?: string; // If your backend provides geocoded address
  // Add any other fields returned by /api/location/{employeeId}
  [key: string]: any;
}

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  // Add any other fields your backend PUT /api/location/{employeeId} expects
  timestamp?: string; // Often set by backend, but can be client-provided
}

/**
 * Updates the location for a specific employee. (PUT /api/location/{employeeId})
 * @param employeeId The ID of the employee.
 * @param locationData The new latitude and longitude, and any other relevant data.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: UpdateLocationPayload): Promise<any> {
  console.log(`API CALL: PUT /api/location/${employeeId}. Data:`, locationData);
  if (!employeeId) {
    throw new Error("employeeId is required to update location.");
  }
  try {
    const response = await apiClient(`/location/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
    // Assuming backend returns a success message or the updated location data
    return await parseJsonResponse<any>(response);
  } catch (error) {
    console.error(`Error updating location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to update employee location for ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches the location for a specific employee. (GET /api/location/{employeeId})
 * @param employeeId The ID of the employee.
 */
export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`API CALL: GET /api/location/${employeeId}.`);
  if (!employeeId) {
    throw new Error("employeeId is required to get location.");
  }
  try {
    const response = await apiClient(`/location/${employeeId}`);
    if (response.status === 404) return null;
    return await parseJsonResponse<LocationData>(response);
  } catch (error) {
    console.error(`Error fetching location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch employee location for ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}
