
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Users, AlertTriangle, Loader2 } from "lucide-react";
import React, { useState, useEffect, FormEvent, useRef } from "react";
import { getConversationMessages, sendMessage, markMessagesAsRead, type Message as ServiceMessage, type SendMessagePayload } from '@/services/message-service'; 
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";

// Display-specific message structure
interface DisplayMessage {
  id: string;
  senderDisplay: string; // "Current User" or sender's name
  text: string;
  timestamp: Date;
  isCurrentUser: boolean;
}

// Hardcoded conversation ID for now
const SELECTED_CONVERSATION_ID = "general_chat"; 

export default function ChatPage() {
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [errorMessages, setErrorMessages] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    setCurrentUserId(userId);
    console.log("ChatPage: Current User ID from localStorage:", userId);
  }, []);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [displayMessages]);

  useEffect(() => {
    if (!SELECTED_CONVERSATION_ID || !currentUserId) {
      if (!currentUserId && !isLoadingMessages) { // Only show if not already loading
         // setErrorMessages("Your user ID could not be determined. Cannot load or send messages.");
      }
      // Potentially set isLoading to false if we know we can't proceed
      // setIsLoadingMessages(false); 
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      setErrorMessages(null);
      try {
        console.log(`ChatPage: Loading messages for conversation ${SELECTED_CONVERSATION_ID}`);
        const serviceMessages = await getConversationMessages({ conversationId: SELECTED_CONVERSATION_ID });
        
        const mappedMessages: DisplayMessage[] = serviceMessages.map(msg => ({
          id: msg.id,
          text: msg.content,
          timestamp: new Date(msg.timestamp),
          isCurrentUser: msg.senderId === currentUserId,
          senderDisplay: msg.senderId === currentUserId ? 'Current User' : msg.senderName || 'Unknown User',
        }));
        
        setDisplayMessages(mappedMessages);

        // Optionally mark messages as read
        if (mappedMessages.length > 0 && currentUserId) {
          // Consider only marking if there are unread messages, or based on specific logic
          // For simplicity, marking all fetched messages in this conversation as read by current user.
          // This might need a more sophisticated approach depending on backend capabilities (e.g., unread counts).
          await markMessagesAsRead({ conversationId: SELECTED_CONVERSATION_ID });
          console.log(`ChatPage: Attempted to mark messages in ${SELECTED_CONVERSATION_ID} as read.`);
        }

      } catch (err) {
        console.error("ChatPage: Failed to load messages:", err);
        const errorText = err instanceof Error ? err.message : "Could not load messages.";
        setErrorMessages(errorText);
        toast({ variant: "destructive", title: "Chat Error", description: `Failed to load messages: ${errorText}` });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [SELECTED_CONVERSATION_ID, currentUserId, toast]);


  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !currentUserId || !SELECTED_CONVERSATION_ID) {
      if (!currentUserId) {
        toast({ variant: "destructive", title: "Cannot Send", description: "Your user ID is not available."});
      }
      return;
    }
    
    const optimisticMessage: DisplayMessage = {
        id: `optimistic-${Date.now().toString()}`,
        senderDisplay: 'Current User', 
        text: newMessage,
        timestamp: new Date(),
        isCurrentUser: true,
    };
    setDisplayMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const payload: SendMessagePayload = {
        senderId: currentUserId, // Backend might ignore this if using token for senderId
        conversationId: SELECTED_CONVERSATION_ID,
        content: messageToSend.trim(),
      };
      const sentMessage = await sendMessage(payload);
      // Replace optimistic message with actual message from server
      setDisplayMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? {
          id: sentMessage.id,
          text: sentMessage.content,
          timestamp: new Date(sentMessage.timestamp),
          isCurrentUser: sentMessage.senderId === currentUserId,
          senderDisplay: sentMessage.senderId === currentUserId ? 'Current User' : sentMessage.senderName || 'Unknown User',
        } : msg
      ));
    } catch (err) {
      console.error("ChatPage: Failed to send message:", err);
      const errorText = err instanceof Error ? err.message : "Could not send message.";
      toast({ variant: "destructive", title: "Send Error", description: `Failed to send message: ${errorText}` });
      // Revert optimistic update or mark it as failed
      setDisplayMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageToSend); // Put message back in input
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span className="text-xl">Team Chat ({SELECTED_CONVERSATION_ID})</span>
          </CardTitle>
          <CardDescription className="pt-1">
            Chat with your colleagues in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {isLoadingMessages && (
            <div className="space-y-4">
              {Array.from({length: 3}).map((_, i) => (
                <div key={`skel-${i}`} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Skeleton className={`h-16 w-1/2 rounded-lg ${i % 2 === 0 ? 'bg-muted' : 'bg-primary/20'}`} />
                </div>
              ))}
            </div>
          )}

          {!isLoadingMessages && errorMessages && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
              <AlertTriangle className="h-16 w-16 mb-4 opacity-70" />
              <p className="text-lg font-semibold">Error Loading Messages</p>
              <p className="text-sm">{errorMessages}</p>
            </div>
          )}

          {!isLoadingMessages && !errorMessages && displayMessages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">No messages yet.</p>
                <p className="text-sm">Start the conversation!</p>
            </div>
          )}

          {!isLoadingMessages && !errorMessages && displayMessages.map((msg) => (
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
              placeholder="Type your message..."
              className="flex-grow text-base"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoadingMessages || !currentUserId}
            />
            <Button type="submit" size="icon" disabled={isLoadingMessages || !currentUserId || !newMessage.trim()}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
