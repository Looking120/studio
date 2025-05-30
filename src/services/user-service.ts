
// src/services/user-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';
import type { Employee as FrontendEmployee } from '@/lib/data'; // Using this as a base for User

// Frontend User type, can be more specific than Employee if needed
export interface User extends Omit<FrontendEmployee, 'status' | 'lastSeen' | 'latitude' | 'longitude' | 'jobTitle' | 'department' > {
  id: string; // Ensure id is string, as IdentityUser<Guid> uses Guid
  userName?: string; // From AppUser
  firstName?: string; // From AppUser
  lastName?: string; // From AppUser
  middleName?: string; // From AppUser
  email: string; // From IdentityUser
  role?: string; // Typically managed by roles, not a direct field on AppUser but often returned in DTOs
  phoneNumber?: string; // From IdentityUser
  // Add other fields as per your UserDto from backend
}

// Backend DTO for User (example, adjust to your actual API response)
interface ApiUserDto {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  role?: string; // If your User DTO includes a role string
  // employeeId?: string; // If linking to an Employee record
}

const mapApiUserToFrontend = (dto: ApiUserDto): User => ({
  id: dto.id,
  userName: dto.userName,
  firstName: dto.firstName,
  lastName: dto.lastName,
  name: `${dto.firstName || ''} ${dto.lastName || ''}`.trim(), // Construct name
  middleName: dto.middleName,
  email: dto.email,
  phoneNumber: dto.phoneNumber,
  role: dto.role || 'User', // Default role if not provided
  avatarUrl: '', // User DTO might not have avatar, Employee does
});

// Note: /api/users/hire is handled by employee-service.ts's hireEmployee
// If you need a separate hireUser here, ensure its payload and endpoint are distinct.

/**
 * Fetches all users. (GET /api/users)
 */
export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL: GET /api/users.');
  try {
    const response = await apiClient('/users');
    const usersDto = await parseJsonResponse<ApiUserDto[]>(response);
    return (usersDto || []).map(mapApiUserToFrontend);
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch users. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Fetches a single user by their ID. (GET /api/users/{id})
 * @param userId The ID of the user (should be Guid as string).
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL: GET /api/users/${userId}.`);
  try {
    const response = await apiClient(`/users/${userId}`);
    if (response.status === 404) return null;
    const userDto = await parseJsonResponse<ApiUserDto | null>(response);
    if (!userDto) return null;
    return mapApiUserToFrontend(userDto);
  } catch (error) {
    console.error(`Error fetching user by ID ${userId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    throw new HttpError(`Failed to fetch user by ID ${userId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

/**
 * Deletes a user by their ID. (DELETE /api/users/{id})
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL: DELETE /api/users/${userId}.`);
  try {
    const response = await apiClient(`/users/${userId}`, {
      method: 'DELETE',
    });
     if (response.ok) {
      if (response.status === 204) return { success: true, message: 'User deleted successfully.' };
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json") && response.body) {
          const result = await response.json().catch(() => null) as { success: boolean; message?: string } | null;
          return result || { success: true, message: 'User deleted successfully.' };
      }
      return { success: true, message: 'User deleted successfully.' };
    }
    await parseJsonResponse<any>(response); // Will throw for non-OK
    throw new HttpError(`Unexpected error deleting user ${userId}`, response.status, await response.text());
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: User with ID ${userId} not found.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to delete user ${userId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

export interface UpdateUserRolePayload {
  role: string; // Or an array of roles, depending on your backend
}
/**
 * Updates the role of a user. (PUT /api/users/{id}/role)
 * @param userId The ID of the user.
 * @param roleData Object containing the new role(s).
 */
export async function updateUserRole(userId: string, roleData: UpdateUserRolePayload): Promise<User> {
  console.log(`API CALL: PUT /api/users/${userId}/role. Data:`, roleData);
  try {
    const response = await apiClient(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(roleData), // Backend expects { "role": "NewRole" } or similar
    });
    const userDto = await parseJsonResponse<ApiUserDto>(response);
    return mapApiUserToFrontend(userDto); // Assuming API returns the updated user
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    if (error instanceof UnauthorizedError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update role failed: User with ID ${userId} not found or role endpoint misconfigured.`, 404, error.responseText);
    }
    throw new HttpError(`Failed to update role for user ${userId}. ${error instanceof Error ? error.message : String(error)}`, error instanceof HttpError ? error.status : 500, error instanceof HttpError ? error.responseText : "");
  }
}

// hireUser is intentionally omitted as /api/users/hire is handled by employee-service.ts
// If you need a distinct hireUser here, ensure its DTO/payload and purpose are clear.
// For example, if it's just creating an AppUser without an Employee record.
// export async function hireUser(userData: Omit<User, 'id'>): Promise<User> {
//   console.log('API CALL: POST /api/users -- MOCKED if different from hireEmployee');
//   // ... implementation ...
// }
