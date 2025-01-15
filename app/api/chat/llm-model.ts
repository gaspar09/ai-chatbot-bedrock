import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
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

/**
 * Supports switching between different model providers.
 *
 * openai, anthropic, bedrock
 *
 * @param name - the name of model to use
 * @returns
 */
export function getModel(name: string) {
  if (name.startsWith("gpt-")) {
    return openai("gpt-4o");
  }
  if (name.startsWith("claude-")) {
    return anthropic(name);
  }
  return bedrock(name);
}
