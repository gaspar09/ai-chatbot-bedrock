import { streamText, createDataStreamResponse, generateId } from "ai";
import { getModel } from "./llm-model";

// Allow streaming responses up to 300 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // change to the model you want to use
  const model = getModel("us.anthropic.claude-3-5-sonnet-20240620-v1:0");

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
