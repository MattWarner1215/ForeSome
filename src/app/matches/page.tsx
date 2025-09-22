'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import EnhancedRoundCard from '@/components/ui/enhanced-round-card'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'
import { invalidateMatchQueries } from '@/lib/query-invalidation'

interface Round {
  id: string
  title: string
  description: string | null
  course: string
  address: string
  zipCode: string
  date: string
  time: string
  maxPlayers: number
  isPublic: boolean
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
  _count: {
    players: number
  }
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  pendingRequestsCount?: number
}

function RoundesPageContent() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Initialize activeTab based on URL parameters
  const [activeTab, setActiveTab] = useState<'public' | 'my'>(() => {
    return searchParams.get('myMatches') === 'true' ? 'my' : 'public'
  })
  const [zipCodeInput, setZipCodeInput] = useState('')
  const [zipCodeFilter, setZipCodeFilter] = useState('')

  // Debounce zip code input to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setZipCodeFilter(zipCodeInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [zipCodeInput])

  // Clear zip code filter when switching to 'my' tab
  useEffect(() => {
    if (activeTab === 'my') {
      setZipCodeInput('')
      setZipCodeFilter('')
    }
  }, [activeTab])

  const { data: rounds, isLoading } = useQuery<Round[]>({
    queryKey: ['rounds', activeTab, zipCodeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab === 'my') {
        params.set('myMatches', 'true')
      } else if (zipCodeFilter) {
        params.set('zipCode', zipCodeFilter)
      }

      const response = await fetch(`/api/matches?${params}`)
      if (!response.ok) throw new Error('Failed to fetch rounds')
      return response.json()
    },
    enabled: !!session,
    staleTime: 2000, // 2 seconds for faster matches updates
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 4000, // Auto-refresh every 4 seconds
    refetchIntervalInBackground: false // Don't refetch when tab is not active
  })

  const joinRound = useMutation({
    mutationFn: async (matchId: string) => {
      const response = await fetch(`/api/matches/${matchId}/join`, {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join match')
      }
      return response.json()
    },
    onSuccess: () => {
      // Immediately invalidate all match-related queries for instant updates
      invalidateMatchQueries(queryClient)
      // Also trigger a fresh fetch of the current data
      queryClient.refetchQueries({ queryKey: ['rounds', activeTab, zipCodeFilter] })
    }
  })

  const leaveRound = useMutation({
    mutationFn: async (matchId: string) => {
      const response = await fetch(`/api/matches/${matchId}/leave`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to leave match')
      }
      return response.json()
    },
    onSuccess: () => {
      // Immediately invalidate all match-related queries for instant updates
      invalidateMatchQueries(queryClient)
      // Also trigger a fresh fetch of the current data
      queryClient.refetchQueries({ queryKey: ['rounds', activeTab, zipCodeFilter] })
    }
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isUserInRound = (match: Round) => {
    return match.players.some(p => p.player.id === session?.user?.id) || 
           match.creatorId === session?.user?.id
  }

  const canRequestJoin = (match: Round) => {
    return !match.userStatus && 
           match._count.players < match.maxPlayers &&
           new Date(match.date) > new Date() &&
           match.creatorId !== session?.user?.id
  }

  const canLeaveRound = (match: Round) => {
    return match.userStatus === 'accepted' &&
           match.creatorId !== session?.user?.id
  }

  const handleZipCodeSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The query will automatically refetch due to the dependency on zipCodeFilter
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading rounds...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: `url('${BACKGROUND_IMAGES.golf_public_background}')`,
          zIndex: -1
        }}
      ></div>
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between overflow-visible">
          <div className="flex items-center">
            <img 
              src={LOGO_IMAGES.foresum_logo} 
              alt="ForeSum Logo" 
              className="h-[150px] w-[150px] object-contain"
            />
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/matches/create">Create Round</Link>
            </Button>
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="border-green-200 hover:bg-green-50"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Filter Rounds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex space-x-2">
                    <Button
                      variant={activeTab === 'public' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('public')}
                      size="sm"
                      className="flex-1"
                    >
                      Public
                    </Button>
                    <Button
                      variant={activeTab === 'my' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('my')}
                      size="sm"
                      className="flex-1"
                    >
                      My Rounds
                    </Button>
                  </div>
                </div>

                {activeTab === 'public' && (
                  <form onSubmit={handleZipCodeSearch}>
                    <Label htmlFor="zipCode">Search by Zip Code</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="zipCode"
                        value={zipCodeInput}
                        onChange={(e) => setZipCodeInput(e.target.value)}
                        placeholder="e.g., 90210"
                      />
                      <Button type="submit" size="sm">
                        Search
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-green-100 mb-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-2xl font-bold text-green-800">
                  {activeTab === 'public' ? 'Available Rounds' : 'My Rounds'}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {activeTab === 'public' 
                    ? 'Find and join golf rounds in your area'
                    : 'Rounds you\'ve created or joined'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {rounds && rounds.length > 0 ? (
                  <div className="grid gap-6">
                    {rounds.map((match) => (
                      <EnhancedRoundCard
                        key={match.id}
                        match={match}
                        currentUserId={session?.user?.id}
                        roundType={activeTab}
                        size="lg"
                        onCardClick={() => router.push(`/matches/${match.id}`)}
                        onJoinClick={() => joinRound.mutate(match.id)}
                        onLeaveClick={() => leaveRound.mutate(match.id)}
                        onManageClick={() => router.push(`/matches/${match.id}/manage`)}
                        isLoading={joinRound.isPending || leaveRound.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FontAwesomeIcon icon={faUsers} className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No rounds found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeTab === 'public'
                        ? 'No public rounds available. Be the first to create one!'
                        : 'You haven\'t created or joined any rounds yet.'
                      }
                    </p>
                    <Button asChild>
                      <Link href="/matches/create">Create Your First Round</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoundesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoundesPageContent />
    </Suspense>
  )
}