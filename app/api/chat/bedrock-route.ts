import { createDataStreamResponse, generateId } from "ai";
import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

interface BedrockMetrics {
  startTime: number;
  firstTokenTime?: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  timing: {
    ttft: number;
    total: number;
  };
}

// Create a Bedrock Runtime client
const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1"
});

// Model ID for Claude 3
const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";

export async function handleBedrockChat(messages: any[]) {
  console.log("Bedrock chat handler called with messages:", messages);
  
  const metrics: BedrockMetrics = {
    startTime: Date.now(),
    tokens: {
      prompt: 0,
      completion: 0,
      total: 0,
    },
    timing: {
      ttft: 0,
      total: 0,
    },
  };

  // Transform messages to Bedrock format
  const conversation = messages.map(msg => ({
    role: msg.role,
    content: [{ text: msg.content }]
  }));

  // Create the command
  const command = new ConverseStreamCommand({
    modelId,
    messages: conversation,
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
    }
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      try {
        console.log("Sending request to Bedrock...");
        const response = await client.send(command);
        console.log("Received response from Bedrock");
        
        const messageId = generateId();
        let isFirstChunk = true;
        let responseText = '';

        if (response.stream) {
          for await (const chunk of response.stream) {
            console.log("Processing chunk:", chunk);
            
            // Handle content blocks
            if (chunk.contentBlockDelta?.delta?.text) {
              const deltaText = chunk.contentBlockDelta.delta.text;
              responseText += deltaText;

              // Send single message with accumulating content
              dataStream.writeData({
                id: messageId,
                role: 'assistant',
                content: responseText,  // Send full accumulated content
                isDelta: true
              });

              // Capture first token time
              if (isFirstChunk) {
                isFirstChunk = false;
                metrics.firstTokenTime = Date.now();
                metrics.timing.ttft = metrics.firstTokenTime - metrics.startTime;
              }

              metrics.tokens.completion += 1;
            }

            // Update metrics from Bedrock
            if (chunk.metadata?.usage) {
              metrics.tokens = {
                prompt: chunk.metadata.usage.inputTokens || 0,
                completion: chunk.metadata.usage.outputTokens || 0,
                total: chunk.metadata.usage.totalTokens || 0
              };
            }
          }

          // Final message with full content
          dataStream.writeData({
            id: messageId,
            role: 'assistant',
            content: responseText,
            isDelta: false
          });

          // Calculate final metrics
          const endTime = Date.now();
          metrics.timing.total = endTime - metrics.startTime;

          // Add final message annotation with metrics
          dataStream.writeMessageAnnotation({
            id: messageId,
            usage: {
              promptTokens: metrics.tokens.prompt,
              completionTokens: metrics.tokens.completion,
              totalTokens: metrics.tokens.total,
              msToFirstChunk: metrics.timing.ttft,
              msToFinish: metrics.timing.total,
            },
          });
        }
      } catch (error) {
        console.error("Bedrock streaming error:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Error in Bedrock chat:", error);
      return error instanceof Error ? error.message : String(error);
    },
  });
} 
