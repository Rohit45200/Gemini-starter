# Gemini Starter (React + Express)

This is a minimal boilerplate to run a Google Gemini chat app with a secure backend.

## Folders
- `server/` — Node/Express backend. Keeps your API key safe.
- `client/` — Vite + React frontend with a simple chat UI.

## Setup
1) Install backend deps
```bash
cd server
npm i
cp .env.example .env
# Put your real key in .env
# GOOGLE_API_KEY=your_real_key_here
npm run dev
```

2) Install frontend deps (new terminal)
```bash
cd client
npm i
npm run dev
```

3) Open the browser at the URL shown by Vite (typically http://localhost:5173).
   The frontend is configured to proxy /api/* to http://localhost:5000.

## Notes
- Never put keys in the client. Keep them in `server/.env`.
- You can change the model name in `server/server.js` (e.g., "gemini-1.5-pro").
- For production, deploy server separately and point client to it.
