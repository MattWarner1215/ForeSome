'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCamera, faTrash, faSpinner, faUsers } from '@fortawesome/free-solid-svg-icons'

interface GroupIconUploadProps {
  groupId: string
  currentIcon?: string | null
  onIconChange: (iconUrl: string | null) => void
  disabled?: boolean
  defaultIcon?: string
}

export function GroupIconUpload({
  groupId,
  currentIcon,
  onIconChange,
  disabled = false,
  defaultIcon = "/images/owner_icon.png?v=1"
}: GroupIconUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('icon', file)

      const response = await fetch(`/api/groups/${groupId}/icon`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload icon')
      }

      const data = await response.json()
      onIconChange(data.iconUrl)
    } catch (error) {
      console.error('Error uploading group icon:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload icon')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteIcon = async () => {
    if (!currentIcon) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/groups/${groupId}/icon`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete icon')
      }

      onIconChange(null)
    } catch (error) {
      console.error('Error deleting group icon:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete icon')
    } finally {
      setIsDeleting(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Icon Preview */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
          <img
            src={(currentIcon && currentIcon.trim() !== '') ? currentIcon : defaultIcon}
            alt={(currentIcon && currentIcon.trim() !== '') ? "Group icon" : "Default group icon"}
            className="w-full h-full object-contain"
            onError={(e) => {
              const img = e.target as HTMLImageElement
              if (img.src !== defaultIcon) {
                img.src = defaultIcon
              }
            }}
          />
        </div>

        {/* Upload Button Overlay */}
        {!disabled && (
          <button
            onClick={triggerFileSelect}
            disabled={isUploading || isDeleting}
            className="absolute inset-0 w-24 h-24 rounded-full bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group"
            title="Upload new icon"
          >
            {isUploading ? (
              <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 text-white animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faCamera} className="h-6 w-6 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={triggerFileSelect}
            disabled={isUploading || isDeleting}
            className="flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                <span>{currentIcon && currentIcon.trim() !== '' ? 'Change' : 'Upload'}</span>
              </>
            )}
          </Button>

          {currentIcon && currentIcon.trim() !== '' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteIcon}
              disabled={isUploading || isDeleting}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              {isDeleting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                  <span>Remove</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
          {error}
        </div>
      )}

      {/* Help Text */}
      {!disabled && (
        <p className="text-xs text-gray-500 text-center max-w-xs">
          Upload a JPEG, PNG, GIF, or WebP image (max 5MB)
        </p>
      )}
    </div>
  )
}