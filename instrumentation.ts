import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({
    serviceName: "ai-chatbot",
    attributes: {
      env: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV,
      version: process.env.VERCEL_DEPLOYMENT_ID,
    },
  });
}
