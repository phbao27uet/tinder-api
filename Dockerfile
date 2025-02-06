# BASE DEPENDENCIES STAGE
FROM node:18.13.0-alpine as base_dependencies
WORKDIR /app

COPY prisma ./
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# BUILD STAGE
FROM node:18.13.0-alpine as builder
WORKDIR /app

COPY --from=base_dependencies /app/node_modules ./node_modules
COPY --from=base_dependencies /app/package.json ./package.json
COPY . .
RUN npm run build

# PRODUCT DEPENDENCIES STAGE
FROM node:18.13.0-alpine as prod_dependencies
WORKDIR /app

COPY prisma ./
COPY package.json package-lock.json ./
RUN npm install --only=production --frozen-lockfile

# PRODUCTION STAGE
FROM node:18.13.0-alpine as prod
WORKDIR /app

COPY .env ./.env

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

COPY --from=builder  /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder  /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder  /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder  /app/node_modules/source-map-support ./node_modules/source-map-support
COPY --from=builder  /app/node_modules/source-map ./node_modules/source-map
COPY --from=builder  /app/node_modules/get-tsconfig ./node_modules/get-tsconfig

COPY --from=prod_dependencies /root/.cache /root/.cache
COPY --from=prod_dependencies /app/node_modules ./node_modules
COPY --from=prod_dependencies /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/src/templates ./src/templates

CMD ["npm", "run", "start:prod"]