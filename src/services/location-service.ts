
// src/services/location-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Updated to match GET /employees/{employeeId}/location/current response
export interface LocationData {
  employeeId: string;
  employeeName: string; // Provided by the new endpoint
  latitude: number;
  longitude: number;
  locationType?: string; // Make optional as it might not always be present
  timestamp: string; // API returns string
}

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  timestamp?: string; 
  locationType?: string; // Add if your PUT /location/{employeeId} expects it
}

interface ApiUpdateLocationResponse {
    success: boolean;
    message?: string;
}

export async function updateEmployeeLocation(employeeId: string, locationData: UpdateLocationPayload): Promise<ApiUpdateLocationResponse> {
  console.log(`API CALL: PUT /location/${employeeId} with data:`, locationData);
  try {
    // This endpoint might be different from what you're using in your Swagger test (PUT /api/employees/{id}/location)
    // Ensure this is the correct endpoint for updating location in your backend.
    const response = await apiClient<ApiUpdateLocationResponse>(`/location/${employeeId}`, {
      method: 'PUT',
      body: locationData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateEmployeeLocation:", error);
    throw new HttpError(`Failed to update location for employee ${employeeId}.`, 0, null);
  }
}

export async function getEmployeeLocation(employeeId: string): Promise<LocationData | null> {
  // Using the endpoint you confirmed works: GET /api/employees/{employeeId}/location/current
  console.log(`API CALL: GET /employees/${employeeId}/location/current`);
  try {
    const response = await apiClient<LocationData | null>(`/employees/${employeeId}/location/current`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Location data for employee ${employeeId} not found via /employees/{id}/location/current.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getEmployeeLocation:", error);
    throw new HttpError(`Failed to get location for employee ${employeeId} via /employees/{id}/location/current.`, 0, null);
  }
}
