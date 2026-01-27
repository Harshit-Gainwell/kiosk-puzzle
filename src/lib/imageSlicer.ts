import { GRID_CONFIG, type Difficulty } from './constants'

export interface PieceDefinition {
  id: string
  correctRow: number
  correctCol: number
  // Source coordinates in original image (pixels)
  sourceX: number
  sourceY: number
  sourceWidth: number
  sourceHeight: number
}

export interface SliceResult {
  pieces: PieceDefinition[]
  // Original image dimensions
  imageWidth: number
  imageHeight: number
  // Scaled board dimensions (fit to container)
  boardWidth: number
  boardHeight: number
  // Individual piece dimensions (scaled)
  pieceWidth: number
  pieceHeight: number
  // Scale factor used
  scale: number
}

/**
 * Load an image and get its natural dimensions
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Calculate the uniform scale factor to fit image in container
 * Preserves aspect ratio - no distortion
 */
export function calculateScale(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number
): number {
  const scaleX = containerWidth / imageWidth
  const scaleY = containerHeight / imageHeight
  // Use the smaller scale to ensure image fits entirely
  return Math.min(scaleX, scaleY)
}

/**
 * Generate piece definitions for the puzzle
 * This creates the metadata for each piece without actually slicing the image
 */
export function generatePieceDefinitions(
  imageWidth: number,
  imageHeight: number,
  difficulty: Difficulty
): PieceDefinition[] {
  const { cols, rows } = GRID_CONFIG[difficulty]
  const pieces: PieceDefinition[] = []
  
  // Calculate piece dimensions in original image coordinates
  const pieceWidth = imageWidth / cols
  const pieceHeight = imageHeight / rows
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      pieces.push({
        id: `piece-${row}-${col}`,
        correctRow: row,
        correctCol: col,
        sourceX: col * pieceWidth,
        sourceY: row * pieceHeight,
        sourceWidth: pieceWidth,
        sourceHeight: pieceHeight,
      })
    }
  }
  
  return pieces
}

/**
 * Main function to prepare puzzle slice data
 * Returns all information needed to render the puzzle
 */
export async function sliceImage(
  imageSrc: string,
  difficulty: Difficulty,
  containerWidth: number,
  containerHeight: number
): Promise<SliceResult> {
  // Load image to get natural dimensions
  const img = await loadImage(imageSrc)
  const imageWidth = img.naturalWidth
  const imageHeight = img.naturalHeight
  
  // Calculate uniform scale factor
  const scale = calculateScale(imageWidth, imageHeight, containerWidth, containerHeight)
  
  // Calculate scaled board dimensions
  const boardWidth = imageWidth * scale
  const boardHeight = imageHeight * scale
  
  // Get grid configuration
  const { cols, rows } = GRID_CONFIG[difficulty]
  
  // Calculate scaled piece dimensions
  const pieceWidth = boardWidth / cols
  const pieceHeight = boardHeight / rows
  
  // Generate piece definitions
  const pieces = generatePieceDefinitions(imageWidth, imageHeight, difficulty)
  
  return {
    pieces,
    imageWidth,
    imageHeight,
    boardWidth,
    boardHeight,
    pieceWidth,
    pieceHeight,
    scale,
  }
}
