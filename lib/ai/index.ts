import { openai } from "@ai-sdk/openai";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { customMiddleware } from "./custom-middleware";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

export function createCustomBedrock() {
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
  return bedrock;
}

export const customModel = (apiIdentifier: string) => {
  const bedrock = createCustomBedrock();
  return wrapLanguageModel({
    model: bedrock("us.anthropic.claude-3-5-sonnet-20240620-v1:0"),
    middleware: customMiddleware,
  });
};
