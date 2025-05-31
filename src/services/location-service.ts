
// src/services/location-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

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

/**
 * Updates the location for a specific employee. (PUT /api/location/{employeeId})
 * @param employeeId The ID of the employee.
 * @param locationData The new latitude and longitude, and any other relevant data.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: UpdateLocationPayload): Promise<any> {
  console.log(`API CALL (axios): PUT /location/${employeeId}. Data:`, locationData);
  if (!employeeId) {
    throw new Error("employeeId is required to update location.");
  }
  try {
    const response = await apiClient<any>(`/location/${employeeId}`, {
      method: 'PUT',
      body: locationData,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to update employee location for ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches the location for a specific employee. (GET /api/location/{employeeId})
 * @param employeeId The ID of the employee.
 */
export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  console.log(`API CALL (axios): GET /location/${employeeId}.`);
  if (!employeeId) {
    throw new Error("employeeId is required to get location.");
  }
  try {
    const response = await apiClient<LocationData | null>(`/location/${employeeId}`);
    if (response.status === 404 && !response.data) { // Axios might still return data for 404 if API does
        return null;
    }
    return response.data;
  } catch (error) {
     if (error instanceof HttpError && error.status === 404) {
        console.warn(`Location for employee ${employeeId} not found.`);
        return null;
    }
    console.error(`Error fetching location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch employee location for ${employeeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}
