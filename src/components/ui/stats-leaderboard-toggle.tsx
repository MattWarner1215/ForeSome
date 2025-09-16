'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartLine, 
  faTrophy, 
  faToggleOn, 
  faToggleOff,
  faMedal, 
  faAward, 
  faUser,
  faStar,
  faGolfBall,
  faMapMarkedAlt,
  faQuestionCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import { LOGO_IMAGES } from '@/lib/images'

interface UserStats {
  roundsCompleted: number
  differentCoursesPlayed: number
  averageRating: number
  achievements: { unlocked: boolean }[]
}

interface LeaderboardEntry {
  id: string
  name: string | null
  email: string
  image: string | null
  roundsCompleted: number
  averageRating: number
  totalRatings: number
  roundsCreated: number
  differentCourses: number
  score: number
}

export default function StatsLeaderboardToggle() {
  const [showStats, setShowStats] = useState(false)
  const [showPointsModal, setShowPointsModal] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/profile/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch user stats')
      }
      return response.json()
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    enabled: showStats, // Only fetch when showing stats
  })

  const { data: leaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      return response.json()
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    enabled: !showStats, // Only fetch when showing leaderboard
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: faTrophy, color: 'text-yellow-500' }
      case 2:
        return { icon: faMedal, color: 'text-gray-400' }
      case 3:
        return { icon: faAward, color: 'text-amber-600' }
      default:
        return { icon: faUser, color: 'text-gray-500' }
    }
  }

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-500'
      case 2:
        return 'from-gray-300 to-gray-400'
      case 3:
        return 'from-amber-500 to-amber-600'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-white/95 to-purple-50/80 backdrop-blur-md shadow-xl border border-purple-200/30 hover:shadow-2xl transition-all duration-300 rounded-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <FontAwesomeIcon 
                  icon={showStats ? faChartLine : faTrophy} 
                  className="h-5 w-5 text-green-600" 
                />
              </div>
              <div className="flex items-center space-x-2">
                <span>{showStats ? 'Golf Stats' : 'Top Golfers'}</span>
                {!showStats && (
                  <button
                    onClick={() => setShowPointsModal(true)}
                    className="text-green-600 hover:text-green-800 transition-colors flex items-center justify-center"
                    title="How are points calculated?"
                  >
                    <FontAwesomeIcon icon={faQuestionCircle} className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardTitle>
            
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center space-x-3 text-lg text-green-600 hover:text-green-800 transition-colors"
              title={showStats ? 'Show Top Golfers' : 'Show Golf Stats'}
            >
              <span className="hidden sm:inline font-medium">
                {showStats ? 'Show Leaderboard' : 'My Stats'}
              </span>
              <FontAwesomeIcon 
                icon={showStats ? faToggleOff : faToggleOn} 
                className="h-10 w-10 transform transition-transform hover:scale-110" 
              />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {showStats ? (
            statsLoading ? (
              <div className="bg-white/90 backdrop-blur-sm border border-green-100/50 rounded-2xl overflow-hidden animate-pulse">
                {/* Table Header Skeleton */}
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>

                {/* Table Body Skeleton */}
                <div className="divide-y divide-gray-100">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm border border-green-100/50 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-green-800 flex items-center space-x-2">
                    <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
                    <span>Golf Statistics Overview</span>
                  </h3>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-green-50">
                  {/* Rounds Played Row */}
                  <div className="group flex items-center justify-between px-4 py-3 hover:bg-green-50/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-green-400 to-green-500 rounded-lg shadow-sm">
                        <FontAwesomeIcon icon={faGolfBall} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Rounds Played</div>
                        <div className="text-xs text-gray-500">Completed golf rounds</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-700">
                        {stats?.roundsCompleted || 0}
                      </div>
                      <div className="text-xs text-green-600">rounds</div>
                    </div>
                  </div>

                  {/* Courses Row */}
                  <div className="group flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-sm">
                        <FontAwesomeIcon icon={faMapMarkedAlt} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Unique Courses</div>
                        <div className="text-xs text-gray-500">Different courses played</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-700">
                        {stats?.differentCoursesPlayed || 0}
                      </div>
                      <div className="text-xs text-blue-600">courses</div>
                    </div>
                  </div>

                  {/* Average Rating Row */}
                  <div className="group flex items-center justify-between px-4 py-3 hover:bg-yellow-50/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg shadow-sm">
                        <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Average Rating</div>
                        <div className="text-xs text-gray-500">Player rating average</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-yellow-700">
                        {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-xs text-yellow-600">stars</div>
                    </div>
                  </div>

                  {/* Achievements Row */}
                  <div className="group flex items-center justify-between px-4 py-3 hover:bg-purple-50/50 transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg shadow-sm">
                        <FontAwesomeIcon icon={faTrophy} className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">Achievements</div>
                        <div className="text-xs text-gray-500">Unlocked milestones</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-purple-700">
                        {stats?.achievements?.filter(a => a.unlocked).length || 0}
                      </div>
                      <div className="text-xs text-purple-600">badges</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            leaderboardLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : leaderboardError || !leaderboard ? (
              <div className="text-center py-8">
                <p className="text-red-600">Failed to load leaderboard</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-3">
                  <FontAwesomeIcon icon={faTrophy} className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-amber-800 font-medium text-sm">No active players yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 5).map((player, index) => {
                  const rank = index + 1
                  const { icon, color } = getRankIcon(rank)
                  
                  return (
                    <div 
                      key={player.id} 
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                        rank <= 3 
                          ? 'bg-gradient-to-r from-white to-amber-50 border border-amber-200' 
                          : 'bg-white/80 border border-gray-200'
                      } hover:shadow-md`}
                    >
                      {/* Rank */}
                      <div className={`p-2 bg-gradient-to-br ${getRankBg(rank)} rounded-full flex items-center justify-center min-w-[36px] h-9`}>
                        {rank <= 3 ? (
                          <FontAwesomeIcon icon={icon} className={`h-4 w-4 text-white`} />
                        ) : (
                          <span className="text-white font-bold text-sm">#{rank}</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {player.image ? (
                            <img 
                              src={player.image} 
                              alt="Avatar" 
                              className="w-5 h-5 rounded-full object-cover" 
                            />
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faUser} className="h-2 w-2 text-gray-600" />
                            </div>
                          )}
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {player.name || player.email.split('@')[0]}
                          </h3>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-amber-700">{player.score}</span> points
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-amber-700">{player.score}</div>
                        <div className="text-xs text-amber-600">pts</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>
      
      {/* Points Explanation Modal - Portal to document root */}
      {showPointsModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60" 
            onClick={() => setShowPointsModal(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                <FontAwesomeIcon icon={faTrophy} className="h-5 w-5 text-amber-600" />
                <span>How Points Are Calculated</span>
              </h3>
              <button
                onClick={() => setShowPointsModal(false)}
                className="text-gray-400 hover:text-red-600 transition-colors rounded-full p-1 hover:bg-red-50"
                title="Close"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faGolfBall} className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Rounds Completed</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">10 pts each</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={LOGO_IMAGES.myrounds_icon} alt="Rounds" className="h-4 w-4" />
                    <span className="text-sm font-medium text-blue-800">Rounds Created</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">15 pts each</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faMapMarkedAlt} className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Unique Courses</span>
                  </div>
                  <span className="text-sm font-bold text-purple-700">25 pts each</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Average Rating</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-700">20 pts per point</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Ratings Received</span>
                  </div>
                  <span className="text-sm font-bold text-amber-700">5 pts each</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Example:</strong> A golfer with 5 completed rounds, 2 created rounds, 3 unique courses, 
                  4.2 average rating, and 8 ratings received would earn: (5×10) + (2×15) + (3×25) + (4.2×20) + (8×5) = <strong>249 points</strong>
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPointsModal(false)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}