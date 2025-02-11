## Deploy Your Own

You can deploy your own version with the button below

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgaspar09%2Fai-chatbot-bedrock&env=AWS_REGION,AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY&project-name=ai-chatbot-bedrock&repository-name=ai-chatbot-bedrock)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## General Details

The page is at app/page.tsx
The API route is at app/api/chat/route.ts
The Model config is at app/api/chat/llm-model.ts
