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
import { faLocationDot, faUsers, faStar, faSearch, faPlus, faUser, faGlobe, faLock, faChevronUp, faChevronDown, faBars, faTimes, faHistory, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import StatsLeaderboardToggle from '@/components/ui/stats-leaderboard-toggle'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
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
  _count: { players: number }
  userStatus?: 'pending' | 'accepted' | 'declined' | null
  pendingRequestsCount?: number
  courseFeatures?: string
}

interface Group {
  id: string
  name: string
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [golfCarouselIndex, setGolfCarouselIndex] = useState(0)
  const [golfImage1Index, setGolfImage1Index] = useState(0)
  const [golfImage2Index, setGolfImage2Index] = useState(1)
  const [golfImage3Index, setGolfImage3Index] = useState(2)
  const [locationLoading, setLocationLoading] = useState(false)
  const [forceShowPage, setForceShowPage] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
      return groups.slice(0, 3)
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
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m.id === match.id)
      )
      
      return uniqueMatches
    },
    enabled: !!session,
    staleTime: 60000, // 1 minute 
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  })

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Auto-rotate golf carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setGolfCarouselIndex((current) => 
        current === golfCarouselData.length - 1 ? 0 : current + 1
      )
    }, 30000) // Change every 30 seconds

    return () => clearInterval(interval)
  }, [golfCarouselData.length])

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
  }, [golfCarouselData.length])

  if (status === 'loading' && !forceShowPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative">
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Golf Images Background Carousel */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <img
              src={golfCarouselData[golfCarouselIndex].image}
              alt="Golf background"
              className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>
        </div>
        
        
        <div className="relative w-full max-w-4xl z-20 px-4 sm:px-0">

          <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="flex justify-center mb-4 sm:mb-6">
                <img 
                  src={LOGO_IMAGES.foresum_logo} 
                  alt="ForeSum Logo" 
                  className="h-20 w-20 sm:h-28 sm:w-28 md:h-[140px] md:w-[140px] object-contain"
                />
              </div>
              <CardDescription className="text-gray-600 text-sm sm:text-base md:text-lg px-4 sm:px-0">
                Find your perfect golf match at local courses
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0 px-4 sm:px-6">
              {/* Inspirational Quote */}
              <div className="text-center mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl sm:rounded-2xl border border-green-200/50">
                <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold italic text-gray-800 leading-relaxed mb-2 sm:mb-3">
                  "{golfCarouselData[golfCarouselIndex].quote}"
                </p>
                <p className="text-xs sm:text-sm md:text-base font-semibold text-green-700">
                  — {golfCarouselData[golfCarouselIndex].author}
                </p>
              </div>
              
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-10">
                {/* Find Rounds Card */}
                <Card className="group relative bg-gradient-to-br from-green-50 via-white to-green-100/50 backdrop-blur-xl shadow-xl border-2 border-green-200/40 rounded-3xl hover:shadow-2xl hover:border-green-300/60 transition-all duration-500 hover:scale-[1.03] overflow-hidden">
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-transparent to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-green-800 text-xl font-bold group-hover:text-green-900 transition-colors">
                          Find Rounds
                        </CardTitle>
                        <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 group-hover:w-16 transition-all duration-300"></div>
                      </div>
                      <div className="text-green-400 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                        <FontAwesomeIcon icon={faLocationDot} className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-gray-700 font-medium leading-relaxed mb-4">
                      Discover amazing golf rounds in your area and connect with fellow golfers
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                        Public Rounds
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                        Private Groups
                      </span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full border border-teal-200">
                        Local Courses
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Create Rounds Card */}
                <Card className="group relative bg-gradient-to-br from-blue-50 via-white to-indigo-100/50 backdrop-blur-xl shadow-xl border-2 border-blue-200/40 rounded-3xl hover:shadow-2xl hover:border-blue-300/60 transition-all duration-500 hover:scale-[1.03] overflow-hidden">
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-800 text-xl font-bold group-hover:text-blue-900 transition-colors">
                          Create Rounds
                        </CardTitle>
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mt-1 group-hover:w-16 transition-all duration-300"></div>
                      </div>
                      <div className="text-blue-400 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                        <FontAwesomeIcon icon={faUsers} className="h-8 w-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-gray-700 font-medium leading-relaxed mb-4">
                      Host memorable golf experiences at your favorite courses and build lasting friendships
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                        Host Events
                      </span>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                        Invite Friends
                      </span>
                      <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full border border-sky-200">
                        Set Schedule
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                  <Link href="/auth/signin" className="flex items-center space-x-2">
                    <span>Sign In</span>
                    <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-green-300 text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                  <Link href="/auth/signup">Sign Up for Free</Link>
                </Button>
              </div>
              
              {/* Footer Text */}
              <div className="mt-6 sm:mt-8 text-center border-t border-gray-200 pt-4 sm:pt-6">
                <p className="text-xs sm:text-sm text-gray-600">
                  Join thousands of golfers connecting through ForeSum
                </p>
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
        <div className="container mx-auto px-2 sm:px-4 h-full flex flex-col md:flex-row items-center justify-between py-2 md:py-0 gap-2 md:gap-0 overflow-visible">
          {/* Left Section - Logo + Search */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 w-full md:w-auto">
            <img 
              src={LOGO_IMAGES.foresum_logo} 
              alt="ForeSum Logo" 
              className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-[150px] lg:w-[150px] object-contain flex-shrink-0"
            />
            {/* Search functionality */}
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-700 font-medium hidden lg:block">Search for Rounds:</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Input
                  placeholder="Enter zip code"
                  value={zipCodeSearch}
                  onChange={(e) => setZipCodeSearch(e.target.value)}
                  className="w-full sm:w-48 md:w-64 lg:w-80 xl:w-96 h-8 text-sm border-green-200 focus:border-green-500 focus:ring-green-500"
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
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4 lg:mx-8">
            <div className="px-3 py-1.5 lg:px-4 lg:py-2 bg-green-50/80 rounded-lg border border-green-200/50">
              <span className="text-sm lg:text-base text-green-800 font-semibold">
                Welcome, {session?.user?.name || session?.user?.email}!
              </span>
            </div>
          </div>
          
          {/* Mobile Welcome Message */}
          <div className="flex lg:hidden items-center justify-center w-full md:hidden">
            <div className="px-2 py-1 bg-green-50/80 rounded-lg border border-green-200/50">
              <span className="text-xs text-green-800 font-semibold">
                Welcome, {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0]}!
              </span>
            </div>
          </div>
          
          {/* Right Section - Public Rounds + Create Round + Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 w-full md:w-auto justify-end">
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
              <div className="relative" ref={menuRef}>
                <Button 
                  size="sm" 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} className="h-4 w-4" />
                </Button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border-0 py-3 min-w-[180px] z-50 animate-in slide-in-from-top-2 duration-200">
                      <div className="absolute -top-2 right-4 w-4 h-4 bg-white/95 backdrop-blur-md rotate-45 border-l border-t border-green-100"></div>
                    <div className="px-2">
                      <Link 
                        href="/profile" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-200 rounded-xl border-b border-gray-100/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Profile</span>
                      </Link>
                      <Link 
                        href="/groups" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-200 rounded-xl border-b border-gray-100/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Groups</span>
                      </Link>
                      <Link 
                        href="/matches/completed" 
                        className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-200 rounded-xl border-b border-gray-100/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faHistory} className="h-4 w-4 text-green-600" />
                        </div>
                        <span>Completed Matches</span>
                      </Link>
                      <div className="my-2 border-t border-gray-200/50"></div>
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false)
                          signOut()
                        }}
                        className="flex items-center space-x-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 rounded-xl"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <FontAwesomeIcon icon={faTimes} className="h-4 w-4 text-red-600" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
        </div>
      </nav>
      
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
                        <img src={LOGO_IMAGES.myrounds_icon} alt="My Rounds" className="h-[50px] w-[50px]" />
                        {recentRounds && recentRounds.some(match => match.pendingRequestsCount && match.pendingRequestsCount > 0) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>My Rounds</span>
                        {recentRounds && (() => {
                          const totalPending = recentRounds.reduce((sum, match) => sum + (match.pendingRequestsCount || 0), 0);
                          return totalPending > 0 ? (
                            <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                              {totalPending}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </CardTitle>
                    <CardDescription className="text-gray-600 ml-16">
                      Rounds you've created or joined
                      {recentRounds && (() => {
                        const totalPending = recentRounds.reduce((sum, match) => sum + (match.pendingRequestsCount || 0), 0);
                        return totalPending > 0 && (
                          <span className="block text-red-600 font-medium mt-1">
                            {totalPending} pending join request{totalPending !== 1 ? 's' : ''} need your attention
                          </span>
                        );
                      })()}
                    </CardDescription>
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
                    
                    {/* Rounds Display - Half Width Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {visibleMyRounds.map((match) => (
                      <div 
                        key={match.id} 
                        className="group relative p-4 bg-white/95 backdrop-blur-sm border border-green-200/50 rounded-xl shadow-md hover:shadow-xl hover:shadow-green-200/30 transition-all duration-300 cursor-pointer hover:bg-white hover:scale-[1.02] hover:-translate-y-1 [&::before]:hidden [&::after]:hidden"
                        onClick={() => router.push(`/matches/${match.id}`)}
                      >
                        {/* Optimized Layout for Half-Width Cards */}
                        <div className="space-y-3">
                          {/* Header with Title and Course */}
                          <div className="flex items-start space-x-3">
                            <GolfCourseAvatar 
                              courseName={match.course} 
                              size="sm"
                              roundType="my"
                              className="[&::before]:hidden [&::after]:hidden flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base text-gray-900 group-hover:text-green-700 transition-colors duration-200 truncate">{match.title}</h3>
                              <div className="flex items-center mt-1">
                                <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3 mr-1 text-green-500 flex-shrink-0" />
                                <span className="font-semibold text-sm text-gray-800 truncate">{match.course}</span>
                              </div>
                              <p className="text-gray-600 text-xs truncate">{match.address}</p>
                            </div>
                          </div>

                          {/* Match Description - Condensed */}
                          {match.description && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-gray-600 text-xs italic line-clamp-2">
                                "{match.description}"
                              </p>
                            </div>
                          )}

                          {/* Bottom Section - Date, Time, Players, Status */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="flex items-center text-gray-600">
                                <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className="h-3 w-3 mr-1" />
                                {formatDate(match.date)}
                              </span>
                              <span className="flex items-center text-gray-600">
                                <svg className="h-3 w-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatTime(match.time)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FontAwesomeIcon icon={faUsers} className="h-2 w-2 mr-1" />
                                {match._count.players + 1}/{match.maxPlayers}
                              </div>
                            </div>
                          </div>

                          {/* Status Badges Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {match.isPublic && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <FontAwesomeIcon icon={faGlobe} className="h-1.5 w-1.5 mr-0.5" />
                                  Public Round
                                </span>
                              )}
                              {!match.isPublic && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  <FontAwesomeIcon icon={faLock} className="h-1.5 w-1.5 mr-0.5" />
                                  Private Round
                                </span>
                              )}
                            </div>
                            {(match.pendingRequestsCount ?? 0) > 0 && (
                              <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Course Features - Bottom of Card - Condensed */}
                        {match.courseFeatures && (
                          <div className="mt-2 pt-2 border-t border-green-100/50">
                            <p className="text-green-700 text-xs font-medium bg-green-50 p-1.5 rounded-lg border border-green-200 flex items-center">
                              <FontAwesomeIcon icon={faStar} className="h-2 w-2 mr-1 text-green-600 flex-shrink-0" />
                              <span className="truncate">{match.courseFeatures}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200/50 shadow-sm mx-2">
                    <div className="w-fit mx-auto mb-4">
                      <img src={LOGO_IMAGES.myrounds_icon} alt="My Rounds" className="h-[50px] w-[50px]" />
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
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FontAwesomeIcon icon={faUsers} className="h-5 w-5 text-green-600" />
                    </div>
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
                      // Separate owned and member groups for visual separation
                      const ownedGroups = myGroups.filter(group => group.creator.id === session?.user?.id)
                      const memberGroups = myGroups.filter(group => group.creator.id !== session?.user?.id)
                      
                      return (
                        <>
                          {/* Owned Groups Section */}
                          {ownedGroups.length > 0 && (
                            <div>
                              <div className="flex items-center mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"></div>
                                  <h4 className="text-sm font-semibold text-yellow-800 uppercase tracking-wide">My Groups</h4>
                                </div>
                                <div className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                                  {ownedGroups.length}
                                </div>
                              </div>
                              <div className="space-y-3">
                                {ownedGroups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white/90 backdrop-blur-sm border border-yellow-200/70 rounded-2xl hover:shadow-lg hover:shadow-yellow-100/30 transition-all duration-300 cursor-pointer hover:bg-white sm:hover:scale-[1.02] space-y-2 sm:space-y-0"
                                    onClick={() => router.push('/groups')}
                                  >
                                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                      <div className="p-2 sm:p-3 rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-yellow-400 to-yellow-500">
                                        <FontAwesomeIcon 
                                          icon={faUsers} 
                                          className="h-4 w-4 text-white" 
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-yellow-700 transition-colors duration-200">{group.name}</span>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full inline-block w-fit bg-yellow-100 text-yellow-800">
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
                                <div className="flex items-center mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wide">Member Groups</h4>
                                  </div>
                                  <div className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                    {memberGroups.length}
                                  </div>
                                </div>
                              )}
                              <div className="space-y-3">
                                {memberGroups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-white/90 backdrop-blur-sm border border-green-100/50 rounded-2xl hover:shadow-lg hover:shadow-green-100/20 transition-all duration-300 cursor-pointer hover:bg-white sm:hover:scale-[1.02] space-y-2 sm:space-y-0"
                                    onClick={() => router.push('/groups')}
                                  >
                                    <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                                      <div className="p-2 sm:p-3 rounded-2xl shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300 bg-gradient-to-br from-green-400 to-green-500">
                                        <FontAwesomeIcon 
                                          icon={faUsers} 
                                          className="h-4 w-4 text-white" 
                                        />
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