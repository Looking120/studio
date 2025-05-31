
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

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
  avatarUrl?: string; 

  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string; // ISO string "YYYY-MM-DDTHH:mm:ss.sssZ"
  gender: string;      // Expecting "Male", "Female", "Other"
  hireDate: string;    // ISO string
  departmentId: string; // Guid as string
  positionId: string;   // Guid as string
  officeId: string;     // Guid as string
}

export interface HiredEmployeeResponse extends FrontendEmployee {
  firstName: string; 
  lastName: string;
}

interface ApiEmployeeDto {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  departmentId?: string;
  departmentName?: string; 
  positionId?: string;
  positionName?: string; 
  currentStatus: number | string; 
  avatarUrl?: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: string;
  employeeNumber?: string;
  phoneNumber?: string;
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
  console.log('API CALL (axios): GET /employees');
  try {
    const response = await apiClient<ApiEmployeeDto[]>('/employees');
    const employeesData = response.data;
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error('Error fetching employees:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch employees. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches a single employee by their ID. (GET /api/employees/{id})
 * @param id The ID of the employee.
 */
export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`API CALL (axios): GET /employees/${id}`);
  try {
    const response = await apiClient<ApiEmployeeDto | null>(`/employees/${id}`);
    const empData = response.data;
    if (!empData) return null; // Handles 404 if interceptor allows it or API returns 200 with null
    return mapApiEmployeeToFrontend(empData);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Employee with ID ${id} not found.`);
        return null;
    }
    console.error(`Error fetching employee by ID ${id}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch employee by ID ${id}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches employees by their status. (GET /api/employees/status/{status})
 * @param status The status to filter by ('Active' or 'Inactive').
 */
export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`API CALL (axios): GET /employees/status/${status}`);
  const apiStatus = status;
  try {
    const response = await apiClient<ApiEmployeeDto[]>(`/employees/status/${apiStatus}`);
    const employeesData = response.data;
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error(`Error fetching employees by status ${status}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch employees by status ${status}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Updates the status of an employee. (PUT /api/employees/{employeeId}/status)
 * @param employeeId The ID of the employee.
 * @param status The new status ('Active' or 'Inactive').
 */
export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  const payload = { status: status }; 
  console.log(`API CALL (axios): PUT /employees/${employeeId}/status. New status: ${status}. Payload:`, payload);
  try {
    const response = await apiClient<ApiEmployeeDto>(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: payload,
    });
    const empData = response.data;
    return mapApiEmployeeToFrontend(empData);
  } catch (error) {
    console.error(`Error updating employee ${employeeId} status to ${status}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to update employee status. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Hires a new user/employee. (POST /api/users/hire)
 * @param employeeData The data for the new employee, based on HireEmployeePayload.
 */
export async function hireEmployee(employeeData: HireEmployeePayload): Promise<HiredEmployeeResponse> {
  console.log('API CALL (axios): POST /users/hire. Payload:', employeeData);
  try {
    const response = await apiClient<ApiEmployeeDto>('/users/hire', {
      method: 'POST',
      body: employeeData,
    });
    const hiredEmpData = response.data; 
    return {
      ...mapApiEmployeeToFrontend(hiredEmpData),
      firstName: hiredEmpData.firstName, 
      lastName: hiredEmpData.lastName,
    } as HiredEmployeeResponse;
  } catch (error) {
    console.error('Error hiring employee:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new HttpError(`Failed to hire employee. API Error: ${errorMessage}`, (error as any).status || 500, (error as HttpError)?.responseData || "");
  }
}

/**
 * Fetches the current location of an employee. (GET /api/employees/{employeeId}/location/current)
 * @param employeeId The ID of the employee.
 */
export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL (axios): GET /employees/${employeeId}/location/current`);
  try {
    const response = await apiClient<EmployeeLocation>(`/employees/${employeeId}/location/current`);
    return response.data; 
  } catch (error) {
    console.error(`Error fetching current location for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch current employee location. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches nearby employees for a given employee. (GET /api/employees/{employeeId}/location/nearby)
 * @param employeeId The ID of the employee.
 */
export async function getNearbyEmployees(employeeId: string): Promise<FrontendEmployee[]> {
  console.log(`API CALL (axios): GET /employees/${employeeId}/location/nearby`);
  try {
    const response = await apiClient<ApiEmployeeDto[]>(`/employees/${employeeId}/location/nearby`);
    const employeesData = response.data;
    return (employeesData || []).map(mapApiEmployeeToFrontend);
  } catch (error) {
    console.error(`Error fetching nearby employees for ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch nearby employees. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}
