# Google OAuth Setup Guide

To enable Google sign-in/sign-up functionality in ForeSum, follow these steps:

## 1. Google Cloud Console Setup

### Create a Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your project ID

### Enable Required APIs
1. Go to **APIs & Services** > **Library**
2. Search and enable:
   - **Google+ API** (for profile access)
   - **People API** (optional, for additional profile data)

### Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure OAuth consent screen first if prompted:
   - Choose **External** for testing
   - Fill in App name: "ForeSum"
   - User support email: your email
   - Developer contact: your email
   - Add scopes: `email`, `profile`
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "ForeSum Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - Add your production domain later: `https://yourdomain.com/api/auth/callback/google`

### Get Your Credentials
1. Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
2. Copy the **Client Secret** (looks like: `GOCSPX-xxxxx`)

## 2. Update Environment Variables

Replace the placeholder values in `.env.local`:

```bash
GOOGLE_CLIENT_ID="your-actual-client-id-from-google"
GOOGLE_CLIENT_SECRET="your-actual-client-secret-from-google"
```

## 3. Restart Development Server

After updating the environment variables:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## 4. Test the Integration

1. Go to `http://localhost:3000/auth/signup`
2. You should now see the "Continue with Google" button
3. Click it to test the OAuth flow
4. After successful authentication, you'll be redirected to the dashboard

## 5. Database Integration

The Google OAuth is already configured to work with your existing Prisma schema. When users sign up with Google:
- A new `User` record is created
- An `Account` record links the Google OAuth account
- User profile data (name, email, image) is automatically populated

## Troubleshooting

### Common Issues:
1. **Redirect URI Mismatch**: Make sure the redirect URI in Google Console exactly matches your app's URL
2. **Credentials Not Loading**: Restart the dev server after updating `.env.local`
3. **Consent Screen**: You might need to add test users in the OAuth consent screen during development

### Production Deployment:
- Add your production domain to authorized redirect URIs
- Update `NEXTAUTH_URL` in production environment
- Consider upgrading OAuth consent screen to "Published" for public use

## Security Notes

- Never commit real credentials to version control
- Use different credentials for development and production
- Regularly rotate your client secrets
- Monitor usage in Google Cloud Console