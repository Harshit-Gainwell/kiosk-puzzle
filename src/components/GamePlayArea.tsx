import { useRef, useEffect, useCallback, useState } from 'react'
import { useGameStore, type Piece } from '@/stores/gameStore'
import { 
  GRID_CONFIG, 
  MIN_TOUCH_TARGET,
  PIECE_SHADOW,
  PIECE_SHADOW_DRAGGING,
} from '@/lib/constants'

interface GamePlayAreaProps {
  onAreaReady: (width: number, height: number) => void
}

export function GamePlayArea({ onAreaReady }: GamePlayAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null)
  
  const {
    difficulty,
    imageUrl,
    boardWidth,
    boardHeight,
    pieceWidth,
    pieceHeight,
    pieces,
    scale,
    imageWidth,
    imageHeight,
    isInitialized,
    boardOffsetX,
    boardOffsetY,
    dropPiece,
  } = useGameStore()
  
  // Track dragging state
  const [draggingPiece, setDraggingPiece] = useState<string | null>(null)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Report area size on mount and resize
  useEffect(() => {
    const area = areaRef.current
    if (!area) return
    
    const reportSize = () => {
      const rect = area.getBoundingClientRect()
      onAreaReady(rect.width, rect.height)
    }
    
    reportSize()
    
    const observer = new ResizeObserver(reportSize)
    observer.observe(area)
    
    return () => observer.disconnect()
  }, [onAreaReady])
  
  // Handle pointer down on a piece
  const handlePiecePointerDown = useCallback((e: React.PointerEvent, piece: Piece) => {
    if (piece.isLocked) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    
    const rect = target.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    
    setDragPosition({ x: e.clientX, y: e.clientY })
    setDraggingPiece(piece.id)
  }, [])
  
  // Handle pointer move (on document level for smooth dragging)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingPiece) return
    e.preventDefault()
    setDragPosition({ x: e.clientX, y: e.clientY })
  }, [draggingPiece])
  
  // Handle pointer up - drop the piece
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!draggingPiece || !areaRef.current) return
    
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.releasePointerCapture(e.pointerId)
    
    const areaRect = areaRef.current.getBoundingClientRect()
    const dropX = e.clientX - areaRect.left - dragOffset.x
    const dropY = e.clientY - areaRect.top - dragOffset.y
    
    // Check if dropped on board
    const isOnBoard = 
      dropX >= boardOffsetX - pieceWidth * 0.5 &&
      dropX <= boardOffsetX + boardWidth - pieceWidth * 0.5 &&
      dropY >= boardOffsetY - pieceHeight * 0.5 &&
      dropY <= boardOffsetY + boardHeight - pieceHeight * 0.5
    
    // Relative to board for snap check
    const boardRelativeX = dropX - boardOffsetX
    const boardRelativeY = dropY - boardOffsetY
    
    dropPiece(draggingPiece, boardRelativeX, boardRelativeY, dropX, dropY, isOnBoard)
    setDraggingPiece(null)
  }, [draggingPiece, dragOffset, boardOffsetX, boardOffsetY, boardWidth, boardHeight, pieceWidth, pieceHeight, dropPiece])
  
  // Handle pointer cancel
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (draggingPiece) {
      const target = e.currentTarget as HTMLElement
      target.releasePointerCapture(e.pointerId)
      setDraggingPiece(null)
    }
  }, [draggingPiece])
  
  // Render a single piece
  const renderPiece = (piece: Piece, isDragging: boolean) => {
    const bgPosX = -piece.sourceX * scale
    const bgPosY = -piece.sourceY * scale
    const bgWidth = imageWidth * scale
    const bgHeight = imageHeight * scale
    
    let visualX = piece.currentX
    let visualY = piece.currentY
    
    if (isDragging && areaRef.current) {
      const areaRect = areaRef.current.getBoundingClientRect()
      visualX = dragPosition.x - areaRect.left - dragOffset.x
      visualY = dragPosition.y - areaRect.top - dragOffset.y
    }
    
    return (
      <div
        key={piece.id}
        className={`
          absolute touch-none select-none rounded-md
          ${piece.isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
          ${isDragging ? 'cursor-grabbing z-[100]' : 'z-10'}
        `}
        style={{
          left: visualX,
          top: visualY,
          width: pieceWidth,
          height: pieceHeight,
          backgroundImage: `url(${imageUrl})`,
          backgroundPosition: `${bgPosX}px ${bgPosY}px`,
          backgroundSize: `${bgWidth}px ${bgHeight}px`,
          backgroundRepeat: 'no-repeat',
          minWidth: MIN_TOUCH_TARGET,
          minHeight: MIN_TOUCH_TARGET,
          boxShadow: isDragging 
            ? PIECE_SHADOW_DRAGGING 
            : PIECE_SHADOW,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}
        onPointerDown={(e) => handlePiecePointerDown(e, piece)}
      />
    )
  }
  
  if (!isInitialized) {
    return (
      <div 
        ref={areaRef}
        className="w-full h-full flex items-center justify-center bg-pattern-grid"
      >
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-muted-foreground font-medium">Preparing puzzle...</p>
        </div>
      </div>
    )
  }
  
  // Separate locked and unlocked pieces
  const lockedPieces = pieces.filter(p => p.isLocked)
  const unlockedPieces = pieces.filter(p => !p.isLocked)
  const currentDraggingPiece = pieces.find(p => p.id === draggingPiece)
  
  return (
    <div 
      ref={areaRef}
      className="w-full h-full relative overflow-hidden bg-pattern-grid"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Board container */}
      <div
        className="absolute rounded-xl overflow-hidden"
        style={{
          left: boardOffsetX,
          top: boardOffsetY,
          width: boardWidth,
          height: boardHeight,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 20px 50px -15px rgba(0, 0, 0, 0.25), 0 10px 25px -10px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Grid overlay - Clean grayscale lines */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vertical lines */}
          {Array.from({ length: difficulty ? GRID_CONFIG[difficulty].cols - 1 : 0 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0"
              style={{ 
                left: (i + 1) * pieceWidth,
                width: 1,
                background: 'rgba(0, 0, 0, 0.12)',
              }}
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: difficulty ? GRID_CONFIG[difficulty].rows - 1 : 0 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0"
              style={{ 
                top: (i + 1) * pieceHeight,
                height: 1,
                background: 'rgba(0, 0, 0, 0.12)',
              }}
            />
          ))}
        </div>
        
        {/* Locked pieces on board (positioned relative to board) */}
        {lockedPieces.map(piece => {
          const bgPosX = -piece.sourceX * scale
          const bgPosY = -piece.sourceY * scale
          const bgWidth = imageWidth * scale
          const bgHeight = imageHeight * scale
          
          return (
            <div
              key={piece.id}
              className="absolute"
              style={{
                left: piece.currentX - boardOffsetX,
                top: piece.currentY - boardOffsetY,
                width: pieceWidth,
                height: pieceHeight,
                backgroundImage: `url(${imageUrl})`,
                backgroundPosition: `${bgPosX}px ${bgPosY}px`,
                backgroundSize: `${bgWidth}px ${bgHeight}px`,
                backgroundRepeat: 'no-repeat',
              }}
            />
          )
        })}
      </div>
      
      {/* Board label */}
      <div 
        className="absolute px-3 py-1.5 text-xs font-medium rounded-md shadow-md bg-gray-800 text-white"
        style={{
          left: boardOffsetX,
          top: boardOffsetY - 32,
        }}
      >
        Drop pieces here
      </div>
      
      {/* Unlocked pieces (scattered around, positioned relative to play area) */}
      {unlockedPieces
        .filter(p => p.id !== draggingPiece)
        .map(piece => renderPiece(piece, false))}
      
      {/* Dragging piece rendered last (on top) */}
      {currentDraggingPiece && renderPiece(currentDraggingPiece, true)}
    </div>
  )
}
