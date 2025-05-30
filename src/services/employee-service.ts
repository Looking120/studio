// src/services/employee-service.ts
import type { Employee } from '@/lib/data';
import { apiClient, parseJsonResponse } from './api-client';

/**
 * Fetches all employees.
 * Corresponds to: GET /api/employees
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('API CALL: GET /api/employees');
  const response = await apiClient('/employees');
  return parseJsonResponse<Employee[]>(response);
}

/**
 * Fetches a single employee by their ID.
 * Corresponds to: GET /api/employees/{id}
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  console.log(`API CALL: GET /api/employees/${id}`);
  const response = await apiClient(`/employees/${id}`);
  return parseJsonResponse<Employee>(response); // parseJsonResponse handles 404 by throwing, or returns null for 204. Adjust if API returns 200 with null body.
}

/**
 * Fetches employees by their status.
 * Corresponds to: GET /api/employees/status/{status}
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/status/${status}`);
  const response = await apiClient(`/employees/status/${status}`);
  return parseJsonResponse<Employee[]>(response);
}

/**
 * Updates the status of an employee.
 * Corresponds to: PUT /api/employees/{employeeId}/status
 * @param employeeId The ID of the employee.
 * @param status The new status.
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<Employee> {
  console.log(`API CALL: PUT /api/employees/${employeeId}/status. New status: ${status}`);
  const response = await apiClient(`/employees/${employeeId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }), 
  });
  return parseJsonResponse<Employee>(response);
}


/**
 * Hires a new user/employee.
 * Corresponds to: POST /api/users/hire (as per your spec, also listed under /api/users)
 * @param employeeData The data for the new employee.
 */
export async function hireEmployee(employeeData: Omit<Employee, 'id' | 'status' | 'avatarUrl' | 'lastSeen' | 'latitude' | 'longitude'> & { avatarUrl?: string }): Promise<Employee> {
  console.log('API CALL: POST /api/users/hire.', employeeData);
  const response = await apiClient('/users/hire', { 
    method: 'POST',
    body: JSON.stringify(employeeData),
  });
  return parseJsonResponse<Employee>(response);
}

/**
 * Fetches the current location of an employee.
 * Corresponds to: GET /api/employees/{employeeId}/location/current
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<{ latitude: number; longitude: number; lastSeen: string }> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/current`);
  const response = await apiClient(`/employees/${employeeId}/location/current`);
  return parseJsonResponse<{ latitude: number; longitude: number; lastSeen: string }>(response);
}

/**
 * Fetches nearby employees for a given employee.
 * Corresponds to: GET /api/employees/{employeeId}/location/nearby
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/nearby`);
  const response = await apiClient(`/employees/${employeeId}/location/nearby`);
  return parseJsonResponse<Employee[]>(response);
}

/**
 * Updates the location of an employee. (Shared endpoint, also in location-service.ts)
 * Corresponds to: PUT /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 * @param locationData The new location data.
 */
export async function updateEmployeeLocationApi(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`API CALL: PUT /api/location/${employeeId}. Data:`, locationData);
  const response = await apiClient(`/location/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(locationData),
  });
  return parseJsonResponse<any>(response); // Or handle no content response
}
