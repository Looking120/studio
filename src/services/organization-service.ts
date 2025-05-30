
// src/services/organization-service.ts
import type { Office } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// --- Office Related Types ---
export interface AddOfficePayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number;
}
export interface UpdateOfficePayload extends Partial<AddOfficePayload> {}


// --- Department Related Types ---
export interface Department {
  id: string;
  name: string;
  employeeCount?: number;
  [key: string]: any;
}
export interface AddDepartmentPayload {
  name: string;
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
  [key: string]: any;
}
export interface AddPositionPayload {
  title: string;
  departmentId?: string;
}
export interface AssignPositionPayload {
  employeeId: string;
}


// --- Office Endpoints ---

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

export async function fetchOffices(): Promise<Office[]> {
  console.log('API CALL: GET /api/organization/offices.');
  try {
    const response = await apiClient('/organization/offices');
    const offices = await parseJsonResponse<Office[]>(response);
    return offices || [];
  } catch (error) {
    console.error('Error fetching offices:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch offices. ${error instanceof Error ? error.message : String(error)}`);
  }
}

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

export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
        if (response.status === 204) {
             return { success: true, message: 'Office deleted successfully (No Content).' };
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
            return result || { success: true, message: 'Office deleted successfully.' };
        }
        return { success: true, message: 'Office deleted successfully.' };
    }
    // If response is not OK, parseJsonResponse will throw a detailed error.
    // This error will be caught by the outer catch block.
    await parseJsonResponse<any>(response); 
    // The line below should not be reached if parseJsonResponse throws as expected.
    throw new Error(`API request to delete office failed with status ${response.status}, but parseJsonResponse did not throw an error.`);
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to delete office ${officeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Department Endpoints ---

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
    if (error instanceof Error && (error.message.includes("status 404") || error.message.toLowerCase().includes("not found"))) {
        throw new Error(`Update failed: The department update endpoint (PUT /api/organization/departments/${departmentId}) was not found (404). Please ensure this endpoint is available on the backend.`);
    }
    throw new Error(`Failed to update department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/departments/${departmentId}.`);
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      if (response.status === 204) { // HTTP 204 No Content
        return { success: true, message: 'Department deleted successfully.' };
      }
      // If there's a body (e.g. 200 OK with JSON), try to parse it.
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
        // If parsing fails or result is null, still consider it a success if response was OK.
        return result && typeof result.success === 'boolean' ? result : { success: true, message: 'Department deleted successfully (parsed response).' };
      }
      return { success: true, message: 'Department deleted successfully (non-JSON OK response).' };
    } else {
      // If response is not OK, parseJsonResponse will throw a detailed error.
      // This error will be caught by the outer catch block.
      await parseJsonResponse<any>(response);
      // The line below should ideally not be reached if parseJsonResponse throws.
      // Adding a fallback error if parseJsonResponse somehow doesn't throw despite non-OK status.
      throw new Error(`API request to delete department failed with status ${response.status}, but parseJsonResponse did not throw an error.`);
    }
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    // error.message here should be the detailed one from parseJsonResponse if the API call failed.
    throw new Error(`Failed to delete department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}


// --- Position Endpoints ---

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

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  console.log(`API CALL: PUT /api/organization/positions/${positionId}/assign. Data:`, assignmentData);
  try {
    const response = await apiClient(`/organization/positions/${positionId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
    });
    return await parseJsonResponse<any>(response);
  } catch (error) {
    console.error(`Error assigning position ${positionId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

