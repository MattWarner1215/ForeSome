'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTrophy, 
  faMedal, 
  faAward, 
  faUser, 
  faStar,
  faGolfBall,
  faMapMarkedAlt
} from '@fortawesome/free-solid-svg-icons'
import { LOGO_IMAGES } from '@/lib/images'

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

interface LeaderboardProps {
  compact?: boolean
  limit?: number
}

export default function Leaderboard({ compact = false, limit = 5 }: LeaderboardProps) {
  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardEntry[]>({
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
  })

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !leaderboard) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Failed to load leaderboard</p>
        </CardContent>
      </Card>
    )
  }

  const topPlayers = leaderboard.slice(0, limit)

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
    <Card className="bg-gradient-to-br from-white/95 to-amber-50/80 backdrop-blur-md shadow-xl border border-amber-200/30 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-800">
          <div className="p-2 bg-amber-100 rounded-lg">
            <FontAwesomeIcon icon={faTrophy} className="h-5 w-5 text-amber-600" />
          </div>
          <span>{compact ? 'Top Golfers' : 'Leaderboard'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPlayers.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto mb-3">
                <FontAwesomeIcon icon={faTrophy} className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-amber-800 font-medium text-sm">No active players yet</p>
            </div>
          ) : (
            topPlayers.map((player, index) => {
              const rank = index + 1
              const { icon, color } = getRankIcon(rank)
              
              return (
                <div 
                  key={player.id} 
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${
                    rank <= 3 
                      ? 'bg-gradient-to-r from-white to-amber-50 border border-amber-200' 
                      : 'bg-white/80 border border-gray-200'
                  } ${compact ? 'hover:shadow-md' : 'hover:shadow-lg hover:scale-[1.02]'}`}
                >
                  {/* Rank */}
                  <div className={`p-3 bg-gradient-to-br ${getRankBg(rank)} rounded-full flex items-center justify-center min-w-[48px] h-12`}>
                    {rank <= 3 ? (
                      <FontAwesomeIcon icon={icon} className={`h-5 w-5 text-white`} />
                    ) : (
                      <span className="text-white font-bold text-lg">#{rank}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {player.image ? (
                        <img 
                          src={player.image} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 truncate">
                        {player.name || player.email.split('@')[0]}
                      </h3>
                    </div>
                    
                    {compact ? (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-amber-700">{player.score}</span> points
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faGolfBall} className="h-3 w-3 text-green-500" />
                          <span>{player.roundsCompleted} rounds</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faStar} className="h-3 w-3 text-yellow-500" />
                          <span>{player.averageRating > 0 ? player.averageRating : '-'} rating</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <img src={LOGO_IMAGES.myrounds_icon} alt="Rounds" className="h-3 w-3" />
                          <span>{player.roundsCreated} created</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FontAwesomeIcon icon={faMapMarkedAlt} className="h-3 w-3 text-purple-500" />
                          <span>{player.differentCourses} courses</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-700">{player.score}</div>
                    <div className="text-xs text-amber-600">points</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {!compact && topPlayers.length >= limit && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing top {limit} players • Scores calculated from rounds played, created, courses, and ratings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}