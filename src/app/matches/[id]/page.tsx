'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { Chat } from '@/components/ui/chat'
import { ChatNotification } from '@/components/ui/chat-notification'
import { SocketProvider } from '@/contexts/socket-context'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, 
  faLocationDot, 
  faUsers, 
  faUser,
  faGlobe,
  faLock,
  faClock,
  faEdit,
  faUserPlus,
  faUserMinus,
  faCheck,
  faTimes,
  faStar,
  faFlag,
  faBan,
  faComments
} from '@fortawesome/free-solid-svg-icons'

interface PendingRequest {
  id: string
  status: string
  player: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
}

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
  status: 'scheduled' | 'completed' | 'cancelled'
  creatorId: string
  creator: {
    id: string
    name: string | null
    email: string
    handicap: number | null
  }
  players: Array<{
    player: {
      id: string
      name: string | null
      email: string
      handicap: number | null
    }
  }>
  _count: {
    players: number
  }
  pendingRequests?: PendingRequest[]
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  isCreator?: boolean
}

interface Rating {
  playerId: string
  value: number
  comment?: string
}

export default function RoundDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const roundId = params.id as string
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [submittingRatings, setSubmittingRatings] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const { data: round, isLoading, error } = useQuery<Round>({
    queryKey: ['round', roundId],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${roundId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch round details')
      }
      const data = await response.json()
      console.log('Round data:', data)
      return data
    },
    enabled: !!roundId
  })

  const joinRound = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/matches/${roundId}/join`, {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to join round')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', roundId] })
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
    }
  })

  const leaveRound = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/matches/${roundId}/leave`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to leave round')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['round', roundId] })
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
    }
  })

  const handleRequest = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' }) => {
      try {
        const response = await fetch(`/api/matches/${roundId}/requests/${requestId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(errorData.message || `Failed to ${action} request`)
        }
        
        return await response.json()
      } catch (error) {
        console.error(`Error ${action}ing request:`, error)
        throw error
      }
    },
    onSuccess: (data, variables) => {
      console.log(`Successfully ${variables.action}ed request`, data)
      queryClient.invalidateQueries({ queryKey: ['round', roundId] })
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
    },
    onError: (error) => {
      console.error('Request handling error:', error)
    }
  })

  const updateMatchStatus = useMutation({
    mutationFn: async (status: 'completed' | 'cancelled') => {
      const response = await fetch(`/api/matches/${roundId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `Failed to mark match as ${status}`)
      }
      return response.json()
    },
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ['round', roundId] })
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      queryClient.invalidateQueries({ queryKey: ['recent-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['public-rounds'] })
      queryClient.invalidateQueries({ queryKey: ['nearby-rounds'] })
      if (status === 'completed') {
        // Initialize ratings for all participants
        initializeRatings()
        setShowRatingModal(true)
      }
    }
  })

  const submitRatings = useMutation({
    mutationFn: async (ratingsData: Rating[]) => {
      const response = await fetch(`/api/matches/${roundId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: ratingsData })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit ratings')
      }
      return response.json()
    },
    onSuccess: () => {
      setShowRatingModal(false)
      setRatings([])
      queryClient.invalidateQueries({ queryKey: ['round', roundId] })
    }
  })

  // Initialize ratings for all participants
  const initializeRatings = () => {
    if (!round) return
    
    const participants = []
    
    // Add creator if not the current user
    if (round.creatorId !== session?.user?.id) {
      participants.push({
        playerId: round.creatorId,
        value: 5,
        comment: ''
      })
    }
    
    // Add accepted players if not the current user
    round.players.forEach(p => {
      if (p.player.id !== session?.user?.id) {
        participants.push({
          playerId: p.player.id,
          value: 5,
          comment: ''
        })
      }
    })
    
    setRatings(participants)
  }

  // Check if there are any players to rate
  const hasPlayersToRate = () => {
    if (!round) return false
    
    // Check if creator is different from current user
    const canRateCreator = round.creatorId !== session?.user?.id
    
    // Check if there are accepted players different from current user
    const canRatePlayers = round.players.some(p => p.player.id !== session?.user?.id)
    
    return canRateCreator || canRatePlayers
  }

  const updateRating = (playerId: string, field: 'value' | 'comment', value: number | string) => {
    setRatings(prev => prev.map(rating => 
      rating.playerId === playerId 
        ? { ...rating, [field]: value }
        : rating
    ))
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-lg">Loading round details...</div>
      </div>
    )
  }

  if (error || !round) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Failed to load round details</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const isCreator = session?.user?.id === round?.creatorId
  const isParticipant = round?.players?.some(p => p?.player?.id === session?.user?.id) ?? false
  const isFull = (round?.players?.length ?? 0) + 1 >= (round?.maxPlayers ?? 0) // +1 for creator
  const userStatus = round?.userStatus
  const hasPendingRequest = userStatus === 'pending'
  const isAccepted = userStatus === 'accepted'
  
  const currentStatus = round?.status || 'scheduled' // Default to scheduled if null
  const isScheduled = currentStatus === 'scheduled'
  const isCompleted = currentStatus === 'completed'
  const isCancelled = currentStatus === 'cancelled'
  
  // User can join if:
  // - Not the creator
  // - No existing relationship to the match (not accepted, not pending)  
  // - Match is not full
  // - Match is scheduled (not completed or cancelled)
  const canJoin = !isCreator && !userStatus && !isFull && isScheduled
  const isMatchInPast = round ? new Date(round.date) < new Date() : false
  const canAccessChat = isCreator || isAccepted

  return (
    <SocketProvider>
      <div className="min-h-screen relative">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-fixed bg-no-repeat"
          style={{ backgroundImage: `url('${BACKGROUND_IMAGES.clubs_back}')` }}
        ></div>
        <div className="absolute inset-0 bg-white bg-opacity-40"></div>
      </div>
      
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 h-20">
        <div className="container mx-auto px-4 h-full flex items-center justify-between overflow-visible">
          <div className="flex items-center">
            <img 
              src={LOGO_IMAGES.foresum_logo} 
              alt="Foresum Logo" 
              className="w-[150px] h-[150px] object-contain"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="border-green-300 text-green-700 hover:bg-green-50 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6 min-w-0 overflow-hidden">
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GolfCourseAvatar 
                      courseName={round?.course || ''} 
                      size="md"
                      roundType={round?.isPublic ? 'public' : 'private'}
                    />
                    <CardTitle className="text-2xl text-gray-800">{round?.title || 'Loading...'}</CardTitle>
                  </div>
                  {isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/matches/${roundId}/manage`)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <FontAwesomeIcon icon={faEdit} className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Round Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg mt-1">
                        <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{round.course}</p>
                        <p className="text-sm text-gray-600">{round.address}</p>
                        <p className="text-sm text-gray-500">Zip: {round.zipCode}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg mt-1">
                        <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{formatDate(round.date)}</p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
                          {formatTime(round.time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{round.players.length + 1}/{round.maxPlayers} Players</p>
                        <p className="text-sm text-gray-600">{isFull ? 'Round is full' : `${round.maxPlayers - round.players.length - 1} spots available`}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <FontAwesomeIcon icon={round.isPublic ? faGlobe : faLock} className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{round.isPublic ? 'Public Course' : 'Private Course'}</p>
                        <p className="text-sm text-gray-600">Requires creator approval</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isCompleted ? 'bg-green-100' : 
                        isCancelled ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {isCompleted ? (
                          <FontAwesomeIcon icon={faFlag} className="h-5 w-5 text-green-600" />
                        ) : isCancelled ? (
                          <FontAwesomeIcon icon={faBan} className="h-5 w-5 text-red-600" />
                        ) : (
                          <img src={LOGO_IMAGES.myrounds_icon} alt="Status" className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          isCompleted ? 'text-green-800' : 
                          isCancelled ? 'text-red-800' : 'text-gray-800'
                        }`}>
                          {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {isCompleted ? 'Match has been played' : 
                           isCancelled ? 'Match was cancelled' : 'Ready to play'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {round.description && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{round.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-3">
                  {canJoin && (
                    <Button
                      onClick={() => joinRound.mutate()}
                      disabled={joinRound.isPending}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4 mr-2" />
                      {joinRound.isPending 
                        ? 'Requesting...'
                        : 'Request to Join'
                      }
                    </Button>
                  )}

                  {hasPendingRequest && (
                    <div className="flex items-center gap-3">
                      <Button
                        disabled
                        variant="outline"
                        className="border-orange-300 text-orange-700 bg-orange-50 cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faClock} className="h-4 w-4 mr-2" />
                        Request Sent
                      </Button>
                      <div className="px-3 py-1 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-medium rounded-full shadow-md animate-pulse">
                        Awaiting Creator Approval
                      </div>
                    </div>
                  )}
                  
                  {(isAccepted || hasPendingRequest) && !isCreator && (
                    <Button
                      onClick={() => leaveRound.mutate()}
                      disabled={leaveRound.isPending}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <FontAwesomeIcon icon={faUserMinus} className="h-4 w-4 mr-2" />
                      {leaveRound.isPending ? 'Leaving...' : (hasPendingRequest ? 'Cancel Request' : 'Leave Round')}
                    </Button>
                  )}

                  {/* Match Status Actions (Creator Only) */}
                  {isCreator && isScheduled && (
                    <>
                      <Button
                        onClick={() => updateMatchStatus.mutate('completed')}
                        disabled={updateMatchStatus.isPending}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                      >
                        <FontAwesomeIcon icon={faFlag} className="h-4 w-4 mr-2" />
                        {updateMatchStatus.isPending ? 'Completing...' : 'Mark as Completed'}
                      </Button>
                      <Button
                        onClick={() => updateMatchStatus.mutate('cancelled')}
                        disabled={updateMatchStatus.isPending}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faBan} className="h-4 w-4 mr-2" />
                        {updateMatchStatus.isPending ? 'Cancelling...' : 'Cancel Round'}
                      </Button>
                    </>
                  )}

                  {/* Rate Players Button (For completed rounds) */}
                  {isCompleted && (isCreator || isParticipant) && hasPlayersToRate() && (
                    <Button
                      onClick={() => {
                        initializeRatings()
                        setShowRatingModal(true)
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <FontAwesomeIcon icon={faStar} className="h-4 w-4 mr-2" />
                      Rate Players
                    </Button>
                  )}

                  {/* No players to rate message */}
                  {isCompleted && (isCreator || isParticipant) && !hasPlayersToRate() && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <FontAwesomeIcon icon={faStar} className="h-4 w-4" />
                      <span className="text-sm">No other players to rate in this match</span>
                    </div>
                  )}

                  {/* Chat Button */}
                  {canAccessChat && (
                    <Button
                      onClick={() => setShowChat(!showChat)}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faComments} className="h-4 w-4 mr-2" />
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </Button>
                  )}
                </div>
                
                {(joinRound.error || leaveRound.error || handleRequest.error) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      {joinRound.error?.message || leaveRound.error?.message || handleRequest.error?.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Requests (Only visible to creator) */}
            {isCreator && round?.pendingRequests && round.pendingRequests.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-b border-yellow-200">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-gray-800">Pending Requests ({round.pendingRequests.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {round.pendingRequests.filter(request => request?.id && request?.player).map((request) => (
                      <div key={request.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-white text-lg">
                                {(request.player?.name || request.player?.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">{request.player?.name || request.player?.email || 'Unknown Player'}</p>
                              {request.player?.handicap && (
                                <p className="text-sm text-gray-600">Handicap: {request.player.handicap}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => handleRequest.mutate({ requestId: request.id, action: 'accept' })}
                              disabled={handleRequest.isPending || (round?.players?.length ?? 0) + 1 >= (round?.maxPlayers ?? 0)}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                            >
                              <FontAwesomeIcon icon={faCheck} className="h-4 w-4 mr-2" />
                              {handleRequest.isPending ? 'Accepting...' : 'Accept'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleRequest.mutate({ requestId: request.id, action: 'decline' })}
                              disabled={handleRequest.isPending}
                              className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-2"
                            >
                              <FontAwesomeIcon icon={faTimes} className="h-4 w-4 mr-2" />
                              {handleRequest.isPending ? 'Declining...' : 'Decline'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Sidebar - Players always visible, Chat when toggled */}
          <div className="lg:col-span-2 space-y-6">
            {/* Players Section - In right sidebar */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b border-green-200">
                <CardTitle className="flex items-center space-x-2">
                  <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-green-600" />
                  <span className="text-gray-800">Players ({(round?.players?.length ?? 0) + 1})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Creator */}
                  {round?.creator && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">{round.creator.name || round.creator.email}</p>
                        <p className="text-xs text-green-700 font-medium">Round Creator</p>
                      </div>
                    </div>
                  )}

                  {/* Players */}
                  {round?.players?.filter(playerData => playerData?.player?.id).map((playerData, index) => (
                    <div key={playerData.player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <span className="font-medium text-white text-sm">
                          {(playerData.player?.name || playerData.player?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{playerData.player?.name || playerData.player?.email || 'Unknown Player'}</p>
                        {playerData.player?.handicap && (
                          <p className="text-xs text-gray-600">Handicap: {playerData.player.handicap}</p>
                        )}
                      </div>
                    </div>
                  )) ?? []}

                  {/* Empty slots */}
                  {Array.from({ length: Math.max(0, (round?.maxPlayers ?? 0) - (round?.players?.length ?? 0) - 1) }).map((_, index) => (
                    <div key={`empty-${index}`} className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-500 font-medium">Open Spot</p>
                        <p className="text-xs text-gray-400">Waiting for player</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Section - Below players in right sidebar */}
            {showChat && canAccessChat && (
              <div className="w-full min-w-0 overflow-hidden">
                <Chat matchId={roundId} matchTitle={round?.title} />
              </div>
            )}
          </div>
        </div>

        {/* Chat Notification */}
        {canAccessChat && !showChat && (
          <ChatNotification 
            matchId={roundId}
            onOpenChat={() => setShowChat(true)}
          />
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Rate Your Fellow Players</h3>
                <p className="text-gray-600">Share your experience playing with these golfers (1-5 stars)</p>
              </div>
              
              <div className="p-6 space-y-6">
                {ratings.length === 0 ? (
                  <div className="text-center py-8">
                    <FontAwesomeIcon icon={faStar} className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 text-lg">No other players to rate</p>
                    <p className="text-gray-500 text-sm mt-2">This match doesn't have any other participants.</p>
                  </div>
                ) : (
                  ratings.map((rating) => {
                    const player = round?.creatorId === rating.playerId 
                      ? round.creator 
                      : round?.players.find(p => p.player.id === rating.playerId)?.player
                    
                    if (!player) return null
                    
                    return (
                      <div key={rating.playerId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-white text-lg">
                              {(player.name || player.email)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{player.name || player.email}</p>
                            {player.handicap && (
                              <p className="text-sm text-gray-600">Handicap: {player.handicap}</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Star Rating */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => updateRating(rating.playerId, 'value', star)}
                                className={`text-2xl transition-colors ${
                                  star <= rating.value 
                                    ? 'text-yellow-400 hover:text-yellow-500' 
                                    : 'text-gray-300 hover:text-gray-400'
                                }`}
                              >
                                <FontAwesomeIcon icon={faStar} />
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Comment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
                          <textarea
                            value={rating.comment}
                            onChange={(e) => updateRating(rating.playerId, 'comment', e.target.value)}
                            placeholder="Share your thoughts about playing with this golfer..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRatingModal(false)}
                  disabled={submittingRatings}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setSubmittingRatings(true)
                    submitRatings.mutate(ratings)
                  }}
                  disabled={submittingRatings || ratings.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingRatings ? 'Submitting...' : 'Submit Ratings'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </SocketProvider>
  )
}