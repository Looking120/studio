
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
  middleName?: string | null; // API can return null for middleName
  email: string;
  role?: string; // Frontend uses single role string
  avatarUrl?: string;
  phoneNumber?: string;
  isHired?: boolean; 
}

// Interface pour correspondre à la structure de l'API pour un utilisateur individuel
interface ApiUserResponse {
  id: string;
  userName?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  roles: string[]; // API returns an array of roles
}

// Supposons que l'API retourne un type compatible pour les listes
interface ApiUserListUser extends ApiUserResponse {} // Utilisé pour la liste

interface ApiDeleteResponse {
    success: boolean;
    message?: string;
}

// This function is used by ChatPage. If /api/users ONLY returns unhired users,
// then this function will also only return unhired users, which might be an issue for Chat.
// This needs to be reviewed based on backend capabilities for fetching ALL users or specific types.
export async function fetchUsers(): Promise<User[]> {
  console.log('API CALL: GET /users (fetchUsers - for Chat, potentially needs review)');
  try {
    // Assuming this endpoint /users, without specific filters, might return all users
    // or be intended for a different purpose than unhired users.
    // If it strictly returns unhired users, ChatPage will only list unhired users.
    const response = await apiClient<ApiUserListUser[]>('/users', {
      method: 'GET',
      // Consider if pagination or filters are needed here for chat users
    });
    return response.data.map(apiUser => ({
        id: apiUser.id,
        userName: apiUser.userName,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        name: apiUser.firstName && apiUser.lastName ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : apiUser.userName || apiUser.email,
        middleName: apiUser.middleName,
        email: apiUser.email,
        role: apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : 'User', // Take the first role
        isHired: undefined, // isHired status might not be directly available or relevant here
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchUsers:", error);
    throw new HttpError('Failed to fetch users.', 0, null);
  }
}

// This function is for fetching UNHIRED users (applicants).
// As per user instruction, GET /api/users (with pagination) returns these users.
export async function fetchUnhiredUsers(): Promise<User[]> {
  console.log('API CALL: GET /users (fetchUnhiredUsers - for Applicants)');
  try {
    // The endpoint /api/users with pagination is stated to return unhired users.
    const response = await apiClient<ApiUserListUser[]>('/users', { 
      method: 'GET',
      params: { PageNumber: 1, PageSize: 100 } // Fetch up to 100 applicants
    });
    return response.data.map(apiUser => ({
      id: apiUser.id,
      userName: apiUser.userName,
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      name: apiUser.firstName && apiUser.lastName ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : apiUser.userName || apiUser.email,
      middleName: apiUser.middleName,
      email: apiUser.email,
      role: apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : 'User', // Take the first role
      isHired: false, // Explicitly set as false as these are unhired users
      // avatarUrl and phoneNumber might not be in the /users list response, depends on API.
      // They are available when navigating to "Hire" form from an applicant if passed via query params.
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchUnhiredUsers:", error);
    throw new HttpError('Failed to fetch unhired users.', 0, null);
  }
}


export async function fetchUserById(userId: string): Promise<User | null> {
  console.log(`API CALL: GET /users/${userId}`);
  try {
    const response = await apiClient<ApiUserResponse | null>(`/users/${userId}`, { // Expect single user structure
      method: 'GET',
    });
    if (response.data) {
        const apiUser = response.data;
        return { 
            id: apiUser.id,
            userName: apiUser.userName,
            firstName: apiUser.firstName,
            lastName: apiUser.lastName,
            name: apiUser.firstName && apiUser.lastName ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : apiUser.userName || apiUser.email,
            middleName: apiUser.middleName,
            email: apiUser.email,
            role: apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : 'User',
            // isHired status would ideally come from this specific user fetch if available
        };
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

export interface UpdateUserPayload extends Partial<Omit<User, 'id' | 'name' | 'role' | 'isHired'>> {
  // Exclut 'id', 'name' (dérivé), 'role' (géré par endpoint dédié), 'isHired' (géré par processus d'embauche)
  // L'API peut s'attendre à `roles: string[]` si le rôle doit être mis à jour ici.
  // Pour l'instant, ce payload est pour les champs de base modifiables directement sur un User.
  roles?: string[]; // Si la mise à jour du rôle se fait aussi par cet endpoint.
}

export async function updateUser(userId: string, userData: UpdateUserPayload): Promise<User> {
  console.log(`API CALL: PUT /users/${userId} with data:`, userData);
  try {
    const response = await apiClient<ApiUserResponse>(`/users/${userId}`, { // Attend la structure API
      method: 'PUT',
      body: userData,
    });
    const apiUser = response.data;
    return { 
        id: apiUser.id,
        userName: apiUser.userName,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        name: apiUser.firstName && apiUser.lastName ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : apiUser.userName || apiUser.email,
        middleName: apiUser.middleName,
        email: apiUser.email,
        role: apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : 'User',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateUser:", error);
    throw new HttpError(`Failed to update user ${userId}.`, 0, null);
  }
}


export interface UpdateUserRolePayload {
  roles: string[]; // L'API pour /role attend probablement un tableau de rôles
}

export async function updateUserRole(userId: string, roleData: UpdateUserRolePayload): Promise<User> {
  console.log(`API CALL: PUT /users/${userId}/role with data:`, roleData);
  try {
    const response = await apiClient<ApiUserResponse>(`/users/${userId}/role`, { // Attend la structure API
      method: 'PUT',
      body: roleData,
    });
    const apiUser = response.data;
    return { 
        id: apiUser.id,
        userName: apiUser.userName,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        name: apiUser.firstName && apiUser.lastName ? `${apiUser.firstName} ${apiUser.lastName}`.trim() : apiUser.userName || apiUser.email,
        middleName: apiUser.middleName,
        email: apiUser.email,
        role: apiUser.roles && apiUser.roles.length > 0 ? apiUser.roles[0] : 'User',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateUserRole:", error);
    throw new HttpError(`Failed to update role for user ${userId}.`, 0, null);
  }
}

