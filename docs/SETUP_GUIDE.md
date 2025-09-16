# 4some Setup Guide

## Overview
4some is a complete golf match-making application built with Next.js, TypeScript, and modern web technologies. This guide will help you get the application running locally.

## ✅ Features Implemented

### Core Functionality
- **User Authentication**: Email/password signup and signin with NextAuth.js
- **User Profiles**: Complete profile management with handicap, bio, contact info, and ratings
- **Match Creation**: Create golf matches with course details, date/time, player limits
- **Match Discovery**: Search and filter matches by zip code
- **Join/Leave Matches**: Join public matches or leave matches you've joined
- **Favorite Groups**: Create private groups and share matches with specific players
- **Rating System**: Rate other players after matches are completed
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Technical Features
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: TanStack Query for server state, Zustand for client state
- **UI Components**: shadcn/ui components with consistent design system
- **TypeScript**: Full type safety throughout the application
- **Modern Architecture**: Next.js 13+ App Router with server components

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18 or higher
- PostgreSQL database (local or cloud)
- Git (optional)

### 2. Database Setup

Choose one of these options:

#### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string

#### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new database
3. Copy the connection string

#### Option C: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database named `4some_db`
3. Use connection string format: `postgresql://username:password@localhost:5432/4some_db`

### 3. Environment Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your database URL and generate a secret:
   ```env
   DATABASE_URL="your-database-connection-string-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="run-this-command-to-generate-secret"
   ```

3. Generate a secure secret for NextAuth:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and use it as your `NEXTAUTH_SECRET`.

### 4. Install Dependencies

```bash
npm install
```

### 5. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## 📖 User Guide

### Getting Started
1. **Sign Up**: Create an account with your email and password
2. **Complete Profile**: Add your handicap, zip code, and bio
3. **Create or Join Matches**: Find matches near you or create your own
4. **Create Groups**: Make private groups for your regular golf buddies

### Creating a Match
1. Click "Create Match" from the dashboard
2. Fill in match details:
   - Title and description
   - Golf course name and address
   - Date, time, and zip code
   - Maximum number of players
   - Public or private visibility
3. Submit to create the match

### Finding Matches
1. Use the zip code search on the dashboard for quick results
2. Go to "Browse All Matches" to see all available matches
3. Filter by "My Matches" to see matches you've created or joined
4. Join public matches that have available spots

### Managing Groups
1. Go to the Groups page
2. Create new groups with names and descriptions
3. Invite friends to your private groups
4. Share private matches with group members

### Profile & Ratings
1. Update your profile with golf handicap and bio
2. After playing matches, rate other players
3. Build your reputation through positive ratings
4. View your rating history and comments

## 🛠 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio database browser
- `npm run db:generate` - Generate Prisma client

### Project Structure
```
src/
├── app/                 # Next.js 13+ app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── matches/        # Match-related pages
│   ├── groups/         # Group management pages
│   └── profile/        # User profile page
├── components/         # Reusable UI components
│   └── ui/            # shadcn/ui components
├── lib/               # Utility functions
├── store/             # Zustand state stores
└── types/             # TypeScript type definitions
```

## 📊 Database Schema

The application uses the following main models:
- **User**: User accounts with profiles and ratings
- **Match**: Golf matches with course details and participants
- **Group**: Private groups for sharing matches
- **Rating**: Player ratings and reviews
- **MatchPlayer**: Join table for match participants
- **GroupMember**: Group membership management

## 🔧 Customization

### Adding New Features
1. Create database migrations with Prisma
2. Add API routes in `/api/`
3. Create UI components in `/components/`
4. Add pages in `/app/`

### Styling
- The app uses Tailwind CSS for styling
- shadcn/ui provides consistent component design
- Colors and themes can be customized in `tailwind.config.js`

## 📝 Environment Variables Reference

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Optional OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Digital Ocean App Platform

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify your database connection
3. Ensure all environment variables are set correctly
4. Check that your database schema is up to date with `npm run db:push`

## 🎉 You're Ready to Golf!

Your 4some application is now ready to help golfers find and create matches. Users can sign up, create profiles, organize matches, and build their golf network through the platform.

Happy golfing! ⛳