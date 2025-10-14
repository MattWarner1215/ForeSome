# GitHub Secrets Setup for Azure Deployment

This guide explains how to configure GitHub Secrets for automated Azure Container Instance deployments.

## Required Secrets

You need to add the following secrets to your GitHub repository:

### Go to: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

---

## 1. Azure Container Registry Credentials

### `AZURE_REGISTRY_USERNAME`
**Description:** Azure Container Registry username
**How to get it:**
```bash
az acr credential show --name foresomeregistry --query "username" --output tsv
```

### `AZURE_REGISTRY_PASSWORD`
**Description:** Azure Container Registry password
**How to get it:**
```bash
az acr credential show --name foresomeregistry --query "passwords[0].value" --output tsv
```

---

## 2. Azure Credentials (Service Principal)

### `AZURE_CREDENTIALS`
**Description:** JSON credentials for Azure login
**How to create it:**

```bash
az ad sp create-for-rbac \
  --name "github-actions-foresum" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/foresome-rg \
  --sdk-auth
```

**Replace:** `YOUR_SUBSCRIPTION_ID` with your actual Azure subscription ID

**To get your subscription ID:**
```bash
az account show --query "id" --output tsv
```

**The output will look like this (copy the entire JSON):**
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  "activeDirectoryEndpointUrl": "...",
  "resourceManagerEndpointUrl": "...",
  "activeDirectoryGraphResourceId": "...",
  "sqlManagementEndpointUrl": "...",
  "galleryEndpointUrl": "...",
  "managementEndpointUrl": "..."
}
```

---

## 3. Application Environment Variables

### `DATABASE_URL`
**Description:** PostgreSQL connection string (Supabase)
**Format:**
```
postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```
**Where to find:** Supabase Dashboard → Project Settings → Database → Connection String (Direct connection)

---

### `NEXT_PUBLIC_SUPABASE_URL`
**Description:** Supabase project URL
**Format:**
```
https://npmksisxmjgnqytcduhs.supabase.co
```
**Where to find:** Supabase Dashboard → Project Settings → API → Project URL

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Description:** Supabase anonymous key
**Where to find:** Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

---

### `NEXTAUTH_SECRET`
**Description:** NextAuth.js session encryption secret
**How to generate:**
```bash
openssl rand -base64 32
```
**Example output:**
```
Xr8fK9mN2pQ7wV4tU6sE3dR5hG1jL0cA8bM9nP7qW4x=
```

---

### `NEXTAUTH_URL`
**Description:** Public URL of your application
**Value:**
```
http://foresum-app.eastus.azurecontainer.io:3000
```

---

## Setup Checklist

- [ ] `AZURE_REGISTRY_USERNAME` - ACR username
- [ ] `AZURE_REGISTRY_PASSWORD` - ACR password
- [ ] `AZURE_CREDENTIALS` - Service principal JSON
- [ ] `DATABASE_URL` - Supabase PostgreSQL connection
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `NEXTAUTH_SECRET` - NextAuth secret (generate new)
- [ ] `NEXTAUTH_URL` - Container public URL

---

## Quick Setup Script

Run these commands to get all the values you need:

```bash
# 1. Get ACR credentials
echo "AZURE_REGISTRY_USERNAME:"
az acr credential show --name foresomeregistry --query "username" --output tsv
echo ""

echo "AZURE_REGISTRY_PASSWORD:"
az acr credential show --name foresomeregistry --query "passwords[0].value" --output tsv
echo ""

# 2. Get subscription ID
SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
echo "Your Subscription ID: $SUBSCRIPTION_ID"
echo ""

# 3. Create service principal (copy entire JSON output)
echo "AZURE_CREDENTIALS (copy entire JSON):"
az ad sp create-for-rbac \
  --name "github-actions-foresum" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/foresome-rg \
  --sdk-auth
echo ""

# 4. Generate NextAuth secret
echo "NEXTAUTH_SECRET:"
openssl rand -base64 32
echo ""

# 5. Reminder for Supabase values
echo "===================="
echo "Don't forget to add from Supabase Dashboard:"
echo "- DATABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "===================="
```

---

## Testing the Workflow

After adding all secrets:

1. **Manual trigger:**
   - Go to: `Actions` → `Deploy to Azure Container Instance` → `Run workflow`

2. **Automatic trigger:**
   - Push to `main` branch: `git push origin main`

3. **Monitor deployment:**
   - Go to: `Actions` tab in GitHub
   - Click on the running workflow
   - Watch the deployment progress

---

## Troubleshooting

### "Invalid service principal" error
- Make sure `AZURE_CREDENTIALS` is valid JSON (copy entire output)
- Verify the service principal has `contributor` role on the resource group

### "Registry authentication failed"
- Verify `AZURE_REGISTRY_USERNAME` and `AZURE_REGISTRY_PASSWORD` are correct
- Check ACR admin user is enabled:
  ```bash
  az acr update --name foresomeregistry --admin-enabled true
  ```

### "Container fails to start"
- Check container logs in the workflow output
- Verify all environment variables are set correctly
- Check Supabase connection string uses direct connection (port 5432, not 6543)

### "Cannot resolve DNS"
- Wait 1-2 minutes after deployment for DNS propagation
- Use IP address directly if DNS name doesn't work yet

---

## Security Best Practices

1. ✅ **Never commit secrets to Git**
2. ✅ **Use GitHub Secrets for all sensitive values**
3. ✅ **Rotate secrets periodically**
4. ✅ **Use service principals with minimal permissions**
5. ✅ **Enable 2FA on GitHub account**
6. ✅ **Review workflow logs for exposed secrets**

---

## Updating Secrets

To update a secret:
1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Click on the secret name
3. Click `Update secret`
4. Enter new value and save

After updating secrets, re-run the workflow to apply changes.

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Azure Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Supabase Documentation](https://supabase.com/docs)
