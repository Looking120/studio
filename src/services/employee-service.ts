// src/services/employee-service.ts
import type { Employee } from '@/lib/data';
import { apiClient, parseJsonResponse } from './api-client';
import { mockEmployees } from '@/lib/data'; // Temporary for placeholder

/**
 * Fetches all employees.
 * Corresponds to: GET /api/employees
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('API CALL: GET /api/employees - Placeholder implementation. Returning mock data.');
  // Replace this with your actual fetch call using apiClient:
  // const response = await apiClient('/employees');
  // return parseJsonResponse<Employee[]>(response);
  
  // Using mock data for now:
  return Promise.resolve(mockEmployees);
}

/**
 * Fetches a single employee by their ID.
 * Corresponds to: GET /api/employees/{id}
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  console.log(`API CALL: GET /api/employees/${id} - Placeholder implementation.`);
  // Replace with actual fetch:
  // const response = await apiClient(`/employees/${id}`);
  // return parseJsonResponse<Employee>(response);
  const employee = mockEmployees.find(emp => emp.id === id);
  return Promise.resolve(employee || null);
}

/**
 * Fetches employees by their status.
 * Corresponds to: GET /api/employees/status/{status}
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/status/${status} - Placeholder implementation.`);
  // Replace with actual fetch:
  // const response = await apiClient(`/employees/status/${status}`);
  // return parseJsonResponse<Employee[]>(response);
  const filtered = mockEmployees.filter(emp => emp.status === status);
  return Promise.resolve(filtered);
}

/**
 * Updates the status of an employee.
 * Corresponds to: PUT /api/employees/{employeeId}/status
 * @param employeeId The ID of the employee.
 * @param status The new status.
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<Employee> {
  console.log(`API CALL: PUT /api/employees/${employeeId}/status - Placeholder implementation.`);
  // Replace with actual fetch:
  // const response = await apiClient(`/employees/${employeeId}/status`, {
  //   method: 'PUT',
  //   body: JSON.stringify({ status }), // Assuming API expects this format
  // });
  // return parseJsonResponse<Employee>(response);

  // Mock implementation for local state update (if needed for UI demo without backend)
  const employeeIndex = mockEmployees.findIndex(emp => emp.id === employeeId);
  if (employeeIndex > -1) {
    mockEmployees[employeeIndex].status = status;
    return Promise.resolve(mockEmployees[employeeIndex]);
  }
  return Promise.reject(new Error('Employee not found for status update'));
}


/**
 * Hires a new user/employee.
 * Corresponds to: POST /api/users/hire
 * @param employeeData The data for the new employee.
 */
export async function hireEmployee(employeeData: Omit<Employee, 'id' | 'status' | 'avatarUrl'> & { avatarUrl?: string }): Promise<Employee> {
  console.log('API CALL: POST /api/users/hire - Placeholder implementation.');
  // Replace with actual fetch:
  // const response = await apiClient('/users/hire', { // Assuming '/users/hire' from your spec
  //   method: 'POST',
  //   body: JSON.stringify(employeeData),
  // });
  // return parseJsonResponse<Employee>(response);

  // Mock implementation:
  const newEmployee: Employee = {
    id: `emp${Math.floor(Math.random() * 10000)}`,
    ...employeeData,
    status: 'Active',
    avatarUrl: employeeData.avatarUrl || `https://placehold.co/40x40.png?text=${employeeData.name.substring(0,2)}`,
  };
  mockEmployees.push(newEmployee);
  return Promise.resolve(newEmployee);
}

// --- Location related functions for employees ---

/**
 * Fetches the current location of an employee.
 * Corresponds to: GET /api/employees/{employeeId}/location/current
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<any> { // Replace 'any' with actual location type
  console.log(`API CALL: GET /api/employees/${employeeId}/location/current - Placeholder implementation.`);
  // const response = await apiClient(`/employees/${employeeId}/location/current`);
  // return parseJsonResponse<any>(response);
  return Promise.resolve({ latitude: 0, longitude: 0, lastSeen: 'Now' }); // Mock response
}

/**
 * Fetches nearby employees for a given employee.
 * Corresponds to: GET /api/employees/{employeeId}/location/nearby
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/nearby - Placeholder implementation.`);
  // const response = await apiClient(`/employees/${employeeId}/location/nearby`);
  // return parseJsonResponse<Employee[]>(response);
  return Promise.resolve([]);
}

/**
 * Updates the location of an employee.
 * Corresponds to: PUT /api/location/{employeeId}
 * @param employeeId The ID of the employee.
 * @param locationData The new location data.
 */
export async function updateEmployeeLocation(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`API CALL: PUT /api/location/${employeeId} - Placeholder implementation.`);
  // const response = await apiClient(`/location/${employeeId}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(locationData),
  // });
  // return parseJsonResponse<any>(response);
  return Promise.resolve({ success: true });
}
