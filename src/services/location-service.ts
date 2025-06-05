
// src/services/location-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
  address?: string;
  [key: string]: any; // Pour d'autres champs potentiels
}

export interface UpdateLocationPayload {
  latitude: number;
  longitude: number;
  timestamp?: string; // Assurez-vous que l'API attend cela si envoyé
}

// L'API peut retourner une structure différente, ex: { success: boolean, message: string }
// Pour l'instant, on suppose qu'elle retourne un objet qui peut être typé 'any' ou un type spécifique si connu
interface ApiUpdateLocationResponse {
    success: boolean;
    message?: string;
    // ...autres champs potentiels
}

interface ApiLocationData extends LocationData {}

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
  console.log(`API CALL: GET /location/${employeeId}`);
  try {
    const response = await apiClient<ApiLocationData | null>(`/location/${employeeId}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Location data for employee ${employeeId} not found.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getEmployeeLocation:", error);
    throw new HttpError(`Failed to get location for employee ${employeeId}.`, 0, null);
  }
}
