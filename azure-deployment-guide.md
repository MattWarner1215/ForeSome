# ForeSum Azure Deployment Guide

## 🚀 Complete Setup for Azure Container Apps

### **Step 1: Environment Variables for Azure**

In your Azure Container App, set these environment variables:

```bash
# Production URLs (replace with your domain)
NEXTAUTH_URL=https://foresum.com
NEXT_PUBLIC_APP_URL=https://foresum.com

# Coming Soon Mode (set to "true" to show coming soon page)
NEXT_PUBLIC_SHOW_COMING_SOON=true

# Database (your existing Supabase connection)
DATABASE_URL=postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612!@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=30&connect_timeout=20

# NextAuth Secret (generate new for production)
NEXTAUTH_SECRET=your-production-secret-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w
```

### **Step 2: Route Structure**

Your app now supports these routes:

```
foresum.com/                 → Coming Soon page (when NEXT_PUBLIC_SHOW_COMING_SOON=true)
foresum.com/app              → Main ForeSum application
foresum.com/auth/signin      → Authentication
foresum.com/matches          → Matches page
foresum.com/groups           → Groups page
```

### **Step 3: Domain Configuration**

1. **DNS Setup at your registrar:**
```
Type: CNAME
Name: www
Value: your-app.region.azurecontainerapps.io

Type: A
Name: @
Value: [IP from nslookup your-app.region.azurecontainerapps.io]
```

2. **Azure Custom Domain:**
   - Go to Azure Portal → Your Container App → Custom domains
   - Add "foresum.com" and "www.foresum.com"
   - Complete domain verification with TXT record

### **Step 4: Deployment Options**

#### Option A: Coming Soon Mode (Recommended for launch)
```bash
# In Azure environment variables:
NEXT_PUBLIC_SHOW_COMING_SOON=true
```
- `foresum.com/` → Shows beautiful coming soon page
- `foresum.com/app` → Main application (for testing)

#### Option B: Full App Mode (After launch)
```bash
# In Azure environment variables:
NEXT_PUBLIC_SHOW_COMING_SOON=false
```
- `foresum.com/` → Redirects to dashboard or auth
- Full application available

### **Step 5: Test Your Setup**

1. **Test Coming Soon Page:**
   ```bash
   curl -I https://foresum.com/coming-soon
   ```

2. **Test Main App:**
   ```bash
   curl -I https://foresum.com/app
   ```

3. **Test Email Collection:**
   - Submit email on coming soon page
   - Check if it saves to your database

### **Step 6: SSL Certificate**

Azure will automatically provision SSL certificates for your custom domains. This may take 30-60 minutes.

### **Step 7: Monitoring**

Monitor your deployment:
- Azure Portal → Your Container App → Log stream
- Check application logs for any errors
- Monitor email registrations in your database

## 🎯 Benefits of This Setup:

✅ **Single hosting cost** (Azure only)
✅ **Professional coming soon page** with email collection
✅ **Easy toggle** between coming soon and full app
✅ **Database integration** for email signups
✅ **SSL/HTTPS** automatically handled
✅ **Custom domain** support
✅ **Scalable** container deployment

## 🔄 Switching Modes:

**To show Coming Soon page:**
```bash
az containerapp env-var set \
  --name your-app-name \
  --resource-group your-resource-group \
  --env-vars NEXT_PUBLIC_SHOW_COMING_SOON=true
```

**To show Full App:**
```bash
az containerapp env-var set \
  --name your-app-name \
  --resource-group your-resource-group \
  --env-vars NEXT_PUBLIC_SHOW_COMING_SOON=false
```

You can now cancel your hosting.com service and use Azure for everything! 🎉