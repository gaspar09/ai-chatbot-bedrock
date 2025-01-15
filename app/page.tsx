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
import { ChevronDown, ChevronUp } from "lucide-react";

interface MessageAnnotation {
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    msToFirstChunk: number;
    msToFinish: number;
  };
}

export default function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
  } = useChat();
  const [simulateLength, setSimulateLength] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<
    Record<string, boolean>
  >({});

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const onSimulate = () => {
    const length = parseInt(simulateLength);
    if (isNaN(length) || length <= 0) {
      alert("Please enter a valid positive number for simulation length.");
      return;
    }
    const simulatedMessage = "A".repeat(length);
    append({
      role: "user",
      content: simulatedMessage,
    });
  };

  const toggleMessageExpansion = (id: string) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI Chatbot</CardTitle>
        </CardHeader>
        <CardContent className="h-[60vh] overflow-y-auto">
          {messages.map((m) => {
            const annotation = m.annotations?.[0] as
              | MessageAnnotation
              | undefined;

            return (
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
                {m.role === "assistant" && m.annotations && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMessageExpansion(m.id)}
                      className="text-xs text-gray-500"
                    >
                      {expandedMessages[m.id] ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Show Details
                        </>
                      )}
                    </Button>
                    {expandedMessages[m.id] && annotation && (
                      <div className="text-xs text-gray-500 mt-2">
                        <p>Prompt Tokens: {annotation.usage.promptTokens}</p>
                        <p>
                          Completion Tokens: {annotation.usage.completionTokens}
                        </p>
                        <p>Total Tokens: {annotation.usage.totalTokens}</p>
                        <p>
                          Time to First Chunk:{" "}
                          {annotation.usage.msToFirstChunk.toFixed(2)}ms
                        </p>
                        <p>
                          Time to Finish:{" "}
                          {annotation.usage.msToFinish.toFixed(2)}ms
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {isLoading && (
            <div
              className="text-left"
              ref={(el) => el?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="inline-block p-2 rounded-lg animate-bounce">
                •••
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <form onSubmit={onSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="grow"
              aria-label="Chat input"
            />
            <Button type="submit" disabled={isLoading}>
              Send
            </Button>
          </form>
          <div className="flex w-full space-x-2">
            <Input
              value={simulateLength}
              onChange={(e) => setSimulateLength(e.target.value)}
              placeholder="Simulate N chars"
              type="number"
              className="grow"
              aria-label="Simulate message length"
            />
            <Button
              type="button"
              disabled={isLoading || !simulateLength}
              onClick={onSimulate}
            >
              Simulate User Message
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
