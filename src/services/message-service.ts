// src/services/message-service.ts
import { apiClient, parseJsonResponse } from './api-client';

// Define types for message-related data, adjust as per your API
export interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // For direct messages
  conversationId?: string; // For group/channel messages
  content: string;
  timestamp: string; // Assuming ISO string, convert to Date object in component if needed
  // Add other relevant fields from your API response
  [key: string]: any;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  name?: string; // If conversations can have names
  // Add other relevant fields from your API response
  [key: string]: any;
}

export interface UnreadMessagesInfo {
  count: number;
  messages?: Message[]; // Optional: if API returns some unread messages
  // Add other relevant fields from your API response
  [key: string]: any;
}

/**
 * Sends a message.
 * Corresponds to: POST /api/messages/send
 * @param messageData Data for the message to be sent.
 */
export async function sendMessage(messageData: {
  senderId: string;
  receiverId?: string;
  conversationId?: string;
  content: string;
}): Promise<Message> {
  console.log('API CALL: POST /api/messages/send. Data:', messageData);
  const response = await apiClient('/messages/send', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
  return parseJsonResponse<Message>(response);
}

/**
 * Fetches messages for a specific conversation.
 * Corresponds to: GET /api/messages/conversation (assuming it might take an ID or params)
 * @param params Parameters to identify the conversation (e.g., conversationId, userIds).
 */
export async function getConversationMessages(params: { conversationId?: string; userId1?: string; userId2?: string }): Promise<Message[]> {
  console.log('API CALL: GET /api/messages/conversation. Params:', params);
  let endpoint = '/messages/conversation';
  const queryParams = new URLSearchParams();
  if (params.conversationId) queryParams.append('conversationId', params.conversationId);
  if (params.userId1) queryParams.append('userId1', params.userId1);
  if (params.userId2) queryParams.append('userId2', params.userId2);
  
  const queryString = queryParams.toString();
  if (queryString) {
    endpoint += `?${queryString}`;
  }
  
  const response = await apiClient(endpoint);
  return parseJsonResponse<Message[]>(response);
}

/**
 * Fetches unread messages count or details for an employee.
 * Corresponds to: GET /api/messages/{employeeId}/unread
 * @param employeeId The ID of the employee.
 */
export async function getUnreadMessages(employeeId: string): Promise<UnreadMessagesInfo> {
  console.log(`API CALL: GET /api/messages/${employeeId}/unread.`);
  const response = await apiClient(`/messages/${employeeId}/unread`);
  return parseJsonResponse<UnreadMessagesInfo>(response);
}

/**
 * Marks messages as read.
 * Corresponds to: POST /api/messages/mark-read
 * @param data Data to identify messages to mark as read (e.g., messageIds, conversationId for user).
 */
export async function markMessagesAsRead(data: { messageIds?: string[]; conversationId?: string; userId?: string }): Promise<{ success: boolean }> {
  console.log('API CALL: POST /api/messages/mark-read. Data:', data);
  const response = await apiClient('/messages/mark-read', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // If API returns 204 No Content, parseJsonResponse will return null.
  // Adjust if a specific success object is expected.
  const result = await parseJsonResponse<{ success: boolean }>(response);
  return result || { success: true };
}
