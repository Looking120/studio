
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Interface pour la réponse de l'API GET /employees (liste)
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

// Interface pour la réponse de l'API GET /employees/{id} (détail)
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
  employmentStatus?: 'Active' | 'Inactive' | string; // Employment status
  currentStatus?: string; // Activity status
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
        name: name,
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, // Employment status not provided by this API endpoint
        currentStatus: apiEmp.currentStatus, // Activity status
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
      return {
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

export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/status/${status}`); // This likely refers to employment status
  try {
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/status/${status}`, {
      method: 'GET',
    });
    // Assuming this endpoint returns employees based on their EMPLOYMENT status
    return response.data.map(apiEmp => ({ 
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || 'Unknown Name'),
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: status, // Setting employment status based on the query
        currentStatus: apiEmp.currentStatus, // Activity status
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeesByStatus:", error);
    throw new HttpError(`Failed to fetch employees with status ${status}.`, 0, null);
  }
}

export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  console.log(`API CALL: PUT /employees/${employeeId}/status with status: ${status}`); // This should be employment status
  try {
    // This API is expected to update the EMPLOYMENT status
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${employeeId}/status`, { 
      method: 'PUT',
      body: { employmentStatus: status }, // Assuming backend expects employmentStatus
    });
    const apiDetail = response.data;
    return {
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
    throw new HttpError(`Failed to update status for employee ${employeeId}. Error: ${error instanceof Error ? error.message : String(error)}`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
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
    // This endpoint response structure is different from LocationData in location-service.
    // It should return something compatible with EmployeeLocation.
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
        status: undefined, // Employment status not in this API's list item
        currentStatus: apiEmp.currentStatus, // Activity status
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
