'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faGlobe, 
  faLock, 
  faLocationDot, 
  faUsers, 
  faStar, 
  faToggleOn, 
  faToggleOff,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'

interface Match {
  id: string
  title: string
  description?: string
  course: string
  address: string
  zipCode: string
  date: string
  time: string
  maxPlayers: number
  isPublic: boolean
  status: string
  creatorId: string
  _count: { players: number }
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  pendingRequestsCount?: number
  courseFeatures?: string
}

export default function PublicRoundsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [showPublicRounds, setShowPublicRounds] = useState(true)

  // Move useQuery to the top to fix hook order issue
  const { data: rounds, isLoading } = useQuery<Match[]>({
    queryKey: ['public-rounds', showPublicRounds],
    queryFn: async () => {
      const publicParam = showPublicRounds ? 'true' : 'false'
      const response = await fetch(`/api/matches?public=${publicParam}`)
      if (!response.ok) throw new Error(`Failed to fetch ${showPublicRounds ? 'public' : 'private'} rounds`)
      const rounds = await response.json()
      return rounds
    },
    staleTime: 3000, // 3 seconds for faster public rounds updates
    gcTime: 180000, // 3 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchIntervalInBackground: false // Don't refetch when tab is not active
  })

  // Handle authentication states after all hooks are defined
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/images/foresum_logo.png"
              alt="ForeSum Logo"
              className="h-[120px] w-[120px] object-contain animate-pulse"
            />
          </div>
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('${BACKGROUND_IMAGES.golf_public_background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/60"></div>

      {/* Header */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800">
                {showPublicRounds ? 'Public Rounds' : 'Private Rounds'}
              </h1>
              <p className="text-gray-600 text-sm">
                {showPublicRounds 
                  ? 'Join public rounds open to everyone' 
                  : 'Rounds created by members of your groups'}
              </p>
            </div>
            
            <Button 
              onClick={() => router.push('/')}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium px-6 py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Card className={`bg-gradient-to-br from-white/95 backdrop-blur-md shadow-xl border transition-all duration-300 rounded-2xl ${
            showPublicRounds 
              ? 'to-blue-50/80 border-blue-200/30 hover:shadow-2xl' 
              : 'to-orange-50/80 border-orange-200/30 hover:shadow-2xl'
          }`}>
            <CardContent className="p-6">
              {/* Rounds Section Headline with Toggle */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${
                  showPublicRounds ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  {showPublicRounds ? 'Public Rounds' : 'Private Rounds'}
                </h2>
                
                <button
                  onClick={() => setShowPublicRounds(!showPublicRounds)}
                  className={`flex items-center space-x-3 text-lg transition-colors ${
                    showPublicRounds 
                      ? 'text-blue-600 hover:text-blue-800' 
                      : 'text-orange-600 hover:text-orange-800'
                  }`}
                  title={showPublicRounds ? 'Show Private Rounds' : 'Show Public Rounds'}
                >
                  <span className="hidden sm:inline font-medium">
                    {showPublicRounds ? 'Show Private' : 'Show Public'}
                  </span>
                  <FontAwesomeIcon 
                    icon={showPublicRounds ? faToggleOn : faToggleOff} 
                    className="h-8 w-8 transform transition-transform hover:scale-110" 
                  />
                </button>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : rounds && rounds.length > 0 ? (
                <div className="space-y-4">
                  {rounds.map((match) => (
                    <div 
                      key={match.id} 
                      className={`group relative p-4 md:p-5 backdrop-blur-sm border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer sm:hover:scale-[1.02] sm:hover:-translate-y-2 ${
                        showPublicRounds 
                          ? 'bg-white/95 border-blue-200/50 hover:shadow-blue-200/30 hover:bg-white'
                          : 'bg-white/95 border-orange-200/50 hover:shadow-orange-200/30 hover:bg-white'
                      }`}
                      onClick={() => router.push(`/matches/${match.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:justify-between">
                        <div className="flex items-start space-x-3 w-full sm:w-auto">
                          <GolfCourseAvatar 
                            courseName={match.course} 
                            size="md"
                            roundType={showPublicRounds ? "public" : "private"}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className={`font-bold text-lg text-gray-900 group-hover:transition-colors duration-200 ${
                                showPublicRounds ? 'group-hover:text-blue-700' : 'group-hover:text-orange-700'
                              }`}>
                                {match.title}
                              </h3>
                            </div>
                            
                            {/* Golf Course Details */}
                            <div className="mb-2">
                              <h4 className="font-semibold text-base text-gray-800 mb-0.5 flex items-center">
                                <FontAwesomeIcon 
                                  icon={faLocationDot} 
                                  className={`h-3 w-3 mr-2 ${showPublicRounds ? 'text-blue-500' : 'text-orange-500'}`}
                                />
                                {match.course}
                              </h4>
                              <div className="ml-5">
                                <p className="text-gray-600 text-xs mb-0.5">{match.address}</p>
                                <p className="text-gray-500 text-xs">ZIP: {match.zipCode}</p>
                              </div>
                            </div>

                            {/* Match Description */}
                            {match.description && (
                              <div className="mb-2">
                                <p className={`text-gray-600 text-xs italic p-2 rounded-lg ${
                                  showPublicRounds ? 'bg-blue-50' : 'bg-orange-50'
                                }`}>
                                  "{match.description}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-full sm:w-auto sm:text-right">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                            showPublicRounds 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            <FontAwesomeIcon icon={faUsers} className="h-2 w-2 mr-1" />
                            {match._count.players + 1}/{match.maxPlayers} players
                          </div>
                          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1 sm:gap-2 text-xs">
                            <span className="flex items-center text-gray-600">
                              <img
                                src={LOGO_IMAGES.myrounds_icon}
                                alt="Date"
                                className="h-2 w-2 mr-1"
                              />
                              {formatDate(match.date)}
                            </span>
                            <span className="flex items-center text-gray-600">
                              <svg className={`h-2 w-2 mr-1 ${showPublicRounds ? 'text-blue-500' : 'text-orange-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              {formatTime(match.time)}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                              showPublicRounds 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              <FontAwesomeIcon 
                                icon={showPublicRounds ? faGlobe : faLock} 
                                className="h-1.5 w-1.5 mr-0.5" 
                              />
                              {showPublicRounds ? 'Public Round' : 'Private Round'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Course Features - Bottom of Card */}
                      {match.courseFeatures && (
                        <div className={`mt-3 pt-2 border-t ${
                          showPublicRounds ? 'border-blue-100/50' : 'border-orange-100/50'
                        }`}>
                          <p className={`text-xs font-medium p-2 rounded-lg border flex items-center ${
                            showPublicRounds 
                              ? 'text-blue-700 bg-blue-50 border-blue-200' 
                              : 'text-orange-700 bg-orange-50 border-orange-200'
                          }`}>
                            <FontAwesomeIcon 
                              icon={faStar} 
                              className={`h-2 w-2 mr-1 flex-shrink-0 ${
                                showPublicRounds ? 'text-blue-600' : 'text-orange-600'
                              }`} 
                            />
                            <span>{match.courseFeatures}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-16 rounded-xl shadow-sm border ${
                  showPublicRounds 
                    ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200/50' 
                    : 'bg-gradient-to-br from-orange-50 to-white border-orange-200/50'
                }`}>
                  <div className={`p-4 rounded-full w-fit mx-auto mb-6 ${
                    showPublicRounds ? 'bg-blue-100' : 'bg-orange-100'
                  }`}>
                    <FontAwesomeIcon 
                      icon={showPublicRounds ? faGlobe : faLock} 
                      className={`h-12 w-12 ${showPublicRounds ? 'text-blue-600' : 'text-orange-600'}`} 
                    />
                  </div>
                  <h3 className={`text-xl font-bold mb-4 ${showPublicRounds ? 'text-blue-800' : 'text-orange-800'}`}>
                    {showPublicRounds 
                      ? 'No public rounds available' 
                      : 'No group member rounds found'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {showPublicRounds 
                      ? 'Be the first to create a public round and invite other golfers to join!'
                      : 'Join groups to see rounds from fellow members, or create your own private round.'}
                  </p>
                  <Button 
                    asChild 
                    size="lg" 
                    className={`${
                      showPublicRounds 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        : 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
                    }`}
                  >
                    <Link href="/matches/create">Create a Round</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}