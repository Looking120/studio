// src/services/user-service.ts
import { apiClient, parseJsonResponse } from './api-client';
import type { Employee } from '@/lib/data'; // Assuming User type is similar to Employee for now

// Define a more specific User type if it differs significantly from Employee
// For now, we can reuse Employee or create a User type
interface User extends Employee { // Or define a distinct User type
  role?: string; // Example: 'Admin', 'Manager', 'Employee'
}

/**
 * Hires a new user.
 * (Note: This endpoint POST /api/users/hire is also in your employee-service.ts. You may want to consolidate.)
 * @param userData Data for the new user.
 */
export async function hireUser(userData: Omit<User, 'id' | 'status'>): Promise<User> {
  console.log('API CALL: POST /api/users/hire - Placeholder from user-service. Data:', userData);
  // const response = await apiClient('/users/hire', {
  //   method: 'POST',
  //   body: JSON.stringify(userData),
  // });
  // return parseJsonResponse<User>(response);
  return Promise.reject(new Error('hireUser not implemented in user-service'));
}

/**
 * Fetches all users.
 * Corresponds to: GET /api/users
 */
export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL: GET /api/users - Placeholder.');
  // const response = await apiClient('/users');
  // return parseJsonResponse<User[]>(response);
  return Promise.resolve([]);
}

/**
 * Fetches a single user by their ID.
 * Corresponds to: GET /api/users/{id}
 * @param userId The ID of the user.
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL: GET /api/users/${userId} - Placeholder.`);
  // const response = await apiClient(`/users/${userId}`);
  // return parseJsonResponse<User>(response);
  return Promise.resolve(null);
}

/**
 * Deletes a user by their ID.
 * Corresponds to: DELETE /api/users/{id}
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/users/${userId} - Placeholder.`);
  // const response = await apiClient(`/users/${userId}`, {
  //   method: 'DELETE',
  // });
  // if (response.status === 204) return { success: true }; // No content success
  // return parseJsonResponse<{ success: boolean; message?: string }>(response);
  return Promise.resolve({ success: true, message: 'User deleted (mock)' });
}

/**
 * Updates the role of a user.
 * Corresponds to: PUT /api/users/{id}/role
 * @param userId The ID of the user.
 * @param roleData Object containing the new role, e.g., { role: 'Admin' }.
 */
export async function updateUserRole(userId: string, roleData: { role: string }): Promise<User> {
  console.log(`API CALL: PUT /api/users/${userId}/role - Placeholder. Data:`, roleData);
  // const response = await apiClient(`/users/${userId}/role`, {
  //   method: 'PUT',
  //   body: JSON.stringify(roleData),
  // });
  // return parseJsonResponse<User>(response);
  return Promise.reject(new Error('updateUserRole not implemented'));
}
