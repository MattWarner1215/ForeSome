'use client'

import { useState, useEffect } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faLock, faEye, faEyeSlash, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import Link from 'next/link'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const [isProvidersLoaded, setIsProvidersLoaded] = useState(false)
  const router = useRouter()

  // Load available providers on component mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const availableProviders = await getProviders()
        setProviders(availableProviders)
      } catch (error) {
        console.error('Failed to load providers:', error)
      } finally {
        setIsProvidersLoaded(true)
      }
    }
    loadProviders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        router.push('/')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')

    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false,
      })

      if (result?.error) {
        setError('Google sign-in failed')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError('An error occurred with Google sign-in')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // Check if Google provider is available
  const isGoogleProviderAvailable = providers?.google && isProvidersLoaded

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-2 h-2 bg-green-300 rounded-full"></div>
        <div className="absolute top-32 right-20 w-3 h-3 bg-green-200 rounded-full"></div>
        <div className="absolute bottom-20 left-32 w-4 h-4 bg-green-100 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-2 h-2 bg-green-300 rounded-full"></div>
        <div className="absolute top-1/2 left-20 w-1 h-1 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/3 right-32 w-2 h-2 bg-green-200 rounded-full"></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Golf Ball Animation */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 animate-bounce">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/foresum_logo.png" 
                alt="ForeSum Logo" 
                className="h-[120px] w-[120px] object-contain"
              />
            </div>
            <CardDescription className="text-gray-600 mt-2">
              Welcome back to your golf community
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-green-600 transition-colors"
                  >
                    {showPassword ? (
                      <FontAwesomeIcon icon={faEyeSlash} className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FontAwesomeIcon icon={faEye} className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign In</span>
                      <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Conditionally render Google sign-in section */}
            {isGoogleProviderAvailable && (
              <>
                {/* Divider */}
                <div key="divider" className="mt-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="px-4 text-sm text-gray-500 font-medium">or</div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* Google Sign-In Button */}
                <div key="google-signin" className="mt-6">
                  <Button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 font-semibold border border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isGoogleLoading ? (
                      <div key="loading" className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing in with Google...</span>
                      </div>
                    ) : (
                      <div key="normal" className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faGoogle} className="h-5 w-5 text-red-500" />
                        <span>Continue with Google</span>
                      </div>
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Forgot Password Link */}
            <div key="forgot-password" className="mt-6 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 transition-colors hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="font-semibold text-green-600 hover:text-green-700 transition-colors hover:underline"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Join thousands of golfers connecting through ForeSum
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-green-100 rounded-full opacity-50"></div>
        <div className="absolute -top-6 -left-6 w-8 h-8 bg-green-200 rounded-full opacity-30"></div>
      </div>
    </div>
  )
}