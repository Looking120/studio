// src/services/organization-service.ts
import { apiClient, parseJsonResponse } from './api-client';
import type { Office } from '@/lib/data';

// Define types for Department and Position, adjust as per your API
export interface Department {
  id: string;
  name: string;
  // Add other relevant fields from your API response
  employeeCount?: number;
  [key: string]: any;
}

export interface Position {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string; // For display if API provides it
  assignedEmployees?: number;
  // Add other relevant fields from your API response
  [key: string]: any;
}

// --- Office Endpoints ---

/**
 * Adds a new office to the organization.
 * Corresponds to: POST /api/organization/offices
 * @param officeData Data for the new office.
 */
export async function addOffice(officeData: Omit<Office, 'id'>): Promise<Office> {
  console.log('API CALL: POST /api/organization/offices. Data:', officeData);
  const response = await apiClient('/organization/offices', {
    method: 'POST',
    body: JSON.stringify(officeData),
  });
  return parseJsonResponse<Office>(response);
}

/**
 * Fetches all offices of the organization.
 * Corresponds to: GET /api/organization/offices
 */
export async function fetchOffices(): Promise<Office[]> {
  console.log('API CALL: GET /api/organization/offices.');
  const response = await apiClient('/organization/offices');
  return parseJsonResponse<Office[]>(response);
}

/**
 * Fetches a specific office by its ID.
 * Corresponds to: GET /api/organization/offices/{officeId}
 * @param officeId The ID of the office.
 */
export async function fetchOfficeById(officeId: string): Promise<Office | null> {
  console.log(`API CALL: GET /api/organization/offices/${officeId}.`);
  const response = await apiClient(`/organization/offices/${officeId}`);
  return parseJsonResponse<Office>(response);
}

/**
 * Updates an existing office.
 * Corresponds to: PUT /api/organization/offices/{officeId}
 * @param officeId The ID of the office to update.
 * @param officeData The new data for the office.
 */
export async function updateOffice(officeId: string, officeData: Partial<Office>): Promise<Office> {
  console.log(`API CALL: PUT /api/organization/offices/${officeId}. Data:`, officeData);
  const response = await apiClient(`/organization/offices/${officeId}`, {
    method: 'PUT',
    body: JSON.stringify(officeData),
  });
  return parseJsonResponse<Office>(response);
}

/**
 * Deletes an office.
 * Corresponds to: DELETE /api/organization/offices/{officeId}
 * @param officeId The ID of the office to delete.
 */
export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/organization/offices/${officeId}.`);
  const response = await apiClient(`/organization/offices/${officeId}`, {
    method: 'DELETE',
  });
  const result = await parseJsonResponse<{ success: boolean; message?: string }>(response);
  return result || { success: true, message: 'Office deleted' }; // Handle 204 No Content
}

// --- Department Endpoints ---

/**
 * Adds a new department to the organization.
 * Corresponds to: POST /api/organization/departments
 * @param departmentData Data for the new department.
 */
export async function addDepartment(departmentData: { name: string; employeeCount?: number }): Promise<Department> {
  console.log('API CALL: POST /api/organization/departments. Data:', departmentData);
  const response = await apiClient('/organization/departments', {
    method: 'POST',
    body: JSON.stringify(departmentData),
  });
  return parseJsonResponse<Department>(response);
}

/**
 * Fetches all departments of the organization.
 * Corresponds to: GET /api/organization/departments
 */
export async function fetchDepartments(): Promise<Department[]> {
  console.log('API CALL: GET /api/organization/departments.');
  const response = await apiClient('/organization/departments');
  return parseJsonResponse<Department[]>(response);
}

// --- Position Endpoints ---

/**
 * Adds a new position to the organization.
 * Corresponds to: POST /api/organization/positions
 * @param positionData Data for the new position.
 */
export async function addPosition(positionData: { title: string; departmentId?: string; departmentName?: string; assignedEmployees?: number }): Promise<Position> {
  console.log('API CALL: POST /api/organization/positions. Data:', positionData);
  const response = await apiClient('/organization/positions', {
    method: 'POST',
    body: JSON.stringify(positionData),
  });
  return parseJsonResponse<Position>(response);
}

/**
 * Fetches all positions in the organization.
 * Corresponds to: GET /api/organization/positions
 */
export async function fetchPositions(): Promise<Position[]> {
  console.log('API CALL: GET /api/organization/positions.');
  const response = await apiClient('/organization/positions');
  return parseJsonResponse<Position[]>(response);
}

/**
 * Assigns a position to an employee or updates an assignment.
 * Corresponds to: PUT /api/organization/positions/{positionId}/assign
 * @param positionId The ID of the position.
 * @param assignmentData Data for the assignment (e.g., employeeId, startDate).
 */
export async function assignPositionToEmployee(positionId: string, assignmentData: { employeeId: string; startDate?: string }): Promise<any> {
  console.log(`API CALL: PUT /api/organization/positions/${positionId}/assign. Data:`, assignmentData);
  const response = await apiClient(`/organization/positions/${positionId}/assign`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData),
  });
  return parseJsonResponse<any>(response); // Or specific response type
}
