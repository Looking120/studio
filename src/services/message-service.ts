
// src/services/message-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

export interface SendMessagePayload {
  senderId: string;
  receiverId?: string; // API peut nécessiter cela ou déduire de conversationId
  conversationId: string;
  content: string;
}

export interface MarkReadPayload {
  messageIds?: string[];
  conversationId?: string; // API peut nécessiter l'un ou l'autre
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  content: string;
  timestamp: string; // Doit être une chaîne ISO 8601
}

export interface Conversation {
  id: string;
  participants: string[]; // IDs des utilisateurs
  lastMessage?: Message;
  name?: string; // Pour les conversations de groupe
}

export interface UnreadMessagesInfo {
  count: number;
  messages?: Message[];
}

// Supposons que l'API retourne des types compatibles
interface ApiMessage extends Message {}
interface ApiUnreadMessagesInfo extends UnreadMessagesInfo {}
interface ApiMarkReadResponse {
    success: boolean;
    message?: string;
}

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  console.log(`API CALL: POST /messages/send with payload:`, payload);
  try {
    const response = await apiClient<ApiMessage>('/messages/send', {
      method: 'POST',
      body: payload,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in sendMessage:", error);
    throw new HttpError('Failed to send message.', 0, null);
  }
}

export async function getConversationMessages(params: { conversationId: string; userId1?: string; userId2?: string }): Promise<Message[]> {
  console.log(`API CALL: GET /messages/conversation with params:`, params);
  try {
    // L'API attend `conversationId` OU `userId1` & `userId2`. Le frontend passe conversationId.
    const queryParams: Record<string, string> = { conversationId: params.conversationId };
    // if (params.userId1 && params.userId2) { // Logique alternative si l'API préfère les IDs utilisateurs
    //   queryParams.userId1 = params.userId1;
    //   queryParams.userId2 = params.userId2;
    // }

    const response = await apiClient<ApiMessage[]>('/messages/conversation', {
      method: 'GET',
      params: queryParams,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getConversationMessages:", error);
    throw new HttpError('Failed to get conversation messages.', 0, null);
  }
}

export async function getUnreadMessages(employeeId: string): Promise<UnreadMessagesInfo> {
  console.log(`API CALL: GET /messages/${employeeId}/unread`);
  try {
    const response = await apiClient<ApiUnreadMessagesInfo>(`/messages/${employeeId}/unread`, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in getUnreadMessages:", error);
    throw new HttpError(`Failed to get unread messages for employee ${employeeId}.`, 0, null);
  }
}

export async function markMessagesAsRead(payload: MarkReadPayload): Promise<ApiMarkReadResponse> {
  console.log('API CALL: POST /messages/mark-read with payload:', payload);
  try {
    const response = await apiClient<ApiMarkReadResponse>('/messages/mark-read', {
      method: 'POST',
      body: payload,
    });
    return response.data;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    console.error("Unexpected error in markMessagesAsRead:", error);
    throw new HttpError('Failed to mark messages as read.', 0, null);
  }
}
