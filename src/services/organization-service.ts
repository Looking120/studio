
// src/services/organization-service.ts
import type { Office as FrontendOffice } from '@/lib/data'; 
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

interface ApiOfficeDto {
  id: string;
  name: string;
  address: string;
  latitude: number;  
  longitude: number; 
  headcount: number;
  radius?: number; 
  description?: string; 
}

export interface AddOfficePayload { 
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number; 
}
export interface UpdateOfficePayload { 
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
  latitude: dto.latitude,  
  longitude: dto.longitude, 
  headcount: dto.headcount,
});

interface ApiDepartmentDto {
  id: string;
  name: string;
  employeeCount?: number;
}
export interface Department { 
  id: string;
  name: string;
  employeeCount?: number;
}
export interface AddDepartmentPayload { 
  name: string;
}
export interface UpdateDepartmentPayload { 
  name: string;
}

const mapApiDepartmentToFrontend = (dto: ApiDepartmentDto): Department => ({
  id: dto.id,
  name: dto.name,
  employeeCount: dto.employeeCount,
});

interface ApiPositionDto {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  assignedEmployees?: number;
}
export interface Position { 
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string;
  assignedEmployees?: number;
}
export interface AddPositionPayload { 
  title: string;
  departmentId?: string;
}
export interface AssignPositionPayload { 
  employeeId?: string; 
  departmentId?: string; 
}

const mapApiPositionToFrontend = (dto: ApiPositionDto): Position => ({
  id: dto.id,
  title: dto.title,
  departmentId: dto.departmentId,
  departmentName: dto.departmentName,
  assignedEmployees: dto.assignedEmployees,
});

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
    throw new HttpError(`Failed to add office. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to add office.");
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
    throw new HttpError(`Failed to fetch offices. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to fetch offices.");
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
    throw new HttpError(`Failed to fetch office by ID ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to fetch office by ID ${officeId}.`);
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
    throw new HttpError(`Failed to update office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to update office ${officeId}.`);
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
    await parseJsonResponse<any>(response); 
    throw new HttpError(`Unexpected error deleting office ${officeId}`, response.status, await response.text()); 
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The endpoint to delete office ${officeId} (DELETE /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to delete office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to delete office ${officeId}.`);
  }
}

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
    throw new HttpError(`Failed to add department. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to add department.");
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
    throw new HttpError(`Failed to fetch departments. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to fetch departments.");
  }
}

export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`API CALL: PUT /api/organization/departments/${departmentId}. Data:`, departmentData);
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
    throw new HttpError(`Failed to update department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to update department ${departmentId}.`);
  }
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/departments/${departmentId}.`);
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      if (response.status === 204) return { success: true, message: 'Department deleted successfully.' };
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json") && response.body) {
          const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
          return result || { success: true, message: 'Department deleted successfully.' };
      }
      return { success: true, message: 'Department deleted successfully.' };
    }
    await parseJsonResponse<any>(response);
    throw new HttpError(`Unexpected error deleting department ${departmentId}`, response.status, await response.text());
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The department delete endpoint (DELETE /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to delete department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to delete department ${departmentId}.`);
  }
}

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
    throw new HttpError(`Failed to add position. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to add position.");
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
    throw new HttpError(`Failed to fetch positions. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "Failed to fetch positions.");
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
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Assign position failed: The endpoint (PUT /api/organization/positions/${positionId}/assign) was not found on the server (404).`, 404, error.responseText);
    }
    throw new HttpError(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : `Failed to assign position ${positionId}.`);
  }
}
