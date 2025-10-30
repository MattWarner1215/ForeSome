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
- **Image**: `foresum:v25` (latest with port 80 for Cloudflare)
- **Azure URL**: http://foresum-app.eastus.azurecontainer.io (port 80)
- **Custom Domain**: https://foresumgolf.com (via Cloudflare)
- **Current IP**: 4.156.206.204:80
- **CI/CD**: GitHub Actions automated deployment on push to main

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

### Environment Variables (Production)
```bash
NEXT_PUBLIC_SHOW_COMING_SOON=true          # Shows coming soon page by default
NEXTAUTH_URL=http://foresum-app.eastus.azurecontainer.io  # HTTP for container compatibility (no port needed with 80)
NEXTAUTH_SECRET=<generated-secret>          # Secure random secret
NEXT_PUBLIC_SUPABASE_URL=https://npmksisxmjgnqytcduhs.supabase.co
NODE_ENV=production
HOSTNAME=0.0.0.0                           # Essential for container external access
PORT=80                                     # Changed from 3000 for Cloudflare compatibility
DATABASE_URL=<supabase-postgres-url>       # Secure environment variable
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-key>  # Secure environment variable
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<maps-key>    # Google Maps API key
SUPABASE_SERVICE_ROLE_KEY=<service-key>    # Supabase service role key
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

### Custom Domain Limitations (IMPORTANT)

**Azure Container Instances does NOT support custom domains natively**. Azure ACI enforces hostname validation and only accepts requests with the official Azure hostname (`foresum-app.eastus.azurecontainer.io`). Any requests using custom domains or direct IP addresses return "Web Page Blocked" errors.

**Current Status**:
- ✅ **Working**: http://foresum-app.eastus.azurecontainer.io (port 80)
- ❌ **Not Working**: Custom domain (foresumgolf.com) - blocked by Azure ACI hostname validation
- DNS configured correctly (CNAME → Azure hostname) but Azure rejects non-Azure hostnames

**Solutions for Custom Domain Support**:

1. **Migrate to Azure Container Apps** (RECOMMENDED)
   - Native custom domain support with automatic SSL
   - Better suited for production workloads
   - Similar pricing to ACI

2. **Deploy Reverse Proxy**
   - Deploy nginx/Caddy as separate container
   - Proxy accepts custom domain, forwards to app with Azure hostname
   - Adds complexity but enables custom domain with current ACI setup

3. **Use Azure App Service**
   - Full custom domain and SSL support
   - More expensive than ACI but production-ready

**Attempted Cloudflare Configuration** (Not functional due to ACI limitations):
- Type: CNAME record
- Name: @ (root domain)
- Target: `foresum-app.eastus.azurecontainer.io`
- Proxy: DNS only (gray cloud) - required since proxied mode also fails
- Result: Azure blocks with "Web Page Blocked" error regardless of proxy setting

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

#### Custom Domain Issues (Azure ACI Limitation)
- **"Web Page Blocked" error**: Azure Container Instances enforces hostname validation
  - Only accepts requests with Host header: `foresum-app.eastus.azurecontainer.io`
  - Rejects all custom domains, IPs, and alternative hostnames
  - This is an Azure platform limitation, not a configuration issue
- **Cloudflare 503 errors**: Occurs when Cloudflare proxy tries to connect with custom domain
  - Cloudflare sends `Host: foresumgolf.com` header
  - Azure ACI rejects it with 503 Service Unavailable
  - Turning off Cloudflare proxy (DNS only) still doesn't work - Azure validates hostname
- **Solution**: Migrate to Azure Container Apps or deploy reverse proxy (see Custom Domain Limitations section)