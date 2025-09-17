#!/bin/bash

# ForeSum Azure Container Instance Deployment Script
# This script deploys ForeSum to Azure Container Instance with proper environment variables

echo "🚀 Deploying ForeSum to Azure Container Instance..."

# Generate a secure secret for production
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Deploy to Azure Container Instance with proper escaping
az container create \
  --resource-group foresome-rg \
  --name foresum-container \
  --image foresomeregistry.azurecr.io/foresum:latest \
  --dns-name-label foresum-app \
  --ports 3000 \
  --cpu 1 \
  --memory 2 \
  --environment-variables \
    NEXT_PUBLIC_SHOW_COMING_SOON=true \
    NEXTAUTH_URL=https://foresum-app.eastus.azurecontainer.io \
    NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
    NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co \
    NODE_ENV=production \
  --secure-environment-variables \
    DATABASE_URL="postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612!@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=20" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w" \
  --registry-login-server foresomeregistry.azurecr.io

echo "✅ Deployment completed! Your app will be available at:"
echo "https://foresum-app.eastus.azurecontainer.io"