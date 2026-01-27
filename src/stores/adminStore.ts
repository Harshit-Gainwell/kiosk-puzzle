import { create } from 'zustand'
import { getImage, getPasswordHash, saveImage, savePasswordHash } from '@/lib/storage'
import { hashPassword } from '@/lib/crypto'

interface AdminState {
  imageBlob: Blob | null
  imageUrl: string | null
  passwordHash: string | null
  isLoading: boolean
  
  setImage: (blob: Blob) => void
  clearImage: () => void
  setPasswordHash: (hash: string) => void
  loadFromStorage: () => Promise<void>
  saveToStorage: (password?: string) => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  imageBlob: null,
  imageUrl: null,
  passwordHash: null,
  isLoading: true,
  
  setImage: (blob: Blob) => {
    // Revoke old URL if exists
    const oldUrl = get().imageUrl
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }
    
    const newUrl = URL.createObjectURL(blob)
    set({ imageBlob: blob, imageUrl: newUrl })
  },
  
  clearImage: () => {
    const oldUrl = get().imageUrl
    if (oldUrl) {
      URL.revokeObjectURL(oldUrl)
    }
    set({ imageBlob: null, imageUrl: null })
  },
  
  setPasswordHash: (hash: string) => {
    set({ passwordHash: hash })
  },
  
  loadFromStorage: async () => {
    set({ isLoading: true })
    
    try {
      const [imageBlob, passwordHash] = await Promise.all([
        getImage(),
        getPasswordHash(),
      ])
      
      // Revoke old URL to prevent memory leak
      const oldUrl = get().imageUrl
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl)
      }
      
      let imageUrl: string | null = null
      if (imageBlob && imageBlob.size > 0) {
        imageUrl = URL.createObjectURL(imageBlob)
        console.log('Loaded image from storage:', imageBlob.size, 'bytes')
      }
      
      set({ imageBlob, imageUrl, passwordHash, isLoading: false })
    } catch (error) {
      console.error('Failed to load from storage:', error)
      set({ imageBlob: null, imageUrl: null, isLoading: false })
    }
  },
  
  saveToStorage: async (password?: string) => {
    const { imageBlob } = get()
    
    if (imageBlob) {
      await saveImage(imageBlob)
    }
    
    if (password && password.trim()) {
      const hash = await hashPassword(password)
      await savePasswordHash(hash)
      set({ passwordHash: hash })
    }
  },
}))
