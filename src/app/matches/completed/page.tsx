'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faStar, faHistory, faArrowLeft, faFlag } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { LOGO_IMAGES } from '@/lib/images'

interface CompletedMatch {
  id: string
  title: string
  course: string
  address: string
  date: string
  time: string
  status: string
  maxPlayers: number
  creator: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
  players: Array<{
    id: string
    status: string
    player: {
      id: string
      name: string | null
      email: string
      handicap: number | null
    }
  }>
  _count: { players: number }
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  pendingRequestsCount?: number
}

export default function CompletedMatchesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'my-matches'>('all')

  const { data: completedMatches, isLoading, error } = useQuery<CompletedMatch[]>({
    queryKey: ['completed-matches', filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        showCompleted: 'true',
        ...(filter === 'my-matches' && { myMatches: 'true' })
      })
      
      const response = await fetch(`/api/matches?${params}`)
      if (!response.ok) throw new Error('Failed to fetch completed matches')
      return response.json()
    },
    enabled: !!session,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isUserParticipant = (match: CompletedMatch) => {
    if (!session?.user?.id) return false
    return match.creator.id === session.user.id || 
           match.players.some(p => p.player.id === session.user.id && p.status === 'accepted')
  }

  const filteredMatches = completedMatches?.filter(match => {
    // Filter out future matches and non-completed matches
    const matchDate = new Date(match.date)
    const isCompleted = match.status === 'completed'
    const isPast = matchDate < new Date()
    
    return isCompleted || isPast
  }) || []

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view completed matches</h1>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url('/images/golf_back_profile.jpeg')` }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10">
        <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="text-gray-700 hover:text-gray-900"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} className="h-5 w-5 text-green-600" />
                Completed Matches
              </h1>
              
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          {/* Filter Buttons */}
          <div className="mb-6 flex gap-3">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              className={filter === 'all' 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : 'bg-white/80 hover:bg-white/90'
              }
            >
              All Completed
            </Button>
            <Button
              onClick={() => setFilter('my-matches')}
              variant={filter === 'my-matches' ? 'default' : 'outline'}
              className={filter === 'my-matches' 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : 'bg-white/80 hover:bg-white/90'
              }
            >
              My Matches
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-white">Loading completed matches...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="py-8 text-center">
                <p className="text-red-600">Failed to load completed matches. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredMatches.length === 0 && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
              <CardContent className="py-12 text-center">
                <FontAwesomeIcon icon={faHistory} className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Completed Matches</h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'my-matches' 
                    ? "You haven't completed any matches yet." 
                    : "No completed matches found."
                  }
                </p>
                <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                  <Link href="/matches/create">Create Your First Match</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Matches Grid */}
          {!isLoading && !error && filteredMatches.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => (
                <Card key={match.id} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <GolfCourseAvatar 
                          courseName={match.course} 
                          size="md"
                          roundType="completed"
                        />
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                            {match.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FontAwesomeIcon icon={faFlag} className="h-3 w-3 text-green-600" />
                            <span className="capitalize">{match.status || 'completed'}</span>
                          </div>
                        </div>
                      </div>
                      {isUserParticipant(match) && (
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Participant
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{match.course}</p>
                        <p className="text-gray-600">{match.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className="h-4 w-4" />
                      <div>
                        <p className="font-medium">{formatDate(match.date)}</p>
                        <p className="text-gray-600">{formatTime(match.time)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-green-600" />
                      <span>
                        {match._count.players + 1} / {match.maxPlayers} players
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">Created by</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-white text-sm">
                            {(match.creator.name || match.creator.email)?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {match.creator.name || match.creator.email}
                          </p>
                          {match.creator.handicap && (
                            <p className="text-xs text-gray-600">Handicap: {match.creator.handicap}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      <Link href={`/matches/${match.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}