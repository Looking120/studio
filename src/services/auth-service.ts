
// src/services/auth-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Interface pour la réponse brute de l'API signIn
interface ApiSignInRawResponse {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessToken: string;
  durationInMinutes: number;
  message?: string; // Ajouté pour gérer le message dans la réponse
}

export interface SignInUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string; 
  userName?: string;
  email: string;
  role: string;
}
export interface SignInResponse {
  token: string;
  user: SignInUser;
  message?: string; // Ajouté pour propager le message de l'API
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string;
  userName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
}

// Interface pour la réponse de l'API signUp (si elle diffère de signIn)
interface ActualSignUpApiResponse {
    id: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    message?: string; 
    // Ne pas inclure accessToken ici si signUp ne logue pas automatiquement
}


export interface SignUpResponse {
  message: string;
  userId?: string;
  // Pas de token ici si le backend ne connecte pas l'utilisateur après l'inscription
}

export async function signIn(credentials: { email?: string; password?: string }): Promise<SignInResponse> {
  console.log('Auth Service: Attempting signIn via API for email:', credentials.email);
  try {
    const response = await apiClient<ApiSignInRawResponse>('/auth/signin', {
      method: 'POST',
      body: credentials,
    });
    
    const apiData = response.data;
    console.log('Auth Service: signIn API response data:', apiData);

    if (!apiData.accessToken) {
        console.error('Auth Service: No accessToken in signIn response from API.');
        throw new HttpError(apiData.message || 'Authentication failed: No token received from server.', response.status, apiData);
    }
    
    const user: SignInUser = {
      id: apiData.id,
      firstName: apiData.firstName,
      lastName: apiData.lastName,
      name: `${apiData.firstName} ${apiData.lastName}`,
      userName: apiData.userName,
      email: apiData.email,
      role: apiData.role,
    };
    
    return {
      token: apiData.accessToken,
      user: user,
      message: apiData.message || "Login successful"
    };

  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) {
      console.warn(`Auth Service: signIn failed for ${credentials.email}. Error: ${error.message}`);
      throw error;
    }
    console.error(`Auth Service: Unexpected error during signIn for ${credentials.email}:`, error);
    throw new HttpError('An unexpected error occurred during sign in.', 0, null);
  }
}

export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('Auth Service: Attempting signUp via API for email:', userData.email);
  try {
    const response = await apiClient<ActualSignUpApiResponse>('/auth/signup', {
      method: 'POST',
      body: userData,
    });
    
    // L'API signUp retourne un message et potentiellement des infos utilisateur
    // mais ne logue pas directement l'utilisateur (pas de token retourné par cet endpoint)
    return {
      message: response.data.message || "Signup successful! Please log in.",
      userId: response.data.id,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      console.error(`Auth Service: signUp API error for ${userData.email}: ${error.message}`, error.responseData);
      throw error; // Re-throw HttpError pour que la page puisse afficher le message
    }
    console.error(`Auth Service: Unexpected error during signUp for ${userData.email}:`, error);
    throw new HttpError('An unexpected error occurred during sign up.', 0, null);
  }
}

export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  console.log('Auth Service: Attempting signOut via API');
  try {
    // L'endpoint signOut ne prend généralement pas de body et peut ne pas retourner de JSON.
    // Nous faisons un POST vide. Axios enverra Content-Type: application/json par défaut.
    // Si le backend attend pas de Content-Type ou un autre, cela pourrait être 415.
    // Pour un POST sans body, le content-type peut être omis ou mis à une valeur que le serveur attend.
    await apiClient<any>('/auth/signout', {
      method: 'POST',
      // body: {}, // Envoyer un objet vide pour que Content-Type: application/json soit envoyé
      headers: { 'Content-Length': '0' } // Alternative si le serveur est strict
    });
    console.log('Auth Service: signOut API call successful or no error thrown.');
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
    }
    return { message: "Successfully signed out from server and local session cleared.", serverSignOutOk: true };
  } catch (error) {
    console.warn('Auth Service: signOut API call failed or threw an error. Clearing local session anyway.', error);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
    }
    if (error instanceof HttpError && error.status === 401) {
         // Si déjà déconnecté côté serveur, ce n'est pas une "vraie" erreur.
        return { message: "Local session cleared. Server indicated already signed out or session invalid.", serverSignOutOk: false};
    }
    // Pour les autres erreurs HttpError ou erreurs inattendues:
    const errorMessage = error instanceof Error ? error.message : "Could not confirm server sign out.";
    return { message: `Local session cleared. ${errorMessage}`, serverSignOutOk: false };
  }
}
