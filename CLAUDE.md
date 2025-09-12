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
npm run dev            # Start development server on localhost:3001 (port 3000 may be in use)
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
```

### External Access & Mobile Testing
For testing on mobile devices or from different networks:

#### Cloudflare Tunnel (Recommended)
```bash
# Install Cloudflare Tunnel
brew install cloudflared

# Start tunnel (run alongside npm run dev)
cloudflared tunnel --url http://localhost:3001
```

#### ngrok Alternative
```bash
# Install ngrok
brew install ngrok/ngrok/ngrok

# Authenticate (requires free account at ngrok.com)
ngrok config add-authtoken YOUR_AUTHTOKEN

# Start tunnel
ngrok http 3001
```

**Current Deployment Status:**
- Development server running on port 3001
- Cloudflare tunnel active: `https://kingdom-suggestions-hampshire-algorithms.trycloudflare.com`
- Fully accessible from mobile devices and external networks
- NEXTAUTH_URL configured for tunnel access

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to PostgreSQL connection string
3. Generate secure `NEXTAUTH_SECRET` with `openssl rand -base64 32`
4. (Optional) Set `GOLF_COURSE_API_KEY` for enhanced course search - get free key at https://golfcourseapi.com/
5. Run `npm run db:generate && npm run db:push` to initialize database
6. Run `npx tsx scripts/seed-golf-courses.ts` to populate the golf course database with 171+ Ohio courses

## Architecture Overview

### Core Technologies
- **Framework**: Next.js 15+ with App Router (Updated for Next.js 15 compatibility)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: TanStack Query (server state) + Zustand (client state)
- **UI**: Tailwind CSS + shadcn/ui components
- **Golf Course Data**: Database-driven golf course search with 171+ Ohio courses

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
- NextAuth.js with Prisma adapter
- Custom credentials provider with bcrypt password hashing
- JWT strategy with session callbacks extending user ID
- Protected routes check session in API routes with `getServerSession(authOptions)`

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

## Next.js 15 Compatibility & Recent Updates

### Framework Compatibility Updates (Latest)
- **Next.js 15 API Routes**: All dynamic route parameters updated from `{ params: { id: string } }` to `{ params: Promise<{ id: string }> }`
- **Type Safety Improvements**: Enhanced TypeScript compatibility with stricter type checking
- **Authentication Updates**: NextAuth.js configuration cleaned up - removed invalid options (`signUp`, `trustHost`)
- **Error Handling**: Improved unknown error type handling with proper type guards
- **Build Optimization**: Resolved all compilation warnings and type errors for production builds

### Stats/Leaderboard Toggle System (Latest)
- **Help Modal**: Added interactive help modal for Top Golfers card explaining points calculation system
- **Modal Z-Index Management**: Fixed modal rendering above all content including cards with `z-[99999]`
- **Dual Functionality**: Unified toggle component combining Golf Stats and Top Golfers with conditional data fetching
- **User Experience**: Added multiple close options (X button, "Got It!" button, backdrop click)
- **Visual Polish**: Color-coded point categories with examples and professional modal design

### Search Enhancement Features (Latest)
- **Flexible User Search**: Enhanced user search to support both name AND email queries
- **Backward Compatibility**: Maintained support for legacy 'email' parameter while adding 'q' parameter
- **Debounced Search**: 300ms debounce for optimal performance and reduced API calls
- **Type Safety**: Improved search API with proper error handling and validation

### UI/UX Polish (Latest)
- **Background Consistency**: Added golf_manage_back.jpg background to Manage Group pages
- **Button Styling**: Unified green gradient styling for Dashboard buttons across Groups pages
- **Responsive Design**: Proper overlay and backdrop blur effects for all background images
- **Component Structure**: Improved React Fragment usage to avoid JSX syntax conflicts

### Technical Debt Resolution (Latest)
- **Prisma Model Alignment**: Updated Zustand stores to use correct `Match` model instead of non-existent `Round`
- **Golf Course Data**: Simplified to use static database instead of external API integration
- **Set Iteration**: Resolved ES6 Set iteration compatibility with `Array.from()` approach
- **Null Safety**: Added comprehensive null coalescing operators for optional properties

## Recent Feature Updates

### UI/UX Enhancements
- **Background Images**: Custom background images for different sections (clubs_back.jpg, golf_Back_groups.jpg)
- **Avatar System**: Complete user avatar upload functionality with image management
- **Notification System**: Real-time notifications for pending match join requests
- **Carousel Navigation**: Vertical carousel for "My Matches" with 3-item pagination
- **Match Visibility**: Toggle between public/private matches with clear separation logic

### Performance Optimizations
- **Database Connection Tuning**: Optimized connection pooling (10 connections, timeouts)
- **Query Optimization**: Eliminated N+1 queries in matches API route
- **Caching Strategy**: Aggressive React Query caching (30-60s stale times)
- **Error Handling**: Enhanced database connection error handling in auth callbacks
- **Memory Management**: Optimized garbage collection timings (3-5 minutes)

### Match Management Features
- **Match Details**: Complete match detail pages with join/leave functionality
- **Request Management**: Approve/decline join requests for match creators
- **Notification Badges**: Visual indicators for pending requests with counts
- **Match Filtering**: Separate "My Matches" vs "Private Matches" vs "Public Matches"
- **Geographic Search**: Enhanced zipcode-based match discovery

### Group System
- **Member Management**: Add members during group creation with user search
- **Group Privacy**: Private groups for sharing matches with specific players
- **Background Customization**: Dedicated background for groups pages

### Data Architecture Updates
- **Match Logic**: Private matches show group member matches (excluding user's own)
- **Public Matches**: Exclude user's created matches (shown in "My Matches")
- **Pending Requests**: Real-time counts and notifications for match creators
- **User Search**: Debounced search functionality for adding group members

### Performance Specifications
- **Connection Pool**: 10 concurrent database connections
- **Query Caching**: 20-60 second stale times depending on data type
- **Error Recovery**: Automatic fallback handling for database timeouts
- **Memory Efficiency**: Optimized React Query garbage collection

### Current Database Optimizations
- Enhanced Prisma client configuration with timeouts
- Connection string optimized for Supabase with pgbouncer
- Efficient single-query data fetching instead of N+1 patterns
- Smart error handling in authentication session callbacks

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

## Gamification System

### Statistics & Achievement System
- **User Statistics API** (`/api/profile/stats`): Comprehensive user metrics calculation
  - Matches created, completed, and joined tracking
  - Different courses played counter
  - Average rating calculation
  - Achievement progress tracking
- **Achievement System**: 8 progressive badges with unlock conditions
  - First Match, Match Creator, Course Explorer, Social Golfer, etc.
  - Visual progress indicators with completion percentages
- **Statistics Display**: Color-coded metrics with icons and interactive cards

### Leaderboard System
- **Leaderboard API** (`/api/leaderboard`): Comprehensive scoring algorithm
  - Scoring formula: matches completed (10pts), created (15pts), unique courses (25pts), ratings (20pts), ratings received (5pts)
  - Top 10 player rankings with comprehensive stats breakdown
  - Filtering for active players only (score > 0)
- **Visual Ranking**: Trophy/medal system for top 3 players with color-coded badges
- **Player Profiles**: Detailed stats including matches, courses, ratings, and achievements

### Stats/Leaderboard Toggle Component
- **Unified Interface** (`/src/components/ui/stats-leaderboard-toggle.tsx`): Toggle between Golf Stats and Top Golfers
- **Conditional Data Fetching**: React Query optimization - stats data only loads when showing stats, leaderboard data only loads when showing leaderboard
- **Consistent Styling**: Matches sidebar card design with purple gradient theme
- **Interactive Elements**: 
  - Toggle button matches Public/Private rounds toggle styling (text-lg, h-10 w-10 icon)
  - Individual stat cards with icons, hover effects, and gradient backgrounds
  - Compact leaderboard display with rank icons and player information

### Gamification Integration Points
- **Dashboard Sidebar**: Stats/Leaderboard toggle replaces separate components
- **Profile Page**: Full statistics and achievements display with tab navigation
- **Real-time Updates**: Stats refresh on round completion and rating updates
- **Visual Feedback**: Progress bars, achievement unlocks, and rank progression

### Key Gamification Files
- `/src/components/ui/stats-leaderboard-toggle.tsx` - Main toggle component with dual functionality
- `/src/components/ui/user-stats.tsx` - Detailed statistics component with achievements
- `/src/components/ui/leaderboard.tsx` - Full leaderboard component with player details
- `/src/app/api/profile/stats/route.ts` - User statistics calculation and achievement logic
- `/src/app/api/leaderboard/route.ts` - Leaderboard scoring and ranking system

## Latest Enhancements (Most Recent Updates)

### UI/UX Improvements
- **Default Card Display**: Modified stats-leaderboard toggle to show "Top Golfers" as default instead of "Golf Stats"
- **Button Text Updates**: Changed toggle button text from "Show Stats" to "My Stats" for better clarity
- **Card Size Optimization**: Reduced round card sizing while maintaining visual appeal:
  - Card padding reduced from `p-6` to `p-4`
  - Border radius from `rounded-2xl` to `rounded-xl`
  - Title fonts from `text-xl` to `text-lg`
  - Course names from `text-lg` to `text-base`
  - Reduced hover effects and spacing for more compact display

### Golf Course Features System
- **Course Features Display**: Implemented comprehensive golf course features on match cards
  - Added `courseFeatures?: string` interface to match data structure
  - Features displayed at bottom of cards with star icon and color-coded styling
  - Integrated with existing Golf courses.md database (150 Ohio courses)
  - Features include amenities like Pro Shop, Restaurant, Cart Rental, etc.
- **API Enhancement**: Enhanced matches API to fetch and include course features from golf course database
- **Visual Design**: Features displayed with green star icon and responsive text styling

### Header Layout Redesign
- **Search Repositioning**: Moved search functionality from right side to left side of header
- **Logo Integration**: Positioned search elements next to ForeSome logo for better UX
- **Responsive Design**: Added hidden responsive classes for mobile optimization
- **Clean Layout**: Maintained visual hierarchy while improving accessibility

### Database Expansion
- **Golf Course Database**: Expanded Golf courses.md from 100 to 150 golf courses throughout Ohio
- **Regional Coverage**: Added 8 new regional sections covering all Ohio areas:
  - Southeast Ohio, Southwest Ohio, Northwest Ohio
  - Youngstown Area, Additional Central Ohio, Western Ohio
  - Additional Northeast Ohio, Appalachian Ohio
  - Lake Erie Region, Additional Toledo Area

### Bug Fixes and Error Resolution
- **TypeScript Compatibility**: Fixed Set iteration error using `Array.from(new Set(...))` approach
- **Interface Alignment**: Corrected Groups page interface mismatch from `groupRounds` to `groupMatches`
- **Webpack Cache Issues**: Resolved MODULE_NOT_FOUND errors by clearing `.next` cache
- **Member Badge Colors**: Added colorful member badges in Groups with inline styling to prevent CSS conflicts

### Technical Improvements
- **Code Quality**: Enhanced error handling and type safety across components
- **Performance**: Optimized course features loading without impacting render performance
- **Build Stability**: Resolved all compilation warnings and runtime errors
- **Visual Consistency**: Maintained design system while implementing new features

### Key Files Modified
- `/src/components/ui/stats-leaderboard-toggle.tsx` - Default display and button text changes
- `/src/app/page.tsx` - Card sizing, course features display, header search repositioning
- `/src/app/api/matches/route.ts` - Course features API integration and TypeScript fixes
- `/src/app/groups/page.tsx` - Interface corrections and colorful member badges
- `/src/lib/golf-course-api.ts` - Course features interface and data fetching
- `Golf courses.md` - Expanded to 150 courses with comprehensive Ohio coverage

### Current Features Status
- ✅ Top Golfers default display
- ✅ Compact round card design
- ✅ Golf course features on match cards
- ✅ Header search repositioning
- ✅ Colorful group member badges
- ✅ 150 Ohio golf courses database
- ✅ All TypeScript and runtime errors resolved

## Recent Major Features (September 2025)

### Database-Driven Golf Course Search System
- **Dynamic Golf Course Search**: Replaced static course data with live database queries via `/api/golf-courses/search`
- **Enhanced Search Capabilities**: 
  - Search by course name (e.g., "Tartan Fields")
  - Search by city (e.g., "Dublin" finds all Dublin courses)
  - Search by zip code with filtering
  - Case-insensitive with partial matching
- **Performance Optimized**: Database indexing on name, city, and zipCode for fast search results
- **Real-time Data**: All 171+ Ohio golf courses immediately available in course search dropdowns
- **API Architecture**: RESTful endpoint with proper error handling and validation

### Private Round Group Selection Feature
- **Selective Group Sharing**: When creating private rounds, users can choose which of their groups can see the round
- **Smart UI/UX**:
  - Group selection panel appears only for private rounds
  - Checkbox interface with group names and member counts
  - Orange-themed styling consistent with private round branding
  - Auto-clearing of selections when switching to public
- **Validation & Security**:
  - Requires at least one group selection for private rounds
  - Backend validation ensures users can only share with their own groups
  - Database integrity via GroupMatch relationship table
- **Integration**: Seamlessly works with existing match creation and group systems

### Enhanced User Experience Features
- **Badge Text Updates**: Changed "Public/Private" to "Public Course/Private Course" for clarity across all round cards
- **Debounced Search**: Fixed Available Rounds page zip code search with 500ms debouncing to prevent screen flickering
- **Visual Polish**: Removed distracting bouncing elements from splash screen for cleaner design
- **Expanded Golf Database**: Added 21 additional Ohio golf courses (151-171) including Tartan Fields Golf Club

### Technical Architecture Improvements
- **Notification System**: Complete push notification infrastructure for join requests with real-time updates
- **API Standardization**: Consistent error handling and validation patterns across all endpoints
- **TypeScript Enhancement**: Improved type safety with proper interface definitions for all API responses
- **Database Optimization**: Enhanced Prisma queries with proper relations and indexing strategies

### Key Implementation Files
- `/src/app/api/golf-courses/search/route.ts` - Database-driven course search API
- `/src/components/ui/course-search.tsx` - Updated to use database instead of static data
- `/src/app/matches/create/page.tsx` - Enhanced with group selection for private rounds
- `/src/app/api/matches/route.ts` - Updated to handle GroupMatch creation for private rounds
- `/scripts/seed-golf-courses.ts` - Golf course database seeding utility

### Current Feature Status
- ✅ Database-driven golf course search with 171+ courses
- ✅ Private round group selection with security validation
- ✅ Enhanced round card badge terminology
- ✅ Debounced search functionality preventing UI flicker
- ✅ Clean splash screen design with reduced animations
- ✅ Complete notification system for match interactions
- ✅ Comprehensive error handling and validation throughout

## Documentation Hub System (Latest Updates)

### Interactive HTML Documentation
- **Complete Documentation Suite**: All markdown files converted to interactive HTML pages with consistent ForeSome branding
- **Landing Page Hub** (`index.html`): Comprehensive documentation center with search, filtering, and navigation
- **Interactive Editing**: All HTML pages include live editing capabilities with auto-save and export functionality
- **Visual Design System**: Consistent green color palette, typography, and component styling across all documentation

### Documentation Structure
- **`index.html`**: Main landing page with document discovery, search, and quick links
- **`readme.html`**: Project overview, installation guide, and getting started instructions
- **`setup-guide.html`**: Detailed development setup with database options and troubleshooting
- **`foresome-user-flows.html`**: Complete UX documentation with visual flowcharts and personas
- **`foresome-style-guide.html`**: Comprehensive design system with live color swatches and components
- **`foresome-brand-book.html`**: Brand identity guidelines with messaging and voice framework
- **`marketing.html`**: Full marketing strategy with market analysis and growth tactics
- **`security.html`**: Security scan report with risk assessments and recommendations
- **`golf-courses.html`**: Interactive database of 150+ Ohio golf courses with search and filtering

### Documentation Features
- **Real-time Search**: Live search across all documents with keyword matching
- **Category Filtering**: Filter by Development, Business, Design, Data, and Security categories
- **Interactive Elements**: Hover effects, animations, and visual feedback throughout
- **Responsive Design**: Mobile-optimized layouts with touch-friendly interfaces
- **Edit Mode**: Click-to-edit functionality with auto-save to localStorage
- **Export Functionality**: Download edited HTML files with custom changes
- **Quick Navigation**: Breadcrumbs, smooth scrolling, and keyboard shortcuts

### Visual Design Implementation
- **Consistent Branding**: ForeSome green color scheme (#10b981, #059669, #d1fae5) throughout
- **Component Library**: Reusable cards, buttons, grids, and interactive elements
- **Golf Theming**: Golf course imagery, icons, and terminology integration
- **Professional Layout**: Modern gradients, shadows, typography, and spacing
- **Accessibility**: WCAG compliant colors, keyboard navigation, and semantic markup

### Technical Implementation
- **Self-Contained Files**: All HTML files include embedded CSS and JavaScript
- **No Dependencies**: Fully functional without external frameworks or libraries
- **Performance Optimized**: Lightweight, fast-loading pages with smooth animations
- **Cross-Browser Compatible**: Works across modern browsers and devices
- **Local Storage**: Auto-save functionality for edited content persistence

### Usage Guidelines
- **Primary Access**: Start at `index.html` for document discovery and navigation
- **Direct Access**: Individual HTML files can be opened directly for specific content
- **Editing Workflow**: Enable edit mode, make changes, auto-save handles persistence
- **Sharing**: HTML files can be shared, hosted, or used offline independently
- **Updates**: Modify content directly in HTML files or regenerate from updated markdown sources

### Integration Points
- **Development Workflow**: Documentation updates should be reflected in both markdown and HTML versions
- **Design System**: HTML documentation showcases and documents the actual design system in use
- **Brand Consistency**: All documentation reinforces ForeSome brand identity and messaging
- **User Experience**: Documentation structure mirrors application information architecture

### Key Files for Documentation System
- `index.html` - Main documentation hub and landing page
- `*.html` - Individual document pages with consistent styling and functionality
- `Golf courses.md` - Source data for golf course database (referenced by golf-courses.html)
- All original `.md` files serve as source content for HTML generation

### Documentation Maintenance
- **Content Updates**: Modify markdown files and regenerate HTML versions as needed
- **Design Changes**: Update CSS variables and styles across HTML files for consistency
- **Feature Additions**: New functionality should include documentation updates
- **Version Control**: Track both markdown and HTML versions for complete documentation history

## Latest Deployment & Build Status (September 2025)

### Build Fixes Applied
- ✅ **TypeScript Compilation Errors Fixed**: All TypeScript errors resolved for clean production builds
- ✅ **Zod Schema Updates**: Fixed `z.record()` usage and ZodError property references
- ✅ **Interface Alignment**: Updated GolfCourse interfaces to match between components and data layers
- ✅ **Type Safety Improvements**: Enhanced auth.ts with proper type assertions for user properties

### Current Deployment Configuration
- **Development Server**: Running on port 3001 (localhost:3001)
- **External Access**: Cloudflare Tunnel providing global HTTPS access
- **Environment**: `.env.local` configured for tunnel URL authentication
- **Database**: Connected to Supabase PostgreSQL with optimized connection pooling
- **Mobile Ready**: Fully responsive design tested on mobile devices

### External Access Setup
```bash
# Current tunnel command (running in background)
cloudflared tunnel --url http://localhost:3001

# Current public URL (temporary)
https://kingdom-suggestions-hampshire-algorithms.trycloudflare.com
```

### Verified Features Working
- ✅ **User Authentication**: Sign up/login functionality operational
- ✅ **Database Connectivity**: All CRUD operations functioning
- ✅ **Golf Course Search**: 171+ Ohio courses searchable
- ✅ **Match Management**: Create/join/manage golf rounds
- ✅ **Group System**: Private groups and member management
- ✅ **Mobile Interface**: Touch-optimized UI working smoothly
- ✅ **Real-time Features**: Notifications and dynamic updates

### Development Workflow for External Testing
1. Start development server: `npm run dev` (uses port 3001)
2. Start Cloudflare tunnel: `cloudflared tunnel --url http://localhost:3001`
3. Update NEXTAUTH_URL in `.env.local` with tunnel URL
4. Access from any device/network using provided HTTPS URL
5. Full functionality available including authentication and database operations

### Performance Notes
- Build time: ~2.5s for TypeScript compilation
- Bundle size optimized with Next.js 15 features
- Database queries optimized with Prisma connection pooling
- Mobile performance validated through tunnel testing