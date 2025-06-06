
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

// Office types
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
interface ApiOffice extends FrontendOffice {} // Supposons une compatibilité directe pour l'instant

// Department types
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
interface ApiDepartment extends Department {}

// Position types
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
  employeeId?: string; // L'API s'attend probablement à employeeId, pas departmentId ici
  departmentId?: string; // Redondant si positionId est fourni
}
interface ApiPosition extends Position {}
interface ApiAssignPositionResponse { // Exemple de réponse, ajustez si nécessaire
    success: boolean;
    message?: string;
}
interface ApiDeleteResponse {
    success: boolean;
    message?: string;
}


// --- Office Functions ---
export async function addOffice(officeData: AddOfficePayload): Promise<FrontendOffice> {
  console.log('API CALL: POST /organization/offices with data:', officeData);
  try {
    const response = await apiClient<ApiOffice>('/organization/offices', {
      method: 'POST',
      body: officeData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in addOffice:", error);
    throw new HttpError('Failed to add office.', 0, null);
  }
}

export async function fetchOffices(pageNumber: number = 1, pageSize: number = 10): Promise<FrontendOffice[]> {
  console.log(`API CALL: GET /organization/offices with params: pageNumber=${pageNumber}, pageSize=${pageSize}`);
  try {
    // Expecting API to return a direct array of offices for the given page
    const response = await apiClient<ApiOffice[]>('/organization/offices', {
      method: 'GET',
      params: { pageNumber, pageSize },
    });
    return response.data; // response.data is ApiOffice[]
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchOffices:", error);
    throw new HttpError('Failed to fetch offices.', 0, null);
  }
}

export async function fetchOfficeById(officeId: string): Promise<FrontendOffice | null> {
  console.log(`API CALL: GET /organization/offices/${officeId}`);
  try {
    const response = await apiClient<ApiOffice | null>(`/organization/offices/${officeId}`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Office with id ${officeId} not found.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchOfficeById:", error);
    throw new HttpError(`Failed to fetch office ${officeId}.`, 0, null);
  }
}

export async function updateOffice(officeId: string, officeData: UpdateOfficePayload): Promise<FrontendOffice> {
  console.log(`API CALL: PUT /organization/offices/${officeId} with data:`, officeData);
  try {
    const response = await apiClient<ApiOffice>(`/organization/offices/${officeId}`, {
      method: 'PUT',
      body: officeData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateOffice:", error);
    throw new HttpError(`Failed to update office ${officeId}.`, 0, null);
  }
}

export async function deleteOffice(officeId: string): Promise<ApiDeleteResponse> {
  console.log(`API CALL: DELETE /organization/offices/${officeId}`);
  try {
    const response = await apiClient<ApiDeleteResponse>(`/organization/offices/${officeId}`, {
      method: 'DELETE',
    });
    return response.data; // API devrait retourner { success: true } ou similaire
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in deleteOffice:", error);
    throw new HttpError(`Failed to delete office ${officeId}.`, 0, null);
  }
}

// --- Department Functions ---
export async function addDepartment(departmentData: AddDepartmentPayload): Promise<Department> {
  console.log('API CALL: POST /organization/departments with data:', departmentData);
  try {
    const response = await apiClient<ApiDepartment>('/organization/departments', {
      method: 'POST',
      body: departmentData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in addDepartment:", error);
    throw new HttpError('Failed to add department.', 0, null);
  }
}

export async function fetchDepartments(): Promise<Department[]> {
  console.log('API CALL: GET /organization/departments');
  try {
    const response = await apiClient<ApiDepartment[]>('/organization/departments', {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchDepartments:", error);
    throw new HttpError('Failed to fetch departments.', 0, null);
  }
}

export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`API CALL: PUT /organization/departments/${departmentId} with data:`, departmentData);
   // L'endpoint n'est pas dans la liste fournie, mais le UI le suggère.
   // Supposons que PUT /organization/departments/{id} existe.
  try {
    const response = await apiClient<ApiDepartment>(`/organization/departments/${departmentId}`, {
      method: 'PUT',
      body: departmentData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateDepartment:", error);
    throw new HttpError(`Failed to update department ${departmentId}.`, 0, null);
  }
}

export async function deleteDepartment(departmentId: string): Promise<ApiDeleteResponse> {
  console.log(`API CALL: DELETE /organization/departments/${departmentId}`);
  // L'endpoint n'est pas dans la liste fournie, mais le UI le suggère.
  // Supposons que DELETE /organization/departments/{id} existe.
  try {
    const response = await apiClient<ApiDeleteResponse>(`/organization/departments/${departmentId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in deleteDepartment:", error);
    throw new HttpError(`Failed to delete department ${departmentId}.`, 0, null);
  }
}

// --- Position Functions ---
export async function addPosition(positionData: AddPositionPayload): Promise<Position> {
  console.log('API CALL: POST /organization/positions with data:', positionData);
  try {
    const response = await apiClient<ApiPosition>('/organization/positions', {
      method: 'POST',
      body: positionData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in addPosition:", error);
    throw new HttpError('Failed to add position.', 0, null);
  }
}

export async function fetchPositions(): Promise<Position[]> {
  console.log('API CALL: GET /organization/positions');
  try {
    const response = await apiClient<ApiPosition[]>('/organization/positions', {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchPositions:", error);
    throw new HttpError('Failed to fetch positions.', 0, null);
  }
}

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<ApiAssignPositionResponse> {
  console.log(`API CALL: PUT /organization/positions/${positionId}/assign with data:`, assignmentData);
  try {
    const response = await apiClient<ApiAssignPositionResponse>(`/organization/positions/${positionId}/assign`, {
      method: 'PUT',
      body: assignmentData, // L'API attendra probablement l'employeeId ici
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in assignPositionToEmployee:", error);
    throw new HttpError(`Failed to assign position ${positionId}.`, 0, null);
  }
}
