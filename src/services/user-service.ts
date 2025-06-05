
// src/services/user-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';
import type { Employee as FrontendEmployee } from '@/lib/data'; // Pour référence de type

// Le type User est utilisé dans ChatPage, il est plus simple que FrontendEmployee
export interface User {
  id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Combinaison de firstName et lastName
  middleName?: string;
  email: string;
  role?: string;
  avatarUrl?: string; // Ajouté pour la cohérence avec ChatPage
  phoneNumber?: string;
}

// Supposons que l'API retourne un type compatible
interface ApiUser extends User {}
interface ApiDeleteResponse {
    success: boolean;
    message?: string;
}

export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL: GET /users');
  try {
    const response = await apiClient<ApiUser[]>('/users', {
      method: 'GET',
    });
    // Assurez-vous que l'API retourne `name` ou construisez-le ici si nécessaire
    return response.data.map(user => ({ ...user, name: user.name || `${user.firstName} ${user.lastName}`.trim() }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchUsers:", error);
    throw new HttpError('Failed to fetch users.', 0, null);
  }
}

export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL: GET /users/${userId}`);
  try {
    const response = await apiClient<ApiUser | null>(`/users/${userId}`, {
      method: 'GET',
    });
    if (response.data) {
        return { ...response.data, name: response.data.name || `${response.data.firstName} ${response.data.lastName}`.trim() };
    }
    return null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`User with id ${userId} not found.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchUserById:", error);
    throw new HttpError(`Failed to fetch user ${userId}.`, 0, null);
  }
}

export async function deleteUser(userId: string): Promise<ApiDeleteResponse> {
  console.log(`API CALL: DELETE /users/${userId}`);
  try {
    const response = await apiClient<ApiDeleteResponse>(`/users/${userId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in deleteUser:", error);
    throw new HttpError(`Failed to delete user ${userId}.`, 0, null);
  }
}

export interface UpdateUserPayload extends Partial<Omit<User, 'id' | 'name'>> {
  // Exclut 'id' car il est dans l'URL, 'name' est dérivé
  // Le backend s'attend peut-être à des champs spécifiques
}

export async function updateUser(userId: string, userData: UpdateUserPayload): Promise<User> {
  console.log(`API CALL: PUT /users/${userId} with data:`, userData);
  try {
    const response = await apiClient<ApiUser>(`/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
     return { ...response.data, name: response.data.name || `${response.data.firstName} ${response.data.lastName}`.trim() };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateUser:", error);
    throw new HttpError(`Failed to update user ${userId}.`, 0, null);
  }
}


export interface UpdateUserRolePayload {
  role: string;
}

export async function updateUserRole(userId: string, roleData: UpdateUserRolePayload): Promise<User> {
  console.log(`API CALL: PUT /users/${userId}/role with data:`, roleData);
  try {
    const response = await apiClient<ApiUser>(`/users/${userId}/role`, {
      method: 'PUT',
      body: roleData,
    });
    return { ...response.data, name: response.data.name || `${response.data.firstName} ${response.data.lastName}`.trim() };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateUserRole:", error);
    throw new HttpError(`Failed to update role for user ${userId}.`, 0, null);
  }
}
