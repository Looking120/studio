// src/services/user-service.ts
import { apiClient, parseJsonResponse } from './api-client';
import type { Employee } from '@/lib/data';

// Define a User type. It might be similar to Employee or have distinct fields.
export interface User extends Omit<Employee, 'status' | 'lastSeen' | 'latitude' | 'longitude'> { 
  role?: string; // Example: 'Admin', 'Manager', 'Employee'
  // Add other user-specific fields from your API response
  [key: string]: any;
}

/**
 * Hires a new user.
 * Corresponds to: POST /api/users/hire
 * @param userData Data for the new user.
 */
export async function hireUser(userData: Omit<User, 'id'>): Promise<User> {
  console.log('API CALL: POST /api/users/hire from user-service. Data:', userData);
  const response = await apiClient('/users/hire', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  return parseJsonResponse<User>(response);
}

/**
 * Fetches all users.
 * Corresponds to: GET /api/users
 */
export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL: GET /api/users.');
  const response = await apiClient('/users');
  return parseJsonResponse<User[]>(response);
}

/**
 * Fetches a single user by their ID.
 * Corresponds to: GET /api/users/{id}
 * @param userId The ID of the user.
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL: GET /api/users/${userId}.`);
  const response = await apiClient(`/users/${userId}`);
  return parseJsonResponse<User>(response);
}

/**
 * Deletes a user by their ID.
 * Corresponds to: DELETE /api/users/{id}
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/users/${userId}.`);
  const response = await apiClient(`/users/${userId}`, {
    method: 'DELETE',
  });
  const result = await parseJsonResponse<{ success: boolean; message?: string }>(response);
  return result || { success: true, message: 'User deleted' }; // Handle 204 No Content
}

/**
 * Updates the role of a user.
 * Corresponds to: PUT /api/users/{id}/role
 * @param userId The ID of the user.
 * @param roleData Object containing the new role, e.g., { role: 'Admin' }.
 */
export async function updateUserRole(userId: string, roleData: { role: string }): Promise<User> {
  console.log(`API CALL: PUT /api/users/${userId}/role. Data:`, roleData);
  const response = await apiClient(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify(roleData),
  });
  return parseJsonResponse<User>(response);
}
