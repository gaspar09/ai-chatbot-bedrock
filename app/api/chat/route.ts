import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log({ messages });
  const result = streamText({
    model: bedrock("us.anthropic.claude-3-5-sonnet-20240620-v1:0"),
    messages,
    experimental_telemetry: {
      isEnabled: true,
      recordInputs: false,
      functionId: "main-stream",
    },
  });

  return result.toDataStreamResponse();
}
