
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface HireEmployeePayload {
  userId?: string; // For hiring an existing user

  // Personal details, potentially redundant if userId is provided and backend fetches them
  // But the form collects them, so we can send them. Backend can choose to ignore.
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;

  // Employee-specific details
  employeeNumber: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  officeId: string;

  // Optional details
  address?: string | undefined;
  phoneNumber?: string | undefined;
  dateOfBirth?: string | undefined; // Should be ISO string if provided
  gender?: string | undefined;
  avatarUrl?: string | undefined;
}

// Supposons que l'API retourne des types compatibles
interface ApiEmployee extends FrontendEmployee {
    // Potentially more fields from API for a single employee view, e.g.
    // hireDate?: string; // Already added to FrontendEmployee
    phoneNumber?: string;
    address?: string;
    // Add other fields if your API /employees/{id} returns more details
}
interface ApiHiredEmployeeResponse extends ApiEmployee { // L'API peut avoir des champs supplémentaires
    firstName: string; // Assurez-vous que ces champs sont bien dans la réponse API
    lastName: string;
}
interface ApiEmployeeLocation extends EmployeeLocation {}

export async function fetchEmployees(): Promise<FrontendEmployee[]> {
  console.log('API CALL: GET /employees');
  try {
    const response = await apiClient<ApiEmployee[]>('/employees', {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployees:", error);
    throw new HttpError('Failed to fetch employees.', 0, null);
  }
}

export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`API CALL: GET /employees/${id}`);
  try {
    const response = await apiClient<ApiEmployee | null>(`/employees/${id}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Employee with id ${id} not found.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeeById:", error);
    throw new HttpError(`Failed to fetch employee ${id}.`, 0, null);
  }
}

export async function updateEmployee(id: string, employeeData: Partial<Omit<FrontendEmployee, 'id'>>): Promise<FrontendEmployee> {
  console.log(`API CALL: PUT /employees/${id} with data:`, employeeData);
  try {
    const response = await apiClient<ApiEmployee>(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error(`Unexpected error in updateEmployee for id ${id}:`, error);
    throw new HttpError(`Failed to update employee ${id}.`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/status/${status}`);
  try {
    const response = await apiClient<ApiEmployee[]>(`/employees/status/${status}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeesByStatus:", error);
    throw new HttpError(`Failed to fetch employees with status ${status}.`, 0, null);
  }
}

export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  console.log(`API CALL: PUT /employees/${employeeId}/status with status: ${status}`);
  try {
    const response = await apiClient<ApiEmployee>(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: status, // Send the status string directly
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateEmployeeStatus:", error);
    throw new HttpError(`Failed to update status for employee ${employeeId}. Error: ${error instanceof Error ? error.message : String(error)}`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

// Utilise l'endpoint /users/hire comme spécifié
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<ApiHiredEmployeeResponse> {
  console.log('API CALL: POST /users/hire with data:', JSON.stringify(employeeData, null, 2));
  try {
    const response = await apiClient<ApiHiredEmployeeResponse>('/users/hire', {
      method: 'POST',
      body: employeeData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in hireEmployee:", error);
    throw new HttpError('Failed to hire employee.', (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL: GET /employees/${employeeId}/location/current`);
  try {
    const response = await apiClient<ApiEmployeeLocation>(`/employees/${employeeId}/location/current`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getCurrentEmployeeLocation:", error);
    throw new HttpError(`Failed to get current location for employee ${employeeId}.`, 0, null);
  }
}

export async function getNearbyEmployees(employeeId: string): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/${employeeId}/location/nearby`);
  try {
    const response = await apiClient<ApiEmployee[]>(`/employees/${employeeId}/location/nearby`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getNearbyEmployees:", error);
    throw new HttpError(`Failed to get nearby employees for employee ${employeeId}.`, 0, null);
  }
}
