# Web-SyncPlay

Web-SyncPlay is now a unified Bun + Next.js codebase with all application code in `src/`. Realtime websocket handling is embedded in the same runtime, and shared room playback state is persisted in Valkey with a 1h TTL.

## Stack

- Bun runtime and package manager
- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui primitives + Lucide icons
- Vidstack player
- TanStack Query + TanStack Table
- Native WebSocket realtime layer
- yt-dlp media extraction fallback
- Docker Compose deployment

## Layout

- `src/app`: Next.js App Router pages and API routes
- `src/realtime`: websocket room sync engine
- `src/shared`: shared domain contracts
- `src/server`: unified HTTP + websocket server bootstrap

## Development

```bash
bun install
bun run dev
```

## Views and authentication

- Open a room and use the top-right **View** dropdown (left of Share).
- Available views: `Room view`, `Player embed`, `Control embed`, plus a QR code for control embed.
- Control/player links include `#uid=<userId>&secret=<secret>`; this hash is parsed on load and removed from the URL immediately.
- Each client persists its own `userId` + random secret in local storage and authenticates websocket joins with that pair.
- Playback and playlist mutations are accepted only for `owner`/`moderator` roles and verified websocket sessions.

## Production (local)

```bash
docker compose up -d --build
```
