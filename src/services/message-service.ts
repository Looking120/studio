
// src/services/message-service.ts
// import { apiClient, UnauthorizedError, HttpError } from './api-client'; // apiClient not used in mock

export interface SendMessagePayload {
  senderId: string;
  receiverId?: string;
  conversationId: string;
  content: string;
}

export interface MarkReadPayload {
  messageIds?: string[];
  conversationId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  name?: string;
}

export interface UnreadMessagesInfo {
  count: number;
  messages?: Message[];
}

const createMockMessage = (payload: SendMessagePayload, idSuffix: string = "new"): Message => ({
  id: `mock-msg-${idSuffix}-${Date.now()}`,
  senderId: payload.senderId,
  senderName: `User ${payload.senderId.substring(0,4)}`,
  conversationId: payload.conversationId,
  content: payload.content,
  timestamp: new Date().toISOString(),
});

export async function sendMessage(payload: SendMessagePayload): Promise<Message> {
  console.log(`MOCK sendMessage with payload:`, payload);
  return Promise.resolve(createMockMessage(payload));
}

export async function getConversationMessages(params: { conversationId: string; userId1?: string; userId2?: string }): Promise<Message[]> {
  console.log(`MOCK getConversationMessages with params:`, params);
  if (params.conversationId.includes("user")) { // Simulate some messages for user-based conversations
    return Promise.resolve([
      { id: 'mock-msg-1', senderId: params.userId1 || 'userA', conversationId: params.conversationId, content: 'Hello from mock user A!', timestamp: new Date(Date.now() - 60000).toISOString(), senderName: "Mock User A" },
      { id: 'mock-msg-2', senderId: params.userId2 || 'userB', conversationId: params.conversationId, content: 'Hi there from mock user B!', timestamp: new Date().toISOString(), senderName: "Mock User B" },
    ]);
  }
  return Promise.resolve([]);
}

export async function getUnreadMessages(employeeId: string): Promise<UnreadMessagesInfo> {
  console.log(`MOCK getUnreadMessages for employee ${employeeId}`);
  // Simulate no unread messages
  return Promise.resolve({
    count: 0,
    messages: [],
  });
}

export async function markMessagesAsRead(payload: MarkReadPayload): Promise<{ success: boolean; message?: string }> {
  console.log('MOCK markMessagesAsRead with payload:', payload);
  return Promise.resolve({ success: true, message: "Mock messages marked as read." });
}
