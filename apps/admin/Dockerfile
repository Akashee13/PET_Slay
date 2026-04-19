FROM node:20-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /workspace

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=product-images

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=$NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/admin ./apps/admin
COPY packages/config ./packages/config
COPY packages/design-tokens ./packages/design-tokens

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @pet-slay/admin build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /workspace/apps/admin/.next/standalone ./
COPY --from=builder /workspace/apps/admin/.next/static ./apps/admin/.next/static

EXPOSE 8080

CMD ["node", "apps/admin/server.js"]
