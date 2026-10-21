import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Download, FolderOpen, RotateCcw, Upload } from 'lucide-react'
import { backupFileName, createBackup, parseBackup } from './backup'
import {
  canChooseFolder,
  canPickFileInFolder,
  chooseFolder,
  downloadFile,
  ensureWriteAccess,
  isAbortError,
  pickFileInFolder,
  writeFileToFolder,
} from './files'
import { loadStoredFolder, storeFolder } from './folderStore'
import { askAgainFrom, forgetLater, isInstalledApp } from './installPrompt'
import { MODE_INFO } from './modeInfo'
import { MODES, type Mode, type Registrations } from './storage'

interface Props {
  registrations: Registrations
  enabledModes: Mode[]
  onChangeEnabledModes: (modes: Mode[]) => void
  onRestore: (registrations: Registrations) => void
  onClose: () => void
}

type Message = { kind: 'ok' | 'error'; text: string }

function dayCount(registrations: Registrations): string {
  const n = Object.keys(registrations).length
  return n === 1 ? '1 dag' : `${n} dagen`
}

export default function Settings({ registrations, enabledModes, onChangeEnabledModes, onRestore, onClose }: Props) {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [askAgain, setAskAgain] = useState(() => (isInstalledApp() ? null : askAgainFrom(new Date())))
  const [installMessage, setInstallMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadStoredFolder().then((stored) => {
      if (active) setFolder(stored)
    })
    return () => {
      active = false
    }
  }, [])

  function toggleMode(mode: Mode) {
    const on = !enabledModes.includes(mode)
    onChangeEnabledModes(MODES.filter((m) => (m === mode ? on : enabledModes.includes(m))))
  }

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

  function handleShowInstallQuestion() {
    forgetLater()
    setAskAgain(null)
    setInstallMessage('De vraag om de app op je telefoon te installeren staat onderaan in het startscherm als de app geïnstalleerd kan worden.')
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void restoreFrom(file)
  }

  return (
    <main className="app settings">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Instellingen en backup</h1>
      </header>

      <section className="setting">
        <h2>Vervoervormen</h2>
        <p className="muted">Alleen de vormen die aan staan zie je in de week. Thuis staat altijd aan.</p>
        <div className="modes" role="group" aria-label="Vervoervormen">
          {MODES.map((mode) => {
            const { label, Icon } = MODE_INFO[mode]
            const on = enabledModes.includes(mode)
            return (
              <button
                key={mode}
                type="button"
                className={on ? 'mode selected' : 'mode'}
                aria-pressed={on}
                disabled={mode === 'thuis'}
                onClick={() => toggleMode(mode)}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </section>

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

      {(askAgain || installMessage) && (
        <section className="setting">
          <h2>App installeren</h2>
          {askAgain ? (
            <>
              <p className="muted">
                Je koos "Niet nu". De vraag om te installeren komt terug op{' '}
                {askAgain.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}.
              </p>
              <button type="button" className="wide-button" onClick={handleShowInstallQuestion}>
                <RotateCcw size={20} strokeWidth={1.75} aria-hidden />
                Vraag weer tonen
              </button>
            </>
          ) : (
            <p className="message" role="status">
              {installMessage}
            </p>
          )}
        </section>
      )}
    </main>
  )
}
