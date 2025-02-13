import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { model } from "./llm-model";

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
  region: process.env.AWS_REGION || "us-east-1",
});

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
  const conversation = messages.map((msg) => ({
    role: msg.role,
    content: [{ text: msg.content }],
  }));

  // Create the command
  const command = new ConverseStreamCommand({
    modelId: model.modelId,
    messages: conversation,
    inferenceConfig: {
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9,
    },
  });

  // Create a new ReadableStream that will send our chunks
  const stream = new ReadableStream({
    async start(controller) {
      try {
        try {
          console.log("Sending request to Bedrock...");
          const response = await client.send(command);
          console.log("Received response from Bedrock");

          let isFirstChunk = true;

          if (response.stream) {
            for await (const chunk of response.stream) {
              console.log("Processing chunk:", chunk);

              // Handle content blocks
              if (chunk.contentBlockDelta?.delta?.text) {
                const deltaText = chunk.contentBlockDelta.delta.text;

                controller.enqueue(`0:"${deltaText}"\n`);

                // Capture first token time
                if (isFirstChunk) {
                  isFirstChunk = false;
                  metrics.firstTokenTime = Date.now();
                  metrics.timing.ttft =
                    metrics.firstTokenTime - metrics.startTime;
                }

                metrics.tokens.completion += 1;
              }

              // Update metrics from Bedrock
              if (chunk.metadata?.usage) {
                metrics.tokens = {
                  prompt: chunk.metadata.usage.inputTokens || 0,
                  completion: chunk.metadata.usage.outputTokens || 0,
                  total: chunk.metadata.usage.totalTokens || 0,
                };
              }
            }

            const promptTokens = metrics.tokens.prompt;
            const completionTokens = metrics.tokens.completion;
            controller.enqueue(
              `e:{"finishReason":"stop","usage":{"promptTokens":${promptTokens},"completionTokens":${completionTokens}},"isContinued":false}\n`
            );
            controller.enqueue(
              `d:{"finishReason":"stop","usage":{"promptTokens":${promptTokens},"completionTokens":${completionTokens}}}\n`
            );

            // Calculate final metrics
            const endTime = Date.now();
            metrics.timing.total = endTime - metrics.startTime;

            // Add final message annotation with metrics
            controller.enqueue(
              `8:${JSON.stringify([
                {
                  usage: {
                    promptTokens: metrics.tokens.prompt,
                    completionTokens: metrics.tokens.completion,
                    totalTokens: metrics.tokens.total,
                    msToFirstChunk: metrics.timing.ttft,
                    msToFinish: metrics.timing.total,
                  },
                },
              ])}\n`
            );
          }
        } catch (error) {
          console.error("Bedrock streaming error:", error);
          throw error;
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    status: 200,
    headers: {
      "X-Vercel-AI-Data-Stream": "v1",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
