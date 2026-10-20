import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Download, FolderOpen, Upload } from 'lucide-react'
import { backupFileName, backupLabel, createBackup, isBackupFileName, parseBackup } from './backup'
import {
  canChooseFolder,
  canPickFileInFolder,
  chooseFolder,
  downloadFile,
  ensureWriteAccess,
  isAbortError,
  listFiles,
  pickFileInFolder,
  writeFileToFolder,
} from './files'
import { loadStoredFolder, storeFolder } from './folderStore'
import type { Registrations } from './storage'

interface Props {
  registrations: Registrations
  onRestore: (registrations: Registrations) => void
  onClose: () => void
}

type Message = { kind: 'ok' | 'error'; text: string }

function dayCount(registrations: Registrations): string {
  const n = Object.keys(registrations).length
  return n === 1 ? '1 dag' : `${n} dagen`
}

export default function Settings({ registrations, onRestore, onClose }: Props) {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [backupList, setBackupList] = useState<FileSystemFileHandle[] | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    loadStoredFolder().then((stored) => {
      if (active) setFolder(stored)
    })
    return () => {
      active = false
    }
  }, [])

  async function handleChooseFolder() {
    try {
      const chosen = await chooseFolder()
      await storeFolder(chosen)
      setFolder(chosen)
      setMessage({ kind: 'ok', text: `Backups worden opgeslagen in de map "${chosen.name}".` })
    } catch (error) {
      if (!isAbortError(error)) setMessage({ kind: 'error', text: 'Deze map kan niet worden gebruikt. Kies een andere map.' })
    }
  }

  async function handleBackup() {
    const now = new Date()
    const name = backupFileName(now)
    const text = createBackup(registrations, now)
    if (folder) {
      try {
        if (!(await ensureWriteAccess(folder))) {
          setMessage({ kind: 'error', text: `Geen toestemming voor de map "${folder.name}". Probeer het opnieuw.` })
          return
        }
        await writeFileToFolder(folder, name, text)
        setMessage({ kind: 'ok', text: `Backup van ${dayCount(registrations)} opgeslagen als ${name} in de map "${folder.name}".` })
        return
      } catch {
        setMessage({ kind: 'error', text: `Opslaan in de map "${folder.name}" is mislukt. Kies de map opnieuw.` })
        return
      }
    }
    downloadFile(name, text)
    setMessage({ kind: 'ok', text: `Backup van ${dayCount(registrations)} opgeslagen als ${name} in Downloads.` })
  }

  async function restoreFrom(file: File) {
    let result: ReturnType<typeof parseBackup>
    try {
      result = parseBackup(await file.text())
    } catch (error) {
      setMessage({ kind: 'error', text: (error as Error).message })
      return
    }
    const when = result.gemaakt
      ? ` van ${result.gemaakt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : ''
    const ok = window.confirm(
      `Backup${when} met ${dayCount(result.registraties)} inlezen? Dit vervangt al je huidige keuzes.`,
    )
    if (!ok) return
    onRestore(result.registraties)
    setMessage({ kind: 'ok', text: `Backup ingelezen: ${dayCount(result.registraties)}.` })
  }

  async function handleRestore() {
    setMessage(null)
    if (!folder) {
      await pickOtherFile()
      return
    }
    try {
      if (!(await ensureWriteAccess(folder))) {
        setMessage({ kind: 'error', text: `Geen toestemming voor de map "${folder.name}". Probeer het opnieuw.` })
        return
      }
      const backups = await listFiles(folder, isBackupFileName)
      setBackupList(backups)
      if (backups.length === 0) {
        setMessage({ kind: 'error', text: `Geen backups gevonden in de map "${folder.name}".` })
      }
    } catch {
      setMessage({ kind: 'error', text: `De map "${folder.name}" kan niet worden gelezen. Kies de map opnieuw.` })
    }
  }

  async function pickOtherFile() {
    setBackupList(null)
    if (!canPickFileInFolder()) {
      fileInput.current?.click()
      return
    }
    try {
      await restoreFrom(await pickFileInFolder(folder))
    } catch (error) {
      if (!isAbortError(error)) setMessage({ kind: 'error', text: 'Het bestand kan niet worden geopend.' })
    }
  }

  async function restoreFromList(handle: FileSystemFileHandle) {
    try {
      const file = await handle.getFile()
      setBackupList(null)
      await restoreFrom(file)
    } catch {
      setMessage({ kind: 'error', text: 'Het bestand kan niet worden geopend.' })
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void restoreFrom(file)
  }

  return (
    <main className="app settings">
      <header className="settings-header">
        <button type="button" className="icon-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Instellingen en backup</h1>
      </header>

      <section className="setting">
        <h2>Backupmap</h2>
        {canChooseFolder() ? (
          <>
            <p className="muted" data-testid="backupmap">
              {folder ? `Map: ${folder.name}` : 'Nog geen map gekozen. Backups gaan dan naar Downloads.'}
            </p>
            <button type="button" className="wide-button" onClick={handleChooseFolder}>
              <FolderOpen size={20} strokeWidth={1.75} aria-hidden />
              {folder ? 'Andere map kiezen' : 'Map kiezen'}
            </button>
          </>
        ) : (
          <p className="muted">
            Deze browser kan geen map onthouden. Backups gaan naar Downloads en bij inlezen kies je zelf het bestand.
          </p>
        )}
      </section>

      <section className="setting">
        <h2>Backup</h2>
        <div className="backup-buttons">
          <button type="button" className="wide-button" onClick={handleBackup}>
            <Download size={20} strokeWidth={1.75} aria-hidden />
            Backup maken
          </button>
          <button type="button" className="wide-button" onClick={handleRestore}>
            <Upload size={20} strokeWidth={1.75} aria-hidden />
            Backup inlezen
          </button>
        </div>
        {backupList && (
          <div className="backup-list">
            {backupList.length > 0 && <h3>Kies een backup</h3>}
            {backupList.length > 0 && (
              <ul>
                {backupList.map((handle) => (
                  <li key={handle.name}>
                    <button type="button" className="list-button" onClick={() => restoreFromList(handle)}>
                      <span>{backupLabel(handle.name)}</span>
                      <span className="file-name">{handle.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="list-actions">
              <button type="button" className="text-button" onClick={pickOtherFile}>
                Ander bestand kiezen
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setBackupList(null)
                  setMessage(null)
                }}
              >
                Annuleren
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          aria-label="Backupbestand"
          hidden
          onChange={handleFileInput}
        />
        {message && (
          <p className={message.kind === 'error' ? 'message error' : 'message'} role="status">
            {message.text}
          </p>
        )}
      </section>
    </main>
  )
}
