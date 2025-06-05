
// src/services/user-service.ts
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used
import type { Employee as FrontendEmployee } from '@/lib/data';

export interface User extends Omit<FrontendEmployee, 'status' | 'lastSeen' | 'latitude' | 'longitude' | 'jobTitle' | 'department' > {
  id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role?: string;
  phoneNumber?: string;
}

const createMockUser = (id: string, data: Partial<User>): User => ({
    id: id,
    userName: data.userName || `mockuser_${id.substring(0,3)}`,
    firstName: data.firstName || "Mock",
    lastName: data.lastName || `User ${id.substring(0,3)}`,
    name: data.name || `Mock User ${id.substring(0,3)}`,
    email: data.email || `mock_${id.substring(0,3)}@example.com`,
    role: data.role || "Employee",
    avatarUrl: data.avatarUrl || `https://placehold.co/40x40.png?text=${(data.firstName || "M")[0]}${(data.lastName || "U")[0]}`,
});


export async function fetchUsers(): Promise<User[]> {
  console.log('MOCK fetchUsers called');
  return Promise.resolve([
      createMockUser('usr-m1', {firstName: "Chat", lastName: "UserA", email: "chat.usera@example.com", role: "Employee"}),
      createMockUser('usr-m2', {firstName: "Chat", lastName: "UserB", email: "chat.userb@example.com", role: "Employee"}),
      createMockUser('usr-m3', {firstName: "Admin", lastName: "Contact", email: "admin.contact@example.com", role: "Admin"}),
  ]);
}

export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`MOCK fetchUserById for ID: ${userId}`);
  if (userId.startsWith("usr-m") || userId === "mock-admin-id" || userId === "mock-employee-id") {
      return Promise.resolve(createMockUser(userId, {firstName: "Specific", lastName: "Mock User"}));
  }
  return Promise.resolve(null);
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`MOCK deleteUser for ID: ${userId}`);
  return Promise.resolve({ success: true, message: "Mock user deleted successfully." });
}

export interface UpdateUserRolePayload {
  role: string;
}

export async function updateUserRole(userId: string, roleData: UpdateUserRolePayload): Promise<User> {
  console.log(`MOCK updateUserRole for ID ${userId} with data:`, roleData);
  return Promise.resolve(createMockUser(userId, { role: roleData.role }));
}
