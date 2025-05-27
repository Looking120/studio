
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Users, AlertTriangle } from "lucide-react";
import React, { useState, useEffect, FormEvent } from "react";
// import { getConversationMessages, sendMessage, markMessagesAsRead } from '@/services/message-service'; // Import your message service
// import { useToast } from '@/hooks/use-toast';

// Dummy types - replace with actual types from your service or lib/data
interface Message {
  id: string;
  sender: string; // 'user' or 'colleague' or senderName/ID
  text: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string; // e.g., colleague name or group chat name
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null); // Example state
  // const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  // const [errorMessages, setErrorMessages] = useState<string | null>(null);
  // const { toast } = useToast();

  // useEffect(() => {
  //   // Example: Load messages for a selected conversation
  //   const loadMessages = async (conversationId: string) => {
  //     setIsLoadingMessages(true);
  //     setErrorMessages(null);
  //     try {
  //       // const fetchedMessages = await getConversationMessages({ conversationId });
  //       // setMessages(fetchedMessages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))); // Adjust based on actual message structure
  //       // await markMessagesAsRead({ conversationId, userId: "currentUser" }); // Example
  //       console.log(`Placeholder: Would load messages for conversation ${conversationId}`);
  //       setMessages([ // Mock messages
  //           { id: '1', sender: 'Alex Dubois', text: 'Salut l\'équipe! Prêts pour la réunion de 10h?', timestamp: new Date(Date.now() - 60000 * 5)},
  //           { id: '2', sender: 'Utilisateur Modèle', text: 'Oui, j\'ai préparé le compte-rendu.', timestamp: new Date(Date.now() - 60000 * 2)},
  //       ]);
  //     } catch (err) {
  //       console.error("Failed to load messages:", err);
  //       setErrorMessages(err instanceof Error ? err.message : "Could not load messages.");
  //       // toast({ variant: "destructive", title: "Error", description: "Failed to load messages." });
  //     } finally {
  //       setIsLoadingMessages(false);
  //     }
  //   };

  //   if (selectedConversation) {
  //     loadMessages(selectedConversation.id);
  //   } else {
  //     // Show a placeholder or select a default conversation
  //     setMessages([]); // Clear messages if no conversation selected
  //   }
  // }, [selectedConversation, toast]);


  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim()) return;
    
    const optimisticMessage: Message = {
        id: Date.now().toString(),
        sender: 'Utilisateur Modèle', // Should be the current user
        text: newMessage,
        timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    // Example: Call sendMessage service function
    // if (!selectedConversation) {
    //   toast({ variant: "destructive", title: "Error", description: "No conversation selected." });
    //   setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // Rollback optimistic
    //   return;
    // }
    // try {
    //   // const sentMessage = await sendMessage({
    //   //   senderId: "currentUser", // Replace with actual current user ID
    //   //   conversationId: selectedConversation.id, 
    //   //   content: newMessage.trim(),
    //   // });
    //   // Replace optimistic message with server response if necessary, or confirm
    //   // setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? { ...sentMessage, timestamp: new Date(sentMessage.timestamp) } : m));
    //   console.log(`Placeholder: Would send message: "${newMessage.trim()}" to conversation ${selectedConversation.id}`);
    // } catch (err) {
    //   console.error("Failed to send message:", err);
    //   // Rollback optimistic update
    //   setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
    //   toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
    // }
    console.log(`Placeholder: Message "${newMessage.trim()}" would be sent.`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            <span className="text-xl">Messagerie d'équipe</span>
            {/* {selectedConversation ? selectedConversation.name : "Messagerie d'équipe"} */}
          </CardTitle>
          <CardDescription className="pt-1">
            {/* {selectedConversation ? `Discussion avec ${selectedConversation.name}` : "Discutez avec vos collègues en temps réel."} */}
            Discutez avec vos collègues en temps réel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {/* {isLoadingMessages && <p className="text-center text-muted-foreground">Loading messages...</p>}
          {errorMessages && (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertTriangle className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">Error loading messages.</p>
                <p className="text-sm">{errorMessages}</p>
            </div>
          )}
          {!isLoadingMessages && !errorMessages && messages.length === 0 && !selectedConversation && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Aucune conversation sélectionnée.</p>
              <p className="text-sm">Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
          )}
           {!isLoadingMessages && !errorMessages && messages.length === 0 && selectedConversation && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Aucun message dans cette conversation.</p>
              <p className="text-sm">Soyez le premier à envoyer un message !</p>
            </div>
          )} */}
          
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg">Aucun message pour le moment.</p>
                <p className="text-sm">Commencez une nouvelle conversation ou sélectionnez-en une existante.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'Utilisateur Modèle' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-lg max-w-xs lg:max-w-md shadow ${msg.sender === 'Utilisateur Modèle' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'Utilisateur Modèle' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>
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
              placeholder="Écrivez votre message..."
              className="flex-grow text-base"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              // disabled={isLoadingMessages || !selectedConversation}
            />
            <Button type="submit" size="icon" 
            // disabled={isLoadingMessages || !selectedConversation || !newMessage.trim()}
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Envoyer</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
