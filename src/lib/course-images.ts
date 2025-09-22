// Course image mapping for background images in round cards
// Maps golf course names to their appropriate Supabase storage images

export interface CourseImageMapping {
  courseName: string
  logoUrl?: string
  backgroundUrl?: string
  heroUrl?: string
  type: 'traditional' | 'indoor-simulator' | 'resort' | 'municipal'
  themeColors?: {
    primary: string
    secondary: string
    accent: string
  }
}

// Supabase storage base URLs
const SUPABASE_STORAGE_BASE = 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public'

// X-Golf specific mappings
const XGOLF_MAPPINGS: CourseImageMapping[] = [
  {
    courseName: 'X-Golf Columbus',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af', // blue-800
      secondary: '#3b82f6', // blue-500
      accent: '#60a5fa' // blue-400
    }
  },
  {
    courseName: 'X-Golf Cincinnati',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Broadview Heights',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Toledo',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Perrysburg',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Solon',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf North Canton',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Fairlawn',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'X-Golf Powell',
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  }
]

// Traditional golf course mappings using existing images
const TRADITIONAL_COURSE_MAPPINGS: CourseImageMapping[] = [
  {
    courseName: 'Cumberland Trail Golf Club',
    logoUrl: '/images/course-logos/cumberland-trail-logo.png',
    backgroundUrl: '/images/course-backgrounds/cumberland-trail-course.jpg',
    type: 'traditional',
    themeColors: {
      primary: '#0B6025', // Cumberland Trail brand green
      secondary: '#970026', // Cumberland Trail brand red
      accent: '#efcb7e' // Cumberland Trail brand yellow
    }
  },
  {
    courseName: 'Muirfield Village Golf Club',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf-course-bg.jpg`,
    type: 'resort',
    themeColors: {
      primary: '#166534', // green-800
      secondary: '#16a34a', // green-600
      accent: '#22c55e' // green-500
    }
  },
  {
    courseName: 'Scioto Country Club',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf-course-bg.jpg`,
    type: 'traditional',
    themeColors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#22c55e'
    }
  },
  {
    courseName: 'The Virtues Golf Club',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf_Back_groups.jpg`,
    type: 'resort',
    themeColors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#22c55e'
    }
  },
  {
    courseName: 'Champions Golf Course',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf_manage_back.jpg`,
    type: 'municipal',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'Raymond Memorial Golf Course',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf_back_profile.jpeg`,
    type: 'municipal',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  {
    courseName: 'Tartan Fields Golf Club',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/clubs_back.jpg`,
    type: 'traditional',
    themeColors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#22c55e'
    }
  }
]

// Default course mappings for common course types
const DEFAULT_MAPPINGS: Record<string, CourseImageMapping> = {
  'country-club': {
    courseName: 'Default Country Club',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf-course-bg.jpg`,
    type: 'traditional',
    themeColors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#22c55e'
    }
  },
  'municipal': {
    courseName: 'Default Municipal Course',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf_public_background.jpg`,
    type: 'municipal',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  },
  'resort': {
    courseName: 'Default Resort Course',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/golf_Back_groups.jpg`,
    type: 'resort',
    themeColors: {
      primary: '#166534',
      secondary: '#16a34a',
      accent: '#22c55e'
    }
  },
  'indoor-simulator': {
    courseName: 'Default Indoor Simulator',
    backgroundUrl: `${SUPABASE_STORAGE_BASE}/backgrounds/xgolf-hero.webp`,
    logoUrl: `${SUPABASE_STORAGE_BASE}/logos/xgolf-logo.png`,
    type: 'indoor-simulator',
    themeColors: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa'
    }
  }
}

// Combine all mappings
const ALL_COURSE_MAPPINGS = [
  ...XGOLF_MAPPINGS,
  ...TRADITIONAL_COURSE_MAPPINGS
]

/**
 * Get course image mapping for a given course name
 */
export function getCourseImageMapping(courseName: string): CourseImageMapping {
  // First try exact match
  const exactMatch = ALL_COURSE_MAPPINGS.find(
    mapping => mapping.courseName.toLowerCase() === courseName.toLowerCase()
  )

  if (exactMatch) {
    return exactMatch
  }

  // Check for X-Golf courses (case-insensitive partial match)
  if (courseName.toLowerCase().includes('x-golf') || courseName.toLowerCase().includes('xgolf')) {
    return DEFAULT_MAPPINGS['indoor-simulator']
  }

  // Check for common course type keywords
  const lowerCourseName = courseName.toLowerCase()

  if (lowerCourseName.includes('country club') || lowerCourseName.includes('private')) {
    return DEFAULT_MAPPINGS['country-club']
  }

  if (lowerCourseName.includes('municipal') || lowerCourseName.includes('city') || lowerCourseName.includes('public')) {
    return DEFAULT_MAPPINGS['municipal']
  }

  if (lowerCourseName.includes('resort') || lowerCourseName.includes('club')) {
    return DEFAULT_MAPPINGS['resort']
  }

  // Default fallback
  return DEFAULT_MAPPINGS['country-club']
}

/**
 * Check if a course is an indoor simulator
 */
export function isIndoorSimulator(courseName: string): boolean {
  const mapping = getCourseImageMapping(courseName)
  return mapping.type === 'indoor-simulator'
}

/**
 * Get theme colors for a course
 */
export function getCourseThemeColors(courseName: string) {
  const mapping = getCourseImageMapping(courseName)
  return mapping.themeColors || {
    primary: '#166534',
    secondary: '#16a34a',
    accent: '#22c55e'
  }
}

/**
 * Get all available course types
 */
export function getCourseTypes() {
  return ['traditional', 'indoor-simulator', 'resort', 'municipal'] as const
}