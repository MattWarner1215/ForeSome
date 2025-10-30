'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faClock, faArrowLeft, faSearch, faBars, faTimes, faRightFromBracket, faFlag, faUserCircle, faUsersRectangle, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import EnhancedRoundCard from '@/components/ui/enhanced-round-card'
import { NotificationBell } from '@/components/ui/notification-bell'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'
import { invalidateMatchQueries } from '@/lib/query-invalidation'
import { GoogleMapsCard } from '@/components/ui/google-maps'

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

  // Initialize activeTab with a stable default to prevent hydration mismatch
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')
  const [zipCodeInput, setZipCodeInput] = useState('')
  const [zipCodeFilter, setZipCodeFilter] = useState('')

  // Dashboard header state
  const [zipCodeSearch, setZipCodeSearch] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null)

  // Set activeTab based on URL parameters after hydration
  useEffect(() => {
    const privateParam = searchParams.get('private')
    if (privateParam === 'true') {
      setActiveTab('private')
    }
  }, [searchParams])

  // Debounce zip code input to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setZipCodeFilter(zipCodeInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [zipCodeInput])

  // Clear zip code filter when switching to 'private' tab
  useEffect(() => {
    if (activeTab === 'private') {
      setZipCodeInput('')
      setZipCodeFilter('')
    }
  }, [activeTab])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMenuOpen &&
          menuRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          hamburgerButtonRef.current &&
          !hamburgerButtonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isMenuOpen])

  const { data: rounds, isLoading } = useQuery<Round[]>({
    queryKey: ['rounds', activeTab, zipCodeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeTab === 'private') {
        params.set('private', 'true')
      } else if (zipCodeFilter) {
        params.set('zipCode', zipCodeFilter)
      }
      if (activeTab === 'public') {
        params.set('public', 'true')
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

  // Query for rounds with location data (only for public rounds)
  const { data: roundsWithLocations } = useQuery({
    queryKey: ['rounds-locations', zipCodeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (zipCodeFilter) {
        params.set('zipCode', zipCodeFilter)
      }
      const response = await fetch(`/api/rounds/locations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch round locations')
      const data = await response.json()
      console.log('[ROUNDS PAGE] Received rounds with locations:', data)
      return data
    },
    enabled: !!session && activeTab === 'public', // Only fetch for public rounds
    staleTime: 0, // Always fresh for debugging
    gcTime: 0, // No cache for debugging
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
    onMutate: async (matchId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['rounds', activeTab, zipCodeFilter] })

      // Snapshot the previous value for rollback
      const previousRounds = queryClient.getQueryData<Round[]>(['rounds', activeTab, zipCodeFilter])

      // Optimistically update the round to show pending status
      if (previousRounds && session?.user?.id) {
        const updatedRounds = previousRounds.map(round =>
          round.id === matchId
            ? { ...round, userStatus: 'pending' as const }
            : round
        )
        queryClient.setQueryData(['rounds', activeTab, zipCodeFilter], updatedRounds)
      }

      return { previousRounds }
    },
    onError: (err, matchId, context) => {
      // Rollback on error
      if (context?.previousRounds) {
        queryClient.setQueryData(['rounds', activeTab, zipCodeFilter], context.previousRounds)
      }
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
    onMutate: async (matchId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['rounds', activeTab, zipCodeFilter] })

      // Snapshot the previous value for rollback
      const previousRounds = queryClient.getQueryData<Round[]>(['rounds', activeTab, zipCodeFilter])

      // Optimistically update the round to show user is no longer in it
      if (previousRounds && session?.user?.id) {
        const updatedRounds = previousRounds.map(round =>
          round.id === matchId
            ? {
                ...round,
                userStatus: null,
                _count: { players: Math.max(0, round._count.players - 1) }
              }
            : round
        )
        queryClient.setQueryData(['rounds', activeTab, zipCodeFilter], updatedRounds)
      }

      return { previousRounds }
    },
    onError: (err, matchId, context) => {
      // Rollback on error
      if (context?.previousRounds) {
        queryClient.setQueryData(['rounds', activeTab, zipCodeFilter], context.previousRounds)
      }
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
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50 min-h-16 md:h-20 relative">
        <div className="container mx-auto px-2 sm:px-4 h-full flex flex-col md:flex-row items-center justify-between py-2 md:py-0 gap-2 md:gap-0 overflow-hidden min-w-0">
          {/* Left Section - Logo + Search */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 w-full md:w-auto md:flex-shrink-0 min-w-0">
            <img
              src={LOGO_IMAGES.foresum_logo}
              alt="ForeSum Logo"
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[150px] lg:w-[150px] object-contain flex-shrink-0"
            />
            {/* Search functionality */}
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto min-w-0">
              <span className="text-xs sm:text-sm text-gray-700 font-medium hidden xl:block flex-shrink-0">Search for Rounds:</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto min-w-0">
                <Input
                  placeholder="Enter zip code"
                  value={zipCodeSearch}
                  onChange={(e) => setZipCodeSearch(e.target.value)}
                  className="w-full sm:w-48 md:w-52 lg:w-60 xl:w-80 h-8 text-sm border-green-200 focus:border-green-500 focus:ring-green-500 min-w-0"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore="true"
                  data-dashlane-ignore="true"
                  data-form-type="other"
                  data-cy="zip-search"
                  role="searchbox"
                  type="search"
                />
                <Button asChild size="sm" className="h-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex-shrink-0">
                  <Link href={`/rounds${zipCodeSearch ? `?zipCode=${zipCodeSearch}` : ''}`}>
                    <FontAwesomeIcon icon={faSearch} className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Center Section - Welcome Message */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4 lg:mx-8 min-w-0">
            <div className="px-3 py-1.5 lg:px-4 lg:py-2 bg-green-50/80 rounded-lg border border-green-200/50 max-w-full">
              <span className="text-sm lg:text-base text-green-800 font-semibold truncate block">
                Welcome, {session?.user?.name || session?.user?.email}!
              </span>
            </div>
          </div>

          {/* Mobile Welcome Message */}
          <div className="flex lg:hidden items-center justify-center w-full md:hidden min-w-0">
            <div className="px-2 py-1 bg-green-50/80 rounded-lg border border-green-200/50 max-w-full">
              <span className="text-xs text-green-800 font-semibold truncate block">
                Welcome, {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0]}!
              </span>
            </div>
          </div>

          {/* Right Section - Create Round + My Dashboard + Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto md:flex-shrink-0 justify-end min-w-0">
              <Button asChild size="sm" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-xs sm:text-sm">
                <Link href="/matches/create">
                  <span className="hidden sm:inline">Create Round</span>
                  <span className="sm:hidden">Create</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs sm:text-sm">
                <Link href="/dashboard">
                  <span className="hidden sm:inline">My Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              </Button>
              <NotificationBell />
              <div className="relative z-[60]">
                <Button
                  ref={hamburgerButtonRef}
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMenuOpen(prev => !prev);
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 relative z-[61]"
                  type="button"
                >
                  <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown - Outside nav to avoid overflow clipping */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed top-16 right-4 bg-white/98 backdrop-blur-xl shadow-2xl border border-gray-200/20 rounded-3xl py-2 min-w-[220px] z-[9999] overflow-hidden"
        >
            {/* Modern arrow pointer */}
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white/98 backdrop-blur-xl rotate-45 border-l border-t border-gray-200/20"></div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-bold text-white text-sm">
                    {(session?.user?.name || session?.user?.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/dashboard');
                  }}
                  className="group flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50/80 hover:to-emerald-50/80 hover:text-green-800 transition-all duration-300 ease-out cursor-pointer w-full text-left rounded-xl mb-1 border border-gray-200/60 hover:border-green-300/60"
                  type="button"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <FontAwesomeIcon icon={faFlag} className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                  </div>
                  <span className="font-medium">Dashboard</span>
                </button>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="group flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-blue-50/80 hover:text-blue-800 transition-all duration-300 ease-out cursor-pointer w-full text-left rounded-xl mb-1 border border-gray-200/60 hover:border-blue-300/60"
                  type="button"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <FontAwesomeIcon icon={faUserCircle} className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                  </div>
                  <span className="font-medium">Profile Settings</span>
                </button>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/groups');
                  }}
                  className="group flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-purple-50/80 hover:text-purple-800 transition-all duration-300 ease-out cursor-pointer w-full text-left rounded-xl mb-1 border border-gray-200/60 hover:border-purple-300/60"
                  type="button"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <FontAwesomeIcon icon={faUsersRectangle} className="h-4 w-4 text-purple-600 group-hover:text-purple-700" />
                  </div>
                  <span className="font-medium">My Groups</span>
                </button>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/matches/completed');
                  }}
                  className="group flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-orange-50/80 hover:text-orange-800 transition-all duration-300 ease-out cursor-pointer w-full text-left rounded-xl mb-1 border border-gray-200/60 hover:border-orange-300/60"
                  type="button"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <FontAwesomeIcon icon={faClockRotateLeft} className="h-4 w-4 text-orange-600 group-hover:text-orange-700" />
                  </div>
                  <span className="font-medium">Match History</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100/80"></div>

            {/* Sign Out */}
            <div className="py-1">
              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="group flex items-center space-x-3 w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50/80 hover:to-red-50/80 hover:text-red-700 transition-all duration-300 ease-out cursor-pointer rounded-xl border border-gray-200/60 hover:border-red-300/60"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-red-50 to-red-100 group-hover:from-red-100 group-hover:to-red-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-md">
                    <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4 text-red-600 group-hover:text-red-700" />
                  </div>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-8">
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
                      variant={activeTab === 'private' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('private')}
                      size="sm"
                      className="flex-1"
                    >
                      Private
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

            {/* Google Maps Card - Show under Filter Rounds card for public rounds with locations  */}
            {activeTab === 'public' && roundsWithLocations && roundsWithLocations.length > 0 && (
              <GoogleMapsCard rounds={roundsWithLocations} />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-green-100 mb-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-2xl font-bold text-green-800">
                  {activeTab === 'public' ? 'Public Rounds' : 'Private Rounds'}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {activeTab === 'public'
                    ? 'Find and join public golf rounds in your area'
                    : 'Private rounds from your group members'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {rounds && rounds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rounds.map((match) => (
                      <EnhancedRoundCard
                        key={match.id}
                        match={match}
                        currentUserId={session?.user?.id}
                        roundType={activeTab}
                        size="sm"
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
                        : 'No private rounds from your group members. Join groups to see private rounds!'
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