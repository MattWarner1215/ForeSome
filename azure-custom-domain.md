# Azure Custom Domain Setup for ForeSum

## Method 1: Using Azure Portal

1. **Navigate to your Container App**
   - Go to Azure Portal → Container Apps
   - Select your ForeSum container app

2. **Add Custom Domain**
   - Go to "Custom domains" in the left menu
   - Click "Add custom domain"
   - Enter your domain: `foresum.com` or `www.foresum.com`

3. **Domain Verification**
   - Azure will provide a TXT record for verification
   - Add this TXT record to your DNS:
   ```
   Type: TXT
   Name: asuid.foresum.com (or asuid.www.foresum.com)
   Value: [Azure provided verification string]
   ```

4. **SSL Certificate**
   - Choose "Azure managed certificate" (recommended)
   - Or upload your own certificate

## Method 2: Using Azure CLI

```bash
# Install Azure CLI if not already installed
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set your subscription
az account set --subscription "your-subscription-id"

# Add custom domain
az containerapp hostname add \
  --resource-group your-resource-group \
  --name your-container-app \
  --hostname foresum.com

# Bind SSL certificate (managed certificate)
az containerapp hostname bind \
  --resource-group your-resource-group \
  --name your-container-app \
  --hostname foresum.com \
  --environment your-container-environment
```

## DNS Configuration at Your Registrar

### For www.foresum.com:
```
Type: CNAME
Name: www
Value: your-app.victorioushill-12345678.eastus.azurecontainerapps.io
TTL: 300
```

### For root domain (foresum.com):
```
Type: A
Name: @
Value: [Get IP from: nslookup your-app.azurecontainerapps.io]
TTL: 300

# Alternative: Use CNAME flattening if your registrar supports it
Type: CNAME
Name: @
Value: your-app.victorioushill-12345678.eastus.azurecontainerapps.io
```

### Domain Verification:
```
Type: TXT
Name: asuid.foresum.com
Value: [Azure verification string from portal]
TTL: 300
```

## Steps Summary:

1. **Get your Azure Container App URL**
   - Find it in Azure Portal under your container app
   - Format: `your-app.region.azurecontainerapps.io`

2. **Configure DNS at your domain registrar**
   - Add CNAME for www subdomain
   - Add A record for root domain (or CNAME if supported)
   - Add TXT record for verification

3. **Add custom domain in Azure**
   - Use Portal or CLI method above
   - Wait for DNS propagation (5-30 minutes)

4. **Enable HTTPS**
   - Azure will automatically provision SSL certificate
   - Force HTTPS redirect in your app settings

## Troubleshooting:

- **DNS Propagation**: Use `dig foresum.com` or online tools to check
- **Certificate Issues**: May take 30-60 minutes to provision
- **Verification Failed**: Ensure TXT record is correctly added

## Environment Variables for Custom Domain:

Update your container app environment variables:
```
NEXTAUTH_URL=https://foresum.com
NEXT_PUBLIC_APP_URL=https://foresum.com
```

## Testing:

1. Wait for DNS propagation: `nslookup foresum.com`
2. Test HTTP: `curl -I http://foresum.com`
3. Test HTTPS: `curl -I https://foresum.com`
4. Verify SSL: Browser or `openssl s_client -connect foresum.com:443`