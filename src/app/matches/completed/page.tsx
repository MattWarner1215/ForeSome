'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faStar, faHistory, faArrowLeft, faFlag } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { LOGO_IMAGES, BACKGROUND_IMAGES } from '@/lib/images'

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
    // Only show completed matches (not cancelled or other statuses)
    return match.status === 'completed'
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
            <Button asChild className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
              <Link href="/matches/create">Create Round</Link>
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-800 flex items-center justify-center gap-3">
                <FontAwesomeIcon icon={faHistory} className="h-6 w-6 text-green-600" />
                Completed Matches
              </CardTitle>
              <CardDescription className="text-gray-600">
                View your golf round history and past achievements
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-3">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all'
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              : 'bg-white/90 hover:bg-white border-green-200 hover:bg-green-50'
            }
          >
            All Completed
          </Button>
          <Button
            onClick={() => setFilter('my-matches')}
            variant={filter === 'my-matches' ? 'default' : 'outline'}
            className={filter === 'my-matches'
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              : 'bg-white/90 hover:bg-white border-green-200 hover:bg-green-50'
            }
          >
            My Matches
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-700 font-medium">Loading completed matches...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="text-red-500 mb-4">
                <FontAwesomeIcon icon={faHistory} className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Matches</h3>
              <p className="text-red-600 mb-6">Failed to load completed matches. Please try again.</p>
              <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredMatches.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="text-gray-300 mb-6">
                <FontAwesomeIcon icon={faHistory} className="h-16 w-16" />
              </div>
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
              <Card key={match.id} className="bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 rounded-2xl overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-green-50/30 to-green-50/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <GolfCourseAvatar
                        courseName={match.course}
                        size="md"
                        roundType="completed"
                        className="shadow-md"
                      />
                      <div>
                        <CardTitle className="text-lg font-bold text-green-800 mb-1 hover:text-green-900 transition-colors">
                          {match.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FontAwesomeIcon icon={faFlag} className="h-3 w-3 text-green-600" />
                          <span className="capitalize bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                            {match.status || 'completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isUserParticipant(match) && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        Participant
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/30">
                      <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{match.course}</p>
                        <p className="text-gray-600 text-sm truncate">{match.address}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/30">
                      <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(match.date)}</p>
                        <p className="text-gray-600 text-sm">{formatTime(match.time)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/30">
                      <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900">
                        {match._count.players + 1} / {match.maxPlayers} players
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Created by</p>
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/30">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="font-bold text-white text-sm">
                          {(match.creator.name || match.creator.email)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {match.creator.name || match.creator.email}
                        </p>
                        {match.creator.handicap && (
                          <p className="text-xs text-gray-600">Handicap: {match.creator.handicap}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 mt-4">
                    <Link href={`/matches/${match.id}`} className="flex items-center justify-center gap-2">
                      <FontAwesomeIcon icon={faHistory} className="h-4 w-4" />
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
  )
}