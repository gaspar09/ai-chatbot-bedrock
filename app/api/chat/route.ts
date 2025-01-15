import { streamText, createDataStreamResponse, generateId } from "ai";
import { model } from "./llm-model";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const result = streamText({
        model,
        messages,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: false,
          functionId: "main-stream",
        },
        onFinish: (event) => {
          // Add final message annotation
          dataStream.writeMessageAnnotation({
            usage: event.usage,
          });
        },
      });
      result.mergeIntoDataStream(dataStream);
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error);
    },
  });
}
