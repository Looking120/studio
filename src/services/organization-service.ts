
// src/services/organization-service.ts
import type { Office } from '@/lib/data';
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

// --- Office Related Types ---
export interface AddOfficePayload {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number;
}
export interface UpdateOfficePayload extends Partial<AddOfficePayload> {}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number; // Optional, if your backend provides it
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}


// --- Department Related Types ---
export interface Department {
  id: string;
  name: string;
  employeeCount?: number; // Assuming backend DTO might provide this
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
  departmentName?: string; // Assuming backend DTO might provide this
  assignedEmployees?: number; // Assuming backend DTO might provide this
}
export interface AddPositionPayload {
  title: string;
  departmentId?: string; // Assuming GUID as string
}
export interface AssignPositionPayload {
  employeeId: string; // Assuming GUID as string
}


// --- Office Endpoints ---

export async function addOffice(officeData: AddOfficePayload): Promise<Office> {
  console.log('API CALL: POST /api/organization/offices. Data:', officeData);
  try {
    const response = await apiClient('/organization/offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    });
    const officeDto = await parseJsonResponse<any>(response);
    return {
        id: officeDto.id,
        name: officeDto.name,
        address: officeDto.address,
        latitude: officeDto.center?.y || officeDto.latitude, // Adapt to your OfficeDto structure
        longitude: officeDto.center?.x || officeDto.longitude, // Adapt to your OfficeDto structure
        headcount: officeDto.headcount,
    } as Office;
  } catch (error) {
    console.error('Error adding office:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to add office. ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchOffices(): Promise<PaginatedResult<Office>> {
  console.log('API CALL: GET /api/organization/offices.');
  try {
    // Assuming your API supports pagination query params like ?pageNumber=1&pageSize=10
    // For now, fetching without specific pagination params, relying on API defaults.
    const response = await apiClient('/organization/offices'); 
    const paginatedResultDto = await parseJsonResponse<PaginatedResult<any>>(response);
    
    return {
        ...paginatedResultDto,
        items: (paginatedResultDto.items || []).map(officeDto => ({
            id: officeDto.id,
            name: officeDto.name,
            address: officeDto.address,
            latitude: officeDto.center?.y || officeDto.latitude,
            longitude: officeDto.center?.x || officeDto.longitude,
            headcount: officeDto.headcount,
        })) as Office[],
    };
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
    const officeDto = await parseJsonResponse<any | null>(response);
    if (!officeDto) return null;
    return {
        id: officeDto.id,
        name: officeDto.name,
        address: officeDto.address,
        latitude: officeDto.center?.y || officeDto.latitude,
        longitude: officeDto.center?.x || officeDto.longitude,
        headcount: officeDto.headcount,
    } as Office;
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
    const officeDto = await parseJsonResponse<any>(response);
     return {
        id: officeDto.id,
        name: officeDto.name,
        address: officeDto.address,
        latitude: officeDto.center?.y || officeDto.latitude,
        longitude: officeDto.center?.x || officeDto.longitude,
        headcount: officeDto.headcount,
    } as Office;
  } catch (error) {
    console.error(`Error updating office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new Error(`Update failed: The endpoint to update office ${officeId} (PUT /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`);
    }
    throw new Error(`Failed to update office ${officeId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    if (response.ok) { // Handles 200, 204
        if (response.status === 204) {
             return { success: true, message: 'Office deleted successfully (No Content).' };
        }
        // Try to parse if there's a body (e.g., for 200 OK)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json") && response.body) {
            const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
            return result || { success: true, message: 'Office deleted successfully.' };
        }
        return { success: true, message: 'Office deleted successfully.' };
    }
    // If response is not OK, parseJsonResponse will throw a detailed error.
    // This error will be caught by the outer catch block.
    await parseJsonResponse<any>(response); 
    // Fallback, should not be reached if parseJsonResponse throws as expected.
    throw new Error(`API request to delete office failed with status ${response.status}, but parseJsonResponse did not throw an error.`);
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new Error(`Delete failed: The endpoint to delete office ${officeId} (DELETE /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`);
    }
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
    // Assuming DepartmentDto has 'id' and 'name', and potentially 'employeeCount'
    const departmentDto = await parseJsonResponse<any>(response);
    return {
        id: departmentDto.id,
        name: departmentDto.name,
        employeeCount: departmentDto.employeeCount,
    } as Department;
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
    // Assuming the DTOs have 'id', 'name', 'employeeCount'
    const departmentDtos = await parseJsonResponse<any[]>(response);
    return (departmentDtos || []).map(dto => ({
        id: dto.id,
        name: dto.name,
        employeeCount: dto.employeeCount,
    })) as Department[];
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
    const departmentDto = await parseJsonResponse<any>(response);
    return {
        id: departmentDto.id,
        name: departmentDto.name,
        employeeCount: departmentDto.employeeCount,
    } as Department;
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
        throw new Error(`Update failed: The department update endpoint (PUT /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`);
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
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json") && response.body) {
        const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
        return result && typeof result.success === 'boolean' ? result : { success: true, message: 'Department deleted successfully (parsed response).' };
      }
      return { success: true, message: 'Department deleted successfully (non-JSON OK response).' };
    } else {
      // Let HttpError from parseJsonResponse propagate
      await parseJsonResponse<any>(response);
      // This line should not be reached if parseJsonResponse throws correctly
      throw new Error(`API request to delete department ${departmentId} failed with status ${response.status}.`);
    }
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
     if (error instanceof HttpError && error.status === 404) {
        throw new Error(`Delete failed: The department delete endpoint (DELETE /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`);
    }
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
    // Assuming PositionDto has 'id', 'title', 'departmentId', 'departmentName', 'assignedEmployees'
    const positionDto = await parseJsonResponse<any>(response);
    return {
        id: positionDto.id,
        title: positionDto.title,
        departmentId: positionDto.departmentId,
        departmentName: positionDto.departmentName,
        assignedEmployees: positionDto.assignedEmployees,
    } as Position;
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
    const positionDtos = await parseJsonResponse<any[]>(response);
    return (positionDtos || []).map(dto => ({
        id: dto.id,
        title: dto.title,
        departmentId: dto.departmentId,
        departmentName: dto.departmentName,
        assignedEmployees: dto.assignedEmployees,
    })) as Position[];
  } catch (error) {
    console.error('Error fetching positions:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new Error(`Failed to fetch positions. ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  // Note: Your C# code has AssignPositionToDepartmentAsync. This function assumes assigning an employee to a position.
  // The endpoint /api/organization/positions/{positionId}/assign needs to match this intent on the backend.
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
     if (error instanceof HttpError && error.status === 404) {
        throw new Error(`Assign position failed: The endpoint (PUT /api/organization/positions/${positionId}/assign) was not found on the server (404).`);
    }
    throw new Error(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`);
  }
}
