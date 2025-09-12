import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const isProduction = process.env.NODE_ENV === 'production'

export const authOptions: NextAuthOptions = {
  providers: [
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
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
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
              setTimeout(() => reject(new Error('Database query timeout')), 5000)
            )
          ])
          
          if (user && typeof user === 'object' && 'image' in user && 'name' in user) {
            session.user.image = user.image as string | null
            session.user.name = user.name as string | null
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
    signIn: "/auth/signin"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}