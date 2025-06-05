
// src/services/organization-service.ts
import type { Office as FrontendOffice } from '@/lib/data';
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
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

const createMockOffice = (id: string, data: Partial<FrontendOffice>): FrontendOffice => ({
  id: id,
  name: data.name || `Mock Office ${id.substring(0,3)}`,
  address: data.address || '123 Mock Street',
  latitude: data.latitude || 34.0522,
  longitude: data.longitude || -118.2437,
  headcount: data.headcount || 50,
});

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

const createMockDepartment = (id: string, data: Partial<Department>): Department => ({
    id: id,
    name: data.name || `Mock Dept ${id.substring(0,3)}`,
    employeeCount: data.employeeCount || 10,
});


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

const createMockPosition = (id: string, data: Partial<Position>): Position => ({
    id: id,
    title: data.title || `Mock Position ${id.substring(0,3)}`,
    departmentId: data.departmentId || 'mock-dept-id',
    departmentName: data.departmentName || 'Mock Department',
    assignedEmployees: data.assignedEmployees || 5,
});


export async function addOffice(officeData: AddOfficePayload): Promise<FrontendOffice> {
  console.log('MOCK addOffice with data:', officeData);
  const newId = `mock-off-${Date.now()}`;
  return Promise.resolve(createMockOffice(newId, officeData));
}

export async function fetchOffices(): Promise<PaginatedResult<FrontendOffice>> {
  console.log('MOCK fetchOffices called');
  const mockItems = [
      createMockOffice('off-m1', {name: "HQ Mock", headcount: 120}),
      createMockOffice('off-m2', {name: "Branch Mock", headcount: 30}),
  ];
  return Promise.resolve({
    items: mockItems,
    totalCount: mockItems.length,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
}

export async function fetchOfficeById(officeId: string): Promise<FrontendOffice | null> {
  console.log(`MOCK fetchOfficeById for ID: ${officeId}`);
  if (officeId === 'off-m1' || officeId === 'off-m2') {
    return Promise.resolve(createMockOffice(officeId, {name: `Office ${officeId}`}));
  }
  return Promise.resolve(null);
}

export async function updateOffice(officeId: string, officeData: UpdateOfficePayload): Promise<FrontendOffice> {
  console.log(`MOCK updateOffice for ID ${officeId} with data:`, officeData);
  return Promise.resolve(createMockOffice(officeId, officeData));
}

export async function deleteOffice(officeId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`MOCK deleteOffice for ID: ${officeId}`);
  return Promise.resolve({ success: true, message: "Mock office deleted successfully." });
}

export async function addDepartment(departmentData: AddDepartmentPayload): Promise<Department> {
  console.log('MOCK addDepartment with data:', departmentData);
  const newId = `mock-dept-${Date.now()}`;
  return Promise.resolve(createMockDepartment(newId, departmentData));
}

export async function fetchDepartments(): Promise<Department[]> {
  console.log('MOCK fetchDepartments called');
  return Promise.resolve([
      createMockDepartment('dept-m1', {name: "Engineering", employeeCount: 25}),
      createMockDepartment('dept-m2', {name: "Sales", employeeCount: 15}),
  ]);
}

export async function updateDepartment(departmentId: string, departmentData: UpdateDepartmentPayload): Promise<Department> {
  console.log(`MOCK updateDepartment for ID ${departmentId} with data:`, departmentData);
  return Promise.resolve(createMockDepartment(departmentId, departmentData));
}

export async function deleteDepartment(departmentId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`MOCK deleteDepartment for ID: ${departmentId}`);
  return Promise.resolve({ success: true, message: "Mock department deleted successfully." });
}

export async function addPosition(positionData: AddPositionPayload): Promise<Position> {
  console.log('MOCK addPosition with data:', positionData);
  const newId = `mock-pos-${Date.now()}`;
  return Promise.resolve(createMockPosition(newId, positionData));
}

export async function fetchPositions(): Promise<Position[]> {
  console.log('MOCK fetchPositions called');
  return Promise.resolve([
      createMockPosition('pos-m1', {title: "Software Engineer", departmentName: "Engineering"}),
      createMockPosition('pos-m2', {title: "Sales Manager", departmentName: "Sales"}),
  ]);
}

export async function assignPositionToEmployee(positionId: string, assignmentData: AssignPositionPayload): Promise<any> {
  console.log(`MOCK assignPositionToEmployee for position ${positionId} with data:`, assignmentData);
  return Promise.resolve({ success: true, message: "Mock position assigned successfully." });
}
