import { useState, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/appStore'
import { useAdminStore } from '@/stores/adminStore'
import { useGameStore } from '@/stores/gameStore'
import { verifyPassword } from '@/lib/crypto'
import { GRID_CONFIG, type Difficulty } from '@/lib/constants'
import { GamePlayArea } from '@/components/GamePlayArea'
import { GameHeader } from '@/components/GameHeader'
import { Menu, Play, Trophy, Check, ImageIcon, Puzzle, Zap, Award } from 'lucide-react'
import { formatTime } from '@/lib/puzzleRules'

const DIFFICULTY_OPTIONS: { key: Difficulty; label: string; pieces: number; icon: typeof Puzzle; color: string; description: string }[] = [
  { key: 'easy', label: 'Easy', pieces: 9, icon: Puzzle, color: 'text-green-600 bg-green-50', description: 'Perfect for beginners' },
  { key: 'medium', label: 'Medium', pieces: 16, icon: Zap, color: 'text-amber-600 bg-amber-50', description: 'A moderate challenge' },
  { key: 'hard', label: 'Hard', pieces: 25, icon: Award, color: 'text-red-600 bg-red-50', description: 'For puzzle experts' },
]

export function GameScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const { imageUrl: puzzleImageUrl, passwordHash } = useAdminStore()
  
  const { 
    initGame, 
    tick, 
    resetGame, 
    isInitialized, 
    isComplete,
    timerSeconds,
    wrongPlacements,
  } = useGameStore()
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  
  const [playAreaSize, setPlayAreaSize] = useState({ width: 0, height: 0 })
  const [imageLoadError, setImageLoadError] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Detect mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Timer management
  useEffect(() => {
    if (isPlaying && isInitialized && !isComplete) {
      timerRef.current = setInterval(() => tick(), 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isPlaying, isInitialized, isComplete, tick])
  
  // Fire confetti celebration
  const fireConfetti = useCallback(() => {
    // Left side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 }
    })
    // Right side burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 }
    })
    // Center burst with delay
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 }
      })
    }, 200)
  }, [])
  
  // Show completion dialog and fire confetti
  useEffect(() => {
    if (isComplete && isPlaying) {
      fireConfetti()
      setShowCompletionDialog(true)
    }
  }, [isComplete, isPlaying, fireConfetti])
  
  const handleAreaReady = useCallback((width: number, height: number) => {
    setPlayAreaSize({ width, height })
  }, [])
  
  const handleStartGame = useCallback(() => {
    if (!puzzleImageUrl) return
    setIsPlaying(true)
  }, [puzzleImageUrl])
  
  // Initialize game when play area is ready
  useEffect(() => {
    if (isPlaying && !isInitialized && puzzleImageUrl && playAreaSize.width > 0) {
      initGame(
        puzzleImageUrl,
        selectedDifficulty,
        playAreaSize.width,
        playAreaSize.height,
        isMobile
      )
    }
  }, [isPlaying, isInitialized, puzzleImageUrl, selectedDifficulty, playAreaSize, isMobile, initGame])
  
  const handleExit = useCallback(() => {
    resetGame()
    setIsPlaying(false)
    setShowCompletionDialog(false)
  }, [resetGame])
  
  const handleRestart = useCallback(() => {
    if (!puzzleImageUrl) return
    resetGame()
    setTimeout(() => {
      if (playAreaSize.width > 0) {
        initGame(puzzleImageUrl, selectedDifficulty, playAreaSize.width, playAreaSize.height, isMobile)
      }
    }, 50)
  }, [puzzleImageUrl, selectedDifficulty, playAreaSize, isMobile, resetGame, initGame])
  
  const handleAdminAccess = () => {
    setShowAdminDialog(true)
    setAdminPassword('')
    setPasswordError('')
  }

  const [isVerifying, setIsVerifying] = useState(false)
  
  const handleAdminSubmit = async () => {
    // Don't submit if empty
    if (!adminPassword.trim()) {
      setPasswordError('Please enter a password')
      return
    }
    
    // Don't submit if already verifying
    if (isVerifying) return
    
    if (!passwordHash) {
      setScreen('admin')
      return
    }
    
    setIsVerifying(true)
    setPasswordError('')
    
    try {
      const isValid = await verifyPassword(adminPassword, passwordHash)
      if (isValid) {
        setShowAdminDialog(false)
        resetGame()
        setIsPlaying(false)
        setScreen('admin')
      } else {
        setPasswordError('Incorrect password. Please try again.')
      }
    } finally {
      setIsVerifying(false)
    }
  }
  
  const handlePlayAgain = () => {
    setShowCompletionDialog(false)
    handleRestart()
  }

  // Get grid config for overlay
  const gridConfig = GRID_CONFIG[selectedDifficulty]

  // Admin Dialog JSX (inline to prevent re-creation on each render)
  const adminDialogContent = (
    <Dialog open={showAdminDialog} onOpenChange={(open) => {
      if (!isVerifying) setShowAdminDialog(open)
    }}>
      <DialogContent className="w-[92vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Admin Access</DialogTitle>
          <DialogDescription>Enter the admin password to access settings</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <label htmlFor="game-admin-password" className="sr-only">Admin Password</label>
          <Input
            id="game-admin-password"
            name="game-admin-password"
            type="password"
            placeholder="Enter password"
            value={adminPassword}
            onChange={(e) => { setAdminPassword(e.target.value); setPasswordError('') }}
            onKeyDown={(e) => e.key === 'Enter' && !isVerifying && handleAdminSubmit()}
            className="h-11"
            disabled={isVerifying}
            autoFocus
          />
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-11" 
              onClick={() => setShowAdminDialog(false)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 h-11" 
              onClick={handleAdminSubmit}
              disabled={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Access Admin'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
  
  // Completion Dialog JSX (inline to prevent re-creation on each render)
  const completionDialogContent = (
    <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
      <DialogContent className="w-[92vw] max-w-md mx-auto text-center">
        <div className="py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-gray-700" />
          </div>
          <DialogTitle className="text-2xl mb-2">Congratulations!</DialogTitle>
          <DialogDescription className="text-base">You completed the puzzle!</DialogDescription>
        </div>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{formatTime(timerSeconds)}</p>
            <p className="text-sm text-muted-foreground">Time</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{wrongPlacements}</p>
            <p className="text-sm text-muted-foreground">Wrong Moves</p>
          </div>
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 h-11" onClick={handleExit}>Change Level</Button>
          <Button className="flex-1 h-11" onClick={handlePlayAgain}>Play Again</Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Game Playing State
  if (isPlaying) {
    return (
      <div className="h-screen h-[100dvh] flex flex-col bg-background overflow-hidden">
        <GameHeader 
          onExit={handleExit}
          onRestart={handleRestart}
          onAdminAccess={handleAdminAccess}
        />
        
        <main className="flex-1 min-h-0 overflow-hidden">
          <GamePlayArea onAreaReady={handleAreaReady} />
        </main>

        {adminDialogContent}
        {completionDialogContent}
      </div>
    )
  }

  // Level Selection State - Refined layout
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card shadow-sm">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <img src="/til-logo.png" alt="TIL Tractors India" className="h-32 sm:h-40 w-auto object-contain" />
            <span className="text-xs text-muted-foreground border-l pl-3 hidden sm:block">Crane Puzzle</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleAdminAccess} title="Admin Panel" className="hover:bg-muted">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content - Centered card layout */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-pattern-grid">
        <div className="w-[95%] max-w-7xl bg-card rounded-2xl shadow-xl border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image Preview with Grid Overlay */}
            <div className="relative p-6 sm:p-8 lg:p-12 bg-muted/40 flex items-center justify-center min-h-[350px] lg:min-h-[450px]">
              {puzzleImageUrl && !imageLoadError ? (
                <div className="relative max-w-full max-h-[400px] lg:max-h-[500px]">
                  <div className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={puzzleImageUrl}
                      alt="Puzzle preview"
                      className="max-w-full max-h-[380px] lg:max-h-[480px] w-auto h-auto object-contain"
                      onError={() => setImageLoadError(true)}
                    />
                    {/* Grid overlay - inner lines only */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Vertical lines */}
                      {Array.from({ length: gridConfig.cols - 1 }).map((_, i) => (
                        <div
                          key={`v-${i}`}
                          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                          style={{ left: `${((i + 1) / gridConfig.cols) * 100}%` }}
                        />
                      ))}
                      {/* Horizontal lines */}
                      {Array.from({ length: gridConfig.rows - 1 }).map((_, i) => (
                        <div
                          key={`h-${i}`}
                          className="absolute left-0 right-0 h-0.5 bg-white/60"
                          style={{ top: `${((i + 1) / gridConfig.rows) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Grid label badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-bold shadow-lg">
                    {gridConfig.cols}×{gridConfig.rows} Grid
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[400px] aspect-square rounded-xl bg-muted/80 flex items-center justify-center flex-col gap-3 p-6 border-2 border-dashed border-muted-foreground/30">
                  <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-center text-sm">
                    {imageLoadError ? 'Image failed to load' : 'No image loaded'}
                  </p>
                </div>
              )}
            </div>

            {/* Difficulty Selection */}
            <div className="p-6 sm:p-8 lg:p-12 flex flex-col border-t md:border-t-0 md:border-l">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-1">Select Difficulty</h2>
                <p className="text-sm text-muted-foreground">Choose your challenge level</p>
              </div>
              
              {/* Difficulty options */}
              <div className="space-y-3 flex-1">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const isSelected = selectedDifficulty === opt.key
                  const IconComponent = opt.icon
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedDifficulty(opt.key)}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${opt.color}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold">{opt.label}</span>
                          <span className="text-lg font-bold">{opt.pieces} <span className="text-xs font-normal text-muted-foreground">pieces</span></span>
                        </div>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50'}
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Start Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  className="w-full h-12 text-base gap-2 font-semibold shadow-md"
                  size="lg"
                  onClick={handleStartGame}
                  disabled={!puzzleImageUrl}
                >
                  <Play className="w-5 h-5" />
                  Start Game
                </Button>
                
                {!puzzleImageUrl && (
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    No puzzle image loaded. Access admin panel to upload one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {adminDialogContent}
    </div>
  )
}
