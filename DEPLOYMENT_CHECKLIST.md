# ForeSome Production Deployment Checklist

## ⚠️ CRITICAL: Before Any Deployment

**Always use these EXACT values. Any deviation will break the site.**

## Working Configuration Summary

### Container Configuration
- **Image**: `foresum:v25` (DO NOT CHANGE)
- **Port**: 80
- **Resource Group**: `foresome-rg`
- **Container Name**: `foresum-container`
- **Registry**: `foresomeregistry.azurecr.io`

### Environment Variables (EXACT VALUES REQUIRED)

```bash
NEXTAUTH_URL=http://foresumgolf.com
DATABASE_URL=postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612%21@aws-1-us-east-1.pooler.supabase.com:5432/postgres
NEXTAUTH_SECRET=UMCBaWdnSfsE/G/9KrrxYGcYAvEW9sJs4UxrvtdzZXM=
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
HOSTNAME=0.0.0.0
PORT=80
NODE_ENV=production
```

### DNS Configuration (Cloudflare)
- **Type**: CNAME
- **Name**: @ (or foresumgolf.com)
- **Target**: `foresum-app.eastus.azurecontainer.io`
- **Proxy Status**: DNS only (gray cloud) ⚠️ NOT proxied/orange cloud

### URLs
- **Production**: http://foresumgolf.com (HTTP only)
- **Azure Direct**: http://foresum-app.eastus.azurecontainer.io

## Common Issues & Solutions

### Issue: Login returns 401 Unauthorized
**Solution**: Check DATABASE_URL uses `%21` not `!` in password

### Issue: Site not loading after deployment
**Solution**: Wait 1-5 minutes for DNS propagation, test Azure hostname first

### Issue: Database authentication errors
**Solution**: Verify password is URL-encoded: `FenderBass0612%21`

### Issue: Custom domain returns 503
**Solution**: Ensure Cloudflare proxy is OFF (gray cloud, not orange)

## Deployment Command (Manual)

```bash
az container create \
  --resource-group foresome-rg \
  --name foresum-container \
  --image foresomeregistry.azurecr.io/foresum:v25 \
  --dns-name-label foresum-app \
  --ports 80 \
  --cpu 1 \
  --memory 2 \
  --os-type Linux \
  --registry-login-server foresomeregistry.azurecr.io \
  --registry-username foresomeregistry \
  --registry-password "$(az acr credential show --name foresomeregistry --query 'passwords[0].value' --output tsv)" \
  --environment-variables \
    NEXT_PUBLIC_SUPABASE_URL="https://npmksisxmjgnqytcduhs.supabase.co" \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=80 \
    DATABASE_URL="postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612%21@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
    NEXTAUTH_SECRET="UMCBaWdnSfsE/G/9KrrxYGcYAvEW9sJs4UxrvtdzZXM=" \
    NEXTAUTH_URL="http://foresumgolf.com" \
    GOOGLE_CLIENT_ID="<your-google-client-id>" \
    GOOGLE_CLIENT_SECRET="<your-google-client-secret>" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w" \
    SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3ODUwNywiZXhwIjoyMDcyNjU0NTA3fQ.ccFcXzjRXBZ02UHE2AmYg6G5Ax9ds7aT7XB7b5F6tWw" \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSyAQ921igVhx1NedjGXnEaE-u5yqprLGK9I"
```

## Verification Steps

1. **Check container logs**: `az container logs --resource-group foresome-rg --name foresum-container`
   - Should see: "Ready on http://0.0.0.0:80"
   - Should NOT see: Database authentication errors

2. **Test Azure hostname**: `curl http://foresum-app.eastus.azurecontainer.io`
   - Should return: HTTP 200 OK

3. **Test custom domain**: `curl http://foresumgolf.com`
   - Should return: HTTP 200 OK (after DNS propagation)

4. **Test authentication**: Try logging in at http://foresumgolf.com
   - Should successfully authenticate

## GitHub Secrets (Must Match Above)

Update at: https://github.com/MattWarner1215/ForeSome/settings/secrets/actions

- `NEXTAUTH_URL` = `http://foresumgolf.com`
- `DATABASE_URL` = (with `%21` encoding)
- All other secrets must match production values

---

**Last Updated**: 2025-10-30
**Working Configuration**: v25 container with HTTP-only custom domain
