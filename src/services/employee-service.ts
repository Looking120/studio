
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface HireEmployeePayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  avatarUrl?: string;
  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string; 
  gender: string;
  hireDate: string; 
  departmentId: string;
  positionId: string;
  officeId: string;
}

// Supposons que l'API retourne des types compatibles
interface ApiEmployee extends FrontendEmployee {}
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
    // Le payload pour cet endpoint spécifique peut être juste { status: string }
    // ou l'API peut s'attendre à un objet vide si le statut est dans l'URL.
    // Pour l'instant, on envoie un objet avec le statut.
    const response = await apiClient<ApiEmployee>(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: { status: status }, // Assurez-vous que le backend attend ce format
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateEmployeeStatus:", error);
    throw new HttpError(`Failed to update status for employee ${employeeId}.`, 0, null);
  }
}

// Utilise l'endpoint /users/hire comme spécifié
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<ApiHiredEmployeeResponse> {
  console.log('API CALL: POST /users/hire with data:', employeeData);
  try {
    const response = await apiClient<ApiHiredEmployeeResponse>('/users/hire', {
      method: 'POST',
      body: employeeData,
    });
    // Assurez-vous que ApiHiredEmployeeResponse est compatible avec FrontendEmployee pour la page d'ajout
    // La page AddEmployeePage s'attend à ce que `newEmployee.firstName` et `lastName` existent.
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in hireEmployee:", error);
    throw new HttpError('Failed to hire employee.', 0, null);
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
