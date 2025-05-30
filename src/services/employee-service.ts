
// src/services/employee-service.ts
import type { Employee } from '@/lib/data'; // This is the frontend Employee type
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// Interface for the expected location data from getCurrentEmployeeLocation
export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string; // Or Date, adjust as per your API
}

// Define a more specific payload for hiring, aligning with backend C# entities
export interface HireEmployeePayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  department: string; // Placeholder - will likely become departmentId: string (Guid)
  jobTitle: string;   // Placeholder - will likely become positionId: string (Guid)
  avatarUrl?: string;
  // Fields required by backend Employee entity
  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ" or "YYYY-MM-DD"
  gender: number; // Assuming 0 for Male, 1 for Female, etc. as per your Gender enum
  hireDate: string; // ISO string
  departmentId: string; // Guid as string
  positionId: string; // Guid as string
  // Add other fields as necessary: terminationDate, managerId etc.
}

// The return type for hireEmployee should ideally match the backend's Employee entity structure.
// For now, we'll use the frontend Employee type, but it might need adjustment.
export interface HiredEmployeeResponse extends Employee {
    // Add any specific fields returned by /api/users/hire if different from frontend Employee
    // For example, if it returns the full backend Employee structure.
    // For now, assuming it can be mapped to the frontend Employee type.
    firstName: string; // Ensure these are part of the response for mapping
    lastName: string;
}


/**
 * Fetches all employees.
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('API CALL: GET /api/employees');
  try {
    const response = await apiClient('/employees');
    const employeesData = await parseJsonResponse<any[]>(response); // Use any[] if backend structure is different
    // Map backend data to frontend Employee type if necessary
    return employeesData.map(emp => ({
        ...emp, // Spread raw employee data
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(), // Construct name if not present
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive', // Example mapping for status
        // Ensure other fields match the frontend Employee type
    })) as Employee[];
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
    const empData = await parseJsonResponse<any | null>(response);
    if (!empData) return null;
    // Map backend data to frontend Employee type
    return {
        ...empData,
        name: `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
        status: empData.currentStatus === 0 ? 'Active' : 'Inactive',
    } as Employee;
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
  // Backend expects 'Active' or 'Inactive', or perhaps an enum value. Adjust if needed.
  const apiStatus = status; // Or map: status === 'Active' ? 0 : 1;
  try {
    const response = await apiClient(`/employees/status/${apiStatus}`);
    const employeesData = await parseJsonResponse<any[]>(response);
    return employeesData.map(emp => ({
        ...emp,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive',
    })) as Employee[];
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
  // Backend might expect numeric enum for status, e.g., 0 for Active, 1 for Inactive
  const numericStatus = status === 'Active' ? 0 : 1; // Example mapping
  console.log(`API CALL: PUT /api/employees/${employeeId}/status. New status: ${status} (numeric: ${numericStatus})`);
  try {
    const response = await apiClient(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: numericStatus }), // Send numeric status if backend expects it
    });
    const empData = await parseJsonResponse<any>(response);
     return {
        ...empData,
        name: `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
        status: empData.currentStatus === 0 ? 'Active' : 'Inactive',
    } as Employee;
  } catch (error) {
    console.error(`Error updating employee ${employeeId} status to ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to update employee status. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Hires a new user/employee.
 * The backend endpoint is /api/users/hire.
 * @param employeeData The data for the new employee, based on HireEmployeePayload.
 */
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<HiredEmployeeResponse> {
  console.log('API CALL: POST /api/users/hire.', employeeData);
  try {
    const response = await apiClient('/users/hire', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    // Assuming the response from /api/users/hire is the created Employee object (backend structure)
    const hiredEmpData = await parseJsonResponse<any>(response);
    // Map to frontend HiredEmployeeResponse type
    return {
        ...hiredEmpData,
        id: hiredEmpData.id, // ensure id is mapped
        name: `${hiredEmpData.firstName || ''} ${hiredEmpData.lastName || ''}`.trim(),
        email: hiredEmpData.email,
        department: hiredEmpData.department?.name || hiredEmpData.departmentId, // Adjust based on actual response
        jobTitle: hiredEmpData.position?.title || hiredEmpData.positionId, // Adjust
        status: hiredEmpData.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: hiredEmpData.avatarUrl || '', // If backend provides it
    } as HiredEmployeeResponse;
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
    const employeesData = await parseJsonResponse<any[]>(response);
     return employeesData.map(emp => ({
        ...emp,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive',
    })) as Employee[];
  } catch (error) {
    console.error(`Error fetching nearby employees for ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch nearby employees. ${error instanceof Error ? error.message : ''}`);
  }
}
