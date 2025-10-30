import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Utility function to check if Google OAuth is enabled
export const isGoogleOAuthEnabled = () => {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

const isProduction = process.env.NODE_ENV === 'production'

// Create providers array conditionally
const providers = []

// Only add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Always add credentials provider
providers.push(
  CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password || ""
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ baseUrl }) {
      // Always redirect to dashboard after sign in
      return `${baseUrl}/dashboard`
    },
    async signIn({ user, account }) {
      // Allow all credentials sign-ins (handled by the authorize function)
      if (account?.provider === 'credentials') {
        return true
      }

      // Handle OAuth providers (Google)
      if (account?.provider === 'google') {
        // If user exists with this email, automatically link accounts
        if (user?.email) {
          try {
            // Check if user already exists with this email
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
              include: { accounts: true }
            })

            if (existingUser) {
              // Check if Google account is already linked
              const existingGoogleAccount = existingUser.accounts.find(
                acc => acc.provider === 'google' && acc.providerAccountId === account.providerAccountId
              )

              if (!existingGoogleAccount) {
                // Link Google account to existing user
                await prisma.account.create({
                  data: {
                    userId: existingUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                  }
                })

                // Update user with Google profile image if not set
                if (!existingUser.image && user.image) {
                  await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { image: user.image }
                  })
                }
              }
            }
          } catch (error) {
            console.error('Error linking Google account:', error)
            // Continue with sign-in even if linking fails
          }
        }
        return true
      }

      return false
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'google') {
        token.provider = 'google'
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string

        // Fetch fresh user data including image with enhanced error handling
        try {
          // Add timeout wrapper for database query
          const user = await Promise.race([
            prisma.user.findUnique({
              where: { id: token.id as string },
              select: { image: true, name: true }
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Database query timeout')), 3000)
            )
          ])

          if (user && typeof user === 'object' && 'image' in user && 'name' in user) {
            session.user.image = user.image as string | null | undefined
            session.user.name = user.name as string | null | undefined
          }
        } catch (error) {
          // More detailed error logging for debugging
          if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message.includes('connect')) {
              console.warn('Session callback: Database connection issue, using cached session data')
            } else {
              console.error('Session callback database error:', error.message)
            }
          } else {
            console.error('Session callback unknown error:', error)
          }
          // Continue with existing session data to avoid breaking authentication
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/dashboard"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}