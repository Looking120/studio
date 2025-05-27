
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Users } from "lucide-react"; // Changed Bot to MessageSquare/Users
import React from "react";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]"> {/* Adjusted height to fill available space */}
      <Card className="flex-grow flex flex-col shadow-xl rounded-lg">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" /> {/* Changed Icon */}
            <span className="text-xl">Messagerie d'équipe</span> {/* Changed Title */}
          </CardTitle>
          <CardDescription className="pt-1">
            Discutez avec vos collègues en temps réel. {/* Changed Description */}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-6 space-y-4">
          {/* Message Area Placeholder */}
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-50" /> {/* Changed Icon */}
            <p className="text-lg">Aucun message pour le moment.</p>
            <p className="text-sm">Commencez une nouvelle conversation ou sélectionnez-en une existante.</p> {/* Changed Placeholder Text */}
          </div>
          {/* Example messages (can be removed or replaced with actual messages) */}
          {/*
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg max-w-xs">
              Salut l'équipe! Prêts pour la réunion de 10h?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
              Oui, j'ai préparé le compte-rendu.
            </div>
          </div>
          */}
        </CardContent>
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-sm">
          <form className="flex w-full items-center space-x-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="text"
              placeholder="Écrivez votre message..."
              className="flex-grow text-base"
              // disabled // Enable when functionality is added
            />
            <Button type="submit" size="icon">
              <Send className="h-5 w-5" />
              <span className="sr-only">Envoyer</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
