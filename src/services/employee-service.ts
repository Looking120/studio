
// src/services/employee-service.ts
import type { Employee } from '@/lib/data';
import { mockEmployees } from '@/lib/data'; // Import mock data
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed

/**
 * Fetches all employees. (MOCKED)
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('MOCK API CALL: GET /api/employees');
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  return Promise.resolve([...mockEmployees]); // Return a copy
}

/**
 * Fetches a single employee by their ID. (MOCKED)
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<Employee | null> {
  console.log(`MOCK API CALL: GET /api/employees/${id}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const employee = mockEmployees.find(emp => emp.id === id);
  return Promise.resolve(employee || null);
}

/**
 * Fetches employees by their status. (MOCKED)
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<Employee[]> {
  console.log(`MOCK API CALL: GET /api/employees/status/${status}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const filtered = mockEmployees.filter(emp => emp.status === status);
  return Promise.resolve(filtered);
}

/**
 * Updates the status of an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param status The new status.
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<Employee> {
  console.log(`MOCK API CALL: PUT /api/employees/${employeeId}/status. New status: ${status}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const employeeIndex = mockEmployees.findIndex(emp => emp.id === employeeId);
  if (employeeIndex !== -1) {
    // In a real scenario, you might update a local cache or re-fetch.
    // For mock, just return a modified-like object.
    const updatedEmployee = { ...mockEmployees[employeeIndex], status };
    return Promise.resolve(updatedEmployee);
  }
  return Promise.reject(new Error('Mock: Employee not found for status update.'));
}


/**
 * Hires a new user/employee. (MOCKED)
 * @param employeeData The data for the new employee.
 */
export async function hireEmployee(employeeData: Omit<Employee, 'id' | 'status' | 'avatarUrl' | 'lastSeen' | 'latitude' | 'longitude'> & { avatarUrl?: string }): Promise<Employee> {
  console.log('MOCK API CALL: POST /api/users/hire.', employeeData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newEmployee: Employee = {
    id: `emp${Date.now()}`,
    name: employeeData.name,
    email: employeeData.email,
    department: employeeData.department,
    jobTitle: employeeData.jobTitle,
    status: 'Active',
    avatarUrl: employeeData.avatarUrl || `https://placehold.co/40x40.png?text=${employeeData.name.substring(0,2)}`,
  };
  // mockEmployees.push(newEmployee); // If you want to modify the shared mock array
  return Promise.resolve(newEmployee);
}

/**
 * Fetches the current location of an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<{ latitude: number; longitude: number; lastSeen: string }> {
  console.log(`MOCK API CALL: GET /api/employees/${employeeId}/location/current`);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve({ latitude: 34.0522, longitude: -118.2437, lastSeen: "just now (mock)" });
}

/**
 * Fetches nearby employees for a given employee. (MOCKED)
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<Employee[]> {
  console.log(`MOCK API CALL: GET /api/employees/${employeeId}/location/nearby`);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve(mockEmployees.slice(0, 2)); // Return first 2 as mock nearby
}

/**
 * Updates the location of an employee. (MOCKED)
 * @param employeeId The ID of the employee.
 * @param locationData The new location data.
 */
export async function updateEmployeeLocationApi(employeeId: string, locationData: { latitude: number; longitude: number }): Promise<any> {
  console.log(`MOCK API CALL: PUT /api/location/${employeeId}. Data:`, locationData);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve({ success: true, message: "Location updated (mock)" }); 
}
