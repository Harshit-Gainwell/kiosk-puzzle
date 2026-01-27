import { SNAP_TOLERANCE } from './constants'

/**
 * Check if a dropped piece is within snap tolerance of its target position
 * Uses center-to-center distance calculation
 */
export function isWithinSnapTolerance(
  dropX: number,
  dropY: number,
  targetX: number,
  targetY: number,
  pieceWidth: number,
  pieceHeight: number
): boolean {
  // Calculate center points
  const dropCenterX = dropX + pieceWidth / 2
  const dropCenterY = dropY + pieceHeight / 2
  const targetCenterX = targetX + pieceWidth / 2
  const targetCenterY = targetY + pieceHeight / 2
  
  // Calculate distance
  const dx = Math.abs(dropCenterX - targetCenterX)
  const dy = Math.abs(dropCenterY - targetCenterY)
  
  // Tolerance is percentage of piece size
  const toleranceX = pieceWidth * SNAP_TOLERANCE
  const toleranceY = pieceHeight * SNAP_TOLERANCE
  
  return dx <= toleranceX && dy <= toleranceY
}

/**
 * Calculate the target position (top-left) for a piece on the board
 */
export function getTargetPosition(
  correctRow: number,
  correctCol: number,
  pieceWidth: number,
  pieceHeight: number,
  boardOffsetX: number = 0,
  boardOffsetY: number = 0
): { x: number; y: number } {
  return {
    x: boardOffsetX + correctCol * pieceWidth,
    y: boardOffsetY + correctRow * pieceHeight,
  }
}

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array, does not mutate the original
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Calculate progress as count of locked pieces
 */
export function calculateProgress(pieces: { isLocked: boolean }[]): number {
  return pieces.filter(p => p.isLocked).length
}

/**
 * Check if the game is complete (all pieces locked)
 */
export function isGameComplete(pieces: { isLocked: boolean }[]): boolean {
  return pieces.every(p => p.isLocked)
}

/**
 * Format seconds into MM:SS string
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Calculate positions for pieces in the tray
 * Returns array of {x, y} positions for non-overlapping arrangement
 */
export function calculateTrayPositions(
  pieceCount: number,
  pieceWidth: number,
  pieceHeight: number,
  trayWidth: number,
  _trayHeight: number,
  padding: number = 8
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  
  // Calculate how many pieces fit per row with padding
  const effectivePieceWidth = pieceWidth + padding
  const effectivePieceHeight = pieceHeight + padding
  const cols = Math.max(1, Math.floor(trayWidth / effectivePieceWidth))
  
  for (let i = 0; i < pieceCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    positions.push({
      x: col * effectivePieceWidth + padding / 2,
      y: row * effectivePieceHeight + padding / 2,
    })
  }
  
  return positions
}

/**
 * Find the nearest available slot in tray for a dropped piece
 */
export function findNearestAvailableSlot(
  dropX: number,
  dropY: number,
  occupiedSlots: Set<number>,
  trayPositions: { x: number; y: number }[]
): number | null {
  let nearestSlot: number | null = null
  let nearestDistance = Infinity
  
  for (let i = 0; i < trayPositions.length; i++) {
    if (occupiedSlots.has(i)) continue
    
    const pos = trayPositions[i]
    const dx = dropX - pos.x
    const dy = dropY - pos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestSlot = i
    }
  }
  
  return nearestSlot
}
