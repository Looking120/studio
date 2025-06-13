
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Interface for the raw API list item from GET /employees
interface ApiEmployeeListItem {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  employeeNumber?: string;
  email: string;
  phoneNumber?: string;
  departmentName?: string;
  positionTitle?: string;
  currentStatus: string; // Activity status from API like "Available", "Online"
  lastStatusChange?: string;
}

// Interface for the raw API detail from GET /employees/{id}
// This should reflect what the backend *actually* sends for a single employee.
// It might include more fields than the list item.
interface ApiEmployeeDetail {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  employeeNumber?: string;
  email: string;
  phoneNumber?: string;
  departmentName?: string;
  positionTitle?: string;
  employmentStatus?: 'Active' | 'Inactive' | string; // Employment status (e.g., "Active", "Inactive")
  currentStatus?: string; // Activity status (e.g., "Online", "Offline")
  avatarUrl?: string;
  officeId?: string;
  hireDate?: string;
  address?: string;
}


export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface HireEmployeePayload {
  userId?: string; // Optional: For hiring an existing user
  firstName: string;
  lastName: string;
  middleName?: string | undefined;
  email: string;
  employeeNumber: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  officeId: string;
  address?: string | undefined;
  phoneNumber?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: string | undefined;
  avatarUrl?: string | undefined;
}

// Assuming the hire endpoint returns something compatible with FrontendEmployee or ApiEmployeeDetail
interface ApiHiredEmployeeResponse extends FrontendEmployee {
    firstName: string; // Ensure these are present as per your form and backend
    lastName: string;
}


export async function fetchEmployees(): Promise<FrontendEmployee[]> {
  console.log('API CALL: GET /employees (fetchEmployees)');
  try {
    const response = await apiClient<ApiEmployeeListItem[]>('/employees', {
      method: 'GET',
    });
    return response.data.map(apiEmp => {
      let name = 'N/A';
      if (apiEmp.firstName && apiEmp.lastName) {
        name = `${apiEmp.firstName} ${apiEmp.lastName}`.trim();
      } else if (apiEmp.firstName) {
        name = apiEmp.firstName;
      } else if (apiEmp.lastName) {
        name = apiEmp.lastName;
      }

      return {
        id: apiEmp.id,
        name: name,
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, // Employment status is NOT in the /employees list API response
        currentStatus: apiEmp.currentStatus, // This is the Activity Status
        avatarUrl: undefined, // Not in the list API response
        officeId: undefined, // Not in the list API response
        hireDate: undefined, // Not in the list API response
      };
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployees:", error);
    throw new HttpError('Failed to fetch employees.', 0, null);
  }
}

export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`API CALL: GET /employees/${id}`);
  try {
    const response = await apiClient<ApiEmployeeDetail | null>(`/employees/${id}`, {
      method: 'GET',
    });
    
    const apiDetail = response.data;
    if (apiDetail) {
      let name = 'N/A';
      if (apiDetail.firstName && apiDetail.lastName) {
        name = `${apiDetail.firstName} ${apiDetail.lastName}`.trim();
      } else if (apiDetail.firstName) {
        name = apiDetail.firstName;
      } else if (apiDetail.lastName) {
        name = apiDetail.lastName;
      }

      return {
        id: apiDetail.id,
        name: name,
        email: apiDetail.email || 'N/A', 
        department: apiDetail.departmentName || undefined,
        jobTitle: apiDetail.positionTitle || undefined,
        // Map employmentStatus from API to frontend's status
        status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
        currentStatus: apiDetail.currentStatus, // Activity status
        avatarUrl: apiDetail.avatarUrl || undefined,
        officeId: apiDetail.officeId || undefined,
        hireDate: apiDetail.hireDate || undefined,
      };
    }
    return null;
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
    // Assuming the backend expects a payload similar to ApiEmployeeDetail for PUT
    // but the frontend sends FrontendEmployee structure. Adjust as needed.
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData, // This might need transformation if backend expects different field names
    });
    const apiDetail = response.data;
     return { // Remap response to FrontendEmployee
        id: apiDetail.id,
        name: `${apiDetail.firstName || ''} ${apiDetail.lastName || ''}`.trim() || undefined,
        email: apiDetail.email || 'N/A',
        department: apiDetail.departmentName || undefined,
        jobTitle: apiDetail.positionTitle || undefined,
        status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
        currentStatus: apiDetail.currentStatus,
        avatarUrl: apiDetail.avatarUrl || undefined,
        officeId: apiDetail.officeId || undefined,
        hireDate: apiDetail.hireDate || undefined,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error(`Unexpected error in updateEmployee for id ${id}:`, error);
    throw new HttpError(`Failed to update employee ${id}.`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive' | string): Promise<FrontendEmployee[]> {
  // This endpoint GET /employees/status/{status} seems to refer to ACTIVITY status based on cURL (e.g., /status/Online)
  // The frontend UI uses 'Active'/'Inactive' for EMPLOYMENT status.
  // There's a mismatch here if this function is intended for employment status.
  // For now, assuming 'status' passed here is an activity status string.
  console.log(`API CALL: GET /employees/status/${status} (querying by activity status)`);
  try {
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/status/${status}`, {
      method: 'GET',
    });
    return response.data.map(apiEmp => ({ 
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || 'Unknown Name'),
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, // Employment status not directly from this API
        currentStatus: apiEmp.currentStatus, // Activity status
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeesByStatus:", error);
    throw new HttpError(`Failed to fetch employees with activity status ${status}.`, 0, null);
  }
}

export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  // This function is intended to update EMPLOYMENT status ('Active'/'Inactive').
  console.log(`API CALL: PUT /employees/${employeeId}/status with employment status: ${status}`);
  try {
    // Assuming the backend endpoint PUT /employees/{employeeId}/status
    // expects the status string ("Active" or "Inactive") directly as the JSON body.
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${employeeId}/status`, { 
      method: 'PUT',
      body: status, // Send the string "Active" or "Inactive" as the body
      headers: { 'Content-Type': 'application/json' } // Ensure Axios sends it as a JSON string
    });
    const apiDetail = response.data; // Assuming the PUT returns the updated employee details
    return { // Remap response to FrontendEmployee
      id: apiDetail.id,
      name: `${apiDetail.firstName || ''} ${apiDetail.lastName || ''}`.trim() || undefined,
      email: apiDetail.email,
      department: apiDetail.departmentName || undefined,
      jobTitle: apiDetail.positionTitle || undefined,
      status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
      currentStatus: apiDetail.currentStatus,
      avatarUrl: apiDetail.avatarUrl || undefined,
      officeId: apiDetail.officeId || undefined,
      hireDate: apiDetail.hireDate || undefined,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateEmployeeStatus:", error);
    throw new HttpError(`Failed to update employment status for employee ${employeeId}. Error: ${error instanceof Error ? error.message : String(error)}`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

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

// This function seems to relate to activity status, not directly to the employee list's 'Active'/'Inactive' employment status.
// It is correctly fetching location based on an employeeId.
export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL: GET /employees/${employeeId}/location/current`);
  try {
    const response = await apiClient<EmployeeLocation>(`/employees/${employeeId}/location/current`, { 
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
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/${employeeId}/location/nearby`, {
      method: 'GET',
    });
    return response.data.map(apiEmp => ({ 
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || 'Unknown Name'),
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, 
        currentStatus: apiEmp.currentStatus, 
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getNearbyEmployees:", error);
    throw new HttpError(`Failed to get nearby employees for employee ${employeeId}.`, 0, null);
  }
}

