FROM oven/bun:1.3.13-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV FALLBACK_DEFAULT_MEDIA_URL=https://youtu.be/uD4izuDMUQA
ENV ROOM_PARTICIPANTS_LIMIT=100
ENV ROOM_HISTORY_LIMIT=200
ENV ROOM_ACTION_LOG_LIMIT=500

FROM base AS builder

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN SKIP_ENV_VALIDATION=true bun run build

FROM base AS runner

RUN apk add --no-cache yt-dlp

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["bun", "run", "start"]
