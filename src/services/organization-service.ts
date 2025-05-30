
// src/services/organization-service.ts
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed
import type { Office } from '@/lib/data';
import { mockOffices } from '@/lib/data'; // Import mock data

// Define types for Department and Position, adjust as per your API
export interface Department {
  id: string;
  name: string;
  employeeCount?: number;
  [key: string]: any;
}

export interface Position {
  id: string;
  title: string;
  departmentId?: string;
  departmentName?: string; 
  assignedEmployees?: number;
  [key: string]: any;
}

// --- Office Endpoints ---

/**
 * Adds a new office to the organization. (MOCKED)
 * @param officeData Data for the new office.
 */
export async function addOffice(officeData: Omit<Office, 'id'>): Promise<Office> {
  console.log('MOCK API CALL: POST /api/organization/offices. Data:', officeData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newOffice: Office = {
    id: `off${Date.now()}`,
    ...officeData,
  };
  // mockOffices.push(newOffice); // If you want to modify shared mock array
  return Promise.resolve(newOffice);
}

/**
 * Fetches all offices of the organization. (MOCKED)
 */
export async function fetchOffices(): Promise<Office[]> {
  console.log('MOCK API CALL: GET /api/organization/offices.');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve([...mockOffices]); // Return a copy
}

/**
 * Fetches a specific office by its ID. (MOCKED)
 * @param officeId The ID of the office.
 */
export async function fetchOfficeById(officeId: string): Promise<Office | null> {
  console.log(`MOCK API CALL: GET /api/organization/offices/${officeId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const office = mockOffices.find(o => o.id === officeId);
  return Promise.resolve(office || null);
}

/**
 * Updates an existing office. (MOCKED)
 * @param officeId The ID of the office to update.
 * @param officeData The new data for the office.
 */
export async function updateOffice(officeId: string, officeData: Partial<Office>): Promise<Office> {
  console.log(`MOCK API CALL: PUT /api/organization/offices/${officeId}. Data:`, officeData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const officeIndex = mockOffices.findIndex(o => o.id === officeId);
  if (officeIndex !== -1) {
    const updatedOffice = { ...mockOffices[officeIndex], ...officeData };
    return Promise.resolve(updatedOffice as Office);
  }
  return Promise.reject(new Error('Mock: Office not found for update.'));
}

/**
 * Deletes an office. (MOCKED)
 * @param officeId The ID of the office to delete.
 */
export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`MOCK API CALL: DELETE /api/organization/offices/${officeId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  // const officeIndex = mockOffices.findIndex(o => o.id === officeId);
  // if (officeIndex !== -1) mockOffices.splice(officeIndex, 1); // If modifying shared array
  return Promise.resolve({ success: true, message: 'Office deleted (mock)' });
}

// --- Department Endpoints ---
const mockDepartments: Department[] = [
  { id: 'dept_mock_eng', name: 'Mock Engineering', employeeCount: 50 },
  { id: 'dept_mock_mkt', name: 'Mock Marketing', employeeCount: 25 },
];

/**
 * Adds a new department to the organization. (MOCKED)
 * @param departmentData Data for the new department.
 */
export async function addDepartment(departmentData: { name: string; employeeCount?: number }): Promise<Department> {
  console.log('MOCK API CALL: POST /api/organization/departments. Data:', departmentData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newDepartment: Department = {
    id: `dept${Date.now()}`,
    name: departmentData.name,
    employeeCount: departmentData.employeeCount || 0,
  };
  // mockDepartments.push(newDepartment); // If modifying shared array
  return Promise.resolve(newDepartment);
}

/**
 * Fetches all departments of the organization. (MOCKED)
 */
export async function fetchDepartments(): Promise<Department[]> {
  console.log('MOCK API CALL: GET /api/organization/departments.');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve([...mockDepartments]);
}

// --- Position Endpoints ---
const mockPositions: Position[] = [
  { id: 'pos_mock_swe', title: 'Mock Software Engineer', departmentName: 'Mock Engineering', assignedEmployees: 15 },
  { id: 'pos_mock_pm', title: 'Mock Product Manager', departmentName: 'Mock Product', assignedEmployees: 5 },
];
/**
 * Adds a new position to the organization. (MOCKED)
 * @param positionData Data for the new position.
 */
export async function addPosition(positionData: { title: string; departmentId?: string; departmentName?: string; assignedEmployees?: number }): Promise<Position> {
  console.log('MOCK API CALL: POST /api/organization/positions. Data:', positionData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newPosition: Position = {
    id: `pos${Date.now()}`,
    title: positionData.title,
    departmentId: positionData.departmentId,
    departmentName: positionData.departmentName || "Mock Dept Name",
    assignedEmployees: positionData.assignedEmployees || 0,
  };
  // mockPositions.push(newPosition); // If modifying shared array
  return Promise.resolve(newPosition);
}

/**
 * Fetches all positions in the organization. (MOCKED)
 */
export async function fetchPositions(): Promise<Position[]> {
  console.log('MOCK API CALL: GET /api/organization/positions.');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve([...mockPositions]);
}

/**
 * Assigns a position to an employee or updates an assignment. (MOCKED)
 * @param positionId The ID of the position.
 * @param assignmentData Data for the assignment (e.g., employeeId, startDate).
 */
export async function assignPositionToEmployee(positionId: string, assignmentData: { employeeId: string; startDate?: string }): Promise<any> {
  console.log(`MOCK API CALL: PUT /api/organization/positions/${positionId}/assign. Data:`, assignmentData);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve({ success: true, message: `Position ${positionId} assigned to ${assignmentData.employeeId} (mock)` });
}
