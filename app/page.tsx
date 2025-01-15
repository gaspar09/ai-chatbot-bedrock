"use client";

import { useChat } from "ai/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [isTyping, setIsTyping] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsTyping(true);
    handleSubmit(e).finally(() => setIsTyping(false));
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI Chatbot</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-4 ${
                m.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  m.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {m.content}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="text-left">
              <span className="inline-block p-2 rounded-lg bg-gray-200 text-black">
                AI is typing...
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={onSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button type="submit" disabled={isTyping}>
              Send
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
