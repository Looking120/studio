
// src/services/location-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Doit correspondre aux champs de EmployeeLocationDto du backend (basé sur LocationHistory)
export interface LocationData {
  employeeId: string; 
  latitude: number;
  longitude: number;
  locationType?: string;
  timestamp: string; 
}

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  timestamp?: string;
  locationType?: string;
}

interface ApiUpdateLocationResponse {
    success: boolean;
    message?: string;
}

interface ApiLocationHistoryItem {
    id?: string; 
    employeeId: string;
    latitude: number;
    longitude: number;
    locationType?: string;
    timestamp: string;
}

export async function updateEmployeeLocation(employeeId: string, locationData: UpdateLocationPayload): Promise<ApiUpdateLocationResponse> {
  console.log(`API CALL: PUT /location/${employeeId} with data:`, locationData);
  try {
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
  console.log(`API CALL: GET /location/${employeeId} with params: PageNumber=1, PageSize=1`);
  try {
    const response = await apiClient<ApiLocationHistoryItem[]>(`/location/${employeeId}`, {
      method: 'GET',
      params: { PageNumber: 1, PageSize: 1 }, 
    });

    if (response.data && response.data.length > 0) {
      const latestLocationFromHistory = response.data[0];
      // Explicitly check if latitude and longitude are valid numbers
      if (latestLocationFromHistory.latitude != null && typeof latestLocationFromHistory.latitude === 'number' &&
          latestLocationFromHistory.longitude != null && typeof latestLocationFromHistory.longitude === 'number') {
        return {
          employeeId: latestLocationFromHistory.employeeId,
          latitude: latestLocationFromHistory.latitude,
          longitude: latestLocationFromHistory.longitude,
          locationType: latestLocationFromHistory.locationType,
          timestamp: latestLocationFromHistory.timestamp,
        };
      } else {
        console.warn(`[LocationService] Received location history for employee ${employeeId}, but latitude/longitude are invalid or missing in the record:`, latestLocationFromHistory);
        return null;
      }
    }
    console.warn(`No location history found for employee ${employeeId} via /location/${employeeId}. API returned:`, response.data);
    return null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Location data for employee ${employeeId} not found (404) via /location/${employeeId}.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error(`Unexpected error in getEmployeeLocation for ${employeeId}:`, error);
    throw new HttpError(`Failed to get location for employee ${employeeId}.`, 0, null);
  }
}

