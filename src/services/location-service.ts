
// src/services/location-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Doit correspondre aux champs de EmployeeLocationDto du backend (basé sur LocationHistory)
export interface LocationData {
  employeeId: string; // L'API backend retournera l'ID de l'employé
  latitude: number;
  longitude: number;
  locationType?: string;
  timestamp: string; // L'API retourne une chaîne de caractères ISO
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

// Cette interface est pour ce que le backend /api/location/{id} retourne dans sa liste
// Basé sur EmployeeLocationDto qui vient de LocationHistory
interface ApiLocationHistoryItem {
    id?: string; // L'historique de localisation a son propre ID
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
    // L'endpoint backend /api/location/{employeeId} retourne une liste paginée d'EmployeeLocationDto.
    // Nous demandons la première page avec un seul item pour obtenir le plus récent (en supposant un tri par défaut côté backend).
    const response = await apiClient<ApiLocationHistoryItem[]>(`/location/${employeeId}`, {
      method: 'GET',
      params: { PageNumber: 1, PageSize: 1 },
    });

    if (response.data && response.data.length > 0) {
      const latestLocationFromHistory = response.data[0];
      // Mapper les champs de ApiLocationHistoryItem vers LocationData
      return {
        employeeId: latestLocationFromHistory.employeeId, // ou employeeId de l'argument de la fonction
        latitude: latestLocationFromHistory.latitude,
        longitude: latestLocationFromHistory.longitude,
        locationType: latestLocationFromHistory.locationType,
        timestamp: latestLocationFromHistory.timestamp,
      };
    }
    // Si aucune donnée d'historique n'est retournée
    console.warn(`No location history found for employee ${employeeId} via /location/${employeeId}.`);
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
