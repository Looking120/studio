
// src/services/user-service.ts
// import { apiClient, parseJsonResponse } from './api-client'; // API calls removed
import type { Employee } from '@/lib/data';
import { mockEmployees } from '@/lib/data';

export interface User extends Omit<Employee, 'status' | 'lastSeen' | 'latitude' | 'longitude'> { 
  role?: string; 
  [key: string]: any;
}

const mockUsers: User[] = mockEmployees.map(emp => ({
  id: emp.id,
  name: emp.name,
  email: emp.email,
  department: emp.department,
  jobTitle: emp.jobTitle,
  avatarUrl: emp.avatarUrl,
  role: emp.id === 'emp001' ? 'Admin' : 'Employé', // Example role assignment
}));


/**
 * Hires a new user. (MOCKED - See employee-service for main hire function)
 * @param userData Data for the new user.
 */
export async function hireUser(userData: Omit<User, 'id'>): Promise<User> {
  console.log('MOCK API CALL: POST /api/users/hire from user-service. Data:', userData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newUser: User = {
    id: `usr${Date.now()}`,
    name: userData.name,
    email: userData.email,
    department: userData.department,
    jobTitle: userData.jobTitle,
    avatarUrl: userData.avatarUrl || '',
    role: userData.role || 'Employé',
  };
  // mockUsers.push(newUser); // If modifying shared array
  return Promise.resolve(newUser);
}

/**
 * Fetches all users. (MOCKED)
 */
export async function fetchUsers(): Promise<User[]> {
  console.log('MOCK API CALL: GET /api/users.');
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve([...mockUsers]);
}

/**
 * Fetches a single user by their ID. (MOCKED)
 * @param userId The ID of the user.
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`MOCK API CALL: GET /api/users/${userId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const user = mockUsers.find(u => u.id === userId);
  return Promise.resolve(user || null);
}

/**
 * Deletes a user by their ID. (MOCKED)
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`MOCK API CALL: DELETE /api/users/${userId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  // const userIndex = mockUsers.findIndex(u => u.id === userId);
  // if (userIndex !== -1) mockUsers.splice(userIndex, 1); // If modifying shared array
  return Promise.resolve({ success: true, message: 'User deleted (mock)' });
}

/**
 * Updates the role of a user. (MOCKED)
 * @param userId The ID of the user.
 * @param roleData Object containing the new role, e.g., { role: 'Admin' }.
 */
export async function updateUserRole(userId: string, roleData: { role: string }): Promise<User> {
  console.log(`MOCK API CALL: PUT /api/users/${userId}/role. Data:`, roleData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    const updatedUser = { ...mockUsers[userIndex], role: roleData.role };
    return Promise.resolve(updatedUser);
  }
  return Promise.reject(new Error('Mock: User not found for role update.'));
}
