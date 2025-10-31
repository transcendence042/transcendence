# Transcendence – Pong Multiplayer App

A full‑stack Pong game with authentication, friends, and match history.

- Backend: Fastify + Socket.IO + Sequelize (SQLite)
- Frontend: React + Vite + Tailwind
- Auth: Username/password (JWT) and Google OAuth 2.0


## Architecture

- Backend server: `pon-server.js` (Node.js ESM) on http://localhost:3000
- React dev server: Vite on http://localhost:2323
- Database: SQLite file at `backend/database.sqlite`
- Static assets (non‑React): served from `public/` by Fastify

Directory map (key parts):
- `pon-server.js` – Fastify API + Socket.IO server and game loop
- `backend/` – Auth handlers (`auth.js`), Sequelize models/DB (`db.js`)https://github.com/transcendence042/transcendence.git
- `frontend/` – React/Vite application (SPA)
- `public/` – Compiled TS/JS for the non‑React pages and static assets
- `src/` – TypeScript sources for the non‑React static pages (compiled to `public/`)


## Prerequisites

- Node.js 18+ and npm
- SQLite (the `sqlite3` npm package will create/manage the DB file)
- Google OAuth 2.0 credentials (for optional Google login)


## Environment variables

Create a `.env` file in the project root:

```
# Backend
JWT_SECRET=supersecretkey               # change in production

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL for post-login redirect (used by Google flow)
FRONTEND_URL=http://localhost:2323/login
```

Notes:
- `pon-server.js` currently uses a default secret `'supersecretkey'`; setting `JWT_SECRET` is recommended.
- `FRONTEND_URL` is where the backend redirects with `#token=...` after Google login.
- CORS for Socket.IO is already configured for `http://localhost:2323`.


## Install and run

### Backend (API + Socket.IO)

From the repository root:

```bash
npm install
npm start               # starts Fastify + Socket.IO on :3000
```

Useful backend scripts (root `package.json`):
- `start` – run the server (`pon-server.js`)
- `dev` – watch Tailwind, TS, and start the server together
- `build:css` – Tailwind build from `src/input.css` to `public/style.css`
- `build:ts` / `build:ts-once` – TypeScript compile for non‑React pages

The database file will be created at `backend/database.sqlite` on first run.

### Frontend (React + Vite)

In a second terminal:

```bash
cd frontend
npm install
npm run dev           # Vite dev server on :2323
```

Vite is configured to proxy API calls to `http://localhost:3000` (see `frontend/vite.config.js`).


## Features

- JWT auth (login, logout, me) and Google OAuth 2.0 flow
- Friends system (requests, accept/reject, online/offline signals)
- Real‑time game rooms via Socket.IO (1v1 and AI mode with difficulty)
- Match persistence + basic player stats (wins/losses)
- Tailwind styling, React components, and WebSocket‑driven UI updates


## Key API routes (Fastify)

All routes are defined in `pon-server.js` and implemented in `backend/auth.js`.

- `POST /api/auth/register` – Create user (username/password)
- `POST /api/auth/login` – Returns `{ token, user }` on success
- `POST /api/auth/logout` – Requires JWT (bearer). Ends one session
- `GET /api/auth/me` – Returns current user profile

- `GET /api/user/profile/:userId` – Public profile + last matches
- `PUT /api/user/profile` – Update own profile
- `PUT /api/user/profile/changePassword` – Change password

- `GET /api/user/friends` – List accepted friends
- `GET /api/user/friend-getFriendRequests` – Pending requests for me
- `POST /api/user/friend-request` – Send friend request by username
- `POST /api/user/friend-response` – Accept/Reject request

- `GET /api/user/match-history` – My match history (latest first)

- `GET /auth/google/callback` – Google OAuth callback (internal in flow)

Auth: send JWT as `Authorization: Bearer <token>` for protected routes.


## Socket.IO events (high level)

Client → Server:
- `createRoom(roomNameId, { mode })` – Create a room; `mode` can be `AI`
- `joinRoomGame(roomId)` – Join a room for the React UI flow
- `joinRoom(requestedRoomId, startGame, { mode }, challengeRoom)` – Legacy flow
- `roomImIn(roomId)` – Inform server which room this client is watching/playing
- `setDifficulty({ level }, roomId)` – Set AI level: easy|medium|hard
- `paddleMove({ room, y })` – Move paddle for current player
- `leaveRoom()` – Leave current room

Server → Client:
- `lobbyUpdate` – Public lobby state: rooms, players, AI flag
- `gameUpdate` – Frame updates: ball, paddles, scores, etc.
- `gameReady` – Room is ready to play
- `gameEnded` – Game finished (and match saved if PvP)
- `playerAssignment` – Whether you’re player 1 or 2 in a room
- `opponentLeft` / `opponentDisconnected` – Opponent signals
- `roomJoinedInfo` – Room metadata for rejoin flows
- `startConnection` – Initial state after connecting
- Social: `friendConnected`, `friendLogout`, `sendFriendRequest`, `acceptFriendRequest`


## Session handling notes

- Each successful login increments a `sessions` counter on the user.
- Logout decrements it; the user remains online until all sessions are closed.
- If you want to hard‑limit concurrent sessions, return `409` when at the limit (the code shows a pattern for 2 sessions max).


## Development tips

- Ports: Backend 3000, Frontend 2323. If you change them, update `vite.config.js` and CORS in `pon-server.js`.
- JWT: Use a strong `JWT_SECRET` in production and rotate when needed.
- Google OAuth: Make sure your OAuth client allows the callback URL you configured.
- SQLite file: Delete `backend/database.sqlite` to reset local data (dev only).
- Logs: The server logs room joins, AI status, and key auth events to help debug.


## Troubleshooting

- CORS/WebSocket blocked: Confirm Vite dev URL matches the CORS origins in `pon-server.js`.
- 401 Unauthorized: Ensure you pass `Authorization: Bearer <token>` header.
- Can’t start Vite on 2323: Another process is using the port; either kill it or change the port in `frontend/vite.config.js`.
- Google login returns to wrong URL: Set `FRONTEND_URL` so the callback redirects correctly.


## License

See `LICENSE` in this repository.