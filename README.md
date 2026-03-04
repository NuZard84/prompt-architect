# Brain Prompt Agent

Production-grade AI prompt engineering for developers. Turn messy explanations into structured, actionable prompts optimized for Cursor, GPT, Claude, Codex, and custom AI agents.

## Project info

## How can I edit this code?

This project uses Node.js and npm. [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if needed.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Environment variables

For the Supabase edge function `generate-prompt` to work with platform AI (when users don't supply their own key), set:

- `AI_LLM_KEY` – Your AI/LLM API key for the platform fallback (e.g. Gemini API key from [Google AI Studio](https://aistudio.google.com/))
