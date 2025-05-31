
// src/services/message-service.ts
import { apiClient, UnauthorizedError, HttpError } from './api-client';

// For data sent TO the API
export interface SendMessagePayload {
  senderId: string; // Usually inferred by backend from token, but API might require it
  receiverId?: string; // For direct messages if applicable
  conversationId: string; // ID of the conversation/chat room
  content: string;
}

export interface MarkReadPayload {
  messageIds?: string[];
  conversationId?: string;
  // userId for whom messages are marked read is usually inferred by backend from auth token
}

// For data received FROM the API (DTOs)
interface ApiMessageDto {
  id: string;
  senderId: string;
  senderName?: string; // Optional: Backend might join and provide this
  conversationId: string;
  content: string;
  timestamp: string; // ISO Date string
}

interface ApiUnreadMessagesDto {
  count: number;
  messages?: ApiMessageDto[];
}

// Frontend-friendly Message type returned by service functions
export interface Message {
  id: string;
  senderId: string;
  senderName?: string; // Name of the sender, if available
  conversationId: string;
  content: string;
  timestamp: string; // Keep as ISO string, page can format
}

export interface Conversation { // Kept from mock, adjust if API for conversations exists
  id: string;
  participants: string[];
  lastMessage?: Message;
  name?: string;
}

export interface UnreadMessagesInfo {
  count: number;
  messages?: Message[];
}

const mapApiMessageToFrontend = (dto: ApiMessageDto): Message => ({
  id: dto.id,
  senderId: dto.senderId,
  senderName: dto.senderName || 'Unknown User',
  conversationId: dto.conversationId,
  content: dto.content,
  timestamp: dto.timestamp,
});

/**
 * Sends a message. (POST /api/messages/send)
 * @param payload Data for the message to be sent.
 */
export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  console.log(`API CALL (axios): POST /messages/send. Data:`, payload);
  try {
    const response = await apiClient<ApiMessageDto>('/messages/send', {
      method: 'POST',
      body: payload,
    });
    return mapApiMessageToFrontend(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to send message. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches messages for a specific conversation. (GET /api/messages/conversation)
 * @param params Parameters like conversationId.
 */
export async function getConversationMessages(params: { conversationId: string; userId1?: string; userId2?: string }): Promise<Message[]> {
  console.log(`API CALL (axios): GET /messages/conversation. Params:`, params);
  try {
    const response = await apiClient<ApiMessageDto[]>('/messages/conversation', {
      method: 'GET',
      params: { conversationId: params.conversationId } // Adjust if API uses userId1/userId2
    });
    const messagesDto = response.data;
    return (messagesDto || []).map(mapApiMessageToFrontend);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch messages. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Fetches unread messages count or details for an employee. (GET /api/messages/{employeeId}/unread)
 * employeeId here is the ID of the logged-in user whose unread messages are being fetched.
 * @param employeeId The ID of the employee (logged-in user).
 */
export async function getUnreadMessages(employeeId: string): Promise<UnreadMessagesInfo> {
  console.log(`API CALL (axios): GET /messages/${employeeId}/unread.`);
  if (!employeeId) {
    console.warn("getUnreadMessages called without employeeId.");
    return { count: 0, messages: [] };
  }
  try {
    const response = await apiClient<ApiUnreadMessagesDto>(`/messages/${employeeId}/unread`, {
      method: 'GET',
    });
    const dto = response.data;
    return {
      count: dto.count,
      messages: (dto.messages || []).map(mapApiMessageToFrontend),
    };
  } catch (error) {
    console.error(`Error fetching unread messages for employee ${employeeId}:`, error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to fetch unread messages. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}

/**
 * Marks messages as read. (POST /api/messages/mark-read)
 * @param payload Data to identify messages to mark as read.
 */
export async function markMessagesAsRead(payload: MarkReadPayload): Promise<{ success: boolean; message?: string }> {
  console.log('API CALL (axios): POST /messages/mark-read. Data:', payload);
  try {
    const response = await apiClient<{ success: boolean; message?: string }>('/messages/mark-read', {
      method: 'POST',
      body: payload,
    });
    return response.data || { success: false, message: "No response data from mark-read" };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    if (error instanceof UnauthorizedError || error instanceof HttpError) throw error;
    throw new HttpError(`Failed to mark messages as read. ${error instanceof Error ? error.message : String(error)}`, (error as any).status || 500, (error as HttpError)?.responseData || String(error));
  }
}
