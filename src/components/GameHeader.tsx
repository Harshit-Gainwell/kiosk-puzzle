import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/gameStore'
import { formatTime } from '@/lib/puzzleRules'
import { GRID_CONFIG } from '@/lib/constants'
import { Menu, RotateCcw, LogOut, Clock, Target, AlertCircle } from 'lucide-react'

interface GameHeaderProps {
  onExit: () => void
  onRestart: () => void
  onAdminAccess: () => void
}

export function GameHeader({ onExit, onRestart, onAdminAccess }: GameHeaderProps) {
  const { 
    difficulty, 
    timerSeconds, 
    wrongPlacements, 
    pieces,
  } = useGameStore()
  
  const gridConfig = difficulty ? GRID_CONFIG[difficulty] : null
  const totalPieces = gridConfig ? gridConfig.cols * gridConfig.rows : 0
  const lockedPieces = pieces.filter(p => p.isLocked).length
  const progressPercent = totalPieces > 0 ? (lockedPieces / totalPieces) * 100 : 0
  
  return (
    <header className="flex-shrink-0 bg-card border-b shadow-sm">
      {/* Main header row */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between max-w-screen-2xl mx-auto w-full">
        {/* Left side - Branding and difficulty */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-semibold text-sm">TIL India</span>
            {gridConfig && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-muted rounded-full font-medium">
                {gridConfig.cols}×{gridConfig.rows}
              </span>
            )}
          </div>
        </div>
        
        {/* Center - Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 rounded-lg">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-semibold text-sm">{formatTime(timerSeconds)}</span>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Target className="w-4 h-4" />
            <span className="font-semibold text-sm">{lockedPieces}/{totalPieces}</span>
          </div>
          
          {/* Wrong placements */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
            wrongPlacements > 0 ? 'bg-orange-50 text-orange-700' : 'bg-muted/60 text-muted-foreground'
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold text-sm">{wrongPlacements}</span>
          </div>
        </div>
        
        {/* Right side - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRestart}
            className="h-9 text-xs sm:text-sm px-3 gap-1.5 shadow-sm"
            title="Restart puzzle"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExit}
            className="h-9 text-xs sm:text-sm px-3 gap-1.5 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onAdminAccess}
            className="h-9 w-9 hover:bg-muted"
            title="Admin Panel"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Progress bar - gradient and more visible */}
      <div className="h-1.5 bg-muted">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </header>
  )
}
