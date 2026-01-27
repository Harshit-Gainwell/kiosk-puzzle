// Grid configurations for each difficulty level
export const GRID_CONFIG = {
  easy: { cols: 3, rows: 3 },
  medium: { cols: 4, rows: 4 },
  hard: { cols: 5, rows: 5 },
} as const

export type Difficulty = keyof typeof GRID_CONFIG

// Snap tolerance - piece snaps if within this percentage of piece size from target
export const SNAP_TOLERANCE = 0.3 // 30% of piece size

// Visual styling - Enhanced for better visibility with warm grayscale
export const BORDER_COLOR = '#d1cdc6' // Warm gray - light gray / industrial tone
export const BORDER_WIDTH = 1
export const BOARD_SHADOW = '0 0 0 1px rgba(0, 0, 0, 0.06), 0 20px 50px -12px rgba(80, 75, 70, 0.25), 0 8px 20px -8px rgba(80, 75, 70, 0.15)'
export const PIECE_SHADOW = '0 4px 12px -2px rgba(80, 75, 70, 0.2), 0 2px 4px -2px rgba(80, 75, 70, 0.1)'
export const PIECE_SHADOW_DRAGGING = '0 25px 50px -12px rgba(80, 75, 70, 0.35), 0 12px 24px -8px rgba(80, 75, 70, 0.2)'

// Minimum touch target size (accessibility)
export const MIN_TOUCH_TARGET = 44 // 44px minimum for touch-friendly interaction

// Animation durations (ms)
export const SNAP_ANIMATION_DURATION = 150
export const RETURN_ANIMATION_DURATION = 200

// Play area colors - white + warm grayscale
export const PLAY_AREA_BG = '#f7f6f4' // Warm off-white
export const BOARD_BG = '#ffffff' // White
export const STAGING_BG = '#f5f4f2' // Light warm gray
