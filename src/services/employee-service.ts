
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
  userId?: string;
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

interface ApiHiredEmployeeResponse extends FrontendEmployee {
    firstName: string;
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
        name: name === 'N/A' ? undefined : name,
        email: apiEmp.email || undefined,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, // Employment status is not in GET /employees list
        currentStatus: apiEmp.currentStatus || undefined, // Activity Status
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
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
        name: name === 'N/A' ? undefined : name,
        email: apiDetail.email || undefined,
        department: apiDetail.departmentName || undefined,
        jobTitle: apiDetail.positionTitle || undefined,
        status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
        currentStatus: apiDetail.currentStatus || undefined,
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
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData,
    });
    const apiDetail = response.data;
     return {
        id: apiDetail.id,
        name: `${apiDetail.firstName || ''} ${apiDetail.lastName || ''}`.trim() || undefined,
        email: apiDetail.email || undefined,
        department: apiDetail.departmentName || undefined,
        jobTitle: apiDetail.positionTitle || undefined,
        status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
        currentStatus: apiDetail.currentStatus || undefined,
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

export async function fetchEmployeesByStatus(status: string): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/status/${status} (querying by activity status)`);
  try {
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/status/${status}`, {
      method: 'GET',
    });
    return response.data.map(apiEmp => ({
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || undefined),
        email: apiEmp.email || undefined,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined,
        currentStatus: apiEmp.currentStatus || undefined,
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

export async function updateEmployeeActivityStatus(employeeId: string, activityStatus: string): Promise<FrontendEmployee> {
  console.log(`[updateEmployeeActivityStatus] API CALL: PUT /employees/${employeeId}/status with activity status: "${activityStatus}" (Type: ${typeof activityStatus})`);
  try {
    const response = await apiClient<ApiEmployeeDetail | null>(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: activityStatus,
      headers: { 'Content-Type': 'application/json' }
    });

    // Handle 204 No Content (successful update, no body)
    if (response.status === 204) {
      console.log(`[updateEmployeeActivityStatus] Received 204 No Content for ${employeeId}. Update successful. Re-fetching employee for fresh data.`);
      const updatedEmployee = await fetchEmployeeById(employeeId);
      if (updatedEmployee) {
        return updatedEmployee;
      } else {
        console.error(`[updateEmployeeActivityStatus] Successfully updated status for ${employeeId} (204), but FAILED to re-fetch full employee details.`);
        throw new HttpError(`Activity status was updated on the server, but there was an issue refreshing the employee data. Please refresh the page.`, 500, { employeeId, issue: "Re-fetch failed after 204" });
      }
    }

    // Handle 200 OK with body
    const apiDetail = response.data;
    if (apiDetail) { // Should be true if status is 200
      return {
        id: apiDetail.id,
        name: `${apiDetail.firstName || ''} ${apiDetail.lastName || ''}`.trim() || undefined,
        email: apiDetail.email || undefined,
        department: apiDetail.departmentName || undefined,
        jobTitle: apiDetail.positionTitle || undefined,
        status: apiDetail.employmentStatus === 'Active' ? 'Active' : (apiDetail.employmentStatus === 'Inactive' ? 'Inactive' : undefined),
        currentStatus: apiDetail.currentStatus || activityStatus, 
        avatarUrl: apiDetail.avatarUrl || undefined,
        officeId: apiDetail.officeId || undefined,
        hireDate: apiDetail.hireDate || undefined,
      };
    }
    
    // Fallback for unexpected successful response without data (e.g. 200 OK but empty body)
    console.error(`[updateEmployeeActivityStatus] Update for ${employeeId} was successful (status ${response.status}) but no data was returned in the body.`);
    throw new HttpError(`Activity status update for ${employeeId} seemed successful, but no employee data was returned.`, response.status, null);

  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) {
      console.error(`[updateEmployeeActivityStatus] HttpError for ${employeeId}: ${error.message} (Status: ${(error as HttpError).status})`, (error as HttpError).responseData);
      throw error;
    }
    console.error("[updateEmployeeActivityStatus] Unexpected error:", error);
    throw new HttpError(`Failed to update activity status for employee ${employeeId}. Error: ${error instanceof Error ? error.message : String(error)}`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
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
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || undefined),
        email: apiEmp.email || undefined,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined,
        currentStatus: apiEmp.currentStatus || undefined,
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
