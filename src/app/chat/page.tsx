
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Users, AlertTriangle, Loader2, User as UserIconFromLucide } from "lucide-react";
import React, { useState, useEffect, FormEvent, useRef } from "react";
import { getConversationMessages, sendMessage, markMessagesAsRead, type Message as ServiceMessage, type SendMessagePayload } from '@/services/message-service';
import { fetchUsers, type User } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HttpError } from "@/services/api-client";

interface DisplayMessage {
  id: string;
  senderDisplay: string;
  text: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

const generateConversationId = (userId1: string, userId2: string): string => {
  const ids = [userId1, userId2].sort();
  return `${ids[0]}_${ids[1]}`;
};

export default function ChatPage() {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null); // For senderDisplay

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const [isLoadingMessages, setIsLoadingMessages] = useState(false); // True when fetching for a new conversation
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    console.log("ChatPage: Current User ID from localStorage:", userId, "Name:", userName);
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [displayMessages]);

  // Fetch users to chat with
  useEffect(() => {
    if (!currentUserId) return;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setErrorUsers(null);
      try {
        console.log("ChatPage: Fetching users to chat with...");
        const fetchedUsers = await fetchUsers();
        // Filter out the current user from the list
        setUsers(fetchedUsers.filter(user => user.id !== currentUserId && user.id));
        console.log("ChatPage: Users fetched and filtered:", users);
      } catch (err) {
        const errorText = err instanceof Error ? err.message : "Could not load users.";
        if (err instanceof HttpError && err.status === 500) {
            console.warn(`ChatPage: Failed to load users due to a server error (500). Details: ${errorText}`, err);
        } else {
            console.error("ChatPage: Failed to load users:", err);
        }
        setErrorUsers(errorText);
        toast({ variant: "destructive", title: "User List Error", description: `Failed to load users: ${errorText}` });
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, [currentUserId, toast]);


  // Load messages when a conversation is selected/active
  useEffect(() => {
    if (!currentConversationId || !currentUserId || !currentUserName) {
      setDisplayMessages([]); // Clear messages if no conversation is active
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setErrorMessages(null);
      try {
        console.log(`ChatPage: Loading messages for conversation ${currentConversationId}`);
        const serviceMessages = await getConversationMessages({ conversationId: currentConversationId });

        const mappedMessages: DisplayMessage[] = serviceMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.timestamp),
          isCurrentUser: msg.senderId === currentUserId,
          senderDisplay: msg.senderId === currentUserId ? (currentUserName || 'Me') : (msg.senderName || selectedUser?.name || 'Other User'),
        }));

        setDisplayMessages(mappedMessages);

        if (mappedMessages.length > 0) {
          await markMessagesAsRead({ conversationId: currentConversationId });
          console.log(`ChatPage: Attempted to mark messages in ${currentConversationId} as read.`);
        }

      } catch (err) {
        console.error(`ChatPage: Failed to load messages for ${currentConversationId}:`, err);
        const errorText = err instanceof Error ? err.message : "Could not load messages.";
        setErrorMessages(errorText);
        toast({ variant: "destructive", title: "Chat Error", description: `Failed to load messages: ${errorText}` });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentConversationId, currentUserId, currentUserName, selectedUser?.name, toast]);

  const handleSelectUser = (user: User) => {
    if (!currentUserId) {
      toast({ variant: "destructive", title: "Error", description: "Current user ID not found." });
      return;
    }
    if (user.id === currentUserId) {
      toast({ variant: "destructive", title: "Error", description: "Cannot chat with yourself." });
      return;
    }
    setSelectedUser(user);
    const newConversationId = generateConversationId(currentUserId, user.id);
    setCurrentConversationId(newConversationId);
    setDisplayMessages([]); // Clear previous messages
    setErrorMessages(null); // Clear previous errors
    console.log(`ChatPage: Selected user ${user.name}, conversation ID set to ${newConversationId}`);
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !currentUserId || !currentConversationId || !selectedUser || !currentUserName) {
      if (!currentUserId) toast({ variant: "destructive", title: "Cannot Send", description: "Your user ID is not available."});
      if (!currentConversationId) toast({ variant: "destructive", title: "Cannot Send", description: "No active conversation."});
      return;
    }

    const optimisticMessage: DisplayMessage = {
        id: `optimistic-${Date.now().toString()}`,
        senderDisplay: currentUserName || 'Me',
        text: newMessage,
        timestamp: new Date(),
        isCurrentUser: true,
    };
    setDisplayMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const payload: SendMessagePayload = {
        senderId: currentUserId,
        conversationId: currentConversationId,
        content: messageToSend.trim(),
      };
      const sentMessage = await sendMessage(payload);
      setDisplayMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id ? {
          id: sentMessage.id,
          text: sentMessage.content,
          timestamp: new Date(sentMessage.timestamp),
          isCurrentUser: sentMessage.senderId === currentUserId,
          senderDisplay: sentMessage.senderId === currentUserId ? (currentUserName || 'Me') : (sentMessage.senderName || selectedUser.name || 'Other User'),
        } : msg
      ));
    } catch (err) {
      console.error("ChatPage: Failed to send message:", err);
      const errorText = err instanceof Error ? err.message : "Could not send message.";
      toast({ variant: "destructive", title: "Send Error", description: `Failed to send message: ${errorText}` });
      setDisplayMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageToSend);
    }
  };
  
  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };


  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4">
      {/* User List Sidebar */}
      <Card className="md:w-1/3 lg:w-1/4 flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-lg">Contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {isLoadingUsers && (
                Array.from({length: 5}).map((_, i) => (
                  <div key={`skel-user-${i}`} className="flex items-center gap-3 p-2 rounded-md">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ))
              )}
              {!isLoadingUsers && errorUsers && (
                <div className="p-4 text-center text-destructive">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">{errorUsers}</p>
                </div>
              )}
              {!isLoadingUsers && !errorUsers && users.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <UserIconFromLucide className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No other users found.</p>
                </div>
              )}
              {!isLoadingUsers && !errorUsers && users.map(user => (
                <Button
                  key={user.id}
                  variant={selectedUser?.id === user.id ? "secondary" : "ghost"}
                  className={`w-full justify-start p-3 h-auto ${selectedUser?.id === user.id ? 'bg-primary/10 hover:bg-primary/20' : ''}`}
                  onClick={() => handleSelectUser(user)}
                  disabled={!user.id}
                >
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src={user.avatarUrl} alt={user.name || user.email} data-ai-hint="person avatar" />
                    <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{user.name || user.email}</span>
                    {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span className="text-xl">
              {selectedUser ? `Chat with ${selectedUser.name || selectedUser.email}` : "Team Chat"}
            </span>
          </CardTitle>
          <CardDescription className="pt-1">
            {selectedUser ? "Messages with your selected contact." : "Select a user from the list to start chatting."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {!selectedUser && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">No Conversation Selected</p>
              <p className="text-sm">Please select a user from the contacts list to begin.</p>
            </div>
          )}

          {selectedUser && isLoadingMessages && (
            <div className="space-y-4">
              {Array.from({length: 3}).map((_, i) => (
                <div key={`skel-msg-${i}`} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Skeleton className={`h-16 w-1/2 rounded-lg ${i % 2 === 0 ? 'bg-muted' : 'bg-primary/20'}`} />
                </div>
              ))}
            </div>
          )}

          {selectedUser && !isLoadingMessages && errorMessages && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertTriangle className="h-16 w-16 mb-4 opacity-70" />
              <p className="text-lg font-semibold">Error Loading Messages</p>
              <p className="text-sm">{errorMessages}</p>
            </div>
          )}

          {selectedUser && !isLoadingMessages && !errorMessages && displayMessages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">No messages yet.</p>
                <p className="text-sm">Start the conversation!</p>
            </div>
          )}

          {selectedUser && !isLoadingMessages && !errorMessages && displayMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-xs lg:max-w-md shadow ${msg.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                  {msg.senderDisplay} - {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <form className="flex w-full items-center space-x-2" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder={selectedUser ? "Type your message..." : "Select a conversation to type"}
              className="flex-grow text-base"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoadingMessages || !currentUserId || !selectedUser}
            />
            <Button type="submit" size="icon" disabled={isLoadingMessages || !currentUserId || !newMessage.trim() || !selectedUser}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

    