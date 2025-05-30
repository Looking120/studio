
// src/services/message-service.ts
// import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

// User did not provide endpoints for Messages, so this service remains mocked.

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  conversationId?: string;
  content: string;
  timestamp: string;
  [key: string]: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  name?: string;
  [key: string]: any;
}

export interface UnreadMessagesInfo {
  count: number;
  messages?: Message[];
  [key: string]: any;
}

const mockMessages: Message[] = [
    { id: 'msg1', senderId: 'user1', conversationId: 'conv1', content: 'Hello there! (mock)', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'msg2', senderId: 'user2', conversationId: 'conv1', content: 'Hi! How are you? (mock)', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
];

/**
 * Sends a message. (MOCKED - No endpoint provided)
 * @param messageData Data for the message to be sent.
 */
export async function sendMessage(messageData: {
  senderId: string;
  receiverId?: string;
  conversationId?: string;
  content: string;
}): Promise<Message> {
  console.log('MOCK API CALL to send message. Data:', messageData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newMessage: Message = {
    id: `msg${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...messageData,
  };
  // mockMessages.push(newMessage); // If you want to modify shared array
  return Promise.resolve(newMessage);
}

/**
 * Fetches messages for a specific conversation. (MOCKED - No endpoint provided)
 * @param params Parameters to identify the conversation (e.g., conversationId, userIds).
 */
export async function getConversationMessages(params: { conversationId?: string; userId1?: string; userId2?: string }): Promise<Message[]> {
  console.log('MOCK API CALL to get conversation messages. Params:', params);
  await new Promise(resolve => setTimeout(resolve, 300));
  if (params.conversationId === 'conv1') {
    return Promise.resolve([...mockMessages]);
  }
  return Promise.resolve([]);
}

/**
 * Fetches unread messages count or details for an employee. (MOCKED - No endpoint provided)
 * @param employeeId The ID of the employee.
 */
export async function getUnreadMessages(employeeId: string): Promise<UnreadMessagesInfo> {
  console.log(`MOCK API CALL to get unread messages for employee ${employeeId}.`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const mockUnread: UnreadMessagesInfo = {
    count: Math.floor(Math.random() * 5), // Random unread count
  };
  return Promise.resolve(mockUnread);
}

/**
 * Marks messages as read. (MOCKED - No endpoint provided)
 * @param data Data to identify messages to mark as read (e.g., messageIds, conversationId for user).
 */
export async function markMessagesAsRead(data: { messageIds?: string[]; conversationId?: string; userId?: string }): Promise<{ success: boolean }> {
  console.log('MOCK API CALL to mark messages as read. Data:', data);
  await new Promise(resolve => setTimeout(resolve, 300));
  return Promise.resolve({ success: true });
}
