import { cn } from '@/lib/utils'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlagCheckered, faGolfBall, faGlobe, faLock, faFlag } from '@fortawesome/free-solid-svg-icons'

interface GolfCourseAvatarProps {
  courseName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  roundType?: 'my' | 'public' | 'private' | 'completed'
}

export function GolfCourseAvatar({ 
  courseName, 
  size = 'md', 
  className,
  roundType = 'public'
}: GolfCourseAvatarProps) {
  // Get icon based on round type or use golf ball as default
  const getGolfIcon = (type: string) => {
    switch (type) {
      case 'my':
        return faFlag
      case 'public':
        return faGolfBall
      case 'private':
        return faFlagCheckered
      case 'completed':
        return faFlag
      default:
        return faGolfBall
    }
  }

  // Get consistent color based on round type
  const getAvatarColor = (type: string): string => {
    switch (type) {
      case 'my':
        return 'from-green-500 to-green-600'
      case 'public':
        return 'from-blue-500 to-blue-600'
      case 'private':
        return 'from-orange-500 to-orange-600'
      case 'completed':
        return 'from-emerald-500 to-emerald-600'
      default:
        return 'from-green-500 to-green-600'
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const icon = getGolfIcon(roundType)
  const colorClass = getAvatarColor(roundType)

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={courseName}
    >
      <FontAwesomeIcon 
        icon={icon} 
        className={iconSizeClasses[size]}
      />
    </div>
  )
}