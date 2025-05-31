
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Users, AlertTriangle } from "lucide-react";
import React, { useState, useEffect, FormEvent } from "react";
// import { getConversationMessages, sendMessage, markMessagesAsRead } from '@/services/message-service'; 
// import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: string; 
  text: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string; 
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null); 
  // const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  // const [errorMessages, setErrorMessages] = useState<string | null>(null);
  // const { toast } = useToast();

  // useEffect(() => {
  //   const loadMessages = async (conversationId: string) => {
  //     setIsLoadingMessages(true);
  //     setErrorMessages(null);
  //     try {
  //       console.log(`Placeholder: Would load messages for conversation ${conversationId}`);
  //       setMessages([ 
  //           { id: '1', sender: 'Alex Dubois', text: 'Hi team! Ready for the 10 AM meeting?', timestamp: new Date(Date.now() - 60000 * 5)},
  //           { id: '2', sender: 'Current User', text: 'Yes, I have the report ready.', timestamp: new Date(Date.now() - 60000 * 2)},
  //       ]);
  //     } catch (err) {
  //       console.error("Failed to load messages:", err);
  //       setErrorMessages(err instanceof Error ? err.message : "Could not load messages.");
  //     } finally {
  //       setIsLoadingMessages(false);
  //     }
  //   };

  //   if (selectedConversation) {
  //     loadMessages(selectedConversation.id);
  //   } else {
  //     setMessages([]); 
  //   }
  // }, [selectedConversation]);


  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim()) return;
    
    const optimisticMessage: Message = {
        id: Date.now().toString(),
        sender: 'Current User', 
        text: newMessage,
        timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    console.log(`Placeholder: Message "${newMessage.trim()}" would be sent.`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span className="text-xl">Team Chat</span>
          </CardTitle>
          <CardDescription className="pt-1">
            Chat with your colleagues in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">No messages yet.</p>
                <p className="text-sm">Start a new conversation or select an existing one.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'Current User' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-xs lg:max-w-md shadow ${msg.sender === 'Current User' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'Current User' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
                  {msg.sender} - {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <form className="flex w-full items-center space-x-2" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder="Type your message..."
              className="flex-grow text-base"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Send className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
