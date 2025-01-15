import { streamText, createDataStreamResponse, generateId } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

// Allow streaming responses up to 300 seconds
export const maxDuration = 300;

const bedrock = createAmazonBedrock({
  bedrockOptions: {
    requestHandler: new NodeHttpHandler({
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 200, // default is 50 per client.
      }),

      // time limit (ms) for receiving response.
      requestTimeout: 60_000_000,

      // time limit (ms) for establishing connection.
      connectionTimeout: 60_000_000,
    }),
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const result = streamText({
        model: bedrock("us.anthropic.claude-3-5-sonnet-20240620-v1:0"),
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
