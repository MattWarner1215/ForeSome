# ForeSum Azure Container Instance (ACI) Deployment Guide

## 🚀 Deploy to Azure Container Instance

### **Step 1: Build and Push Docker Image**

First, let's create a production-ready Docker image:

```dockerfile
# Dockerfile (create this in your project root)
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### **Step 2: Push to Azure Container Registry (ACR)**

```bash
# Login to Azure
az login

# Create or use existing ACR
az acr create --resource-group your-resource-group --name your-acr-name --sku Basic

# Build and push image
az acr build --registry your-acr-name --image foresum:latest .
```

### **Step 3: Deploy to Container Instance**

#### Option A: Using Azure Portal

1. **Go to Azure Portal → Container Instances**
2. **Click "Create"**
3. **Configure:**
   - **Image source**: Azure Container Registry
   - **Registry**: Select your ACR
   - **Image**: foresum:latest
   - **OS type**: Linux
   - **Size**: 1 vCPU, 1.5 GB memory (minimum)

4. **Environment Variables** (Advanced tab):
```
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_SHOW_COMING_SOON=true
DATABASE_URL=postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612!@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=20
NEXTAUTH_SECRET=your-production-secret
NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w
```

5. **Networking**:
   - **DNS name label**: Choose a unique name (e.g., foresum-app)
   - **Ports**: 3000 (TCP, Public)

#### Option B: Using Azure CLI

```bash
az container create \
  --resource-group your-resource-group \
  --name foresum-container \
  --image your-acr-name.azurecr.io/foresum:latest \
  --dns-name-label foresum-app \
  --ports 3000 \
  --environment-variables \
    NEXTAUTH_URL=https://your-domain.com \
    NEXT_PUBLIC_SHOW_COMING_SOON=true \
    DATABASE_URL="postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612!@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=20" \
    NEXTAUTH_SECRET=your-production-secret \
    NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w \
  --registry-login-server your-acr-name.azurecr.io \
  --registry-username your-acr-name \
  --registry-password $(az acr credential show --name your-acr-name --query "passwords[0].value" -o tsv)
```

### **Step 4: Custom Domain with Azure Application Gateway**

Since ACI doesn't have built-in custom domain support, you'll need to use Azure Application Gateway:

1. **Create Application Gateway**
2. **Configure backend pool** pointing to your ACI
3. **Add custom domain** to Application Gateway
4. **Configure SSL certificate**

### **Step 5: Simpler Alternative - Use Azure Container Apps**

**Recommendation**: Consider migrating to Azure Container Apps for easier custom domain support:

```bash
# Create Container Apps environment
az containerapp env create \
  --name foresum-env \
  --resource-group your-resource-group \
  --location eastus

# Deploy to Container Apps
az containerapp create \
  --name foresum-app \
  --resource-group your-resource-group \
  --environment foresum-env \
  --image your-acr-name.azurecr.io/foresum:latest \
  --target-port 3000 \
  --ingress external \
  --env-vars \
    NEXTAUTH_URL=https://your-domain.com \
    NEXT_PUBLIC_SHOW_COMING_SOON=true \
    DATABASE_URL="postgresql://..." \
    NEXTAUTH_SECRET=your-secret
```

### **Step 6: DNS Configuration**

Once deployed, you'll get a URL like:
- **ACI**: `foresum-app.eastus.azurecontainer.io`
- **Container Apps**: `foresum-app.region.azurecontainerapps.io`

For custom domain, configure DNS:
```
Type: CNAME
Name: www
Value: your-container-url

Type: A
Name: @
Value: [IP address of your container]
```

## 🎯 Quick Start Commands:

```bash
# 1. Create Dockerfile (see above)
# 2. Build and push to ACR
az acr build --registry your-acr-name --image foresum:latest .

# 3. Deploy to ACI
az container create --resource-group your-rg --name foresum-container --image your-acr.azurecr.io/foresum:latest --dns-name-label foresum-app --ports 3000 --environment-variables NEXT_PUBLIC_SHOW_COMING_SOON=true [other-vars]
```

**What's your current setup?** Do you have:
1. Azure Container Registry (ACR)?
2. What's your resource group name?
3. What region are you using?

I can provide the exact commands once I know your setup! 🚀