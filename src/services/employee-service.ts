
// src/services/employee-service.ts
import type { Employee } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// Interface for the expected location data from getCurrentEmployeeLocation
export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string; // Or Date, adjust as per your API
  // Add any other relevant fields your API returns
}

/**
 * Fetches all employees.
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('API CALL: GET /api/employees');
  try {
    const response = await apiClient('/employees');
    return await parseJsonResponse<Employee[]>(response);
  } catch (error) {
    console.error('Error fetching employees:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employees. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Fetches a single employee by their ID.
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  console.log(`API CALL: GET /api/employees/${id}`);
  try {
    const response = await apiClient(`/employees/${id}`);
    if (response.status === 404) return null;
    return await parseJsonResponse<Employee | null>(response);
  } catch (error) {
    console.error(`Error fetching employee by ID ${id}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employee by ID ${id}. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Fetches employees by their status.
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/status/${status}`);
  try {
    const response = await apiClient(`/employees/status/${status}`);
    return await parseJsonResponse<Employee[]>(response);
  } catch (error) {
    console.error(`Error fetching employees by status ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employees by status ${status}. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Updates the status of an employee.
 * @param employeeId The ID of the employee.
 * @param status The new status ('Active' or 'Inactive').
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<Employee> {
  console.log(`API CALL: PUT /api/employees/${employeeId}/status. New status: ${status}`);
  try {
    const response = await apiClient(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }), // Assuming API expects { "status": "Active" } in body
    });
    return await parseJsonResponse<Employee>(response);
  } catch (error) {
    console.error(`Error updating employee ${employeeId} status to ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to update employee status. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Hires a new user/employee.
 * The backend endpoint is /api/users/hire.
 * @param employeeData The data for the new employee.
 * Expects fields like name, email, department, jobTitle. avatarUrl is optional.
 */
export async function hireEmployee(employeeData: Omit<Employee, 'id' | 'status' | 'avatarUrl' | 'lastSeen' | 'latitude' | 'longitude'> & { avatarUrl?: string }): Promise<Employee> {
  console.log('API CALL: POST /api/users/hire.', employeeData);
  try {
    // Note: The endpoint is /users/hire as per the user's full API list.
    // The Employee type from frontend has 'name', while signup had 'firstName', 'lastName'.
    // Backend /api/users/hire must be able to handle the 'name' field or this needs adjustment.
    const response = await apiClient('/users/hire', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    return await parseJsonResponse<Employee>(response);
  } catch (error) {
    console.error('Error hiring employee:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to hire employee. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Fetches the current location of an employee.
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/current`);
  try {
    const response = await apiClient(`/employees/${employeeId}/location/current`);
    return await parseJsonResponse<EmployeeLocation>(response);
  } catch (error) {
    console.error(`Error fetching current location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch current employee location. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Fetches nearby employees for a given employee.
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/nearby`);
  try {
    const response = await apiClient(`/employees/${employeeId}/location/nearby`);
    return await parseJsonResponse<Employee[]>(response);
  } catch (error) {
    console.error(`Error fetching nearby employees for ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch nearby employees. ${error instanceof Error ? error.message : ''}`);
  }
}
