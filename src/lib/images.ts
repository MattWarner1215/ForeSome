/**
 * Centralized image URLs for ForeSum app
 * All images are now served from Supabase Storage CDN for better performance
 */

// Background images from Supabase Storage
export const BACKGROUND_IMAGES = {
  golf_public_background: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/backgrounds/golf_public_background.jpg',
  golf_Back_groups: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/backgrounds/golf_Back_groups.jpg',
  clubs_back: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/backgrounds/clubs_back.jpg',
  golf_manage_back: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/backgrounds/golf_manage_back.jpg'
} as const

// Logo images from Supabase Storage
export const LOGO_IMAGES = {
  foresum_logo: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/logos/foresum_logo.png',
  myrounds_icon: 'https://npmksisxmjgnqytcduhs.supabase.co/storage/v1/object/public/logos/MYRounds_Icon.png'
} as const

// Legacy local paths for reference (can be removed after migration)
export const LEGACY_PATHS = {
  '/images/golf_public_background.jpg': BACKGROUND_IMAGES.golf_public_background,
  '/images/golf_Back_groups.jpg': BACKGROUND_IMAGES.golf_Back_groups,
  '/images/clubs_back.jpg': BACKGROUND_IMAGES.clubs_back,
  '/images/golf_manage_back.jpg': BACKGROUND_IMAGES.golf_manage_back,
  '/images/foresum_logo.png': LOGO_IMAGES.foresum_logo,
  '/images/MYRounds_Icon.png': LOGO_IMAGES.myrounds_icon
} as const

// Helper function to get Supabase image URL
export function getImageUrl(imageName: keyof typeof BACKGROUND_IMAGES | keyof typeof LOGO_IMAGES): string {
  if (imageName in BACKGROUND_IMAGES) {
    return BACKGROUND_IMAGES[imageName as keyof typeof BACKGROUND_IMAGES]
  }
  if (imageName in LOGO_IMAGES) {
    return LOGO_IMAGES[imageName as keyof typeof LOGO_IMAGES]
  }
  throw new Error(`Image not found: ${imageName}`)
}