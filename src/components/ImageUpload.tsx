import { useCallback, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Upload, ImageIcon, Check } from 'lucide-react'

interface ImageUploadProps {
  currentImageUrl: string | null
  onImageSelect: (blob: Blob) => void
  compact?: boolean
}

export function ImageUpload({ currentImageUrl, onImageSelect, compact = false }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB limit

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP)')
      return
    }
    
    if (file.size > MAX_FILE_SIZE) {
      alert('Image is too large. Please select an image under 10MB.')
      return
    }
    
    onImageSelect(file)
  }, [onImageSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    e.target.value = ''
  }

  if (compact) {
    return (
      <Card
        className={`
          relative cursor-pointer transition-all
          border-2 border-dashed
          active:scale-[0.98]
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : currentImageUrl 
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        
        <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className={`
            w-10 h-10 sm:w-12 sm:h-12 
            rounded-lg flex items-center justify-center flex-shrink-0
            ${currentImageUrl 
              ? 'bg-green-500/10 text-green-600' 
              : isDragging 
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }
          `}>
            {currentImageUrl ? (
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : isDragging ? (
              <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-medium truncate">
              {currentImageUrl 
                ? 'Image uploaded' 
                : isDragging 
                  ? 'Drop image here'
                  : 'Drop image or click to browse'
              }
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentImageUrl ? 'Click to replace' : 'JPG, PNG, WebP'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`
        relative w-full aspect-video cursor-pointer
        border-2 border-dashed transition-colors
        flex items-center justify-center overflow-hidden
        active:scale-[0.99]
        ${isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50'
        }
      `}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      
      {currentImageUrl ? (
        <div className="absolute inset-0">
          <img
            src={currentImageUrl}
            alt="Puzzle preview"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="text-white text-center">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Click to replace</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center p-4 sm:p-6">
          <div className={`
            w-14 h-14 sm:w-16 sm:h-16 
            mx-auto mb-3 sm:mb-4 rounded-full 
            flex items-center justify-center
            ${isDragging ? 'bg-primary/10' : 'bg-muted'}
          `}>
            {isDragging ? (
              <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            ) : (
              <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm sm:text-base font-medium text-foreground mb-1">
            {isDragging ? 'Drop image here' : 'Drop image here or click to browse'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Supports JPG, PNG, WebP
          </p>
        </div>
      )}
    </Card>
  )
}
