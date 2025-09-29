'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot, faUsers, faStar, faArrowRight, faEarth, faUserGroup, faHandshake, faCalendarCheck, faFlag } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'
import { BACKGROUND_IMAGES, LOGO_IMAGES } from '@/lib/images'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect authenticated users to rounds page
  useEffect(() => {
    if (status === 'loading') return // Wait for session to load

    if (session) {
      router.push('/rounds')
    }
  }, [session, status, router])

  // Golf images and quotes for landing page carousel
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

  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0)

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((current) =>
        current === golfCarouselData.length - 1 ? 0 : current + 1
      )
    }, 30000) // Change every 30 seconds

    return () => clearInterval(interval)
  }, [golfCarouselData.length])

  // Show loading while checking session
  if (status === 'loading') {
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

  // If user is authenticated, they'll be redirected, so we can return null here
  if (session) {
    return null
  }

  // Show landing page for unauthenticated users
  return (
    <div className="h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-green-50 flex items-center justify-center p-3 relative overflow-hidden">
      {/* Modern Golf Images Background Carousel */}
      <div className="absolute inset-0">
        <div className="relative w-full h-full">
          <img
            src={golfCarouselData[currentCarouselIndex].image}
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
                  {golfCarouselData[currentCarouselIndex].quote}
                </p>
                <div className="absolute -bottom-2 -right-1 text-3xl text-emerald-300/30 font-serif rotate-180">"</div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-emerald-400"></div>
                <p className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {golfCarouselData[currentCarouselIndex].author}
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