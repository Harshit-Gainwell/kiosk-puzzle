import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ImageUpload'
import { useAppStore } from '@/stores/appStore'
import { useAdminStore } from '@/stores/adminStore'
import { ImageIcon } from 'lucide-react'

export function AdminPanel() {
  const setScreen = useAppStore((s) => s.setScreen)
  
  const { 
    imageUrl, 
    isLoading, 
    setImage, 
    clearImage,
    saveToStorage,
    passwordHash 
  } = useAdminStore()
  
  const [password, setPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Handle image load error - likely corrupted data
  const handleImageError = () => {
    setImageError(true)
    clearImage()
  }

  const handleImageSelect = (blob: Blob) => {
    setImageError(false)
    setImage(blob)
  }

  const handleStartSession = async () => {
    if (!imageUrl) return
    
    setIsSaving(true)
    try {
      await saveToStorage(password)
      setScreen('game')
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const canStartSession = imageUrl !== null
  const needsPassword = !passwordHash

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card shadow-sm">
        <div className="h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src="/til-logo.png" alt="TIL Tractors India" className="h-32 sm:h-40 w-auto object-contain" />
            <span className="text-xs text-muted-foreground border-l pl-3 hidden sm:block">Admin Panel</span>
          </div>
        </div>
      </header>

      {/* Main Content - Centered card layout */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-pattern-grid">
        <div className="w-[95%] max-w-7xl bg-card rounded-2xl shadow-xl border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image Preview Area */}
            <div className="p-6 sm:p-8 lg:p-12 flex items-center justify-center bg-muted/40 min-h-[350px] lg:min-h-[550px]">
              {imageUrl && !imageError ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Puzzle preview"
                    onError={handleImageError}
                    className="max-w-full max-h-[480px] object-contain rounded-xl shadow-lg border-4 border-white"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground px-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/80 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <ImageIcon className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium mb-1">No image uploaded</p>
                  <p className="text-sm text-muted-foreground">Upload an image to preview</p>
                </div>
              )}
            </div>

            {/* Controls Panel */}
            <div className="flex flex-col border-t lg:border-t-0 lg:border-l">
              {/* Scrollable Content */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-5">
                {/* Title Section */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1">Configure Puzzle</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload an image and set your admin password
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                    Puzzle Image
                  </label>
                  <ImageUpload 
                    currentImageUrl={imageUrl} 
                    onImageSelect={handleImageSelect}
                    compact
                  />
                  {imageUrl && (
                    <p className="text-xs text-muted-foreground pl-8">
                      Click to replace image
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <label htmlFor="admin-password" className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                    {needsPassword ? 'Set Admin Password' : 'Change Password'}
                  </label>
                  <Input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    placeholder={needsPassword ? 'Enter password' : 'Leave blank to keep current'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 text-base"
                  />
                  {needsPassword && (
                    <p className="text-xs text-muted-foreground pl-8">
                      Required to protect admin access
                    </p>
                  )}
                </div>
              </div>

              {/* Fixed Bottom Action */}
              <div className="flex-shrink-0 p-4 sm:p-6 lg:p-8 pt-0">
                <Button
                  className="w-full h-12 text-base font-semibold shadow-md"
                  size="lg"
                  onClick={handleStartSession}
                  disabled={!canStartSession || isSaving || (needsPassword && !password.trim())}
                >
                  {isSaving ? 'Saving...' : 'Start Session →'}
                </Button>
                {!canStartSession && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Upload an image to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
