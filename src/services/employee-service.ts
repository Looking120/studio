
// src/services/employee-service.ts
import type { Employee as FrontendEmployee } from '@/lib/data';
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// Interface pour la réponse de l'API GET /employees (liste)
interface ApiEmployeeListItem {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  employeeNumber?: string;
  email: string;
  phoneNumber?: string;
  departmentName?: string;
  positionTitle?: string;
  currentStatus?: string; // Exemple: "Available", "Offline" - statut d'activité
  lastStatusChange?: string;
  // Inclure ici tous les champs retournés par l'API pour un élément de la liste
}

// L'interface ApiEmployee (pour GET /employees/{id}) peut être plus détaillée si nécessaire.
// Pour l'instant, nous supposons qu'elle est similaire à FrontendEmployee ou nécessite son propre mappage.
interface ApiEmployeeDetail extends FrontendEmployee {
    // Potentiellement plus de champs ou des noms de champs différents pour la vue détaillée
    phoneNumber?: string;
    address?: string;
    // Si l'API GET /employees/{id} retourne departmentName et positionTitle,
    // il faudra aussi un mappage pour fetchEmployeeById.
}


export interface EmployeeLocation {
  latitude: number;
  longitude: number;
  lastSeen: string;
}

export interface HireEmployeePayload {
  userId?: string;
  firstName: string;
  lastName: string;
  middleName?: string | undefined;
  email: string;
  employeeNumber: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  officeId: string;
  address?: string | undefined;
  phoneNumber?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: string | undefined;
  avatarUrl?: string | undefined;
}

interface ApiHiredEmployeeResponse extends FrontendEmployee {
    firstName: string;
    lastName: string;
}


export async function fetchEmployees(): Promise<FrontendEmployee[]> {
  console.log('API CALL: GET /employees');
  try {
    const response = await apiClient<ApiEmployeeListItem[]>('/employees', {
      method: 'GET',
    });
    // Mapper la réponse de l'API à l'interface FrontendEmployee
    return response.data.map(apiEmp => {
      let name = 'N/A'; // Default name
      if (apiEmp.firstName && apiEmp.lastName) {
        name = `${apiEmp.firstName} ${apiEmp.lastName}`.trim();
      } else if (apiEmp.firstName) {
        name = apiEmp.firstName;
      } else if (apiEmp.lastName) {
        name = apiEmp.lastName;
      }

      return {
        id: apiEmp.id,
        name: name,
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined, // Map from departmentName
        jobTitle: apiEmp.positionTitle || undefined,   // Map from positionTitle
        // Le statut 'Active'/'Inactive' n'est pas dans cette réponse API.
        // Il sera undefined, et l'UI affichera 'N/A' ou le placeholder.
        status: undefined, 
        avatarUrl: undefined, // Non fourni par cet endpoint
        // Les autres champs optionnels de FrontendEmployee seront undefined s'ils ne sont pas dans ApiEmployeeListItem
        officeId: undefined,
        hireDate: undefined,
      };
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployees:", error);
    throw new HttpError('Failed to fetch employees.', 0, null);
  }
}

export async function fetchEmployeeById(id: string): Promise<FrontendEmployee | null> {
  console.log(`API CALL: GET /employees/${id}`);
  try {
    // Si GET /employees/{id} retourne aussi departmentName, positionTitle, etc.
    // un mappage similaire à fetchEmployees sera nécessaire ici.
    // Pour l'instant, supposons que ApiEmployeeDetail est compatible ou que l'API
    // pour un seul employé retourne directement les champs attendus par FrontendEmployee.
    const response = await apiClient<ApiEmployeeDetail | null>(`/employees/${id}`, {
      method: 'GET',
    });
    // Exemple de mappage si nécessaire pour fetchEmployeeById:
    // if (response.data) {
    //   const apiDetail = response.data as any; // Cast to any or a specific detail interface
    //   return {
    //     ...apiDetail, // spread other compatible fields
    //     name: `${apiDetail.firstName || ''} ${apiDetail.lastName || ''}`.trim() || undefined,
    //     department: apiDetail.departmentName || undefined,
    //     jobTitle: apiDetail.positionTitle || undefined,
    //     status: apiDetail.employmentStatus === 'Active' ? 'Active' : 'Inactive', // Example mapping for status
    //   };
    // }
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
        console.warn(`Employee with id ${id} not found.`);
        return null;
    }
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeeById:", error);
    throw new HttpError(`Failed to fetch employee ${id}.`, 0, null);
  }
}

export async function updateEmployee(id: string, employeeData: Partial<Omit<FrontendEmployee, 'id'>>): Promise<FrontendEmployee> {
  console.log(`API CALL: PUT /employees/${id} with data:`, employeeData);
  try {
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData,
    });
    return response.data; // Assumer que la réponse est compatible ou mapper si nécessaire
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error(`Unexpected error in updateEmployee for id ${id}:`, error);
    throw new HttpError(`Failed to update employee ${id}.`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function fetchEmployeesByStatus(status: 'Active' | 'Inactive'): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/status/${status}`);
  try {
    // Cette fonction nécessitera également le mappage si l'API retourne des champs différents
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/status/${status}`, {
      method: 'GET',
    });
    return response.data.map(apiEmp => ({ // Mappage similaire à fetchEmployees
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || 'Unknown Name'),
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: status, // Ici, le statut est connu par le filtre
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in fetchEmployeesByStatus:", error);
    throw new HttpError(`Failed to fetch employees with status ${status}.`, 0, null);
  }
}

export async function updateEmployeeStatus(employeeId: string, status: 'Active' | 'Inactive'): Promise<FrontendEmployee> {
  console.log(`API CALL: PUT /employees/${employeeId}/status with status: ${status}`);
  try {
    // L'API pour updateEmployeeStatus pourrait retourner l'employé mis à jour
    // avec des champs comme departmentName, etc. Il faudrait donc mapper la réponse.
    const response = await apiClient<ApiEmployeeDetail>(`/employees/${employeeId}/status`, { // Supposons ApiEmployeeDetail ou une structure similaire
      method: 'PUT',
      body: status, 
    });
    // Ici, il faudrait mapper response.data (qui est de type ApiEmployeeDetail) vers FrontendEmployee
    // si les noms de champs diffèrent. Par exemple:
    // const apiEmp = response.data;
    // return {
    //   id: apiEmp.id,
    //   name: apiEmp.name || `${apiEmp.firstName || ''} ${apiEmp.lastName || ''}`.trim() || undefined, // Adapter selon la réponse
    //   email: apiEmp.email,
    //   department: (apiEmp as any).departmentName || apiEmp.department || undefined, // Adapter selon la réponse
    //   jobTitle: (apiEmp as any).positionTitle || apiEmp.jobTitle || undefined, // Adapter selon la réponse
    //   status: apiEmp.status, // Devrait être 'Active' ou 'Inactive'
    //   avatarUrl: apiEmp.avatarUrl,
    // };
    return response.data; // Pour l'instant, retour direct, mais un mappage est probable ici aussi.
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in updateEmployeeStatus:", error);
    throw new HttpError(`Failed to update status for employee ${employeeId}. Error: ${error instanceof Error ? error.message : String(error)}`, (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function hireEmployee(employeeData: HireEmployeePayload): Promise<ApiHiredEmployeeResponse> {
  console.log('API CALL: POST /users/hire with data:', JSON.stringify(employeeData, null, 2));
  try {
    const response = await apiClient<ApiHiredEmployeeResponse>('/users/hire', {
      method: 'POST',
      body: employeeData,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in hireEmployee:", error);
    throw new HttpError('Failed to hire employee.', (error as HttpError)?.status || 0, (error as HttpError)?.responseData);
  }
}

export async function getCurrentEmployeeLocation(employeeId: string): Promise<EmployeeLocation> {
  console.log(`API CALL: GET /employees/${employeeId}/location/current`);
  try {
    const response = await apiClient<EmployeeLocation>(`/employees/${employeeId}/location/current`, { // Interface EmployeeLocation semble OK ici
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getCurrentEmployeeLocation:", error);
    throw new HttpError(`Failed to get current location for employee ${employeeId}.`, 0, null);
  }
}

export async function getNearbyEmployees(employeeId: string): Promise<FrontendEmployee[]> {
  console.log(`API CALL: GET /employees/${employeeId}/location/nearby`);
  try {
    // Cette fonction nécessitera également le mappage si l'API retourne des champs différents
    const response = await apiClient<ApiEmployeeListItem[]>(`/employees/${employeeId}/location/nearby`, {
      method: 'GET',
    });
    return response.data.map(apiEmp => ({ // Mappage similaire à fetchEmployees
        id: apiEmp.id,
        name: (apiEmp.firstName && apiEmp.lastName) ? `${apiEmp.firstName} ${apiEmp.lastName}`.trim() : (apiEmp.firstName || apiEmp.lastName || 'Unknown Name'),
        email: apiEmp.email,
        department: apiEmp.departmentName || undefined,
        jobTitle: apiEmp.positionTitle || undefined,
        status: undefined, // Non pertinent pour les employés à proximité peut-être, ou non fourni
        avatarUrl: undefined,
        officeId: undefined,
        hireDate: undefined,
    }));
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getNearbyEmployees:", error);
    throw new HttpError(`Failed to get nearby employees for employee ${employeeId}.`, 0, null);
  }
}
