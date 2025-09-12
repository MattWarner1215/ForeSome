# 4some - Golf Match Maker

A Next.js application that allows golfers to create and join matches at local golf courses.

## Features

- **User Authentication**: Sign up and sign in with email/password
- **Match Creation**: Create golf matches with course details, date/time, and player limits
- **Match Discovery**: Find matches near you by zip code
- **User Profiles**: Manage your profile with handicap, bio, and contact info
- **Rating System**: Rate other players after matches
- **Favorite Groups**: Create private groups to share matches with friends
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query, Zustand
- **Backend**: Next.js API Routes/Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud-hosted)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd 4some
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database URL and other configuration:
```
DATABASE_URL="postgresql://username:password@localhost:5432/4some_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup Options

#### Option 1: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database named `4some_db`
3. Update `DATABASE_URL` in `.env.local`

#### Option 2: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your database URL from Project Settings > Database
3. Update `DATABASE_URL` in `.env.local`

#### Option 3: Neon
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Get your connection string
3. Update `DATABASE_URL` in `.env.local`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma client

## Project Structure

```
src/
├── app/                 # Next.js 13 app directory
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── store/              # Zustand state stores
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details