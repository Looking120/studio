
// src/services/organization-service.ts
import type { Office as FrontendOffice } from '@/lib/data'; 
import { apiClient, UnauthorizedError, HttpError } from './api-client';

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
  console.log('API CALL (axios): POST /organization/offices. Data:', officeData);
  try {
    const response = await apiClient<ApiOfficeDto>('/organization/offices', {
      method: 'POST',
      body: officeData,
    });
    return mapApiOfficeToFrontend(response.data);
  } catch (error) {
    console.error('Error adding office:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to add office. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to add office.");
  }
}

export async function fetchOffices(): Promise<PaginatedResult<FrontendOffice>> {
  console.log('API CALL (axios): GET /organization/offices.');
  try {
    const response = await apiClient<PaginatedResult<ApiOfficeDto>>('/organization/offices');
    const paginatedResultDto = response.data;
    return {
      ...paginatedResultDto,
      items: (paginatedResultDto.items || []).map(mapApiOfficeToFrontend),
    };
  } catch (error) {
    console.error('Error fetching offices:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch offices. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to fetch offices.");
  }
}

export async function fetchOfficeById(officeId: string): Promise<FrontendOffice | null> {
  console.log(`API CALL (axios): GET /organization/offices/${officeId}.`);
  try {
    const response = await apiClient<ApiOfficeDto | null>(`/organization/offices/${officeId}`);
    const officeDto = response.data;
    if (!officeDto) return null; // Handles 404 if API returns 200 with null or interceptor allows
    return mapApiOfficeToFrontend(officeDto);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Office with ID ${officeId} not found.`);
        return null;
    }
    console.error(`Error fetching office by ID ${officeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch office by ID ${officeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to fetch office by ID ${officeId}.`);
  }
}

export async function updateOffice(officeId: string, officeData: UpdateOfficePayload): Promise<FrontendOffice> {
  console.log(`API CALL (axios): PUT /organization/offices/${officeId}. Data:`, officeData);
  try {
    const response = await apiClient<ApiOfficeDto>(`/organization/offices/${officeId}`, {
      method: 'PUT',
      body: officeData,
    });
    return mapApiOfficeToFrontend(response.data);
  } catch (error) {
    console.error(`Error updating office ${officeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update failed: The endpoint to update office ${officeId} (PUT /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to update office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to update office ${officeId}.`);
  }
}

export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL (axios): DELETE /organization/offices/${officeId}.`);
  try {
    const response = await apiClient(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    // Axios considers 2xx successful. 204 means no content.
    if (response.status === 204 || !response.data) {
        return { success: true, message: 'Office deleted successfully (No Content or empty response).' };
    }
    return response.data as { success: boolean; message?: string } || { success: true, message: 'Office deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting office ${officeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The endpoint to delete office ${officeId} (DELETE /api/organization/offices/${officeId}) was not found on the server (404). Please ensure this endpoint exists.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to delete office ${officeId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to delete office ${officeId}.`);
  }
}

export async function addDepartment(departmentData: AddDepartmentPayload): Promise<Department> {
  console.log('API CALL (axios): POST /organization/departments. Data:', departmentData);
  try {
    const response = await apiClient<ApiDepartmentDto>('/organization/departments', {
      method: 'POST',
      body: departmentData,
    });
    return mapApiDepartmentToFrontend(response.data);
  } catch (error) {
    console.error('Error adding department:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to add department. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to add department.");
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  console.log('API CALL (axios): GET /organization/departments.');
  try {
    const response = await apiClient<ApiDepartmentDto[]>('/organization/departments');
    const departmentDtos = response.data;
    return (departmentDtos || []).map(mapApiDepartmentToFrontend);
  } catch (error) {
    console.error('Error fetching departments:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch departments. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to fetch departments.");
  }
}

export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`API CALL (axios): PUT /organization/departments/${departmentId}. Data:`, departmentData);
  try {
    const response = await apiClient<ApiDepartmentDto>(`/organization/departments/${departmentId}`, {
      method: 'PUT',
      body: departmentData,
    });
    return mapApiDepartmentToFrontend(response.data);
  } catch (error) {
    console.error(`Error updating department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update failed: The department update endpoint (PUT /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to update department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to update department ${departmentId}.`);
  }
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL (axios): DELETE /organization/departments/${departmentId}.`);
  try {
    const response = await apiClient(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });
    if (response.status === 204 || !response.data) {
      return { success: true, message: 'Department deleted successfully.' };
    }
    return response.data as { success: boolean; message?: string } || { success: true, message: 'Department deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting department ${departmentId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: The department delete endpoint (DELETE /api/organization/departments/${departmentId}) was not found on the server (404). Please ensure this endpoint is available on the backend.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to delete department ${departmentId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to delete department ${departmentId}.`);
  }
}

export async function addPosition(positionData: AddPositionPayload): Promise<Position> {
  console.log('API CALL (axios): POST /organization/positions. Data:', positionData);
  try {
    const response = await apiClient<ApiPositionDto>('/organization/positions', {
      method: 'POST',
      body: positionData,
    });
    return mapApiPositionToFrontend(response.data);
  } catch (error) {
    console.error('Error adding position:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to add position. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to add position.");
  }
}

export async function fetchPositions(): Promise<Position[]> {
  console.log('API CALL (axios): GET /organization/positions.');
  try {
    const response = await apiClient<ApiPositionDto[]>('/organization/positions');
    const positionDtos = response.data;
    return (positionDtos || []).map(mapApiPositionToFrontend);
  } catch (error) {
    console.error('Error fetching positions:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch positions. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "Failed to fetch positions.");
  }
}

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  console.log(`API CALL (axios): PUT /organization/positions/${positionId}/assign. Data:`, assignmentData);
  try {
    const response = await apiClient<any>(`/organization/positions/${positionId}/assign`, {
      method: 'PUT',
      body: assignmentData,
    });
    return response.data;
  } catch (error) {
    console.error(`Error assigning position ${positionId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Assign position failed: The endpoint (PUT /api/organization/positions/${positionId}/assign) was not found on the server (404).`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to assign position ${positionId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || `Failed to assign position ${positionId}.`);
  }
}
