'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faTrash, faUser, faSpinner } from '@fortawesome/free-solid-svg-icons'

interface AvatarUploadProps {
  currentAvatar?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8', 
  xl: 'h-12 w-12'
}

export default function AvatarUpload({ currentAvatar, size = 'lg', className = '' }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setPreviewUrl(null)
    },
    onError: (error) => {
      console.error('Upload error:', error)
      setPreviewUrl(null)
    }
  })

  const removeAvatar = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove avatar')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setPreviewUrl(null)
    }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadAvatar.mutate(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeAvatar.mutate()
  }

  const avatarSrc = previewUrl || currentAvatar
  const isLoading = uploadAvatar.isPending || removeAvatar.isPending

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden cursor-pointer group bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 ${isLoading ? 'opacity-75' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleClick}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FontAwesomeIcon 
              icon={faUser} 
              className={`${iconSizes[size]} text-white`}
            />
          </div>
        )}

        {/* Overlay */}
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${isHovering || isLoading ? 'opacity-100' : 'opacity-0'}`}>
          {isLoading ? (
            <FontAwesomeIcon 
              icon={faSpinner} 
              className="h-6 w-6 text-white animate-spin" 
            />
          ) : (
            <FontAwesomeIcon 
              icon={faCamera} 
              className="h-6 w-6 text-white" 
            />
          )}
        </div>

        {/* Remove button */}
        {currentAvatar && !isLoading && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {/* Error display */}
      {(uploadAvatar.error || removeAvatar.error) && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm whitespace-nowrap z-10">
          {uploadAvatar.error?.message || removeAvatar.error?.message}
        </div>
      )}

      {/* Helper text - positioned to align with camera icon */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Click to upload • Max 5MB
        </p>
        <p className="text-xs text-gray-400">
          JPEG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  )
}