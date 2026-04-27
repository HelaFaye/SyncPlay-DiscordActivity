FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app

ENV NODE_ENV=production \
    VALKEY_URL=redis://valkey:6379 \
    YTDLP_BIN=yt-dlp \
    FALLBACK_DEFAULT_MEDIA_URL=https://youtu.be/uD4izuDMUQA \
    ROOM_PARTICIPANTS_LIMIT=100 \
    ROOM_HISTORY_LIMIT=200 \
    ROOM_ACTION_LOG_LIMIT=500 \
    WS_HEARTBEAT_INTERVAL_MS=5000 \
    WS_HEARTBEAT_TIMEOUT_MS=15000

LABEL org.opencontainers.image.url="https://web-syncplay.de" \
    org.opencontainers.image.description="Watch videos or play music in sync with your friends" \
    org.opencontainers.image.title="Web-SyncPlay" \
    maintainer="Yasamato <https://github.com/Yasamato>"

FROM base AS builder

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN SKIP_ENV_VALIDATION=true bun run build

FROM base AS runner

RUN apk add --no-cache yt-dlp

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY package.json next.config.ts public/ ./
COPY --from=builder /app/.next ./.next

USER bun
EXPOSE 3000
CMD ["bun", "run", "start"]
