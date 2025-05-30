
// src/services/organization-service.ts
import type { Office as FrontendOffice } from '@/lib/data'; // Renamed to avoid conflict
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

// --- Common Paginated Result Type ---
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// --- Office Related Types ---
interface ApiOfficeDto {
  id: string;
  name: string;
  address: string;
  latitude: number;  // Assuming direct properties now
  longitude: number; // Assuming direct properties now
  headcount: number;
  // center?: { y: number, x: number }; // If backend uses NetTopologySuite Point for center
  radius?: number; // From your C# service for UpdateOfficeAsync
  description?: string; // From your C# service for UpdateOfficeAsync
}

export interface AddOfficePayload { // Maps to OfficeCreateRequest
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number; // Ensure this is part of your OfficeCreateRequest DTO if used
}
export interface UpdateOfficePayload { // Maps to OfficeUpdateRequest
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  headcount?: number;
  radius?: number;
  description?: string;
}

const mapApiOfficeToFrontend = (dto: ApiOfficeDto): FrontendOffice => ({
  id: dto.id,
  name: dto.name,
  address: dto.address,
  latitude: dto.latitude,  // Using direct properties
  longitude: dto.longitude, // Using direct properties
  headcount: dto.headcount,
});

// --- Department Related Types ---
interface ApiDepartmentDto {
  id: string;
  name: string;
  employeeCount?: number;
}
export interface Department { // Frontend Department type
  id: string;
  name: string;
  employeeCount?: number;
}
export interface AddDepartmentPayload { // Maps to DepartmentCreateRequest
  name: string;
}
export interface UpdateDepartmentPayload { // For PUT /api/organization/departments/{id}
  name: string;
}

const mapApiDepartmentToFrontend = (dto: ApiDepartmentDto): Department => ({
  id: dto.id,
  name: dto.name,
  employeeCount: dto.employeeCount,
});

// --- Position Related Types ---
interface ApiPositionDto {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  assignedEmployees?: number;
}
export interface Position { // Frontend Position type
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  assignedEmployees?: number;
}
export interface AddPositionPayload { // Maps to PositionCreateRequest
  title: string;
  departmentId?: string;
}
export interface AssignPositionPayload { // For PUT /api/organization/positions/{positionId}/assign
  // Define what your backend /assign endpoint expects. E.g., employeeId or departmentId
  employeeId?: string; // If assigning an employee to this position
  departmentId?: string; // If assigning this position to a department (as per your C# service)
}

const mapApiPositionToFrontend = (dto: ApiPositionDto): Position => ({
  id: dto.id,
  title: dto.title,
  departmentId: dto.departmentId,
  departmentName: dto.departmentName,
  assignedEmployees: dto.assignedEmployees,
});


// --- Office Endpoints ---

export async function addOffice(officeData: AddOfficePayload): Promise<FrontendOffice> {
  console.log('API CALL: POST /api/organization/offices. Data:', officeData);
  try {
    const response = await apiClient('/organization/offices', {
      method: 'POST',
      body: JSON.stringify(officeData),
    });
    const officeDto = await parseJsonResponse<ApiOfficeDto>(response);
    return mapApiOfficeToFrontend(officeDto);
  } catch (error) {
    console.error('Error adding office:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to add office. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function fetchOffices(): Promise<PaginatedResult<FrontendOffice>> {
  console.log('API CALL: GET /api/organization/offices.');
  try {
    const response = await apiClient('/organization/offices');
    const paginatedResultDto = await parseJsonResponse<PaginatedResult<ApiOfficeDto>>(response);
    return {
      ...paginatedResultDto,
      items: (paginatedResultDto.items || []).map(mapApiOfficeToFrontend),
    };
  } catch (error) {
    console.error('Error fetching offices:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch offices. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function fetchOfficeById(officeId: string): Promise<FrontendOffice | null> {
  console.log(`API CALL: GET /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`);
    if (response.status === 404) return null;
    const officeDto = await parseJsonResponse<ApiOfficeDto | null>(response);
    if (!officeDto) return null;
    return mapApiOfficeToFrontend(officeDto);
  } catch (error) {
    console.error(`Error fetching office by ID ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch office by ID ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function updateOffice(officeId: string, officeData: UpdateOfficePayload): Promise<FrontendOffice> {
  console.log(`API CALL: PUT /api/organization/offices/${officeId}. Data:`, officeData);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'PUT',
      body: JSON.stringify(officeData),
    });
    const officeDto = await parseJsonResponse<ApiOfficeDto>(response);
    return mapApiOfficeToFrontend(officeDto);
  } catch (error) {
    console.error(`Error updating office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update failed: The endpoint to update office ${officeId} (PUT /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to update office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      if (response.status === 204) return { success: true, message: 'Office deleted successfully (No Content).' };
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json") && response.body) {
        const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
        return result || { success: true, message: 'Office deleted successfully.' };
      }
      return { success: true, message: 'Office deleted successfully.' };
    }
    await parseJsonResponse<any>(response); // This will throw for non-OK if not handled above
    throw new HttpError(`Unexpected error deleting office ${officeId}`, response.status, await response.text()); // Fallback
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The endpoint to delete office ${officeId} (DELETE /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to delete office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
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
    const departmentDto = await parseJsonResponse<ApiDepartmentDto>(response);
    return mapApiDepartmentToFrontend(departmentDto);
  } catch (error) {
    console.error('Error adding department:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to add department. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  console.log('API CALL: GET /api/organization/departments.');
  try {
    const response = await apiClient('/organization/departments');
    const departmentDtos = await parseJsonResponse<ApiDepartmentDto[]>(response);
    return (departmentDtos || []).map(mapApiDepartmentToFrontend);
  } catch (error) {
    console.error('Error fetching departments:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch departments. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`API CALL: PUT /api/organization/departments/${departmentId}. Data:`, departmentData);
  // IMPORTANT: Your API endpoint list does not specify a PUT for departments. This will likely 404.
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
    const departmentDto = await parseJsonResponse<ApiDepartmentDto>(response);
    return mapApiDepartmentToFrontend(departmentDto);
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update failed: The department update endpoint (PUT /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to update department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/departments/${departmentId}.`);
  // IMPORTANT: Your API endpoint list does not specify a DELETE for departments. This will likely 404.
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      if (response.status === 204) return { success: true, message: 'Department deleted successfully.' };
      // Try to parse if there's a body for other OK statuses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json") && response.body) {
          const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
          return result || { success: true, message: 'Department deleted successfully.' };
      }
      return { success: true, message: 'Department deleted successfully.' };
    }
    // If response is not OK, parseJsonResponse will throw a detailed HttpError
    await parseJsonResponse<any>(response);
    // Fallback, should not be reached if parseJsonResponse throws as expected.
    throw new HttpError(`Unexpected error deleting department ${departmentId}`, response.status, await response.text());
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The department delete endpoint (DELETE /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to delete department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
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
    const positionDto = await parseJsonResponse<ApiPositionDto>(response);
    return mapApiPositionToFrontend(positionDto);
  } catch (error) {
    console.error('Error adding position:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to add position. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function fetchPositions(): Promise<Position[]> {
  console.log('API CALL: GET /api/organization/positions.');
  try {
    const response = await apiClient('/organization/positions');
    const positionDtos = await parseJsonResponse<ApiPositionDto[]>(response);
    return (positionDtos || []).map(mapApiPositionToFrontend);
  } catch (error) {
    console.error('Error fetching positions:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch positions. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  console.log(`API CALL: PUT /api/organization/positions/${positionId}/assign. Data:`, assignmentData);
  // Your C# service has AssignPositionToDepartmentAsync. Ensure this endpoint matches that intent,
  // or if it's for assigning an employee to a position, the backend logic needs to exist.
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
      throw new HttpError(`Assign position failed: The endpoint (PUT /api/organization/positions/${positionId}/assign) was not found on the server (404).`, 404, error.responseText);
    }
    throw new HttpError(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}
