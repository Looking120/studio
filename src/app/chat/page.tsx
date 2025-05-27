
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send } from "lucide-react";
import React from "react";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]"> {/* Adjusted height to fill available space */}
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-7 w-7 text-primary" />
            <span className="text-xl">AI Chat Assistant</span>
          </CardTitle>
          <CardDescription className="pt-1">
            Ask me anything or get help with your tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {/* Message Area Placeholder */}
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No messages yet.</p>
            <p className="text-sm">Start the conversation by typing below!</p>
          </div>
          {/* Example messages (can be removed or replaced with actual messages) */}
          {/*
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-xs">
              Hello! How can I help you today?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
              I need help with employee onboarding.
            </div>
          </div>
          */}
        </CardContent>
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <form className="flex w-full items-center space-x-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="text"
              placeholder="Type your message..."
              className="flex-grow text-base"
              // disabled // Enable when functionality is added
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
