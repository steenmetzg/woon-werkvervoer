// Onthoudt de gekozen backupmap in IndexedDB. Een map-"handle" kan niet in
// localStorage, maar wel in IndexedDB worden bewaard.
const DB_NAME = 'woon-werkvervoer'
const STORE = 'instellingen'
const KEY = 'backupmap'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadStoredFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await openDb()
    return await new Promise((resolve) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as FileSystemDirectoryHandle | undefined) ?? null)
      request.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function storeFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(handle, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
