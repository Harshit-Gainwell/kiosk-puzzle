import { create } from 'zustand'
import { sliceImage, type PieceDefinition } from '@/lib/imageSlicer'
import { 
  isWithinSnapTolerance, 
  getTargetPosition, 
  shuffleArray,
} from '@/lib/puzzleRules'
import { GRID_CONFIG, type Difficulty } from '@/lib/constants'

export interface Piece extends PieceDefinition {
  currentX: number  // Position relative to play area
  currentY: number
  isLocked: boolean
}

interface GameState {
  // Game configuration
  difficulty: Difficulty | null
  imageUrl: string | null
  
  // Puzzle dimensions
  imageWidth: number
  imageHeight: number
  boardWidth: number
  boardHeight: number
  pieceWidth: number
  pieceHeight: number
  scale: number
  
  // Board position within play area
  boardOffsetX: number
  boardOffsetY: number
  
  // Play area size
  playAreaWidth: number
  playAreaHeight: number
  
  // Piece state
  pieces: Piece[]
  
  // Game progress
  timerSeconds: number
  wrongPlacements: number
  isComplete: boolean
  isInitialized: boolean
  
  // Actions
  initGame: (
    imageUrl: string, 
    difficulty: Difficulty, 
    playAreaWidth: number, 
    playAreaHeight: number,
    isMobile: boolean
  ) => Promise<void>
  dropPiece: (
    pieceId: string, 
    boardRelativeX: number, 
    boardRelativeY: number,
    areaX: number,
    areaY: number,
    droppedOnBoard: boolean
  ) => void
  movePiecePosition: (pieceId: string, x: number, y: number) => void
  tick: () => void
  resetGame: () => void
}

// Generate random positions for pieces scattered around the board
function generateScatteredPositions(
  pieceCount: number,
  pieceWidth: number,
  pieceHeight: number,
  playAreaWidth: number,
  playAreaHeight: number,
  boardOffsetX: number,
  boardOffsetY: number,
  boardWidth: number,
  boardHeight: number,
  isMobile: boolean
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const padding = 10
  
  if (isMobile) {
    // Mobile: Grid layout below the board
    const startY = boardOffsetY + boardHeight + 20
    const availableWidth = playAreaWidth - padding * 2
    const availableHeight = playAreaHeight - startY - padding
    
    // Calculate how many columns fit
    const cols = Math.floor(availableWidth / (pieceWidth + padding))
    const actualCols = Math.max(cols, 3)
    
    // Check if we need to scale down
    const rowsNeeded = Math.ceil(pieceCount / actualCols)
    let scale = 1
    if (rowsNeeded * (pieceHeight + padding) > availableHeight) {
      scale = availableHeight / (rowsNeeded * (pieceHeight + padding))
    }
    
    for (let i = 0; i < pieceCount; i++) {
      const col = i % actualCols
      const row = Math.floor(i / actualCols)
      positions.push({
        x: padding + col * (pieceWidth + padding) * scale,
        y: startY + row * (pieceHeight + padding) * scale,
      })
    }
  } else {
    // Desktop: Scatter pieces around the centered board (left, right, and bottom)
    const zones: { minX: number; maxX: number; minY: number; maxY: number }[] = []
    
    // Left zone (left of board)
    const leftZoneWidth = boardOffsetX - padding - 20
    if (leftZoneWidth > pieceWidth) {
      zones.push({
        minX: padding,
        maxX: boardOffsetX - 20,
        minY: padding,
        maxY: playAreaHeight - pieceHeight - padding,
      })
    }
    
    // Right zone (right of board)
    const rightZoneStart = boardOffsetX + boardWidth + 20
    const rightZoneWidth = playAreaWidth - rightZoneStart - padding
    if (rightZoneWidth > pieceWidth) {
      zones.push({
        minX: rightZoneStart,
        maxX: playAreaWidth - pieceWidth - padding,
        minY: padding,
        maxY: playAreaHeight - pieceHeight - padding,
      })
    }
    
    // Bottom zone (below board)
    const bottomZoneStart = boardOffsetY + boardHeight + 20
    const bottomZoneHeight = playAreaHeight - bottomZoneStart - padding
    if (bottomZoneHeight > pieceHeight) {
      zones.push({
        minX: padding,
        maxX: playAreaWidth - pieceWidth - padding,
        minY: bottomZoneStart,
        maxY: playAreaHeight - pieceHeight - padding,
      })
    }
    
    // Fallback: if no zones are large enough, use full area except board
    if (zones.length === 0) {
      zones.push({
        minX: padding,
        maxX: playAreaWidth - pieceWidth - padding,
        minY: padding,
        maxY: playAreaHeight - pieceHeight - padding,
      })
    }
    
    for (let i = 0; i < pieceCount; i++) {
      // Distribute pieces evenly across zones
      const zone = zones[i % zones.length]
      
      // Random position within zone
      const x = zone.minX + Math.random() * Math.max(0, zone.maxX - zone.minX)
      const y = zone.minY + Math.random() * Math.max(0, zone.maxY - zone.minY)
      
      positions.push({ x, y })
    }
  }
  
  return shuffleArray(positions)
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  difficulty: null,
  imageUrl: null,
  imageWidth: 0,
  imageHeight: 0,
  boardWidth: 0,
  boardHeight: 0,
  pieceWidth: 0,
  pieceHeight: 0,
  scale: 1,
  boardOffsetX: 0,
  boardOffsetY: 0,
  playAreaWidth: 0,
  playAreaHeight: 0,
  pieces: [],
  timerSeconds: 0,
  wrongPlacements: 0,
  isComplete: false,
  isInitialized: false,
  
  initGame: async (imageUrl, difficulty, playAreaWidth, playAreaHeight, isMobile) => {
    // Calculate board size - balanced for centered layout with room for pieces
    // Desktop: ~45% width, centered horizontally, slightly above center vertically
    // Mobile: ~85% width, positioned top-center
    const boardMaxWidth = isMobile ? playAreaWidth * 0.85 : playAreaWidth * 0.45
    const boardMaxHeight = isMobile ? playAreaHeight * 0.50 : playAreaHeight * 0.70
    
    // Slice the image
    const sliceResult = await sliceImage(
      imageUrl,
      difficulty,
      boardMaxWidth,
      boardMaxHeight
    )
    
    // Calculate board offset - centered horizontally, slightly above center vertically
    const boardOffsetX = (playAreaWidth - sliceResult.boardWidth) / 2
    const boardOffsetY = isMobile 
      ? 50 
      : Math.max(50, (playAreaHeight - sliceResult.boardHeight) / 2 - 40) // Slightly above center
    
    const { cols, rows } = GRID_CONFIG[difficulty]
    const totalPieces = cols * rows
    
    // Generate scattered positions for pieces
    const scatteredPositions = generateScatteredPositions(
      totalPieces,
      sliceResult.pieceWidth,
      sliceResult.pieceHeight,
      playAreaWidth,
      playAreaHeight,
      boardOffsetX,
      boardOffsetY,
      sliceResult.boardWidth,
      sliceResult.boardHeight,
      isMobile
    )
    
    // Create pieces with scattered positions
    const pieces: Piece[] = sliceResult.pieces.map((def, index) => ({
      ...def,
      currentX: scatteredPositions[index]?.x ?? 0,
      currentY: scatteredPositions[index]?.y ?? 0,
      isLocked: false,
    }))
    
    set({
      difficulty,
      imageUrl,
      imageWidth: sliceResult.imageWidth,
      imageHeight: sliceResult.imageHeight,
      boardWidth: sliceResult.boardWidth,
      boardHeight: sliceResult.boardHeight,
      pieceWidth: sliceResult.pieceWidth,
      pieceHeight: sliceResult.pieceHeight,
      scale: sliceResult.scale,
      boardOffsetX,
      boardOffsetY,
      playAreaWidth,
      playAreaHeight,
      pieces,
      timerSeconds: 0,
      wrongPlacements: 0,
      isComplete: false,
      isInitialized: true,
    })
  },
  
  dropPiece: (pieceId, boardRelativeX, boardRelativeY, areaX, areaY, droppedOnBoard) => {
    const state = get()
    const pieceIndex = state.pieces.findIndex(p => p.id === pieceId)
    if (pieceIndex === -1) return
    
    const piece = state.pieces[pieceIndex]
    if (piece.isLocked) return
    
    const newPieces = [...state.pieces]
    const updatedPiece = { ...piece }
    
    if (droppedOnBoard) {
      // Check if correct position
      const target = getTargetPosition(
        piece.correctRow,
        piece.correctCol,
        state.pieceWidth,
        state.pieceHeight
      )
      
      const isCorrect = isWithinSnapTolerance(
        boardRelativeX,
        boardRelativeY,
        target.x,
        target.y,
        state.pieceWidth,
        state.pieceHeight
      )
      
      if (isCorrect) {
        // Snap to correct position (in area coordinates)
        updatedPiece.currentX = state.boardOffsetX + target.x
        updatedPiece.currentY = state.boardOffsetY + target.y
        updatedPiece.isLocked = true
        
        newPieces[pieceIndex] = updatedPiece
        
        const isComplete = newPieces.every(p => p.isLocked)
        
        set({
          pieces: newPieces,
          isComplete,
        })
      } else {
        // Wrong position - increment counter, piece stays where dropped
        updatedPiece.currentX = areaX
        updatedPiece.currentY = areaY
        newPieces[pieceIndex] = updatedPiece
        
        set({
          pieces: newPieces,
          wrongPlacements: state.wrongPlacements + 1,
        })
      }
    } else {
      // Dropped in play area (not on board) - piece stays where dropped
      // Clamp to play area bounds
      const clampedX = Math.max(0, Math.min(areaX, state.playAreaWidth - state.pieceWidth))
      const clampedY = Math.max(0, Math.min(areaY, state.playAreaHeight - state.pieceHeight))
      
      updatedPiece.currentX = clampedX
      updatedPiece.currentY = clampedY
      
      newPieces[pieceIndex] = updatedPiece
      set({ pieces: newPieces })
    }
  },
  
  movePiecePosition: (pieceId, x, y) => {
    const state = get()
    const pieceIndex = state.pieces.findIndex(p => p.id === pieceId)
    if (pieceIndex === -1) return
    
    const newPieces = [...state.pieces]
    newPieces[pieceIndex] = {
      ...newPieces[pieceIndex],
      currentX: x,
      currentY: y,
    }
    
    set({ pieces: newPieces })
  },
  
  tick: () => {
    const state = get()
    if (!state.isComplete) {
      set({ timerSeconds: state.timerSeconds + 1 })
    }
  },
  
  resetGame: () => {
    set({
      difficulty: null,
      imageUrl: null,
      imageWidth: 0,
      imageHeight: 0,
      boardWidth: 0,
      boardHeight: 0,
      pieceWidth: 0,
      pieceHeight: 0,
      scale: 1,
      boardOffsetX: 0,
      boardOffsetY: 0,
      playAreaWidth: 0,
      playAreaHeight: 0,
      pieces: [],
      timerSeconds: 0,
      wrongPlacements: 0,
      isComplete: false,
      isInitialized: false,
    })
  },
}))
