'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GolfCourseAvatar } from '@/components/ui/golf-course-avatar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faUsers,
  faClock,
  faCalendarDays,
  faGlobe,
  faLock,
  faStar,
  faZap
} from '@fortawesome/free-solid-svg-icons'
import { getCourseImageMapping, isIndoorSimulator, getCourseThemeColors } from '@/lib/course-images'
import { LOGO_IMAGES } from '@/lib/images'

interface EnhancedRoundCardProps {
  match: {
    id: string
    title: string
    description?: string | null
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
    courseFeatures?: string
  }
  currentUserId?: string
  roundType: 'public' | 'my' | 'private'
  onCardClick?: () => void
  onJoinClick?: () => void
  onLeaveClick?: () => void
  onManageClick?: () => void
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function EnhancedRoundCard({
  match,
  currentUserId,
  roundType,
  onCardClick,
  onJoinClick,
  onLeaveClick,
  onManageClick,
  isLoading = false,
  size = 'md'
}: EnhancedRoundCardProps) {
  // Get course image mapping and theme
  const courseMapping = getCourseImageMapping(match.course)
  const isSimulator = isIndoorSimulator(match.course)
  const themeColors = getCourseThemeColors(match.course)

  // Format functions
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

  // User status checks
  const isCreator = match.creatorId === currentUserId
  const isUserInRound = match.players.some(p => p.player.id === currentUserId) || isCreator
  const canRequestJoin = !match.userStatus &&
                        match._count.players < match.maxPlayers &&
                        new Date(match.date) > new Date() &&
                        !isCreator
  const canLeaveRound = match.userStatus === 'accepted' && !isCreator

  // Size variants
  const sizeVariants = {
    sm: {
      cardPadding: 'p-4',
      titleSize: 'text-lg',
      textSize: 'text-sm',
      iconSize: 'h-3 w-3',
      avatarSize: 'sm' as const
    },
    md: {
      cardPadding: 'p-6',
      titleSize: 'text-xl',
      textSize: 'text-base',
      iconSize: 'h-4 w-4',
      avatarSize: 'md' as const
    },
    lg: {
      cardPadding: 'p-8',
      titleSize: 'text-2xl',
      textSize: 'text-lg',
      iconSize: 'h-5 w-5',
      avatarSize: 'lg' as const
    }
  }

  const sizeConfig = sizeVariants[size]

  return (
    <Card
      className={`
        relative overflow-hidden group cursor-pointer transition-all duration-300
        ${isSimulator
          ? 'hover:shadow-xl hover:shadow-blue-500/25 border-blue-200/50'
          : 'hover:shadow-xl hover:shadow-green-500/25 border-green-200/50'
        }
        hover:scale-[1.02] hover:-translate-y-1
      `}
      onClick={onCardClick}
    >
      {/* Background Image */}
      {courseMapping.backgroundUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 group-hover:opacity-15 transition-opacity duration-300"
          style={{
            backgroundImage: `url('${courseMapping.backgroundUrl}')`
          }}
        />
      )}

      {/* Course Logo Watermark */}
      {courseMapping.logoUrl && (
        <div
          className="absolute top-4 right-4 w-12 h-12 opacity-20 group-hover:opacity-30 bg-contain bg-no-repeat bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url('${courseMapping.logoUrl}')`
          }}
        />
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: isSimulator
            ? 'linear-gradient(135deg, rgba(30, 64, 175, 0.05) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(96, 165, 250, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(22, 101, 52, 0.05) 0%, rgba(22, 163, 74, 0.1) 50%, rgba(34, 197, 94, 0.05) 100%)'
        }}
      />

      <CardContent className={`relative z-10 ${sizeConfig.cardPadding}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <GolfCourseAvatar
              courseName={match.course}
              size={sizeConfig.avatarSize}
              roundType={roundType}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className={`${sizeConfig.titleSize} font-bold mb-1 text-gray-900 group-hover:text-${isSimulator ? 'blue' : 'green'}-700 transition-colors truncate`}>
                {match.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {isSimulator && (
                  <FontAwesomeIcon icon={faZap} className={`${sizeConfig.iconSize} text-blue-500`} />
                )}
                <span className={`${sizeConfig.textSize} font-medium text-${isSimulator ? 'blue' : 'green'}-700 truncate`}>
                  {match.course}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FontAwesomeIcon icon={faLocationDot} className={`${sizeConfig.iconSize} text-gray-500`} />
                <span className="text-sm text-gray-600 truncate">{match.address}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {isSimulator && (
              <Badge
                variant="secondary"
                className="bg-blue-600/60 text-white border-blue-400/30 backdrop-blur-sm"
              >
                Indoor Simulator
              </Badge>
            )}
            <Badge
              variant={match.isPublic ? "default" : "secondary"}
              className={match.isPublic
                ? "bg-blue-600/60 text-white border-blue-400/30 backdrop-blur-sm"
                : "bg-orange-100/60 text-orange-800 border-orange-200/30 backdrop-blur-sm"
              }
            >
              <FontAwesomeIcon
                icon={match.isPublic ? faGlobe : faLock}
                className="h-3 w-3 mr-1"
              />
              {match.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {match.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-2 italic">
            "{match.description}"
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_IMAGES.myrounds_icon} alt="Date" className={sizeConfig.iconSize} />
            <span className="text-sm text-gray-700">{formatDate(match.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className={`${sizeConfig.iconSize} text-gray-500`} />
            <span className="text-sm text-gray-700">{formatTime(match.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className={`${sizeConfig.iconSize} text-gray-500`} />
            <span className="text-sm text-gray-700">{match._count.players + 1}/{match.maxPlayers} players</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isUserInRound ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-gray-600">
              {isUserInRound ? 'Joined' : 'Available'}
            </span>
          </div>
        </div>

        {/* Course Features */}
        {match.courseFeatures && (
          <div className="mb-4">
            <div className={`bg-${isSimulator ? 'blue' : 'green'}-50 border border-${isSimulator ? 'blue' : 'green'}-200 rounded-lg p-2`}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faStar} className={`${sizeConfig.iconSize} text-${isSimulator ? 'blue' : 'green'}-600`} />
                <span className={`text-xs text-${isSimulator ? 'blue' : 'green'}-800 font-medium truncate`}>
                  {match.courseFeatures}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Creator Info & Actions */}
        <div className="flex items-start justify-between pt-3 border-t border-gray-200">
          <div className="flex flex-col">
            <div className="text-xs text-gray-600">
              Created by <span className="font-medium text-gray-800">
                {match.creator.name || match.creator.email.split('@')[0]}
              </span>
            </div>
            {match.creator.handicap && (
              <div className="text-xs text-gray-500 mt-1">
                Handicap: {match.creator.handicap}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Pending Requests Badge */}
            {isCreator && (match.pendingRequestsCount ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-bold">
                  {match.pendingRequestsCount} pending
                </span>
              </div>
            )}

            {/* Action Button */}
            {isCreator ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onManageClick?.()
                }}
                className={`bg-gradient-to-r from-${isSimulator ? 'blue' : 'green'}-600 to-${isSimulator ? 'blue' : 'green'}-700 hover:from-${isSimulator ? 'blue' : 'green'}-700 hover:to-${isSimulator ? 'blue' : 'green'}-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]`}
              >
                Manage
                {(match.pendingRequestsCount ?? 0) > 0 && (
                  <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                    {match.pendingRequestsCount}
                  </span>
                )}
              </Button>
            ) : match.userStatus === 'pending' ? (
              <Button size="sm" disabled variant="outline">
                Request Pending
              </Button>
            ) : match.userStatus === 'accepted' ? (
              canLeaveRound ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLeaveClick?.()
                  }}
                  disabled={isLoading}
                  className="hover:bg-red-50 border-red-200"
                >
                  {isLoading ? 'Leaving...' : 'Leave Round'}
                </Button>
              ) : (
                <Button size="sm" disabled variant="outline">
                  Joined
                </Button>
              )
            ) : match.userStatus === 'declined' ? (
              <Button size="sm" disabled variant="outline">
                Request Declined
              </Button>
            ) : canRequestJoin ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onJoinClick?.()
                }}
                disabled={isLoading}
                className={`bg-gradient-to-r from-${isSimulator ? 'blue' : 'green'}-600 to-${isSimulator ? 'blue' : 'green'}-700 hover:from-${isSimulator ? 'blue' : 'green'}-700 hover:to-${isSimulator ? 'blue' : 'green'}-800 text-white`}
              >
                {isLoading ? 'Requesting...' : 'Request to Join'}
              </Button>
            ) : (
              <Button size="sm" disabled>
                {match._count.players >= match.maxPlayers ? 'Full' : 'Past Round'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}