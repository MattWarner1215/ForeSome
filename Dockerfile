# Use Node.js 18
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-anon-key"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="dummy-maps-key"

# Debug: Check environment and files before build
RUN echo "=== Environment Check ===" && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "DATABASE_URL: ${DATABASE_URL:0:30}..." && \
    ls -la | head -20 && \
    echo "=== Starting build ===" && \
    npm run build 2>&1 | tee build.log || \
    (echo "=== Build failed. Last 100 lines of output: ===" && tail -100 build.log && exit 1)

# Expose port
EXPOSE 3000

# Start the custom server
CMD ["npm", "run", "start"]