'use client'

import { useState, useRef } from 'react'
import { Camera, User, Loader2 } from 'lucide-react'
import PhotoEditor from './PhotoEditor'

interface ProfilePhotoUploadProps {
  currentPhoto?: string | null
  onPhotoChange: (dataUrl: string) => Promise<void>
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

export default function ProfilePhotoUpload({
  currentPhoto,
  onPhotoChange,
  size = 'lg',
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB')
      return
    }

    // Read file as data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setSelectedImage(dataUrl)
      setShowEditor(true)
    }
    reader.readAsDataURL(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async (editedDataUrl: string) => {
    setShowEditor(false)
    setIsUploading(true)

    try {
      await onPhotoChange(editedDataUrl)
    } catch (error) {
      console.error('Failed to upload photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setIsUploading(false)
      setSelectedImage(null)
    }
  }

  const handleCancel = () => {
    setShowEditor(false)
    setSelectedImage(null)
  }

  return (
    <>
      <div className="relative group">
        {/* Photo Display */}
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#111] flex items-center justify-center`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : currentPhoto ? (
            <img
              src={currentPhoto}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-1/2 h-1/2 text-gray-600" />
          )}
        </div>

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photo Editor Modal */}
      {showEditor && selectedImage && (
        <PhotoEditor
          image={selectedImage}
          onSave={handleSave}
          onCancel={handleCancel}
          aspectRatio={1}
          outputSize={{ width: 400, height: 400 }}
        />
      )}
    </>
  )
}
