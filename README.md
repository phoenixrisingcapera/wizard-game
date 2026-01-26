# SpellSlinger: The Quiet Edition

Data-driven wizard story game built with Vite + React. No external APIs, no environment variables, and all assets are local.

## Run Locally

1. Install dependencies:
   `npm install`
2. Start the dev server:
   `npm run dev`

## Build

1. Create a production build:
   `npm run build`

## Deploy to Vercel

1. Push this repo to GitHub (or connect the folder directly).
2. In Vercel, click **New Project** and import the repo.
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy.

No environment variables are required.

## Story Data

- `data/story.json` controls nodes, choices, and outcomes.
- `data/items.json` contains optional item definitions shown in the UI.
