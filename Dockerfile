# 1. Use official Node.js image as the base
FROM node:20-alpine AS base

# 2. Set working directory
WORKDIR /app

# 3. Install pnpm globally
RUN apk update && apk add --no-cache python3 make g++ && \
    npm install -g pnpm

# 4. Copy only package.json and pnpm-lock.yaml first (for better cache)
COPY package.json pnpm-lock.yaml ./

# 5. Install dependencies (cached if package.json/pnpm-lock.yaml unchanged)
RUN pnpm install --frozen-lockfile

# 6. Copy the rest of your application code
COPY . .

# 7. Build the Next.js app
RUN pnpm build

# 8. Use a smaller image for production
FROM node:20-alpine AS prod

WORKDIR /app

# Install pnpm in production image
RUN npm install -g pnpm

# Copy only the built output and node_modules from the previous stage
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json

# Expose the port Next.js runs on
EXPOSE 3000

# Start the Next.js app
CMD ["pnpm", "start"]
