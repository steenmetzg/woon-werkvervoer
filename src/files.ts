// Werken met bestanden en mappen op de telefoon via de File System Access API.
// Deze API zit niet in elke browser; zonder de API wordt een backup gedownload
// en kies je een backup met de gewone bestandskiezer.

type Permission = 'granted' | 'denied' | 'prompt'

interface DirectoryHandleWithPermission extends FileSystemDirectoryHandle {
  queryPermission?: (options: { mode: 'readwrite' }) => Promise<Permission>
  requestPermission?: (options: { mode: 'readwrite' }) => Promise<Permission>
}

interface FilePickerWindow {
  showDirectoryPicker?: (options: { id?: string; mode: 'readwrite' }) => Promise<FileSystemDirectoryHandle>
  showOpenFilePicker?: (options: {
    id?: string
    startIn?: FileSystemDirectoryHandle
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle[]>
}

const pickers = () => window as unknown as FilePickerWindow

export function canChooseFolder(): boolean {
  return typeof pickers().showDirectoryPicker === 'function'
}

export function canPickFileInFolder(): boolean {
  return typeof pickers().showOpenFilePicker === 'function'
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export async function chooseFolder(): Promise<FileSystemDirectoryHandle> {
  return pickers().showDirectoryPicker!({ id: 'backupmap', mode: 'readwrite' })
}

/** Vraagt zo nodig opnieuw toestemming voor de map (de browser kan daar om vragen). */
export async function ensureWriteAccess(folder: FileSystemDirectoryHandle): Promise<boolean> {
  const handle = folder as DirectoryHandleWithPermission
  if (!handle.queryPermission || !handle.requestPermission) return true
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true
  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted'
}

export async function writeFileToFolder(folder: FileSystemDirectoryHandle, name: string, text: string) {
  const file = await folder.getFileHandle(name, { create: true })
  const writable = await file.createWritable()
  await writable.write(text)
  await writable.close()
}

export function downloadFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Opent de bestandskiezer van de telefoon, beginnend in de backupmap. */
export async function pickFileInFolder(folder: FileSystemDirectoryHandle | null): Promise<File> {
  const [handle] = await pickers().showOpenFilePicker!({
    id: 'backupmap',
    ...(folder ? { startIn: folder } : {}),
    types: [{ description: 'Backup van WoonWerk', accept: { 'application/json': ['.json'] } }],
  })
  return handle.getFile()
}

interface IterableDirectory {
  values(): AsyncIterable<FileSystemHandle>
}

/** Alle bestanden in de map waarvan `keep(naam)` waar is, op naam aflopend gesorteerd. */
export async function listFiles(
  folder: FileSystemDirectoryHandle,
  keep: (name: string) => boolean,
): Promise<FileSystemFileHandle[]> {
  const files: FileSystemFileHandle[] = []
  for await (const entry of (folder as unknown as IterableDirectory).values()) {
    if (entry.kind === 'file' && keep(entry.name)) files.push(entry as FileSystemFileHandle)
  }
  return files.sort((a, b) => b.name.localeCompare(a.name))
}
