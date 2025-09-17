# CLAUDE2.md

This file contains feature updates, recent enhancements, and UI/UX improvements for the ForeSum golf application.

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
- **Logo Integration**: Positioned search elements next to ForeSum logo for better UX
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
- `docs/Golf courses.md` - Expanded to 150 courses with comprehensive Ohio coverage

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
- **Complete Documentation Suite**: All markdown files converted to interactive HTML pages with consistent ForeSum branding
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
- **Consistent Branding**: ForeSum green color scheme (#10b981, #059669, #d1fae5) throughout
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
- **Brand Consistency**: All documentation reinforces ForeSum brand identity and messaging
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