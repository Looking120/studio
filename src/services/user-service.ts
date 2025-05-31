
// src/services/user-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';
import type { Employee as FrontendEmployee } from '@/lib/data'; // Using this as a base for User

// Frontend User type, can be more specific than Employee if needed
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

interface ApiUserDto {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  role?: string; 
}

const mapApiUserToFrontend = (dto: ApiUserDto): User => ({
  id: dto.id,
  userName: dto.userName,
  firstName: dto.firstName,
  lastName: dto.lastName,
  name: `${dto.firstName || ''} ${dto.lastName || ''}`.trim(), 
  middleName: dto.middleName,
  email: dto.email,
  phoneNumber: dto.phoneNumber,
  role: dto.role || 'User', 
  avatarUrl: '', 
});


/**
 * Fetches all users. (GET /api/users)
 */
export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL (axios): GET /users.');
  try {
    const response = await apiClient<ApiUserDto[]>('/users');
    const usersDto = response.data;
    return (usersDto || []).map(mapApiUserToFrontend);
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch users. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "");
  }
}

/**
 * Fetches a single user by their ID. (GET /api/users/{id})
 * @param userId The ID of the user (should be Guid as string).
 */
export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL (axios): GET /users/${userId}.`);
  try {
    const response = await apiClient<ApiUserDto | null>(`/users/${userId}`);
    const userDto = response.data;
    if (!userDto) return null;
    return mapApiUserToFrontend(userDto);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`User with ID ${userId} not found.`);
        return null;
    }
    console.error(`Error fetching user by ID ${userId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch user by ID ${userId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "");
  }
}

/**
 * Deletes a user by their ID. (DELETE /api/users/{id})
 * @param userId The ID of the user to delete.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  console.log(`API CALL (axios): DELETE /users/${userId}.`);
  try {
    const response = await apiClient(`/users/${userId}`, {
      method: 'DELETE',
    });
    if (response.status === 204 || !response.data) {
      return { success: true, message: 'User deleted successfully.' };
    }
    return response.data as { success: boolean; message?: string } || { success: true, message: 'User deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Delete failed: User with ID ${userId} not found.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to delete user ${userId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "");
  }
}

export interface UpdateUserRolePayload {
  role: string; 
}
/**
 * Updates the role of a user. (PUT /api/users/{id}/role)
 * @param userId The ID of the user.
 * @param roleData Object containing the new role(s).
 */
export async function updateUserRole(userId: string, roleData: UpdateUserRolePayload): Promise<User> {
  console.log(`API CALL (axios): PUT /users/${userId}/role. Data:`, roleData);
  try {
    const response = await apiClient<ApiUserDto>(`/users/${userId}/role`, {
      method: 'PUT',
      body: roleData, 
    });
    return mapApiUserToFrontend(response.data); 
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    if (error instanceof HttpError && error.status === 404) {
      throw new HttpError(`Update role failed: User with ID ${userId} not found or role endpoint misconfigured.`, 404, (error as HttpError)?.responseData || "");
    }
    throw new HttpError(`Failed to update role for user ${userId}. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || "");
  }
}
