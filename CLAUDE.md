# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Operations
```bash
npm run db:generate    # Generate Prisma client after schema changes
npm run db:push        # Push schema changes to database (development)
npm run db:studio      # Open Prisma Studio for database inspection
```

### Application Commands
```bash
npm run dev            # Start development server with Socket.IO on localhost:3000
npm run dev:next       # Start Next.js server only (without Socket.IO)
npm run build          # Build for production
npm run start          # Start production server with Socket.IO
npm run start:next     # Start Next.js production server only
npm run lint           # Run ESLint
npm run setup-chat     # Initialize chat database tables (run once)
```

### External Access & Mobile Testing
For testing on mobile devices or from different networks:

#### Cloudflare Tunnel (Recommended)
```bash
# Install Cloudflare Tunnel
brew install cloudflared

# Start tunnel (run alongside npm run dev)
cloudflared tunnel --url http://localhost:3000
```

#### ngrok Alternative
```bash
# Install ngrok
brew install ngrok/ngrok/ngrok

# Authenticate (requires free account at ngrok.com)
ngrok config add-authtoken YOUR_AUTHTOKEN

# Start tunnel
ngrok http 3000
```

**Current Deployment Status:**
- **Production**: Successfully deployed to Azure Container Instance
  - Azure URL: http://foresum-app.eastus.azurecontainer.io (port 80)
  - Custom Domain: https://foresumgolf.com (in progress - Cloudflare setup)
  - Container IP: 4.156.206.204:80
  - Coming Soon page: `/coming-soon` with email collection
  - Authentication: Fixed and functional (HTTP-based NEXTAUTH_URL)
- **Development**: Local server running on port 3000 with Socket.IO support
- Real-time chat system fully operational and production-ready
- Chat performance optimized with 74+ messages/second throughput
- Custom server handles both Next.js and WebSocket connections
- Real-time chat functionality enabled
- Fully accessible from mobile devices and external networks via tunnels
- NEXTAUTH_URL: HTTP-based for container compatibility
- **Cloudflare Integration**: SSL/TLS termination, CDN, and custom domain routing

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to Supabase PostgreSQL connection string
3. Set `NEXT_PUBLIC_SUPABASE_URL` to your Supabase project URL
4. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your Supabase anon key
5. Generate secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`
6. Set up Google OAuth (optional but recommended):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Set authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (development), `https://your-domain.com/api/auth/callback/google` (production)
   - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in your environment
7. (Optional) Set `GOLF_COURSE_API_KEY` for enhanced course search - get free key at https://golfcourseapi.com/
8. Set up Google Maps API for rounds location mapping:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Geocoding API
   - Create an API key and restrict it to your domain
   - Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your environment
9. Run `npm run db:generate && npm run db:push` to initialize database
10. Run `npx tsx scripts/setup-supabase-storage.ts` to create storage buckets
11. Run `npx tsx scripts/seed-golf-courses.ts` to populate the golf course database with 172 Ohio courses
12. (Optional) Run `node scripts/update-golf-course-coordinates.js` to geocode golf course coordinates
13. (Optional) Run `node scripts/remove-duplicate-golf-courses.js` to clean up duplicate course records

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15+ with App Router (Updated for Next.js 15 compatibility)
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: Supabase Storage for images and assets
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **UI**: Tailwind CSS + shadcn/ui components
- **Golf Course Data**: Database-driven golf course search with 172 Ohio courses (95 with coordinates, 55.2% coverage)

### Database Schema Architecture
The schema is designed around golf round-making with these core relationships:

**User System**: Users have profiles with handicaps, ratings, and group memberships
- `User` -> `Account/Session` (NextAuth.js authentication)
- `User` -> `Rating` (both given and received ratings)

**Match System**: Matches are the core entity with geographic and temporal organization
- `Match` -> `MatchPlayer` (many-to-many join table for participants)
- `Match` includes `zipCode` for geographic filtering
- Creator is automatically considered a participant (not stored in MatchPlayer)

**Group System**: Private groups for recurring players with selective match sharing
- `Group` -> `GroupMember` (membership with roles)
- `Group` -> `GroupMatch` (selective sharing of private matches with specific groups)
- Users can choose which groups see their private rounds during creation

### Authentication Flow
- NextAuth.js with Prisma adapter for database integration
- **Multiple Authentication Providers**:
  - Google OAuth provider for seamless social login
  - Custom credentials provider with bcrypt password hashing for email/password login
- JWT strategy with session callbacks extending user ID
- Automatic account linking for users signing in with different providers
- Protected routes check session in API routes with `getServerSession(authOptions)`
- Custom sign-in and sign-up pages with Google integration

### State Management Patterns
- **Server State**: TanStack Query for API data fetching and caching
- **Client State**: Zustand stores for UI state and temporary data
- **Form State**: React hooks with local state, no external form library

### API Route Organization
```
/api/auth/           # NextAuth.js routes + custom signup
/api/profile/        # User profile management and ratings
/api/matches/       # Match CRUD, join/leave operations
/api/groups/         # Group management and membership
```

### Frontend Architecture
- **App Router**: File-based routing in `/app` directory
- **Server Components**: API routes return JSON, client components handle UI
- **Component Pattern**: shadcn/ui base components in `/components/ui`
- **Page Structure**: Full-page components with embedded navigation

### Key Business Logic
1. **Match Joining**: Users can join public matches if not full and not creator
2. **Geographic Search**: Matches filtered by `zipCode` field for location-based discovery
3. **Group Privacy**: Groups can share private matches with members only
4. **Rating System**: Users rate each other after matches, with unique constraint per match
5. **Authentication**: Credential-based with email/password, no OAuth providers configured

### Database Constraints & Rules
- Users can only join matches they didn't create
- Match creators cannot leave their own matches
- Group creators cannot leave their own groups
- Ratings are unique per rater/ratee/match combination
- All foreign key relationships use cascade deletes for data integrity

### Environment Dependencies
- Requires `DATABASE_URL` for PostgreSQL connection (optimized with connection pooling)
- Requires `NEXTAUTH_SECRET` for session encryption
- `NEXTAUTH_URL` defaults to localhost:3000 in development

## Key Implementation Files

### Core Components
- `/src/components/ui/avatar-upload.tsx` - Avatar upload component with preview and error handling
- `/src/components/ui/user-search.tsx` - Debounced user search for group member selection
- `/src/app/page.tsx` - Main dashboard with carousel navigation and notifications
- `/src/app/groups/page.tsx` - Group management interface with custom background

### API Routes
- `/src/app/api/matches/route.ts` - Optimized matches API with single-query efficiency
- `/src/app/api/profile/avatar/route.ts` - Avatar upload/delete handling
- `/src/app/api/groups/route.ts` - Group creation with member management
- `/src/app/api/matches/[id]/route.ts` - Match details and management

### Configuration Files
- `/src/lib/prisma.ts` - Enhanced Prisma client with performance optimizations
- `/src/lib/auth.ts` - Authentication with error handling and session management
- `.env.local` - Optimized database connection string with pooling parameters

### Recent Match Logic Improvements
1. **Public Matches Filter**: Excludes user's own created matches
2. **Private Matches Logic**: Shows matches created by group members only
3. **My Matches**: Shows user's created matches and matches they've joined
4. **Notification System**: Real-time pending request counts with visual indicators
5. **Carousel Navigation**: Efficient pagination through match collections

### Performance Best Practices
- Use React Query with appropriate stale times for different data types
- Implement single database queries instead of N+1 patterns
- Apply proper error handling for intermittent connection issues
- Utilize connection pooling with reasonable limits (10 connections)
- Cache frequently accessed data at multiple levels (React Query + browser)

## Supabase Storage Integration (Latest Update)

### File Storage Architecture
- **Supabase Storage**: Scalable cloud storage for all image assets
- **Storage Buckets**: Organized by asset type (avatars, golf-courses, backgrounds, logos)
- **CDN Integration**: Fast global delivery with automatic optimization
- **Access Control**: Row-level security policies for secure file management

### Storage Buckets Configuration
- **`avatars`**: User profile pictures with automatic cleanup
- **`golf-courses`**: Golf course images and photos
- **`backgrounds`**: Application background images
- **`logos`**: Brand assets and logos

### Migration from Local Storage
- **Avatar System**: Fully migrated from local file system to Supabase Storage
- **Automatic Cleanup**: Old avatars are deleted when new ones are uploaded
- **URL Management**: Seamless transition from local URLs to Supabase CDN URLs
- **Backward Compatibility**: Handles both old local files and new Supabase URLs

### Storage Management Features
- **File Validation**: Type and size validation (5MB limit, JPEG/PNG/GIF/WebP)
- **Unique Filenames**: Timestamp-based naming prevents conflicts
- **Error Handling**: Graceful fallbacks if storage operations fail
- **Performance**: 1-hour cache control for optimal delivery

### Setup Requirements
1. **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **Storage Buckets**: Run `npx tsx scripts/setup-supabase-storage.ts` to create buckets
3. **RLS Policies**: Configure Row Level Security in Supabase Dashboard
4. **API Integration**: Avatar upload API fully migrated to use Supabase Storage

### Key Implementation Files
- `/src/lib/supabase.ts` - Supabase client configuration and storage utilities
- `/src/app/api/profile/avatar/route.ts` - Migrated avatar upload/delete API
- `/scripts/setup-supabase-storage.ts` - Storage bucket setup utility
- `.env.local` - Supabase configuration variables

## Google Maps Integration (Latest Update)

### Interactive Maps for Golf Round Discovery
- **Location-based round finding**: Users can view public rounds on an interactive map
- **Google Maps API integration**: Full-featured maps with custom markers and controls
- **Distance calculations**: Shows distance from user's location to each golf course
- **Real-time geolocation**: Browser-based location detection for accurate distance measurements

### Golf Course Coordinate System
- **Database**: 172 Ohio golf courses with 95 having precise GPS coordinates (55.2% coverage)
- **Geocoding**: Automated coordinate lookup using OpenStreetMap Nominatim API
- **Data quality**: Duplicate records removed, prioritizing entries with coordinate data
- **Coverage areas**: Comprehensive coverage across Ohio including Columbus, Cleveland, Cincinnati, Toledo, and Dayton regions

### Maps Implementation Features
- **Interactive markers**: Green pins for golf courses, blue pin for user location
- **Course information**: Click markers to view round details, dates, and player counts
- **Responsive design**: Mobile-optimized with touch controls and proper sizing
- **Modern UI**: Glassmorphism design with smooth animations and hover effects
- **Distance sorting**: Rounds automatically sorted by proximity to user

### Key Maps Files
- `/src/components/ui/google-maps.tsx` - Main Google Maps component with interactive features
- `/src/app/api/rounds/locations/route.ts` - API endpoint for round location data with coordinate matching
- `/scripts/update-golf-course-coordinates.js` - Geocoding script for coordinate population
- `/scripts/remove-duplicate-golf-courses.js` - Database cleanup for duplicate course removal

### Benefits of Supabase Storage
- **Scalability**: No more large files in Git repository
- **Performance**: CDN delivery with global edge locations
- **Management**: Automatic backups and redundancy
- **Cost-Effective**: Pay-as-you-use pricing model
- **Integration**: Seamless integration with existing Supabase database

## Azure Container Instance Deployment

### Production Deployment Overview
ForeSum is successfully deployed on Azure Container Instance with the following configuration:

- **Service**: Azure Container Instance (ACI)
- **Resource Group**: `foresome-rg`
- **Container Name**: `foresum-container`
- **Registry**: Azure Container Registry (ACR) - `foresomeregistry.azurecr.io`
- **Image**: `foresum:v25` (WORKING VERSION - DO NOT CHANGE WITHOUT TESTING)
- **Azure URL**: http://foresum-app.eastus.azurecontainer.io (port 80)
- **Production URL**: http://foresumgolf.com (HTTP only, no HTTPS)
- **DNS Configuration**: Cloudflare CNAME (DNS only/gray cloud) → `foresum-app.eastus.azurecontainer.io`
- **Current IP**: Dynamic (auto-resolved via CNAME)
- **CI/CD**: GitHub Actions automated deployment on push to main

### CRITICAL: Working Configuration Requirements

**This exact configuration is REQUIRED for the site to work. Do not modify without understanding the dependencies.**

1. **NEXTAUTH_URL** must be `http://foresumgolf.com` (HTTP, not HTTPS, not Azure hostname)
2. **DATABASE_URL** must use URL-encoded password: `FenderBass0612%21` (not `FenderBass0612!`)
3. **Cloudflare DNS** must be CNAME (not A record), DNS only mode (gray cloud, NOT proxied/orange cloud)
4. **Container Port** must be 80 (not 3000)
5. **Image Version** must be v25 (tested and working)

### Docker Configuration
```dockerfile
# Single-stage Node.js 18 build
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# Build-time dummy environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
# ... (dummy values for build)

RUN npm run build > build.log 2>&1 || (echo "=== BUILD FAILED ===" && tail -50 build.log && exit 1)

EXPOSE 80
CMD ["npm", "run", "start"]
```

### Environment Variables (Production) - WORKING CONFIGURATION

**IMPORTANT: These exact values are required. See "CRITICAL Configuration Requirements" section above.**

```bash
# Core Configuration
NODE_ENV=production
HOSTNAME=0.0.0.0                           # REQUIRED: Allows external container access
PORT=80                                     # REQUIRED: Must be 80 for standard HTTP

# Authentication (CRITICAL - DO NOT CHANGE)
NEXTAUTH_URL=http://foresumgolf.com        # MUST be http://foresumgolf.com (HTTP, not HTTPS, not Azure hostname)
NEXTAUTH_SECRET=UMCBaWdnSfsE/G/9KrrxYGcYAvEW9sJs4UxrvtdzZXM=  # Production secret

# Database (CRITICAL - PASSWORD MUST BE URL-ENCODED)
DATABASE_URL=postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612%21@aws-1-us-east-1.pooler.supabase.com:5432/postgres
# NOTE: Password uses %21 (URL-encoded !) not ! directly. Azure CLI escapes special characters incorrectly.

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3ODUwNywiZXhwIjoyMDcyNjU0NTA3fQ.ccFcXzjRXBZ02UHE2AmYg6G5Ax9ds7aT7XB7b5F6tWw

# Google OAuth (REQUIRED for Google Sign-In)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAQ921igVhx1NedjGXnEaE-u5yqprLGK9I
```

### Deployment Commands
```bash
# Manual deployment (automated via GitHub Actions)
# Build and tag Docker image
docker build -t foresomeregistry.azurecr.io/foresum:v25 .

# Push to Azure Container Registry
docker push foresomeregistry.azurecr.io/foresum:v25

# Deploy to Azure Container Instance
az container create \
  --resource-group foresome-rg \
  --name foresum-container \
  --image foresomeregistry.azurecr.io/foresum:v25 \
  --dns-name-label foresum-app \
  --ports 80 \
  --cpu 1 \
  --memory 2 \
  --os-type Linux \
  --environment-variables \
    NEXT_PUBLIC_SUPABASE_URL="${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}" \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=80 \
    DATABASE_URL="${{ secrets.DATABASE_URL }}" \
    NEXTAUTH_SECRET="${{ secrets.NEXTAUTH_SECRET }}" \
    NEXTAUTH_URL="${{ secrets.NEXTAUTH_URL }}" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}" \
    SUPABASE_SERVICE_ROLE_KEY="${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="${{ secrets.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }}"
```

### GitHub Actions CI/CD Pipeline
Automated deployment on push to main branch:
- Checks out code with Git LFS enabled (for image files)
- Builds and pushes Docker image to Azure Container Registry
- Deletes existing container instance
- Creates new container with updated image and environment variables
- Retrieves and displays container URL and logs

See `.github/workflows/azure-deploy.yml` for complete workflow configuration.

### GitHub Secrets Configuration (CRITICAL)

**Repository secrets must be configured at**: https://github.com/MattWarner1215/ForeSome/settings/secrets/actions

**Required Secrets with EXACT values**:

```bash
# Azure Configuration
AZURE_CREDENTIALS=<azure-service-principal-json>
AZURE_REGISTRY_USERNAME=foresomeregistry
AZURE_REGISTRY_PASSWORD=<from-azure-acr>

# CRITICAL: Must match production configuration EXACTLY
NEXTAUTH_URL=http://foresumgolf.com
NEXTAUTH_SECRET=UMCBaWdnSfsE/G/9KrrxYGcYAvEW9sJs4UxrvtdzZXM=

# Database - MUST use URL-encoded password
DATABASE_URL=postgresql://postgres.npmksisxmjgnqytcduhs:FenderBass0612%21@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzg1MDcsImV4cCI6MjA3MjY1NDUwN30.PlJE3-NbzXjuGx9UmcDE9h0IxvSO4xTBTaC7kvGvj4w
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wbWtzaXN4bWpnbnF5dGNkdWhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA3ODUwNywiZXhwIjoyMDcyNjU0NTA3fQ.ccFcXzjRXBZ02UHE2AmYg6G5Ax9ds7aT7XB7b5F6tWw

# Google OAuth (REQUIRED for Google Sign-In feature parity)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAQ921igVhx1NedjGXnEaE-u5yqprLGK9I
```

**⚠️ CRITICAL**: If these secrets are not configured correctly, deployments will break authentication and database connectivity. Missing GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET will disable Google Sign-In.

### Key Deployment Fixes Applied
1. **Hostname Binding**: Updated `server.js` from `localhost` to `0.0.0.0` for external container access
2. **Authentication URL**: Fixed `NEXTAUTH_URL` to use HTTP instead of HTTPS to match container protocol
3. **Container Configuration**: Optimized resource allocation (1 CPU, 2GB RAM)
4. **Port Configuration**: Changed from 3000 to 80 for Cloudflare proxy compatibility
5. **Git LFS Integration**: Enabled in GitHub Actions for proper image file handling
6. **Environment Variables**: Switched to `--environment-variables` for proper secret injection
7. **Build Optimization**: Single-stage Docker build with dummy env vars for Next.js build
8. **FontAwesome Fix**: Configured CSS import and autoAddCss to prevent icon rendering issues

### Coming Soon Page Features
- **URL**: `/coming-soon`
- **Design**: Modern glassmorphism with dark theme and golf course background
- **Email Collection**: Integrated form with database storage (`EmailRegistration` model)
- **Responsive**: Mobile-optimized design with animations
- **Branding**: ForeSum logo and consistent styling

### Monitoring and Management
```bash
# Check container status
az container show --resource-group foresome-rg --name foresum-container

# View container logs
az container logs --resource-group foresome-rg --name foresum-container

# Get container IP address
az container show --resource-group foresome-rg --name foresum-container --query "ipAddress.ip" --output tsv

# Delete and redeploy container
az container delete --resource-group foresome-rg --name foresum-container --yes
```

### Custom Domain Configuration (WORKING)

**✅ Custom domain http://foresumgolf.com is successfully configured and working.**

**Working Configuration**:
- **DNS Type**: CNAME record (NOT A record)
- **DNS Target**: `foresum-app.eastus.azurecontainer.io`
- **Cloudflare Proxy**: **DNS only (gray cloud)** - Orange cloud (proxied) will NOT work
- **Protocol**: HTTP only (port 80) - HTTPS is not supported on Azure ACI
- **NEXTAUTH_URL**: Must be set to `http://foresumgolf.com` for authentication to work

**Why This Works**:
Azure Container Instances validates the Host header in requests. When using:
- Direct IP access → Fails (503 "Web Page Blocked")
- Cloudflare proxied (orange cloud) → Fails (Azure sees wrong hostname)
- **DNS only (gray cloud)** → Works! Browser sends correct hostname via CNAME resolution

**Important Notes**:
- Site is accessible via HTTP only: http://foresumgolf.com (not HTTPS)
- Azure ACI does not support SSL termination
- For HTTPS support, you would need to migrate to Azure Container Apps or use a reverse proxy

### Production Notes
- **Database Schema**: Production database needs `EmailRegistration` table for coming soon page
- **Node.js Version**: Currently using Node 18 (Supabase recommends upgrading to Node 20+)
- **Next.js Build**: Standard build without standalone mode (incompatible with custom server.js)
- **Performance**: Container starts in ~30 seconds with image caching
- **Scaling**: Can be easily scaled or upgraded through Azure portal or CLI
- **Custom Domain**: Configured via Cloudflare for HTTPS and CDN

### Troubleshooting

#### Common Issues
- **Site unreachable**: Check hostname binding in `server.js` (should be `0.0.0.0`, not `localhost`)
- **Login failures**: Verify `NEXTAUTH_URL` matches actual container protocol and port
- **Database errors**: Ensure production database schema is up to date with Prisma migrations
- **Image issues**: Verify Azure Container Registry credentials and image tags
- **Icons not showing**: Check Git LFS checkout in GitHub Actions and FontAwesome CSS configuration
- **DNS not resolving**: Wait 5-10 minutes for propagation, purge Cloudflare cache if needed

#### Authentication/Login Issues
- **401 Unauthorized errors**: Usually caused by database connection failures
  - **Check container logs**: `az container logs --resource-group foresome-rg --name foresum-container`
  - **Look for**: "Authentication failed against database server" or "unexpected message from server"
  - **Solution**: Verify DATABASE_URL uses URL-encoded password (`%21` not `!`)

- **NEXTAUTH_URL misconfiguration**:
  - ❌ Wrong: `https://foresumgolf.com` (HTTPS not supported)
  - ❌ Wrong: `http://foresum-app.eastus.azurecontainer.io` (wrong domain)
  - ✅ Correct: `http://foresumgolf.com`

#### Database Connection Errors
- **"Authentication failed against database server"**:
  - Cause: Special characters in password not properly encoded
  - Solution: Use URL encoding: `!` → `%21`, `@` → `%40`, etc.
  - Working password: `FenderBass0612%21` (not `FenderBass0612!`)

- **"Error querying the database: unexpected message from server"**:
  - Cause: Azure CLI auto-escapes special characters with backslashes
  - When you pass `FenderBass0612!`, Azure stores it as `FenderBass0612\!`
  - Solution: Always use URL-encoded passwords in DATABASE_URL

#### Site Not Loading After Deployment
- **DNS propagation**: Wait 1-5 minutes for CNAME to resolve to new container IP
- **Test Azure hostname first**: `curl http://foresum-app.eastus.azurecontainer.io`
- **Check container is running**: Container should show "Ready on http://0.0.0.0:80" in logs
- **Verify DNS resolution**: `dig foresumgolf.com` should resolve to current container IP

#### Custom Domain Not Working
- **Cloudflare proxy enabled (orange cloud)**: Turn OFF proxy (use gray cloud/DNS only)
- **Using A record instead of CNAME**: Change to CNAME pointing to `foresum-app.eastus.azurecontainer.io`
- **Trying to use HTTPS**: Azure ACI only supports HTTP on port 80