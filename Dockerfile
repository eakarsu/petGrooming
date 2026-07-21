FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ARG NEXTAUTH_SECRET=build-only-secret-with-at-least-32-characters
ARG NEXTAUTH_URL=http://127.0.0.1:3000
ARG CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000
ENV DATABASE_URL=$DATABASE_URL NEXTAUTH_SECRET=$NEXTAUTH_SECRET NEXTAUTH_URL=$NEXTAUTH_URL CORS_ALLOWED_ORIGINS=$CORS_ALLOWED_ORIGINS
RUN npm run db:generate && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system app && useradd --system --gid app app
COPY --from=build --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/.next ./.next
COPY --from=build --chown=app:app /app/next.config.js ./
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/scripts ./scripts
COPY --from=build --chown=app:app /app/src ./src
COPY --from=build --chown=app:app /app/tsconfig.json ./
USER app
EXPOSE 3000
CMD ["npm", "start"]
