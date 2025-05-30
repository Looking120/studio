
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

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
  avatarUrl?: string; // Not in your schema, but often present

  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
  gender: string;      // Expecting "Male", "Female", "Other"
  hireDate: string;    // ISO string
  departmentId: string; // Guid as string
  positionId: string;   // Guid as string
  officeId: string;     // Guid as string
  // userId?: string;    // Optional: If linking to an existing AppUser (omitted for new employee form for now)
}

// The return type for hireEmployee should ideally match the backend's Employee entity structure.
// Or a simpler confirmation DTO. Let's assume it returns the created Employee-like object.
export interface HiredEmployeeResponse extends FrontendEmployee {
  // Add any specific fields returned by /api/users/hire if different from FrontendEmployee
  firstName: string; // To ensure these are present
  lastName: string;
}

// Backend DTO for Employee (example, adjust to your actual API response)
interface ApiEmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  departmentId?: string;
  departmentName?: string; // If your API provides it
  positionId?: string;
  positionName?: string; // If your API provides it
  currentStatus: number | string; // 0 for Active, 1 for Inactive, or string "Active"/"Inactive"
  avatarUrl?: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: string;
  // Add other fields from your C# Employee entity if they are part of the DTO
  employeeNumber?: string;
  phoneNumber?: string;
  // ... etc.
}

const mapApiEmployeeToFrontend = (emp: ApiEmployeeDto): FrontendEmployee => {
  let status: 'Active' | 'Inactive' = 'Inactive';
  if (typeof emp.currentStatus === 'string') {
    status = emp.currentStatus.toLowerCase() === 'active' ? 'Active' : 'Inactive';
  } else if (typeof emp.currentStatus === 'number') {
    status = emp.currentStatus === 0 ? 'Active' : 'Inactive';
  }

  return {
    id: emp.id,
    name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
    email: emp.email,
    department: emp.departmentName || emp.departmentId || 'N/A',
    jobTitle: emp.positionName || emp.positionId || 'N/A',
    status: status,
    avatarUrl: emp.avatarUrl || '',
    latitude: emp.latitude,
    longitude: emp.longitude,
    lastSeen: emp.lastSeen,
  };
};

/**
 * Fetches all employees. (GET /api/employees)
 */
export async function fetchEmployees(): Promise<FrontendEmployee[]> {
  console.log('API CALL: GET /api/employees');
  try {
    const response = await apiClient('/employees');
    const employeesData = await parseJsonResponse<ApiEmployeeDto[]>(response);
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error('Error fetching employees:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch employees. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches a single employee by their ID. (GET /api/employees/{id})
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`API CALL: GET /api/employees/${id}`);
  try {
    const response = await apiClient(`/employees/${id}`);
    if (response.status === 404) return null;
    const empData = await parseJsonResponse<ApiEmployeeDto | null>(response);
    if (!empData) return null;
    return mapApiEmployeeToFrontend(empData);
  } catch (error) {
    console.error(`Error fetching employee by ID ${id}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch employee by ID ${id}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches employees by their status. (GET /api/employees/status/{status})
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /api/employees/status/${status}`);
  // Backend might expect "Active" or "Inactive" or numeric values. Adjust if needed.
  const apiStatus = status;
  try {
    const response = await apiClient(`/employees/status/${apiStatus}`);
    const employeesData = await parseJsonResponse<ApiEmployeeDto[]>(response);
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error(`Error fetching employees by status ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch employees by status ${status}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Updates the status of an employee. (PUT /api/employees/{employeeId}/status)
 * Backend expects numeric status: 0 for Active, 1 for Inactive, or a string.
 * Check your backend API's DTO for this endpoint.
 * @param employeeId The ID of the employee.
 * @param status The new status ('Active' or 'Inactive').
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  // Assuming backend expects the string "Active" or "Inactive" or a DTO like { status: "Active" }
  // If backend expects numeric: const numericStatus = status === 'Active' ? 0 : 1;
  const payload = { status: status }; // Adjust DTO as per your backend
  console.log(`API CALL: PUT /api/employees/${employeeId}/status. New status: ${status}. Payload:`, payload);
  try {
    const response = await apiClient(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const empData = await parseJsonResponse<ApiEmployeeDto>(response);
    return mapApiEmployeeToFrontend(empData);
  } catch (error) {
    console.error(`Error updating employee ${employeeId} status to ${status}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to update employee status. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Hires a new user/employee. (POST /api/users/hire)
 * @param employeeData The data for the new employee, based on HireEmployeePayload.
 */
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<HiredEmployeeResponse> {
  console.log('API CALL: POST /api/users/hire. Payload:', employeeData);
  try {
    const response = await apiClient('/users/hire', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    const hiredEmpData = await parseJsonResponse<ApiEmployeeDto>(response); // Assuming response is Employee-like
    return {
      ...mapApiEmployeeToFrontend(hiredEmpData),
      firstName: hiredEmpData.firstName, // Ensure these are part of HiredEmployeeResponse
      lastName: hiredEmpData.lastName,
    } as HiredEmployeeResponse;
  } catch (error) {
    console.error('Error hiring employee:', error);
    if (error instanceof UnauthorizedError) throw error;
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const statusCode = error instanceof HttpError ? error.status : 500;
    const responseText = error instanceof HttpError ? error.responseText : "";
    throw new HttpError(`Failed to hire employee. API Error: ${errorMessage}`, statusCode, responseText);
  }
}

/**
 * Fetches the current location of an employee. (GET /api/employees/{employeeId}/location/current)
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/current`);
  try {
    const response = await apiClient(`/employees/${employeeId}/location/current`);
    return await parseJsonResponse<EmployeeLocation>(response); // Ensure EmployeeLocation matches backend DTO
  } catch (error) {
    console.error(`Error fetching current location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch current employee location. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches nearby employees for a given employee. (GET /api/employees/{employeeId}/location/nearby)
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /api/employees/${employeeId}/location/nearby`);
  try {
    const response = await apiClient(`/employees/${employeeId}/location/nearby`);
    const employeesData = await parseJsonResponse<ApiEmployeeDto[]>(response);
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error(`Error fetching nearby employees for ${employeeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch nearby employees. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}
