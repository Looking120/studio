
// src/services/auth-service.ts
import { apiClient, parseJsonResponse, UnauthorizedError } from './api-client';

// Interface pour la réponse BRUTE de l'API /api/auth/signin
interface ApiSignInRawResponse {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  accessToken: string;
  durationInMinutes: number;
}

// Interface pour ce que le service signIn retourne à l'application (structure attendue par les composants)
export interface SignInUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Pour la compatibilité, peut être construit à partir de firstName et lastName
  userName?: string;
  email: string;
  role: string;
}
export interface SignInResponse {
  token: string; // L'application s'attend à 'token'
  user: SignInUser;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  middleName?: string;
  userName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  birthDate?: string;
  phoneNumber?: string;
}

export interface SignUpResponse {
  message: string;
  userId?: string;
}

/**
 * Signs in a user.
 */
export async function signIn(credentials: { email?: string; password?: string }): Promise<SignInResponse> {
  console.log('Auth Service: Attempting to sign in with email:', credentials.email);
  try {
    const response = await apiClient('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const rawText = await response.clone().text();
    console.log('Auth Service - RAW RESPONSE TEXT from /api/auth/signin:', rawText);

    const parsedRawResponse = await parseJsonResponse<ApiSignInRawResponse>(response);
    console.log('Auth Service - Parsed RAW API JSON response from /api/auth/signin:', parsedRawResponse);

    if (!parsedRawResponse) {
      console.error('Auth Service - DEBUG: parsedRawResponse from parseJsonResponse is null or undefined.');
      throw new Error('Authentication failed: No valid JSON data received from server response.');
    }
    
    // Vérification spécifique pour les objets vides
    if (typeof parsedRawResponse === 'object' && parsedRawResponse !== null && Object.keys(parsedRawResponse).length === 0) {
      console.error('Auth Service - DEBUG: The server sent a JSON response, but it was an empty object {}. An "accessToken" field is expected.');
      throw new Error('Authentication failed: The server responded with an empty JSON object {}. Expected an "accessToken" field in the JSON response.');
    }

    if (!parsedRawResponse.accessToken) {
      console.error('Auth Service - DEBUG: The server sent a JSON response, but it did not contain an "accessToken" field, or the accessToken was falsy. Full parsed JSON response:', parsedRawResponse);
      throw new Error('Authentication failed: The server\'s JSON response did not include an "accessToken" field. Response received: ' + JSON.stringify(parsedRawResponse));
    }
    if (typeof parsedRawResponse.accessToken !== 'string' || parsedRawResponse.accessToken.trim() === '') {
      console.error('Auth Service - DEBUG: parsedRawResponse.accessToken is present, but it is not a non-empty string. Token value:', parsedRawResponse.accessToken, 'Type:', typeof parsedRawResponse.accessToken);
      throw new Error('Authentication failed: Access token received from server is not a valid string or is empty. Access Token: ' + JSON.stringify(parsedRawResponse.accessToken));
    }
    
    // Adapter la réponse brute de l'API à la structure SignInResponse attendue par le reste de l'application
    const appResponse: SignInResponse = {
      token: parsedRawResponse.accessToken,
      user: {
        id: parsedRawResponse.id,
        firstName: parsedRawResponse.firstName,
        lastName: parsedRawResponse.lastName,
        name: `${parsedRawResponse.firstName} ${parsedRawResponse.lastName}`,
        userName: parsedRawResponse.userName,
        email: parsedRawResponse.email,
        role: parsedRawResponse.role,
      }
    };
    console.log('Auth Service - Adapted response for the app:', appResponse);
    return appResponse;

  } catch (error) {
    console.error('Auth Service - signIn error:', error);
    if (error instanceof UnauthorizedError) {
      throw error; 
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred during sign in.');
  }
}

/**
 * Signs up a new user.
 */
export async function signUp(userData: SignUpData): Promise<SignUpResponse> {
  console.log('Auth Service: Attempting to sign up user:', userData.userName);
  try {
    const response = await apiClient('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    const parsedResponse = await parseJsonResponse<SignUpResponse>(response);
    console.log('Auth Service - Parsed JSON response from /api/auth/signup:', parsedResponse);
    if (!parsedResponse || !parsedResponse.message) {
        throw new Error('Signup failed: No confirmation message received from server.');
    }
    return parsedResponse;
  } catch (error) {
    console.error('Auth Service - signUp error:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred during sign up.');
  }
}

/**
 * Signs out the current user.
 * Clears local authentication data and optionally attempts to sign out from the server.
 * @returns A promise with the sign-out status.
 */
export async function signOut(): Promise<{ message: string; serverSignOutOk: boolean }> {
  let serverSignOutOk = false;
  let serverMessage = "Server sign-out not attempted or failed.";
  let finalMessage = "";

  try {
    console.log('Auth Service: Attempting server sign-out...');
    // On s'attend à ce que apiClient inclue le token dans l'en-tête Authorization
    const response = await apiClient('/auth/signout', { method: 'POST' });

    if (response.ok) {
      serverSignOutOk = true;
      // Essayer de lire le message du corps de la réponse si elle n'est pas vide
      if (response.status !== 204 && response.headers.get("content-length") !== "0") {
        try {
          const parsed = await parseJsonResponse<{ message?: string }>(response);
          serverMessage = parsed?.message || "Successfully signed out from server.";
        } catch (e) {
          // Le corps n'était pas du JSON valide ou était vide, mais le statut était OK.
          console.warn("Auth Service: Server sign-out response was OK but body parsing failed or was empty. Error:", e instanceof Error ? e.message : String(e));
          serverMessage = "Successfully signed out from server (response body issue or empty).";
        }
      } else {
         serverMessage = "Successfully signed out from server (no content).";
      }
      console.log(`Auth Service: ${serverMessage}`);
    } else {
      // La déconnexion du serveur a échoué (ex: token déjà expiré, donc 401)
      const errorText = await response.text().catch(() => "Could not read error text from server response."); 
      serverMessage = `Server sign-out attempt failed with status ${response.status}: ${errorText || response.statusText || 'No additional error message from server.'}`;
      console.warn(`Auth Service: ${serverMessage}`);
    }
  } catch (error) {
    // Erreur réseau ou autre pendant la tentative de déconnexion du serveur
    serverMessage = `Error during server sign-out attempt: ${error instanceof Error ? error.message : "Unknown error"}`;
    console.error(`Auth Service: ${serverMessage}`, error);
  }

  // Nettoyage local quoi qu'il arrive
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    console.log('Auth Service: Auth token and user info removed from localStorage.');
    finalMessage = `Local sign-out successful. ${serverMessage}`;
  } else {
    finalMessage = `Local storage not available. ${serverMessage}`;
  }
  
  return {
    message: finalMessage,
    serverSignOutOk,
  };
}
