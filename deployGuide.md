# ForeSum Deployment Guide

This guide explains the complete build and deployment process for ForeSum to Azure Container Instance.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Build Process](#build-process)
- [Docker Configuration](#docker-configuration)
- [Azure Deployment](#azure-deployment)
- [Environment Variables](#environment-variables)
- [Monitoring & Management](#monitoring--management)
- [Troubleshooting](#troubleshooting)

## Overview

ForeSum uses a containerized deployment strategy with:
- **Container Registry**: Azure Container Registry (ACR) - `foresomeregistry.azurecr.io`
- **Deployment Platform**: Azure Container Instance (ACI)
- **Build Tool**: Docker with multi-stage builds
- **Runtime**: Node.js 18 with custom Socket.IO server

### Current Production Configuration
- **Public URL**: http://foresum-app.eastus.azurecontainer.io:3000
- **Container IP**: 20.75.179.214:3000
- **Resource Group**: `foresome-rg`
- **Container Name**: `foresum-container`
- **Image**: `foresomeregistry.azurecr.io/foresum:latest`

## Prerequisites

### Required Tools
1. **Docker** - for building container images
   ```bash
   docker --version  # Verify installation
   ```

2. **Azure CLI** - for deploying to Azure
   ```bash
   az --version      # Verify installation
   az login          # Authenticate with Azure
   ```

3. **Node.js 18+** - for local development
   ```bash
   node --version    # Should be v18.x or higher
   ```

### Azure Resources Setup
If deploying for the first time, create these resources:

```bash
# Create resource group
az group create --name foresome-rg --location eastus

# Create Azure Container Registry
az acr create --resource-group foresome-rg \
  --name foresomeregistry --sku Basic

# Login to ACR
az acr login --name foresomeregistry
```

## Build Process

### 1. Local Build (Development)
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build Next.js application
npm run build

# Start production server locally
npm run start
```

### 2. Docker Build Process

The build uses a single-stage Dockerfile optimized for production:

```dockerfile
FROM node:18                    # Base image
WORKDIR /app                    # Set working directory
COPY package*.json ./           # Copy package files
RUN npm install                 # Install all dependencies
COPY . .                        # Copy source code
RUN npx prisma generate         # Generate Prisma client
RUN npm run build               # Build Next.js app
EXPOSE 3000                     # Expose port
CMD ["npm", "run", "start"]     # Start server
```

**Build Commands:**
```bash
# Build Docker image
docker build -t foresomeregistry.azurecr.io/foresum:latest .

# Optional: Tag with version
docker tag foresomeregistry.azurecr.io/foresum:latest \
           foresomeregistry.azurecr.io/foresum:v2

# Test image locally
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  foresomeregistry.azurecr.io/foresum:latest
```

### 3. Build Environment Variables

During build, dummy environment variables are used:
```bash
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
NEXT_PUBLIC_SUPABASE_URL="https://dummy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-anon-key"
NEXTAUTH_SECRET="dummy-secret-for-build"
NEXTAUTH_URL="http://localhost:3000"
```

**Why?** Next.js requires these variables at build time for static optimization, but actual values are provided at runtime.

## Docker Configuration

### Custom Server (`server.js`)
ForeSum uses a custom Node.js server instead of the standard Next.js server to support Socket.IO for real-time chat:

```javascript
const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

// Key configuration for container deployment
const hostname = process.env.HOSTNAME || '0.0.0.0'  // Critical for external access
const port = process.env.PORT || 3000
```

**Important**: `hostname` must be `0.0.0.0` (not `localhost`) for the container to accept external connections.

### Package.json Scripts
```json
{
  "dev": "node server.js",                          // Development with Socket.IO
  "build": "next build",                            // Build Next.js app
  "start": "NODE_ENV=production node server.js",    // Production with Socket.IO
  "db:generate": "prisma generate",                 // Generate Prisma client
  "db:push": "prisma db push"                       // Push schema changes
}
```

## Azure Deployment

### Option 1: Automated Deployment Script

Use the provided `deploy-to-azure.sh` script:

```bash
# Make script executable
chmod +x deploy-to-azure.sh

# Run deployment
./deploy-to-azure.sh
```

### Option 2: Manual Deployment Steps

**Step 1: Build and Push Image**
```bash
# Build Docker image
docker build -t foresomeregistry.azurecr.io/foresum:latest .

# Login to Azure Container Registry
az acr login --name foresomeregistry

# Push image to registry
docker push foresomeregistry.azurecr.io/foresum:latest
```

**Step 2: Deploy Container**
```bash
# Generate secure secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Deploy to Azure Container Instance
az container create \
  --resource-group foresome-rg \
  --name foresum-container \
  --image foresomeregistry.azurecr.io/foresum:latest \
  --dns-name-label foresum-app \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --os-type Linux \
  --environment-variables \
    NEXT_PUBLIC_SHOW_COMING_SOON=true \
    NEXTAUTH_URL=http://foresum-app.eastus.azurecontainer.io:3000 \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
  --secure-environment-variables \
    DATABASE_URL="your-supabase-postgres-url" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key" \
  --registry-login-server foresomeregistry.azurecr.io
```

### Step 3: Update Existing Container

If the container already exists:
```bash
# Delete existing container
az container delete --resource-group foresome-rg \
  --name foresum-container --yes

# Redeploy with new image (use command from Step 2)
```

## Environment Variables

### Public Variables (Non-sensitive)
| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SHOW_COMING_SOON` | `true` | Show coming soon page |
| `NEXTAUTH_URL` | `http://foresum-app.eastus.azurecontainer.io:3000` | Auth callback URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://npmksisxmjgnqytcduhs.supabase.co` | Supabase project URL |
| `NODE_ENV` | `production` | Node environment |
| `HOSTNAME` | `0.0.0.0` | Server bind address |
| `PORT` | `3000` | Server port |

### Secure Variables (Sensitive)
| Variable | Purpose | How to Get |
|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection | Supabase Dashboard → Settings → Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key | Supabase Dashboard → Settings → API |
| `NEXTAUTH_SECRET` | Session encryption | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Google Cloud Console |

### Environment Variable Notes
1. **NEXTAUTH_URL Protocol**: Must use HTTP (not HTTPS) to match container protocol
2. **Hostname Binding**: Must be `0.0.0.0` for external access, not `localhost`
3. **Database Connection**: Use Supabase pooled connection with `pgbouncer=true`
4. **Secrets Management**: Use `--secure-environment-variables` for sensitive data

## Monitoring & Management

### Check Container Status
```bash
# View container details
az container show --resource-group foresome-rg \
  --name foresum-container

# Get container state
az container show --resource-group foresome-rg \
  --name foresum-container \
  --query "containers[0].instanceView.currentState"

# Get IP address
az container show --resource-group foresome-rg \
  --name foresum-container \
  --query "ipAddress.ip" --output tsv
```

### View Logs
```bash
# View container logs
az container logs --resource-group foresome-rg \
  --name foresum-container

# Follow logs (stream)
az container logs --resource-group foresome-rg \
  --name foresum-container --follow
```

### Container Resource Usage
```bash
# View resource allocation
az container show --resource-group foresome-rg \
  --name foresum-container \
  --query "containers[0].resources"
```

### Restart Container
```bash
# Restart container
az container restart --resource-group foresome-rg \
  --name foresum-container
```

## Troubleshooting

### Common Issues

#### 1. Site Not Accessible
**Symptom**: Cannot reach http://foresum-app.eastus.azurecontainer.io:3000

**Solutions**:
- Check hostname binding in `server.js` - must be `0.0.0.0`
- Verify port 3000 is exposed in container
- Check container status: `az container show ...`
- View logs for errors: `az container logs ...`

#### 2. Authentication Failures
**Symptom**: NextAuth login redirects fail or show errors

**Solutions**:
- Verify `NEXTAUTH_URL` uses HTTP (not HTTPS)
- Ensure `NEXTAUTH_URL` includes port number `:3000`
- Check `NEXTAUTH_SECRET` is set and secure
- Verify Google OAuth redirect URLs match container URL

#### 3. Database Connection Errors
**Symptom**: "Unable to connect to database" errors

**Solutions**:
- Verify `DATABASE_URL` is correctly formatted
- Check Supabase database is accessible
- Ensure connection pooling parameters are set
- Test connection from local environment first

#### 4. Build Failures
**Symptom**: Docker build fails or npm errors

**Solutions**:
```bash
# Clear Docker cache and rebuild
docker builder prune -a
docker build --no-cache -t foresomeregistry.azurecr.io/foresum:latest .

# Check Node.js version in Dockerfile (should be 18+)
# Verify all package.json dependencies are valid
```

#### 5. Image Push Failures
**Symptom**: Cannot push to Azure Container Registry

**Solutions**:
```bash
# Re-login to ACR
az acr login --name foresomeregistry

# Verify registry exists
az acr show --name foresomeregistry --resource-group foresome-rg

# Check image tag format
docker images | grep foresum
```

#### 6. Container Crashes on Startup
**Symptom**: Container starts then immediately exits

**Solutions**:
- Check logs: `az container logs ...`
- Verify all required environment variables are set
- Test image locally first: `docker run -p 3000:3000 ...`
- Check database schema is up to date with migrations

### Performance Optimization

#### Container Resources
Current allocation:
- **CPU**: 1 core
- **Memory**: 2 GB

To increase resources:
```bash
# Delete and recreate with more resources
az container delete --resource-group foresome-rg \
  --name foresum-container --yes

# Recreate with 2 CPUs and 4GB RAM
az container create ... --cpu 2 --memory 4
```

#### Database Connection Pooling
Optimize `DATABASE_URL` parameters:
```
postgresql://...?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=20
```

### Debug Mode

To enable verbose logging:
```bash
# Add debug environment variable
az container create ... \
  --environment-variables \
    DEBUG=* \
    NODE_ENV=production
```

## Deployment Checklist

Before deploying to production:

- [ ] Update `.env.local` with production values
- [ ] Generate new `NEXTAUTH_SECRET` for production
- [ ] Run database migrations: `npm run db:push`
- [ ] Test build locally: `docker build ...`
- [ ] Verify all environment variables are set
- [ ] Check database schema matches Prisma schema
- [ ] Update Google OAuth redirect URLs
- [ ] Test container locally before pushing
- [ ] Push image to ACR: `docker push ...`
- [ ] Deploy to ACI: `az container create ...`
- [ ] Verify deployment: Check logs and access URL
- [ ] Test authentication flow end-to-end
- [ ] Test Socket.IO real-time features

## Custom Domain Setup

To point your Azure Container Instance at your custom domain, you have several options:

### Option 1: Azure Application Gateway (Recommended for Production)

Best for: Enterprise-grade production deployments with SSL termination and load balancing.

```bash
# 1. Create Application Gateway with your domain
az network application-gateway create \
  --name foresum-gateway \
  --resource-group foresome-rg \
  --location eastus \
  --sku Standard_v2 \
  --public-ip-address foresum-public-ip \
  --vnet-name foresum-vnet \
  --subnet gateway-subnet

# 2. Configure backend pool to point to container IP
az network application-gateway address-pool create \
  --gateway-name foresum-gateway \
  --resource-group foresome-rg \
  --name foresum-backend \
  --servers 20.75.179.214

# 3. Point your domain DNS A record to the gateway public IP
# In your domain registrar: yourdomain.com → gateway IP
```

**Then update your container:**
```bash
az container create \
  ... \
  --environment-variables \
    NEXTAUTH_URL=https://yourdomain.com \
  ...
```

**Benefits:**
- Full SSL/TLS termination
- Load balancing capabilities
- Web Application Firewall (WAF) support
- Azure-native integration

**Costs:** ~$140/month for Standard_v2 SKU

### Option 2: Azure Front Door (Global CDN + Custom Domain)

Best for: Global distribution with CDN capabilities and DDoS protection.

```bash
# Create Front Door profile
az afd profile create \
  --profile-name foresum-frontdoor \
  --resource-group foresome-rg \
  --sku Standard_AzureFrontDoor

# Add custom domain
az afd custom-domain create \
  --custom-domain-name yourdomain \
  --profile-name foresum-frontdoor \
  --resource-group foresome-rg \
  --host-name yourdomain.com

# Create origin pointing to container
az afd origin create \
  --origin-name foresum-container \
  --profile-name foresum-frontdoor \
  --origin-group-name default-origin-group \
  --resource-group foresome-rg \
  --host-name foresum-app.eastus.azurecontainer.io \
  --origin-host-header foresum-app.eastus.azurecontainer.io \
  --http-port 3000

# Configure routing rules and SSL certificate
```

**Benefits:**
- Global CDN with edge locations
- Automatic SSL certificates
- DDoS protection
- Better performance for global users

**Costs:** ~$35/month base + data transfer

### Option 3: Cloudflare Tunnel (Simplest, Free)

Best for: Quick setup, free SSL, no Azure infrastructure changes needed.

```bash
# 1. Install cloudflared
brew install cloudflared

# 2. Authenticate with Cloudflare
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create foresum

# 4. Configure tunnel (create config.yml)
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id-from-step-3>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: yourdomain.com
    service: http://foresum-app.eastus.azurecontainer.io:3000
  - service: http_status:404
EOF

# 5. Route DNS (automatically creates CNAME in Cloudflare)
cloudflared tunnel route dns foresum yourdomain.com

# 6. Run tunnel (or install as service)
cloudflared tunnel run foresum

# Optional: Install as system service for auto-restart
cloudflared service install
```

**Update your container environment:**
```bash
--environment-variables \
  NEXTAUTH_URL=https://yourdomain.com \
  ...
```

**Benefits:**
- **Free** SSL certificates
- No Azure infrastructure changes
- DDoS protection
- Analytics dashboard
- Easy setup and maintenance

**Costs:** Free (Cloudflare Free plan)

### Option 4: Simple DNS CNAME (No SSL)

Best for: Testing only - NOT recommended for production.

In your domain registrar's DNS settings:
```
Type: CNAME
Name: www (or @)
Value: foresum-app.eastus.azurecontainer.io
```

Update container:
```bash
--environment-variables \
  NEXTAUTH_URL=http://yourdomain.com:3000
```

**Limitations:**
- No SSL/HTTPS encryption
- Port 3000 visible in URL
- Not suitable for production
- Security warnings in browsers

### Option 5: Azure Container Apps (Recommended Migration Path)

Best for: Modern production deployment with built-in custom domain support.

Azure Container Apps is the successor to Container Instances with better features:

```bash
# 1. Create Container Apps environment
az containerapp env create \
  --name foresum-env \
  --resource-group foresome-rg \
  --location eastus

# 2. Deploy app
az containerapp create \
  --name foresum \
  --resource-group foresome-rg \
  --environment foresum-env \
  --image foresomeregistry.azurecr.io/foresum:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server foresomeregistry.azurecr.io \
  --cpu 1 --memory 2Gi \
  --min-replicas 1 --max-replicas 3 \
  --env-vars \
    NEXT_PUBLIC_SHOW_COMING_SOON=true \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
  --secrets \
    database-url=<your-database-url> \
    nextauth-secret=<your-secret> \
    supabase-key=<your-key>

# 3. Add custom domain (requires domain verification)
az containerapp hostname add \
  --name foresum \
  --resource-group foresome-rg \
  --hostname yourdomain.com

# 4. Bind free managed certificate
az containerapp hostname bind \
  --name foresum \
  --resource-group foresome-rg \
  --hostname yourdomain.com \
  --environment foresum-env \
  --validation-method CNAME
```

**DNS Configuration (in your domain registrar):**
```
Type: CNAME
Name: @ (or www)
Value: <provided-by-azure-containerapp>
```

**Benefits:**
- **Free managed SSL certificates** (auto-renewal)
- Automatic HTTPS (no port numbers)
- Built-in autoscaling (0-N replicas)
- Better for microservices
- Simpler than Container Instances
- Same or lower pricing

**Costs:** ~$15-30/month (similar to ACI)

**Migration Note:** Container Apps uses the same Docker images, so migration is straightforward.

### Comparison Table

| Option | SSL | Cost | Setup Difficulty | Best For |
|--------|-----|------|------------------|----------|
| **Application Gateway** | ✅ Yes | ~$140/mo | Hard | Enterprise production |
| **Front Door** | ✅ Yes | ~$35/mo | Medium | Global CDN needs |
| **Cloudflare Tunnel** | ✅ Yes | Free | Easy | Quick setup, cost-effective |
| **Container Apps** | ✅ Yes | ~$15-30/mo | Easy | Modern Azure deployment |
| **DNS CNAME** | ❌ No | Free | Very Easy | Testing only |

### Recommended Solution

For ForeSum, we recommend **Option 5: Azure Container Apps** because:

1. **Built-in SSL**: Free managed certificates with auto-renewal
2. **Modern Platform**: Microsoft's recommended path forward
3. **Cost-Effective**: Similar pricing to Container Instances
4. **Easy Migration**: Uses same Docker images
5. **Better Features**: Auto-scaling, secrets management, easier domain setup
6. **Clean URLs**: No port numbers, proper HTTPS

### Post-Migration Checklist

After setting up custom domain:

- [ ] Update `NEXTAUTH_URL` to use custom domain
- [ ] Update Google OAuth redirect URLs
- [ ] Update any hardcoded URLs in frontend
- [ ] Test authentication flow end-to-end
- [ ] Verify SSL certificate is valid
- [ ] Test Socket.IO connections over HTTPS
- [ ] Update documentation with new URL
- [ ] Configure DNS CAA records (optional)
- [ ] Set up monitoring for SSL expiration

## Additional Resources

- **Azure Container Instances Docs**: https://docs.microsoft.com/azure/container-instances/
- **Azure Container Registry Docs**: https://docs.microsoft.com/azure/container-registry/
- **Azure Container Apps Docs**: https://docs.microsoft.com/azure/container-apps/
- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Docker Documentation**: https://docs.docker.com/
- **Prisma Deployment**: https://www.prisma.io/docs/guides/deployment

## Support

For issues or questions:
1. Check container logs: `az container logs ...`
2. Review troubleshooting section above
3. Verify environment variables match requirements
4. Test locally with Docker before deploying

---

**Last Updated**: 2025-10-07
**Production URL**: http://foresum-app.eastus.azurecontainer.io:3000
**Registry**: foresomeregistry.azurecr.io
