# 🔧 Troubleshooting Login Issues

## Current Error: "Invalid Credentials"

This error can have several causes. Let's diagnose step by step:

## Step 1: Verify Environment Variables

Check that all required env vars are set in the container:

```bash
az container show \
  --resource-group foresome-rg \
  --name foresum-container \
  --query "containers[0].environmentVariables" \
  --output json
```

**Required variables:**
- `NEXTAUTH_URL` = `http://foresum-app.eastus.azurecontainer.io:3000`
- `NEXTAUTH_SECRET` = (should be set but hidden)
- `DATABASE_URL` = (should be set but hidden)
- `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (should be set but hidden)

## Step 2: Check Container Logs

View the last 50 lines of logs to see any errors:

```bash
az container logs \
  --resource-group foresome-rg \
  --name foresum-container \
  --tail 50
```

**Look for:**
- Database connection errors
- NextAuth errors
- "NEXTAUTH_URL" warnings
- Prisma connection issues

## Step 3: Verify Database Connection

The issue might be with the DATABASE_URL. Check:

1. **Using correct port?**
   - Direct connection: `5432` ✅
   - Pooler connection: `6543` ❌ (doesn't work with Prisma in containers)

2. **Connection string format:**
   ```
   postgresql://postgres.PROJECT:PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

3. **Test database access:**
   - Go to Supabase Dashboard
   - Check if the database is accessible
   - Verify no IP restrictions

## Step 4: Verify NEXTAUTH_URL

**CRITICAL:** The NEXTAUTH_URL must EXACTLY match where the app is deployed.

Current deployment: `http://foresum-app.eastus.azurecontainer.io:3000`

**Common mistakes:**
- ❌ `https://` instead of `http://`
- ❌ Missing `:3000` port
- ❌ Trailing slash `/`
- ❌ Wrong domain name

**Check your GitHub secret:**
```bash
# Should be exactly:
http://foresum-app.eastus.azurecontainer.io:3000
```

## Step 5: Test with a New User

The issue might be with existing user password hashing. Try creating a new account:

1. Go to: `http://foresum-app.eastus.azurecontainer.io:3000/auth/signup`
2. Create a new account
3. Try logging in with those credentials

## Step 6: Check User in Database

Verify the user exists in Supabase:

1. Go to Supabase Dashboard → Table Editor
2. Open the `User` table
3. Find your user by email
4. Check if `password` field is populated (should be a bcrypt hash starting with `$2a$` or `$2b$`)

## Step 7: Common Fixes

### Fix 1: Update NEXTAUTH_URL in GitHub Secrets

1. Go to: GitHub → Settings → Secrets and variables → Actions
2. Find `NEXTAUTH_URL`
3. Update to: `http://foresum-app.eastus.azurecontainer.io:3000` (no trailing slash, http not https)
4. Save and redeploy

### Fix 2: Use Direct Database Connection

Update `DATABASE_URL` secret to use port `5432` instead of `6543`:

**Wrong (pooler - doesn't work in containers):**
```
postgresql://...@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Correct (direct connection):**
```
postgresql://...@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### Fix 3: Restart Container After Env Var Changes

After updating GitHub secrets, trigger a new deployment:

```bash
# Option 1: Push any change
git commit --allow-empty -m "Trigger redeployment"
git push origin main

# Option 2: Manual workflow trigger
# Go to: https://github.com/MattWarner1215/ForeSome/actions
# Click: "Deploy to Azure Container Instance" → "Run workflow"
```

## Step 8: Test Authentication Endpoint

Test if NextAuth is responding:

```bash
curl http://foresum-app.eastus.azurecontainer.io:3000/api/auth/providers
```

**Expected output:**
```json
{
  "credentials": {...},
  "google": {...}  // If Google OAuth is configured
}
```

If this returns an error, NextAuth isn't configured correctly.

## Step 9: Check for CORS Issues

If you're testing from a different domain, check browser console for CORS errors.

NextAuth should be configured with the correct origin in NEXTAUTH_URL.

## Step 10: Verify Password is Correct

If you created the user in a different environment (local), the password might be:
- Hashed differently
- Using a different bcrypt salt
- Not transferred correctly

**Solution:** Create a new user directly in production.

## Quick Diagnostic Script

Run this to check all the important settings:

```bash
#!/bin/bash

echo "=== ForeSome Deployment Diagnostics ==="
echo ""

echo "1. Container Status:"
az container show \
  --resource-group foresome-rg \
  --name foresum-container \
  --query "instanceView.state" \
  --output tsv

echo ""
echo "2. Container IP:"
az container show \
  --resource-group foresome-rg \
  --name foresum-container \
  --query "ipAddress.ip" \
  --output tsv

echo ""
echo "3. Last 10 log lines:"
az container logs \
  --resource-group foresome-rg \
  --name foresum-container \
  --tail 10

echo ""
echo "4. Test auth endpoint:"
curl -s http://foresum-app.eastus.azurecontainer.io:3000/api/auth/providers | head -n 5
```

## Most Likely Issues (In Order)

1. **NEXTAUTH_URL mismatch** (90% of cases)
   - Check it's exactly: `http://foresum-app.eastus.azurecontainer.io:3000`
   - No https, no trailing slash

2. **Wrong DATABASE_URL** (port 6543 instead of 5432)
   - Must use direct connection (port 5432)
   - Not pgbouncer pooler

3. **Password doesn't match** (user created elsewhere)
   - Create new user directly in production

4. **Database connection blocked**
   - Check Supabase IP restrictions
   - Verify database is online

5. **Container env vars not updated**
   - Redeploy after changing GitHub secrets

## Need More Help?

Check container logs for specific error messages:

```bash
az container logs \
  --resource-group foresome-rg \
  --name foresum-container \
  --tail 100
```

Look for:
- `Error: Invalid credentials` - Wrong password/email
- `ECONNREFUSED` - Database connection issue
- `NEXTAUTH_URL` warnings - URL mismatch
- `Prisma` errors - Database schema or connection issues
