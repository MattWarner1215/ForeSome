'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
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
import EnhancedRoundCard from '@/components/ui/enhanced-round-card'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'

interface Match {
  id: string
  title: string
  description?: string | null
  course: string
  address: string
  zipCode: string
  date: string
  time: string
  maxPlayers: number
  isPublic: boolean
  status: string
  creatorId: string
  creator: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
  players: {
    player: {
      id: string
      name: string | null
      email: string
      handicap: number | null
    }
  }[]
  _count: { players: number }
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  pendingRequestsCount?: number
  courseFeatures?: string
}

export default function PublicRoundsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [showPublicRounds, setShowPublicRounds] = useState(true)
  const [joinLoading, setJoinLoading] = useState<string | null>(null)
  const queryClient = useQueryClient()

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

  const handleJoinRequest = async (matchId: string) => {
    try {
      setJoinLoading(matchId)
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'Join request sent successfully!')
        // Refresh the rounds data to show updated status
        queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      } else {
        toast.error(data.message || 'Failed to send join request')
      }
    } catch (error) {
      console.error('Join request error:', error)
      toast.error('Failed to send join request')
    } finally {
      setJoinLoading(null)
    }
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
                    <EnhancedRoundCard
                      key={match.id}
                      match={match}
                      currentUserId={session?.user?.id}
                      roundType={showPublicRounds ? 'public' : 'private'}
                      size="md"
                      onCardClick={() => router.push(`/matches/${match.id}`)}
                      onJoinClick={() => handleJoinRequest(match.id)}
                      onManageClick={() => router.push(`/matches/${match.id}`)}
                      isLoading={joinLoading === match.id}
                    />
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