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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const [provider, setProvider] = useState("vercel");
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    data,
  } = useChat({
    body: {
      provider,
    },
  });
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Alert className="mb-4 max-w-2xl w-full">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only one SDK can be used at a time. Please refresh the page after
          changing SDKs to benchmark against different providers.
        </AlertDescription>
      </Alert>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>AI Chatbot</CardTitle>
          <div className="mt-2">
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vercel">Vercel</SelectItem>
                <SelectItem value="bedrock">AWS Bedrock</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  {m.isDelta && !m.isDeltaComplete && (
                    <span className="ml-2 animate-pulse">...</span>
                  )}
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
