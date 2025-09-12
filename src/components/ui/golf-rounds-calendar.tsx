'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChevronLeft, 
  faChevronRight, 
  faCalendarDays,
  faClock,
  faUsers,
  faMapMarkerAlt,
  faLocationDot,
  faGlobe,
  faLock,
  faTimes,
  faFlag,
  faUserCheck,
  faHourglass,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

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

interface GolfRoundsCalendarProps {
  matches: Match[]
  userId: string
}

export function GolfRoundsCalendar({ matches, userId }: GolfRoundsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayMatches, setSelectedDayMatches] = useState<Match[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get matches for a specific date
  const getMatchesForDate = (day: number) => {
    const dateString = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
    return matches.filter(match => {
      const matchDate = new Date(match.date).toISOString().split('T')[0]
      return matchDate === dateString
    })
  }

  // Determine match relationship to user
  const getMatchType = (match: Match) => {
    if (match.creatorId === userId) return 'created'
    if (match.userStatus === 'accepted') return 'joined'
    if (match.userStatus === 'pending') return 'pending'
    return 'available'
  }

  // Get calendar days array
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const formatTime = (timeString: string) => {
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  // Handle clicking on a calendar day
  const handleDayClick = (day: number) => {
    const dayMatches = getMatchesForDate(day)
    if (dayMatches.length > 0) {
      setSelectedDayMatches(dayMatches)
      setSelectedDate(new Date(currentYear, currentMonth, day).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedDayMatches([])
    setSelectedDate('')
  }

  return (
    <Card className="bg-gradient-to-br from-white/95 to-green-50/80 backdrop-blur-md shadow-xl border border-green-200/30 hover:shadow-2xl transition-all duration-300 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-white" />
            </div>
            <span className="text-green-800 font-bold">Golf Calendar</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0 border-green-300 text-green-700 hover:bg-green-50"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 border-green-300 text-green-700 hover:bg-green-50 text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0 border-green-300 text-green-700 hover:bg-green-50"
            >
              <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {/* Day Headers */}
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-xs font-semibold text-gray-600 p-2">
              {dayName}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={index} className="h-16 p-1"></div>
            }

            const dayMatches = getMatchesForDate(day)
            const hasMatches = dayMatches.length > 0

            return (
              <div
                key={day}
                className={cn(
                  "h-16 p-1 border border-gray-100 rounded-lg transition-all duration-200 relative",
                  isToday(day) && "bg-green-50 border-green-300",
                  hasMatches 
                    ? "bg-blue-50 border-blue-200 hover:bg-blue-100 hover:shadow-md cursor-pointer transform hover:scale-105" 
                    : "hover:bg-gray-50"
                )}
                onClick={() => hasMatches && handleDayClick(day)}
              >
                <div className={cn(
                  "text-xs font-medium",
                  isToday(day) ? "text-green-700" : "text-gray-700"
                )}>
                  {day}
                </div>
                
                {/* Match indicators */}
                {dayMatches.length > 0 && (
                  <div className="absolute inset-x-1 bottom-1 space-y-0.5">
                    {dayMatches.slice(0, 2).map((match, matchIndex) => {
                      const matchType = getMatchType(match)
                      return (
                        <div
                          key={match.id}
                          className={cn(
                            "h-1.5 rounded-full text-xs truncate",
                            matchType === 'created' && "bg-green-500",
                            matchType === 'joined' && "bg-blue-500",
                            matchType === 'pending' && "bg-orange-400",
                            matchType === 'available' && "bg-gray-400"
                          )}
                          title={`${match.title} at ${match.course} - ${formatTime(match.time)}`}
                        />
                      )
                    })}
                    {dayMatches.length > 2 && (
                      <div className="text-xs text-gray-500 text-center font-medium">
                        +{dayMatches.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Created by you</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">You joined</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1.5 bg-orange-400 rounded-full"></div>
              <span className="text-gray-600">Pending approval</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-1.5 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Available</span>
            </div>
          </div>

          {/* Quick Stats */}
          {(() => {
            const now = new Date()
            const futureMatches = matches.filter(match => new Date(match.date) >= now)
            const myMatches = futureMatches.filter(match => 
              match.creatorId === userId || match.userStatus === 'accepted'
            )
            const pendingMatches = futureMatches.filter(match => match.userStatus === 'pending')
            
            if (futureMatches.length > 0) {
              return (
                <div className="text-xs text-gray-600 space-y-1 bg-green-50/50 p-2 rounded-lg border border-green-100">
                  <div className="font-medium text-green-800">Upcoming Rounds</div>
                  <div className="flex justify-between">
                    <span>Your rounds: {myMatches.length}</span>
                    {pendingMatches.length > 0 && (
                      <span className="text-orange-600">Pending: {pendingMatches.length}</span>
                    )}
                  </div>
                </div>
              )
            }
            return null
          })()}
        </div>
      </CardContent>

      {/* Round Details Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Golf Rounds - {selectedDate}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {selectedDayMatches.map((match) => {
                const matchType = getMatchType(match)
                return (
                  <div key={match.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <GolfCourseAvatar 
                        courseName={match.course} 
                        size="lg"
                        roundType={match.isPublic ? 'public' : 'private'}
                      />
                      
                      <div className="flex-1 space-y-3">
                        {/* Match Title and Status */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{match.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <FontAwesomeIcon 
                                icon={match.isPublic ? faGlobe : faLock} 
                                className="h-3 w-3 text-gray-500" 
                              />
                              <span className="text-sm text-gray-600">
                                {match.isPublic ? 'Public Round' : 'Private Round'}
                              </span>
                            </div>
                          </div>
                          
                          {/* User Status Badge */}
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            matchType === 'created' && "bg-green-100 text-green-800",
                            matchType === 'joined' && "bg-blue-100 text-blue-800", 
                            matchType === 'pending' && "bg-orange-100 text-orange-800",
                            matchType === 'available' && "bg-gray-100 text-gray-800"
                          )}>
                            <FontAwesomeIcon 
                              icon={
                                matchType === 'created' ? faFlag :
                                matchType === 'joined' ? faUserCheck :
                                matchType === 'pending' ? faHourglass : faUserPlus
                              } 
                              className="h-3 w-3 mr-1" 
                            />
                            {matchType === 'created' && 'Created by you'}
                            {matchType === 'joined' && 'You joined'}
                            {matchType === 'pending' && 'Pending approval'}
                            {matchType === 'available' && 'Available to join'}
                          </div>
                        </div>

                        {/* Match Details Grid */}
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-800">{match.course}</p>
                              <p className="text-gray-600">{match.address}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-800">{formatTime(match.time)}</p>
                              <p className="text-gray-600">Tee Time</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faUsers} className="h-4 w-4 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-800">
                                {match._count.players + 1}/{match.maxPlayers} Players
                              </p>
                              <p className="text-gray-600">
                                {match.maxPlayers - match._count.players - 1 > 0 
                                  ? `${match.maxPlayers - match._count.players - 1} spots left`
                                  : 'Round is full'
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <FontAwesomeIcon icon={faFlag} className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-gray-800 capitalize">{match.status}</p>
                              <p className="text-gray-600">Round Status</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => window.open(`/matches/${match.id}`, '_blank')}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}