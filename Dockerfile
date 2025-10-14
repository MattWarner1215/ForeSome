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

# Build Next.js application with error logging
RUN npm run build > build.log 2>&1 || \
    (echo "=== BUILD FAILED ===" && \
     echo "Last 50 lines of build output:" && \
     tail -50 build.log && \
     exit 1)

# Expose port
EXPOSE 3000

# Start the custom server (runs from root with all files available)
CMD ["npm", "run", "start"]