
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used in mock

export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface HireEmployeePayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  avatarUrl?: string;
  employeeNumber: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  officeId: string;
}

export interface HiredEmployeeResponse extends FrontendEmployee {
  firstName: string;
  lastName: string;
}

const createMockEmployee = (id: string, status: 'Active' | 'Inactive' = 'Active', partialData?: Partial<FrontendEmployee>): FrontendEmployee => ({
  id: id,
  name: `Mock Employee ${id.substring(0,3)}`,
  email: `mock.${id.substring(0,3)}@example.com`,
  department: 'Mock Department',
  status: status,
  avatarUrl: `https://placehold.co/40x40.png?text=${id.substring(0,2).toUpperCase()}`,
  jobTitle: 'Mock Job Title',
  latitude: 34.0522 + (Math.random() - 0.5) * 0.1,
  longitude: -118.2437 + (Math.random() - 0.5) * 0.1,
  lastSeen: `${Math.floor(Math.random() * 60)}m ago`,
  officeId: 'mock-office-001',
  ...partialData,
});


export async function fetchEmployees(): Promise<FrontendEmployee[]> {
  console.log('MOCK fetchEmployees called');
  // Return a few mock employees for display purposes
  return Promise.resolve([
    createMockEmployee('emp001-mock', 'Active', {name: "Alice Mock", department: "Engineering", jobTitle: "Software Engineer"}),
    createMockEmployee('emp002-mock', 'Active', {name: "Bob Mock", department: "Sales", jobTitle: "Sales Lead"}),
    createMockEmployee('emp003-mock', 'Inactive', {name: "Charlie Mock", department: "Marketing", jobTitle: "Marketing Specialist"}),
  ]);
}

export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`MOCK fetchEmployeeById for ID: ${id}`);
  if (id === 'emp001-mock' || id === 'emp002-mock' || id === 'emp003-mock') {
    return Promise.resolve(createMockEmployee(id));
  }
  return Promise.resolve(null);
}

export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`MOCK fetchEmployeesByStatus for status: ${status}`);
  if (status === 'Active') {
    return Promise.resolve([createMockEmployee('emp001-mock', 'Active'), createMockEmployee('emp002-mock', 'Active')]);
  }
  return Promise.resolve([createMockEmployee('emp003-mock', 'Inactive')]);
}

export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  console.log(`MOCK updateEmployeeStatus for employee ${employeeId} to ${status}`);
  return Promise.resolve(createMockEmployee(employeeId, status));
}

export async function hireEmployee(employeeData: HireEmployeePayload): Promise<HiredEmployeeResponse> {
  console.log('MOCK hireEmployee with data:', employeeData);
  const newId = `emp-mock-${Date.now()}`;
  const hiredEmployee: HiredEmployeeResponse = {
    ...createMockEmployee(newId, 'Active', {
        name: `${employeeData.firstName} ${employeeData.lastName}`,
        email: employeeData.email,
        jobTitle: "Newly Hired", // Or map from positionId if desired
        department: "Newly Assigned" // Or map from departmentId
    }),
    firstName: employeeData.firstName,
    lastName: employeeData.lastName,
  };
  return Promise.resolve(hiredEmployee);
}

export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`MOCK getCurrentEmployeeLocation for employee ${employeeId}`);
  return Promise.resolve({
    latitude: 34.0522 + (Math.random() - 0.5) * 0.01,
    longitude: -118.2437 + (Math.random() - 0.5) * 0.01,
    lastSeen: 'Just now (mocked)',
  });
}

export async function getNearbyEmployees(employeeId: string): Promise<FrontendEmployee[]> {
  console.log(`MOCK getNearbyEmployees for employee ${employeeId}`);
  return Promise.resolve([
      createMockEmployee('near-emp-1', 'Active'),
      createMockEmployee('near-emp-2', 'Active')
    ]);
}
