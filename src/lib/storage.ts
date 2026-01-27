import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'kiosk-puzzle-db'
const DB_VERSION = 1
const STORE_NAME = 'settings'

interface PuzzleDBSchema {
  settings: {
    key: string
    value: string | Blob
  }
}

let dbPromise: Promise<IDBPDatabase<PuzzleDBSchema>> | null = null

function getDB(): Promise<IDBPDatabase<PuzzleDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<PuzzleDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export async function saveImage(blob: Blob): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, blob, 'puzzleImage')
}

export async function getImage(): Promise<Blob | null> {
  const db = await getDB()
  const result = await db.get(STORE_NAME, 'puzzleImage')
  return result instanceof Blob ? result : null
}

export async function savePasswordHash(hash: string): Promise<void> {
  const db = await getDB()
  await db.put(STORE_NAME, hash, 'passwordHash')
}

export async function getPasswordHash(): Promise<string | null> {
  const db = await getDB()
  const result = await db.get(STORE_NAME, 'passwordHash')
  return typeof result === 'string' ? result : null
}

export async function hasSetup(): Promise<boolean> {
  const image = await getImage()
  return image !== null
}

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE_NAME)
}
