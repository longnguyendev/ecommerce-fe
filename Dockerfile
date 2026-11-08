FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Husky chỉ dùng trên máy dev: bỏ qua script prepare trong image.
ENV HUSKY=0

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* được nhúng vào bundle lúc build (và dùng cho images.remotePatterns),
# nên phải truyền khi build, không đặt được lúc chạy.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3400
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3400

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3400/ >/dev/null || exit 1

CMD ["node", "server.js"]
