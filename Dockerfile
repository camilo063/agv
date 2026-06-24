# syntax=docker/dockerfile:1
# Imagen de producción del MVP. El MISMO contenedor que podría correr en AWS ECS
# debe existir y arrancar localmente (portabilidad ejecutable, no teórica — §7).
# Debian slim (no alpine) por mejor compatibilidad de `sharp` y Payload.

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# --- Dependencias (capa cacheable) ---------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build ----------------------------------------------------------------
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# El build solo necesita las vars presentes (no conecta a la BD). En runtime se
# inyectan DATABASE_URI/PAYLOAD_SECRET/etc por entorno (ECS task def / compose).
RUN pnpm build

# --- Runner (mínimo, standalone) -----------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Directorio de uploads para el storage LOCAL (en Vercel/S3 se sirve por plugin).
RUN mkdir -p uploads && chown -R nextjs:nodejs uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
