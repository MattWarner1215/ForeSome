'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faStar, faSearch, faPlus, faUser, faGlobe, faLock, faChevronUp, faChevronDown, faBars, faTimes, faHistory, faArrowRight, faUserCircle, faUsersRectangle, faClockRotateLeft, faRightFromBracket, faEarth, faUserGroup, faHandshake, faCalendarCheck, faFlag } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import StatsLeaderboardToggle from '@/components/ui/stats-leaderboard-toggle'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import EnhancedRoundCard from '@/components/ui/enhanced-round-card'
import { GolfRoundsCalendar } from '@/components/ui/golf-rounds-calendar'
import { NotificationBell } from '@/components/ui/notification-bell'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'
import { prefetchCommonQueries } from '@/lib/query-invalidation'

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

interface Group {
  id: string
  name: string
  icon: string | null
  creator: {
    id: string
    name: string
    email: string
  }
  _count: { members: number }
}

export default function HomePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession({
    required: false,
  })
  const [zipCodeSearch, setZipCodeSearch] = useState('')
  const [myRoundsCarouselIndex, setMyRoundsCarouselIndex] = useState(0)
  const [ownedGroupsIndex, setOwnedGroupsIndex] = useState(0)
  const [memberGroupsIndex, setMemberGroupsIndex] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [golfCarouselIndex, setGolfCarouselIndex] = useState(0)
  const [golfImage1Index, setGolfImage1Index] = useState(0)
  const [golfImage2Index, setGolfImage2Index] = useState(1)
  const [golfImage3Index, setGolfImage3Index] = useState(2)
  const [locationLoading, setLocationLoading] = useState(false)
  const [forceShowPage, setForceShowPage] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null)

  // Golf images and quotes
  const golfCarouselData = [
    {
      image: "/images/golf-course-bg.jpg",
      quote: "The more I work and practice, the luckier I seem to get.",
      author: "Gary Player"
    },
    {
      image: "/images/clubs_back.jpg",
      quote: "Resolve never to quit, never to give up, no matter what the situation",
      author: "Jack Nicklaus"
    },
    {
      image: "/images/golf_Back_groups.jpg",
      quote: "The road to success is always under construction.",
      author: "Arnold Palmer"
    },
    {
      image: "/images/golf_back_profile.jpeg",
      quote: "I have a tip that will take five strokes off anyone's golf game. It's called an eraser.",
      author: "Arnold Palmer"
    },
    {
      image: BACKGROUND_IMAGES.golf_public_background,
      quote: "The older I get, the better I used to be.",
      author: "Lee Trevino"
    },
    {
      image: "/images/golf-course-bg.jpg",
      quote: "Gambling is illegal at Bushwood sir, and I never slice.",
      author: "Judge Smails"
    },
    {
      image: "/images/clubs_back.jpg",
      quote: "Watching Phil Mickelson play golf is like watching a drunk chasing a balloon near the edge of a cliff.",
      author: "David Feherty"
    }
  ]

  const { data: recentRounds } = useQuery<Match[]>({
    queryKey: ['recent-rounds'],
    queryFn: async () => {
      const response = await fetch('/api/matches?myMatches=true')
      if (!response.ok) throw new Error('Failed to fetch rounds')
      const rounds = await response.json()
      return rounds
    },
    enabled: !!session,
    staleTime: 1000, // 1 second for immediate updates
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: false // Don't refetch when tab is not active
  })

  const { data: myGroups } = useQuery<Group[]>({
    queryKey: ['my-groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups')
      if (!response.ok) throw new Error('Failed to fetch groups')
      const groups = await response.json()

      // Ensure balanced representation for dashboard display
      const owned = groups.filter((g: Group) => g.creator.id === session?.user?.id)
      const member = groups.filter((g: Group) => g.creator.id !== session?.user?.id)

      // Strategy: Ensure both categories are represented when possible
      // Take up to 6 of each type to allow pagination while ensuring visibility
      const balancedGroups = [
        ...owned.slice(0, 6), // Allow more for pagination
        ...member.slice(0, 6)  // Allow more for pagination
      ]

      return balancedGroups
    },
    enabled: !!session,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  })

  const { data: nearbyRounds } = useQuery<Match[]>({
    queryKey: ['nearby-rounds', zipCodeSearch],
    queryFn: async () => {
      const params = zipCodeSearch ? `?zipCode=${zipCodeSearch}` : ''
      const response = await fetch(`/api/matches${params}`)
      if (!response.ok) throw new Error('Failed to fetch rounds')
      const rounds = await response.json()
      return rounds.slice(0, 3)
    },
    enabled: !!session && !!zipCodeSearch,
    staleTime: 5000, // 5 seconds for nearby rounds
    gcTime: 180000, // 3 minutes
    refetchOnWindowFocus: true, // Refresh when switching back to tab
    refetchInterval: 8000 // Auto-refresh every 8 seconds
  })


  // Calendar data - fetch more comprehensive match data
  const { data: calendarMatches } = useQuery<Match[]>({
    queryKey: ['calendar-matches'],
    queryFn: async () => {
      // Get matches for calendar (both my matches and public matches)
      const [myResponse, publicResponse] = await Promise.all([
        fetch('/api/matches?myMatches=true'),
        fetch('/api/matches?public=true')
      ])
      
      if (!myResponse.ok || !publicResponse.ok) {
        throw new Error('Failed to fetch calendar matches')
      }
      
      const [myMatches, publicMatches] = await Promise.all([
        myResponse.json(),
        publicResponse.json()
      ])
      
      // Combine and deduplicate matches
      const allMatches = [...myMatches, ...publicMatches]
      const uniqueMatches = allMatches.filter((round, index, self) =>
        index === self.findIndex(m => m.id === round.id)
      )
      
      return uniqueMatches
    },
    enabled: !!session,
    staleTime: 60000, // 1 minute 
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  })

  const formatDate = (dateString: string) => {
    if (!isMounted) return dateString // Return raw string on server
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    if (!isMounted) return time // Return raw time on server
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Carousel navigation functions - Updated for half-width grid (2 rows × 2 columns = 4 items)
  const itemsPerPage = 4
  const totalMyRounds = recentRounds?.length || 0
  const maxCarouselIndex = Math.max(0, totalMyRounds - itemsPerPage)

  const nextMyRounds = () => {
    setMyRoundsCarouselIndex(prev => Math.min(prev + 1, maxCarouselIndex))
  }

  const prevMyRounds = () => {
    setMyRoundsCarouselIndex(prev => Math.max(prev - 1, 0))
  }

  const visibleMyRounds = recentRounds?.slice(myRoundsCarouselIndex, myRoundsCarouselIndex + itemsPerPage) || []

  // Groups pagination logic
  const groupsPerPage = 2 // Show 2 groups per page to ensure both sections visible

  // Separate owned and member groups
  const ownedGroups = myGroups?.filter(group => group.creator.id === session?.user?.id) || []
  const memberGroups = myGroups?.filter(group => group.creator.id !== session?.user?.id) || []

  // Pagination controls for owned groups
  const totalOwnedGroups = ownedGroups.length
  const maxOwnedIndex = Math.max(0, totalOwnedGroups - groupsPerPage)

  const nextOwnedGroups = () => {
    setOwnedGroupsIndex(prev => Math.min(prev + 1, maxOwnedIndex))
  }

  const prevOwnedGroups = () => {
    setOwnedGroupsIndex(prev => Math.max(prev - 1, 0))
  }

  // Pagination controls for member groups
  const totalMemberGroups = memberGroups.length
  const maxMemberIndex = Math.max(0, totalMemberGroups - groupsPerPage)

  const nextMemberGroups = () => {
    setMemberGroupsIndex(prev => Math.min(prev + 1, maxMemberIndex))
  }

  const prevMemberGroups = () => {
    setMemberGroupsIndex(prev => Math.max(prev - 1, 0))
  }

  // Get visible groups for display
  const visibleOwnedGroups = ownedGroups.slice(ownedGroupsIndex, ownedGroupsIndex + groupsPerPage)
  const visibleMemberGroups = memberGroups.slice(memberGroupsIndex, memberGroupsIndex + groupsPerPage)

  // Get user's current location and set default zip code
  const getCurrentLocationZip = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.')
      return
    }

    setLocationLoading(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      
      // Use reverse geocoding to get zip code
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        const zipCode = data.postcode || data.postalCode
        if (zipCode && !zipCodeSearch) {
          setZipCodeSearch(zipCode)
        }
      }
    } catch (error) {
      console.log('Could not get location or zip code:', error)
    } finally {
      setLocationLoading(false)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerButtonRef.current &&
        !hamburgerButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      // Add a small delay to prevent immediate closing
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)

      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Auto-rotate golf carousel
  useEffect(() => {
    if (!isMounted) return

    const interval = setInterval(() => {
      setGolfCarouselIndex((current) =>
        current === golfCarouselData.length - 1 ? 0 : current + 1
      )
    }, 30000) // Change every 30 seconds

    return () => clearInterval(interval)
  }, [golfCarouselData.length, isMounted])

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Timeout to force show page if session loading takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setForceShowPage(true)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [status])

  // Prefetch common queries for faster navigation
  useEffect(() => {
    if (session?.user?.id) {
      prefetchCommonQueries(queryClient, session.user.id)
    }
  }, [session?.user?.id, queryClient])

  // Auto-rotate each golf image independently every 20 seconds with staggered timing
  useEffect(() => {
    if (!isMounted) return
    // Image 1 - starts immediately
    const interval1 = setInterval(() => {
      setGolfImage1Index((current) => 
        current === golfCarouselData.length - 1 ? 0 : current + 1
      )
    }, 20000) // Change every 20 seconds

    // Image 2 - starts after 6.67 seconds delay
    const timer2 = setTimeout(() => {
      const interval2 = setInterval(() => {
        setGolfImage2Index((current) => 
          current === golfCarouselData.length - 1 ? 0 : current + 1
        )
      }, 20000) // Change every 20 seconds
      
      return () => clearInterval(interval2)
    }, 6670)

    // Image 3 - starts after 13.33 seconds delay
    const timer3 = setTimeout(() => {
      const interval3 = setInterval(() => {
        setGolfImage3Index((current) => 
          current === golfCarouselData.length - 1 ? 0 : current + 1
        )
      }, 20000) // Change every 20 seconds
      
      return () => clearInterval(interval3)
    }, 13330)

    return () => {
      clearInterval(interval1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [golfCarouselData.length, isMounted])

  if (status === 'loading' && !forceShowPage && isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={LOGO_IMAGES.foresum_logo} 
              alt="ForeSum Logo" 
              className="h-[120px] w-[120px] object-contain animate-pulse"
            />
          </div>
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading your golf community...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show loading until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src={LOGO_IMAGES.foresum_logo}
              alt="ForeSum Logo"
              className="h-[120px] w-[120px] object-contain animate-pulse"
            />
          </div>
          <div className="flex items-center space-x-2 text-green-700">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading your golf community...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!session && (status !== 'loading' || forceShowPage)) {
    return (
      <div className="h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-green-50 flex items-center justify-center p-3 relative overflow-hidden">
        {/* Modern Golf Images Background Carousel */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <img
              src={golfCarouselData[isMounted ? golfCarouselIndex : 0].image}
              alt="Golf background"
              className="w-full h-full object-cover transition-all duration-2000 ease-out scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900/30 to-green-900/50"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-emerald-300/30 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-green-200/20 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
        </div>

        <div className="relative w-full max-w-6xl z-20 px-2 sm:px-4 h-full flex items-center">

          <Card className="w-full shadow-2xl border-0 bg-white/90 backdrop-blur-3xl rounded-2xl sm:rounded-3xl overflow-hidden ring-1 ring-white/20 max-h-[95vh] overflow-y-auto">
            <CardHeader className="text-center pb-3 sm:pb-4 bg-gradient-to-b from-white/60 to-transparent">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <img
                    src={LOGO_IMAGES.foresum_logo}
                    alt="ForeSum Logo"
                    className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Welcome to ForeSum
              </h1>
              <CardDescription className="text-slate-600 text-sm sm:text-base md:text-lg px-4 sm:px-0 font-medium max-w-2xl mx-auto leading-relaxed">
                Discover amazing golf experiences and connect with passionate golfers at premier courses near you
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0 px-4 sm:px-6">
              {/* Compact Inspirational Quote */}
              <div className="text-center mb-4 sm:mb-6 p-4 sm:p-5 bg-gradient-to-br from-emerald-50/80 via-white/50 to-green-50/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-emerald-200/40 shadow-lg hover:shadow-xl transition-all duration-500 group">
                <div className="relative">
                  <div className="absolute -top-1 -left-1 text-3xl text-emerald-300/30 font-serif">"</div>
                  <p className="text-sm sm:text-base md:text-lg font-bold italic text-slate-700 leading-relaxed mb-2 sm:mb-3 px-6 group-hover:text-slate-800 transition-colors duration-300">
                    {golfCarouselData[isMounted ? golfCarouselIndex : 0].quote}
                  </p>
                  <div className="absolute -bottom-2 -right-1 text-3xl text-emerald-300/30 font-serif rotate-180">"</div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-emerald-400"></div>
                  <p className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {golfCarouselData[isMounted ? golfCarouselIndex : 0].author}
                  </p>
                  <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-emerald-400"></div>
                </div>
              </div>
              
              {/* Compact Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Enhanced Find Rounds Card */}
                <Card className="group relative bg-gradient-to-br from-emerald-50/90 via-white/80 to-green-50/70 backdrop-blur-2xl shadow-2xl border border-emerald-200/50 rounded-[2rem] hover:shadow-emerald-500/25 hover:shadow-3xl hover:border-emerald-300/70 transition-all duration-700 hover:scale-[1.05] hover:-translate-y-2 overflow-hidden">
                  {/* Enhanced Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-green-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/20 to-transparent rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent group-hover:from-emerald-800 group-hover:to-green-800 transition-all duration-300">
                          Find Rounds
                        </CardTitle>
                        <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full mt-2 group-hover:w-16 group-hover:shadow-lg group-hover:shadow-emerald-200 transition-all duration-500"></div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative text-emerald-500 opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300">
                          <FontAwesomeIcon icon={faLocationDot} className="h-7 w-7" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-0 pb-4">
                    <p className="text-slate-700 font-medium leading-relaxed mb-3 text-sm group-hover:text-slate-800 transition-colors duration-300">
                      Discover exceptional golf experiences and connect with passionate golfers at premier courses
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faEarth} className="h-3 w-3" />
                        Public Rounds
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-teal-100 text-green-700 text-xs font-bold rounded-xl border border-green-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faUserGroup} className="h-3 w-3" />
                        Private Groups
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 text-xs font-bold rounded-xl border border-teal-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faFlag} className="h-3 w-3" />
                        Premium Courses
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Create Rounds Card */}
                <Card className="group relative bg-gradient-to-br from-blue-50/90 via-white/80 to-indigo-50/70 backdrop-blur-2xl shadow-2xl border border-blue-200/50 rounded-[2rem] hover:shadow-blue-500/25 hover:shadow-3xl hover:border-blue-300/70 transition-all duration-700 hover:scale-[1.05] hover:-translate-y-2 overflow-hidden">
                  {/* Enhanced Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-indigo-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full transform -translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent group-hover:from-blue-800 group-hover:to-indigo-800 transition-all duration-300">
                          Create Rounds
                        </CardTitle>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-2 group-hover:w-16 group-hover:shadow-lg group-hover:shadow-blue-200 transition-all duration-500"></div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative text-blue-500 opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-300">
                          <FontAwesomeIcon icon={faUsers} className="h-7 w-7" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 pt-0 pb-4">
                    <p className="text-slate-700 font-medium leading-relaxed mb-3 text-sm group-hover:text-slate-800 transition-colors duration-300">
                      Host unforgettable golf experiences and build meaningful connections with fellow golf enthusiasts
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                        Host Events
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faHandshake} className="h-3 w-3" />
                        Invite Friends
                      </span>
                      <span className="px-3 py-1 bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 text-xs font-bold rounded-xl border border-sky-200/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faCalendarCheck} className="h-3 w-3" />
                        Set Schedule
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Compact Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-2">
                <Button asChild size="default" className="group w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-[1.03] rounded-xl px-6 py-2 font-bold">
                  <Link href="/auth/signin" className="flex items-center space-x-2">
                    <span className="group-hover:tracking-wide transition-all duration-300">Sign In</span>
                    <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="default" className="group w-full sm:w-auto border-2 border-emerald-300/70 text-emerald-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:border-emerald-400 shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-[1.03] rounded-xl px-6 py-2 font-bold backdrop-blur-sm bg-white/80">
                  <Link href="/auth/signup" className="group-hover:tracking-wide transition-all duration-300 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faStar} className="h-3 w-3" />
                    <span>Sign Up for Free</span>
                  </Link>
                </Button>
              </div>

              {/* Compact Footer */}
              <div className="mt-4 text-center relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"></div>
                <div className="pt-3">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-50/80 to-green-50/80 backdrop-blur-sm rounded-full border border-emerald-200/50 shadow-md">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                      Join <span className="text-emerald-600 font-bold">10,000+</span> golfers on ForeSum
                    </p>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    )
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
                  <Link href={`/matches${zipCodeSearch ? `?zipCode=${zipCodeSearch}` : ''}`}>
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
          
          {/* Right Section - Public Rounds + Create Round + Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto md:flex-shrink-0 justify-end min-w-0">
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs sm:text-sm">
                <Link href="/rounds/public">
                  <span className="hidden sm:inline">Public Rounds</span>
                  <span className="sm:hidden">Public</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-xs sm:text-sm">
                <Link href="/matches/create">
                  <span className="hidden sm:inline">Create Round</span>
                  <span className="sm:hidden">Create</span>
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
                    router.push('/profile');
                  }}
                  className="group flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50/80 hover:to-emerald-50/80 hover:text-green-800 transition-all duration-300 ease-out cursor-pointer w-full text-left rounded-xl mb-1 border border-gray-200/60 hover:border-green-300/60"
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
                    signOut();
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

      {/* Main Content Card Container */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 relative z-20">
        <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border-0 rounded-2xl sm:rounded-3xl overflow-hidden">
          <CardContent className="p-3 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8">

            {/* Recent Rounds */}
            <Card className="bg-gradient-to-br from-white/95 to-green-50/80 backdrop-blur-md shadow-xl border border-green-200/30 hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-50/50 to-green-50/30 border-b border-green-100/30 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2 text-green-800">
                      <div className="relative">
                        <img src="/images/myRoundsNew_icon.png?v=1" alt="My Rounds" className="h-[60px] w-[60px]" style={{filter: 'brightness(0.8)'}} />
                        {recentRounds && recentRounds.some(round => round.pendingRequestsCount && round.pendingRequestsCount > 0) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span>My Rounds</span>
                          {recentRounds && (() => {
                            const totalPending = recentRounds.reduce((sum, round) => sum + (round.pendingRequestsCount || 0), 0);
                            return totalPending > 0 ? (
                              <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                {totalPending}
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <CardDescription className="text-gray-600 mt-1">
                          Rounds you've created or joined
                          {recentRounds && (() => {
                            const totalPending = recentRounds.reduce((sum, round) => sum + (round.pendingRequestsCount || 0), 0);
                            return totalPending > 0 && (
                              <span className="block text-red-600 font-medium mt-1">
                                {totalPending} pending join request{totalPending !== 1 ? 's' : ''} need your attention
                              </span>
                            );
                          })()}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </div>
                  
                  {/* Centered Pagination */}
                  {totalMyRounds > itemsPerPage && (
                    <div className="flex items-center justify-center mx-6">
                      <div className="bg-gradient-to-r from-white/95 to-green-50/90 backdrop-blur-md shadow-lg border border-green-200/30 rounded-xl p-2 flex items-center space-x-3">
                        {/* Previous Button */}
                        <button
                          onClick={prevMyRounds}
                          disabled={myRoundsCarouselIndex === 0}
                          className="group relative flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon 
                            icon={faChevronUp} 
                            className="h-3 w-3 text-white group-hover:text-green-50 transition-colors duration-200" 
                          />
                          <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity duration-300"></div>
                        </button>

                        {/* Compact Progress Indicator */}
                        <div className="flex flex-col items-center space-y-1">
                          {/* Progress Bar */}
                          <div className="w-12 h-1 bg-green-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${((myRoundsCarouselIndex / maxCarouselIndex) * 100) || 0}%`
                              }}
                            ></div>
                          </div>
                          
                          {/* Compact Page Counter */}
                          <div className="text-xs font-bold text-green-800 leading-none">
                            {Math.floor(myRoundsCarouselIndex / itemsPerPage) + 1}/{Math.ceil(totalMyRounds / itemsPerPage)}
                          </div>
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={nextMyRounds}
                          disabled={myRoundsCarouselIndex >= maxCarouselIndex}
                          className="group relative flex items-center justify-center w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon 
                            icon={faChevronDown} 
                            className="h-3 w-3 text-white group-hover:text-green-50 transition-colors duration-200" 
                          />
                          <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 flex justify-end">
                    <Button asChild variant="outline" size="sm" className="border-green-200 hover:bg-green-50">
                      <Link href="/matches?myMatches=true">View All</Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 py-2">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-green-300 to-transparent opacity-60"></div>
              </div>
              <CardContent className="pt-6">
                {recentRounds && recentRounds.length > 0 ? (
                  <div className="relative">
                    
                    {/* Rounds Display - Enhanced Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleMyRounds.map((round) => (
                        <EnhancedRoundCard
                          key={round.id}
                          match={round}
                          currentUserId={session?.user?.id}
                          roundType="my"
                          size="sm"
                          onCardClick={() => router.push(`/matches/${round.id}`)}
                          onManageClick={() => router.push(`/matches/${round.id}/manage`)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200/50 shadow-sm mx-2">
                    <div className="w-fit mx-auto mb-4">
                      <img src="/images/myRoundsNew_icon.png?v=1" alt="My Rounds" className="h-[50px] w-[50px]" style={{filter: 'brightness(0.8)'}} />
                    </div>
                    <p className="text-green-800 font-medium mb-4">No rounds yet</p>
                    <Button asChild size="sm" className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                      <Link href="/matches/create">Create Your First Match</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Golf Rounds Calendar */}
            <GolfRoundsCalendar
              matches={calendarMatches || []}
              userId={session?.user?.id || ''}
            />

          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stats & Leaderboard Toggle */}
            <StatsLeaderboardToggle />

            {/* My Groups */}
            <Card className="bg-gradient-to-br from-white/95 to-purple-50/80 backdrop-blur-md shadow-xl border border-purple-200/30 hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-green-800 flex items-center space-x-2">
                    <img src="/images/myGroups_icon.png" alt="My Groups" className="h-12 w-12" style={{filter: 'brightness(0.8)'}} />
                    <span>My Groups</span>
                  </CardTitle>
                  <Button asChild variant="outline" size="sm" className="border-green-200 hover:bg-green-50">
                    <Link href="/groups">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {myGroups && myGroups.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      // Use the paginated groups defined earlier
                      
                      return (
                        <>
                          {/* Owned Groups Section */}
                          {ownedGroups.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                                  <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide">My Groups</h4>
                                  <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                    {totalOwnedGroups}
                                  </div>
                                </div>
                                {/* Pagination controls for owned groups */}
                                {totalOwnedGroups > groupsPerPage && (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={prevOwnedGroups}
                                      disabled={ownedGroupsIndex === 0}
                                      className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faChevronUp} className="h-3 w-3 text-white" />
                                    </button>
                                    <span className="text-xs text-green-700 font-medium">
                                      {Math.floor(ownedGroupsIndex / groupsPerPage) + 1}/{Math.ceil(totalOwnedGroups / groupsPerPage)}
                                    </span>
                                    <button
                                      onClick={nextOwnedGroups}
                                      disabled={ownedGroupsIndex >= maxOwnedIndex}
                                      className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-white" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-3">
                                {visibleOwnedGroups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white/90 backdrop-blur-sm border border-green-200/70 rounded-2xl hover:shadow-lg hover:shadow-green-100/30 transition-all duration-300 cursor-pointer hover:bg-white sm:hover:scale-[1.02] space-y-2 sm:space-y-0"
                                    onClick={() => router.push('/groups')}
                                  >
                                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden">
                                        {group.icon && group.icon.trim() !== '' ? (
                                          <img
                                            src={group.icon}
                                            alt={`${group.name} icon`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement
                                              img.src = "/images/owner_icon.png?v=1"
                                            }}
                                          />
                                        ) : (
                                          <img
                                            src="/images/owner_icon.png?v=1"
                                            alt="Owner icon"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              console.error('Failed to load owner icon')
                                            }}
                                          />
                                        )}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-200">{group.name}</span>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full inline-block w-fit bg-green-100 text-green-800">
                                          Owner
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-full sm:w-auto sm:text-right">
                                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mb-1">
                                        <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-1" />
                                        {group._count.members}
                                      </div>
                                      <div className="text-xs text-gray-400">members</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Separator between owned and member groups */}
                          {ownedGroups.length > 0 && memberGroups.length > 0 && (
                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300/50"></div>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 py-1 text-gray-500 font-medium rounded-full border border-gray-200">
                                  Member Groups
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Member Groups Section */}
                          {memberGroups.length > 0 && (
                            <div>
                              {ownedGroups.length === 0 && (
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide">Member Groups</h4>
                                    <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                      {totalMemberGroups}
                                    </div>
                                  </div>
                                  {/* Pagination controls for member groups */}
                                  {totalMemberGroups > groupsPerPage && (
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={prevMemberGroups}
                                        disabled={memberGroupsIndex === 0}
                                        className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                      >
                                        <FontAwesomeIcon icon={faChevronUp} className="h-3 w-3 text-white" />
                                      </button>
                                      <span className="text-xs text-green-700 font-medium">
                                        {Math.floor(memberGroupsIndex / groupsPerPage) + 1}/{Math.ceil(totalMemberGroups / groupsPerPage)}
                                      </span>
                                      <button
                                        onClick={nextMemberGroups}
                                        disabled={memberGroupsIndex >= maxMemberIndex}
                                        className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                      >
                                        <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-white" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Show pagination for member groups when there are owned groups too */}
                              {ownedGroups.length > 0 && totalMemberGroups > groupsPerPage && (
                                <div className="flex items-center justify-end mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-green-700 font-medium">Member Groups:</span>
                                    <button
                                      onClick={prevMemberGroups}
                                      disabled={memberGroupsIndex === 0}
                                      className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faChevronUp} className="h-3 w-3 text-white" />
                                    </button>
                                    <span className="text-xs text-green-700 font-medium">
                                      {Math.floor(memberGroupsIndex / groupsPerPage) + 1}/{Math.ceil(totalMemberGroups / groupsPerPage)}
                                    </span>
                                    <button
                                      onClick={nextMemberGroups}
                                      disabled={memberGroupsIndex >= maxMemberIndex}
                                      className="w-6 h-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-white" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="space-y-3">
                                {visibleMemberGroups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white/90 backdrop-blur-sm border border-green-100/50 rounded-2xl hover:shadow-lg hover:shadow-green-100/20 transition-all duration-300 cursor-pointer hover:bg-white sm:hover:scale-[1.02] space-y-2 sm:space-y-0"
                                    onClick={() => router.push('/groups')}
                                  >
                                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 flex items-center justify-center overflow-hidden">
                                        {group.icon && group.icon.trim() !== '' ? (
                                          <img
                                            src={group.icon}
                                            alt={`${group.name} icon`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const img = e.target as HTMLImageElement
                                              img.src = "/images/member_icon.png?v=1"
                                            }}
                                          />
                                        ) : (
                                          <img
                                            src="/images/member_icon.png?v=1"
                                            alt="Member group icon"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                              console.error('Failed to load member icon')
                                            }}
                                          />
                                        )}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-200">{group.name}</span>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full inline-block w-fit bg-green-100 text-green-800">
                                          Member
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-full sm:w-auto sm:text-right">
                                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 mb-1">
                                        <FontAwesomeIcon icon={faUsers} className="h-3 w-3 mr-1" />
                                        {group._count.members}
                                      </div>
                                      <div className="text-xs text-gray-400">members</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                    <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                      <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-green-800 font-medium mb-3 text-sm">No groups yet</p>
                    <Button asChild size="sm" variant="outline" className="border-green-200 hover:bg-green-50">
                      <Link href="/groups">Create Group</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}