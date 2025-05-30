
// src/services/organization-service.ts
import type { Office } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// --- Office Related Types ---
export interface AddOfficePayload extends Omit<Office, 'id'> {}
export interface UpdateOfficePayload extends Partial<Omit<Office, 'id'>> {}


// --- Department Related Types ---
export interface Department {
  id: string;
  name: string;
  employeeCount?: number;
  // Add other relevant fields like headOfDepartment based on your actual API response
  [key: string]: any;
}
export interface AddDepartmentPayload {
  name: string;
  // Add other fields if required by your API for creating a department
}
export interface UpdateDepartmentPayload {
  name: string;
}

// --- Position Related Types ---
export interface Position {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  assignedEmployees?: number;
  // Add other relevant fields based on your actual API response
  [key: string]: any;
}
export interface AddPositionPayload {
  title: string;
  departmentId?: string; // Or whatever your API expects
}
export interface AssignPositionPayload {
  employeeId: string;
  // Add other relevant fields like startDate if your API expects them
}


// --- Office Endpoints ---

/**
 * Adds a new office to the organization.
 * @param officeData Data for the new office.
 */
export async function addOffice(officeData: AddOfficePayload): Promise<Office> {
  console.log('API CALL: POST /api/organization/offices. Data:', officeData);
  try {
    const response = await apiClient('/organization/offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    });
    return await parseJsonResponse<Office>(response);
  } catch (error) {
    console.error('Error adding office:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to add office. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches all offices of the organization.
 */
export async function fetchOffices(): Promise<Office[]> {
  console.log('API CALL: GET /api/organization/offices.');
  try {
    const response = await apiClient('/organization/offices');
    const offices = await parseJsonResponse<Office[]>(response);
    return offices || []; // Ensure it returns an array even if API sends null
  } catch (error) {
    console.error('Error fetching offices:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch offices. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches a specific office by its ID.
 * @param officeId The ID of the office.
 */
export async function fetchOfficeById(officeId: string): Promise<Office | null> {
  console.log(`API CALL: GET /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`);
    if (response.status === 404) return null;
    return await parseJsonResponse<Office | null>(response);
  } catch (error) {
    console.error(`Error fetching office by ID ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch office by ID ${officeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates an existing office.
 * @param officeId The ID of the office to update.
 * @param officeData The new data for the office.
 */
export async function updateOffice(officeId: string, officeData: UpdateOfficePayload): Promise<Office> {
  console.log(`API CALL: PUT /api/organization/offices/${officeId}. Data:`, officeData);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'PUT',
      body: JSON.stringify(officeData),
    });
    return await parseJsonResponse<Office>(response);
  } catch (error) {
    console.error(`Error updating office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to update office ${officeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes an office.
 * @param officeId The ID of the office to delete.
 */
export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    if (response.ok) { // 200 OK, 204 No Content are ok
        if (response.status === 204) {
             return { success: true, message: 'Office deleted successfully (No Content).' };
        }
        const result = await parseJsonResponse<{ success: boolean; message?: string }>(response).catch(() => null);
        return result || { success: true, message: 'Office deleted successfully.' };
    }
    // If not ok, try to parse error
    const errorData = await parseJsonResponse<any>(response).catch(() => ({ message: `Failed to delete office with status ${response.status}` }));
    throw new Error(errorData.message || `Failed to delete office ${officeId}`);
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to delete office ${officeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Department Endpoints ---

/**
 * Adds a new department to the organization.
 * @param departmentData Data for the new department.
 */
export async function addDepartment(departmentData: AddDepartmentPayload): Promise<Department> {
  console.log('API CALL: POST /api/organization/departments. Data:', departmentData);
  try {
    const response = await apiClient('/organization/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
    return await parseJsonResponse<Department>(response);
  } catch (error) {
    console.error('Error adding department:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to add department. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches all departments of the organization.
 */
export async function fetchDepartments(): Promise<Department[]> {
  console.log('API CALL: GET /api/organization/departments.');
  try {
    const response = await apiClient('/organization/departments');
    const departments = await parseJsonResponse<Department[]>(response);
    return departments || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch departments. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Updates an existing department.
 * Assumes endpoint PUT /api/organization/departments/{departmentId}
 * @param departmentId The ID of the department to update.
 * @param departmentData The new data for the department (e.g., { name: "New Name" }).
 */
export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`API CALL: PUT /api/organization/departments/${departmentId}. Data:`, departmentData);
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
    return await parseJsonResponse<Department>(response);
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to update department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Deletes a department.
 * Assumes endpoint DELETE /api/organization/departments/{departmentId}
 * @param departmentId The ID of the department to delete.
 */
export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/departments/${departmentId}.`);
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      if (response.status === 204) {
        return { success: true, message: 'Department deleted successfully (No Content).' };
      }
      const result = await parseJsonResponse<{ success: boolean; message?: string }>(response).catch(() => null);
      return result || { success: true, message: 'Department deleted successfully.' };
    }
    const errorData = await parseJsonResponse<any>(response).catch(() => ({ message: `Failed to delete department with status ${response.status}` }));
    throw new Error(errorData.message || `Failed to delete department ${departmentId}`);
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to delete department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}


// --- Position Endpoints ---

/**
 * Adds a new position to the organization.
 * @param positionData Data for the new position.
 */
export async function addPosition(positionData: AddPositionPayload): Promise<Position> {
  console.log('API CALL: POST /api/organization/positions. Data:', positionData);
  try {
    const response = await apiClient('/organization/positions', {
      method: 'POST',
      body: JSON.stringify(positionData),
    });
    return await parseJsonResponse<Position>(response);
  } catch (error) {
    console.error('Error adding position:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to add position. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches all positions in the organization.
 */
export async function fetchPositions(): Promise<Position[]> {
  console.log('API CALL: GET /api/organization/positions.');
  try {
    const response = await apiClient('/organization/positions');
    const positions = await parseJsonResponse<Position[]>(response);
    return positions || [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch positions. ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Assigns a position to an employee or updates an assignment.
 * @param positionId The ID of the position.
 * @param assignmentData Data for the assignment (e.g., employeeId, startDate).
 */
export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  console.log(`API CALL: PUT /api/organization/positions/${positionId}/assign. Data:`, assignmentData);
  try {
    const response = await apiClient(`/organization/positions/${positionId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
    return await parseJsonResponse<any>(response); // Adjust response type as needed
  } catch (error) {
    console.error(`Error assigning position ${positionId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

    