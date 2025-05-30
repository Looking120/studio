
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
// and the user-provided schema for /api/users/hire endpoint
export interface HireEmployeePayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  avatarUrl?: string;

  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
  gender: string;      // Changed from number to string (e.g., "Male", "Female", "Other")
  hireDate: string;    // ISO string
  departmentId: string; // Guid as string
  positionId: string;   // Guid as string
  officeId: string;     // Added based on user schema, Guid as string
  userId?: string;      // Optional: If linking to an existing AppUser
}

// The return type for hireEmployee should ideally match the backend's Employee entity structure.
export interface HiredEmployeeResponse extends Employee {
    firstName: string;
    lastName: string;
}


/**
 * Fetches all employees.
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log('API CALL: GET /api/employees');
  try {
    const response = await apiClient('/employees');
    const employeesData = await parseJsonResponse<any[]>(response);
    return (employeesData || []).map(emp => ({
        id: emp.id, // Ensure id is mapped
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        email: emp.email,
        department: emp.department?.name || emp.departmentName || emp.departmentId || 'N/A', // Adjust based on actual response
        jobTitle: emp.position?.title || emp.positionName || emp.positionId || 'N/A', // Adjust
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive', // Example mapping for status
        avatarUrl: emp.avatarUrl || '',
        // Map other fields from your C# Employee entity if needed by the frontend Employee type
        latitude: emp.latitude,
        longitude: emp.longitude,
        lastSeen: emp.lastSeen,
    })) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employees. ${error instanceof Error ? error.message : String(error)}`);
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
    return {
        id: empData.id,
        name: `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
        email: empData.email,
        department: empData.department?.name || empData.departmentName || empData.departmentId || 'N/A',
        jobTitle: empData.position?.title || empData.positionName || empData.positionId || 'N/A',
        status: empData.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: empData.avatarUrl || '',
        latitude: empData.latitude,
        longitude: empData.longitude,
        lastSeen: empData.lastSeen,
    } as Employee;
  } catch (error) {
    console.error(`Error fetching employee by ID ${id}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employee by ID ${id}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches employees by their status.
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<Employee[]> {
  console.log(`API CALL: GET /api/employees/status/${status}`);
  const apiStatus = status;
  try {
    const response = await apiClient(`/employees/status/${apiStatus}`);
    const employeesData = await parseJsonResponse<any[]>(response);
    return (employeesData || []).map(emp => ({
        id: emp.id,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        email: emp.email,
        department: emp.department?.name || emp.departmentName || emp.departmentId || 'N/A',
        jobTitle: emp.position?.title || emp.positionName || emp.positionId || 'N/A',
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: emp.avatarUrl || '',
        latitude: emp.latitude,
        longitude: emp.longitude,
        lastSeen: emp.lastSeen,
    })) as Employee[];
  } catch (error) {
    console.error(`Error fetching employees by status ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch employees by status ${status}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates the status of an employee.
 * Backend expects numeric status: 0 for Active, 1 for Inactive.
 * @param employeeId The ID of the employee.
 * @param status The new status ('Active' or 'Inactive').
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<Employee> {
  const numericStatus = status === 'Active' ? 0 : 1;
  console.log(`API CALL: PUT /api/employees/${employeeId}/status. New status: ${status} (numeric: ${numericStatus})`);
  try {
    const response = await apiClient(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: numericStatus }),
    });
    const empData = await parseJsonResponse<any>(response);
     return {
        id: empData.id,
        name: `${empData.firstName || ''} ${empData.lastName || ''}`.trim(),
        email: empData.email,
        department: empData.department?.name || empData.departmentName || empData.departmentId || 'N/A',
        jobTitle: empData.position?.title || empData.positionName || empData.positionId || 'N/A',
        status: empData.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: empData.avatarUrl || '',
        latitude: empData.latitude,
        longitude: empData.longitude,
        lastSeen: empData.lastSeen,
    } as Employee;
  } catch (error) {
    console.error(`Error updating employee ${employeeId} status to ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to update employee status. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Hires a new user/employee.
 * The backend endpoint is /api/users/hire.
 * @param employeeData The data for the new employee, based on HireEmployeePayload.
 */
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<HiredEmployeeResponse> {
  console.log('API CALL: POST /api/users/hire. Payload:', employeeData);
  try {
    const response = await apiClient('/users/hire', { // Ensure this path is correct as per your API routes
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    const hiredEmpData = await parseJsonResponse<any>(response);
    return {
        id: hiredEmpData.id, 
        name: `${hiredEmpData.firstName || ''} ${hiredEmpData.lastName || ''}`.trim(),
        email: hiredEmpData.email,
        department: hiredEmpData.department?.name || hiredEmpData.departmentId || 'N/A', 
        jobTitle: hiredEmpData.position?.title || hiredEmpData.positionId || 'N/A', 
        status: hiredEmpData.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: hiredEmpData.avatarUrl || '', 
        firstName: hiredEmpData.firstName, // Make sure HiredEmployeeResponse includes these
        lastName: hiredEmpData.lastName,
    } as HiredEmployeeResponse;
  } catch (error) {
    console.error('Error hiring employee:', error);
    if (error instanceof UnauthorizedError) throw error;
    // Construct a more informative error message if the error object has a message
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to hire employee. API Error: ${errorMessage}`);
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
    throw new Error(`Failed to fetch current employee location. ${error instanceof Error ? error.message : String(error)}`);
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
     return (employeesData || []).map(emp => ({
        id: emp.id,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        email: emp.email,
        department: emp.department?.name || emp.departmentName || emp.departmentId || 'N/A',
        jobTitle: emp.position?.title || emp.positionName || emp.positionId || 'N/A',
        status: emp.currentStatus === 0 ? 'Active' : 'Inactive',
        avatarUrl: emp.avatarUrl || '',
        latitude: emp.latitude,
        longitude: emp.longitude,
        lastSeen: emp.lastSeen,
    })) as Employee[];
  } catch (error) {
    console.error(`Error fetching nearby employees for ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch nearby employees. ${error instanceof Error ? error.message : String(error)}`);
  }
}
