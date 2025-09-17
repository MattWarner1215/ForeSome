'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function LandingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Show loading briefly then redirect
    const timer = setTimeout(() => {
      // Check if app is in production mode or if you want to show coming soon
      const isProductionReady = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_COMING_SOON === 'true'

      if (isProductionReady) {
        // Redirect to coming soon page
        router.push('/coming-soon')
      } else if (session) {
        // User is logged in, go to dashboard
        router.push('/dashboard')
      } else {
        // User not logged in, go to auth
        router.push('/auth/signin')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [session, status, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <img
          src="/images/foresum_logo.png"
          alt="ForeSum Logo"
          className="w-32 h-32 mx-auto mb-6 animate-pulse"
        />
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-green-700 mt-4 font-medium">Loading ForeSum...</p>
      </div>
    </div>
  )
}