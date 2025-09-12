'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faGolfBall, 
  faCalendarPlus, 
  faUsers, 
  faMapMarkedAlt, 
  faFlag, 
  faStar, 
  faUserFriends, 
  faTrophy,
  faAward,
  faChartLine,
  faLock,
  faCheck
} from '@fortawesome/free-solid-svg-icons'

interface UserStats {
  roundsCreated: number
  roundsJoined: number
  roundsCompleted: number
  roundsWon: number
  differentCoursesPlayed: number
  averageRating: number
  totalRatingsReceived: number
  groupsCreated: number
  groupsJoined: number
  favoritePartner?: {
    name: string
    count: number
  }
  achievements: Achievement[]
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress?: {
    current: number
    target: number
  }
}

const iconMap = {
  faGolfBall,
  faCalendarPlus,
  faUsers,
  faMapMarkedAlt,
  faFlag,
  faStar,
  faUserFriends,
  faTrophy
}

interface UserStatsProps {
  compact?: boolean
  showAchievements?: boolean
}

export default function UserStats({ compact = false, showAchievements = true }: UserStatsProps) {
  const { data: stats, isLoading, error } = useQuery<UserStats>({
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
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {compact ? (
          <Card className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
            {showAchievements && (
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load statistics</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    const unlockedAchievements = stats.achievements.filter(a => a.unlocked).length
    
    return (
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
            <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
            <span>Golf Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{stats.roundsCompleted}</div>
              <div className="text-sm text-green-600">Rounds Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{stats.differentCoursesPlayed}</div>
              <div className="text-sm text-green-600">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{stats.averageRating}</div>
              <div className="text-sm text-green-600">Avg Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{unlockedAchievements}</div>
              <div className="text-sm text-green-600">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unlockedAchievements = stats.achievements.filter(a => a.unlocked)
  const lockedAchievements = stats.achievements.filter(a => !a.unlocked)

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <Card className="bg-gradient-to-br from-white/95 to-green-50/80 backdrop-blur-md shadow-xl border border-green-200/30 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <div className="p-2 bg-green-100 rounded-lg">
              <FontAwesomeIcon icon={faChartLine} className="h-5 w-5 text-green-600" />
            </div>
            <span>Golf Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/80 rounded-xl border border-green-100">
              <div className="text-3xl font-bold text-green-700 mb-1">{stats.roundsCreated}</div>
              <div className="text-sm text-green-600 font-medium">Rounds Created</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-blue-100">
              <div className="text-3xl font-bold text-blue-700 mb-1">{stats.roundsJoined}</div>
              <div className="text-sm text-blue-600 font-medium">Rounds Joined</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-purple-100">
              <div className="text-3xl font-bold text-purple-700 mb-1">{stats.roundsCompleted}</div>
              <div className="text-sm text-purple-600 font-medium">Rounds Completed</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-orange-100">
              <div className="text-3xl font-bold text-orange-700 mb-1">{stats.differentCoursesPlayed}</div>
              <div className="text-sm text-orange-600 font-medium">Different Courses</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-yellow-100">
              <div className="text-3xl font-bold text-yellow-700 mb-1">
                {stats.averageRating > 0 ? stats.averageRating : '-'}
              </div>
              <div className="text-sm text-yellow-600 font-medium">Average Rating</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-red-100">
              <div className="text-3xl font-bold text-red-700 mb-1">{stats.totalRatingsReceived}</div>
              <div className="text-sm text-red-600 font-medium">Total Ratings</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-indigo-100">
              <div className="text-3xl font-bold text-indigo-700 mb-1">{stats.groupsCreated}</div>
              <div className="text-sm text-indigo-600 font-medium">Groups Created</div>
            </div>
            
            <div className="text-center p-4 bg-white/80 rounded-xl border border-pink-100">
              <div className="text-3xl font-bold text-pink-700 mb-1">{stats.groupsJoined}</div>
              <div className="text-sm text-pink-600 font-medium">Groups Joined</div>
            </div>
          </div>
          
          {stats.favoritePartner && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="text-sm text-blue-600 font-medium mb-1">Favorite Playing Partner</div>
                <div className="text-lg font-bold text-blue-800">
                  {stats.favoritePartner.name} ({stats.favoritePartner.count} rounds)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      {showAchievements && (
        <Card className="bg-gradient-to-br from-white/95 to-yellow-50/80 backdrop-blur-md shadow-xl border border-yellow-200/30 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FontAwesomeIcon icon={faAward} className="h-5 w-5 text-yellow-600" />
              </div>
              <span>Achievements ({unlockedAchievements.length}/{stats.achievements.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                    <FontAwesomeIcon icon={faCheck} className="h-4 w-4 mr-2" />
                    Unlocked ({unlockedAchievements.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {unlockedAchievements.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="p-2 bg-green-500 rounded-lg">
                          <FontAwesomeIcon 
                            icon={iconMap[achievement.icon as keyof typeof iconMap]} 
                            className="h-4 w-4 text-white" 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-green-800">{achievement.title}</div>
                          <div className="text-sm text-green-600">{achievement.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Locked Achievements */}
              {lockedAchievements.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
                    <FontAwesomeIcon icon={faLock} className="h-4 w-4 mr-2" />
                    In Progress ({lockedAchievements.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lockedAchievements.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-75"
                      >
                        <div className="p-2 bg-gray-400 rounded-lg">
                          <FontAwesomeIcon 
                            icon={iconMap[achievement.icon as keyof typeof iconMap]} 
                            className="h-4 w-4 text-white" 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-700">{achievement.title}</div>
                          <div className="text-sm text-gray-600">{achievement.description}</div>
                          {achievement.progress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{achievement.progress.current} / {achievement.progress.target}</span>
                                <span>{Math.round((achievement.progress.current / achievement.progress.target) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}