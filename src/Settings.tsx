import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Clock, Download, FolderOpen, Mic, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'
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
import type { Declared } from './declared'
import { loadStoredFolder, storeFolder } from './folderStore'
import {
  lineCount,
  linesWithRubriek,
  MAX_NAAM,
  MAX_RUBRIEKEN,
  newRubriekId,
  type Hours,
  type Rubriek,
} from './hours'
import { askAgainFrom, forgetLater, isInstalledApp } from './installPrompt'
import { MODE_INFO } from './modeInfo'
import { speechSupported } from './speech'
import { MODES, type Mode, type Registrations } from './storage'

interface Props {
  registrations: Registrations
  declared: Declared
  enabledModes: Mode[]
  onChangeEnabledModes: (modes: Mode[]) => void
  speechEnabled: boolean
  onChangeSpeechEnabled: (on: boolean) => void
  hoursEnabled: boolean
  onChangeHoursEnabled: (on: boolean) => void
  hours: Hours
  rubrieken: Rubriek[]
  onChangeRubrieken: (rubrieken: Rubriek[]) => void
  onRestore: (
    registrations: Registrations,
    declared: Declared | null,
    hours: { uren: Hours; rubrieken: Rubriek[] } | null,
  ) => void
  onClose: () => void
}

type Message = { kind: 'ok' | 'error'; text: string }

function dayCount(registrations: Registrations): string {
  const n = Object.keys(registrations).length
  return n === 1 ? '1 dag' : `${n} dagen`
}

/** Bijv. "120 dagen" of "120 dagen en 35 urenregels". */
function contentCount(registrations: Registrations, hours: Hours | null): string {
  const n = hours ? lineCount(hours) : 0
  if (n === 0) return dayCount(registrations)
  return `${dayCount(registrations)} en ${n === 1 ? '1 urenregel' : `${n} urenregels`}`
}

/** Naam van een rubriek, aan te passen; pas bij het verlaten van het veld wordt de nieuwe naam gecontroleerd. */
function RubriekRow({
  rubriek,
  onRename,
  onDelete,
}: {
  rubriek: Rubriek
  onRename: (naam: string) => boolean
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(rubriek.naam)
  return (
    <li className="rubriek">
      <input
        type="text"
        aria-label={`Naam van rubriek ${rubriek.naam}`}
        value={draft}
        maxLength={MAX_NAAM}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!onRename(draft.trim())) setDraft(rubriek.naam)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      <button type="button" className="icon-button" aria-label={`Rubriek ${rubriek.naam} verwijderen`} onClick={onDelete}>
        <Trash2 size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </li>
  )
}

export default function Settings({
  registrations,
  declared,
  enabledModes,
  onChangeEnabledModes,
  speechEnabled,
  onChangeSpeechEnabled,
  hoursEnabled,
  onChangeHoursEnabled,
  hours,
  rubrieken,
  onChangeRubrieken,
  onRestore,
  onClose,
}: Props) {
  const [rubriekMessage, setRubriekMessage] = useState<Message | null>(null)
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

  function renameRubriek(id: string, naam: string): boolean {
    const current = rubrieken.find((r) => r.id === id)
    if (!current || naam === current.naam) return true
    if (!naam) {
      setRubriekMessage({ kind: 'error', text: 'Een rubriek moet een naam hebben.' })
      return false
    }
    if (rubrieken.some((r) => r.id !== id && r.naam.toLowerCase() === naam.toLowerCase())) {
      setRubriekMessage({ kind: 'error', text: `Er is al een rubriek ${naam}.` })
      return false
    }
    onChangeRubrieken(rubrieken.map((r) => (r.id === id ? { ...r, naam } : r)))
    setRubriekMessage(null)
    return true
  }

  function deleteRubriek(rubriek: Rubriek) {
    const used = linesWithRubriek(hours, rubriek.id)
    if (used > 0) {
      setRubriekMessage({
        kind: 'error',
        text: `${rubriek.naam} heeft nog ${used === 1 ? '1 regel' : `${used} regels`} met uren en kan niet worden verwijderd. De naam kun je wel aanpassen.`,
      })
      return
    }
    onChangeRubrieken(rubrieken.filter((r) => r.id !== rubriek.id))
    setRubriekMessage(null)
  }

  function addRubriek() {
    if (rubrieken.length >= MAX_RUBRIEKEN) return
    // Een nieuwe naam die nog niet bestaat: "Nieuwe rubriek", "Nieuwe rubriek 2", ...
    let naam = 'Nieuwe rubriek'
    for (let n = 2; rubrieken.some((r) => r.naam.toLowerCase() === naam.toLowerCase()); n++) naam = `Nieuwe rubriek ${n}`
    onChangeRubrieken([...rubrieken, { id: newRubriekId(), naam }])
    setRubriekMessage(null)
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
    const text = createBackup(registrations, declared, { uren: hours, rubrieken }, now)
    if (folder) {
      try {
        if (!(await ensureWriteAccess(folder))) {
          setMessage({ kind: 'error', text: `Geen toestemming voor de map "${folder.name}". Probeer het opnieuw.` })
          return
        }
        await writeFileToFolder(folder, name, text)
        setMessage({ kind: 'ok', text: `Backup van ${contentCount(registrations, hours)} opgeslagen als ${name} in de map "${folder.name}".` })
        return
      } catch {
        setMessage({ kind: 'error', text: `Opslaan in de map "${folder.name}" is mislukt. Kies de map opnieuw.` })
        return
      }
    }
    downloadFile(name, text)
    setMessage({ kind: 'ok', text: `Backup van ${contentCount(registrations, hours)} opgeslagen als ${name} in Downloads.` })
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
      `Backup${when} met ${contentCount(result.registraties, result.uren?.uren ?? null)} inlezen? Dit vervangt al je huidige keuzes${result.uren ? ' en uren' : ''}.`,
    )
    if (!ok) return
    onRestore(result.registraties, result.gedeclareerd, result.uren)
    setMessage({ kind: 'ok', text: `Backup ingelezen: ${contentCount(result.registraties, result.uren?.uren ?? null)}.` })
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
        <h2>Uren</h2>
        <p className="muted">Houd per dag je gewerkte uren per rubriek bij. Tik in de week op het klokje bij een dag.</p>
        <div className="modes single" role="group" aria-label="Uren">
          <button
            type="button"
            className={hoursEnabled ? 'mode selected' : 'mode'}
            aria-pressed={hoursEnabled}
            onClick={() => onChangeHoursEnabled(!hoursEnabled)}
          >
            <Clock size={20} strokeWidth={1.75} aria-hidden />
            <span>Uren</span>
          </button>
        </div>
        {hoursEnabled && (
          <>
            <h3 className="sub-heading">Rubrieken</h3>
            {rubrieken.length > 0 && (
              <ul className="rubrieken" aria-label="Rubrieken">
                {rubrieken.map((r) => (
                  <RubriekRow
                    // Met de naam in de sleutel begint het veld opnieuw als de naam van buitenaf verandert (bijv. backup).
                    key={`${r.id}-${r.naam}`}
                    rubriek={r}
                    onRename={(naam) => renameRubriek(r.id, naam)}
                    onDelete={() => deleteRubriek(r)}
                  />
                ))}
              </ul>
            )}
            {rubrieken.length < MAX_RUBRIEKEN ? (
              <button type="button" className="wide-button" onClick={addRubriek}>
                <Plus size={20} strokeWidth={1.75} aria-hidden />
                Rubriek toevoegen
              </button>
            ) : (
              <p className="muted">Je hebt het maximum van {MAX_RUBRIEKEN} rubrieken.</p>
            )}
            {rubriekMessage && (
              <p className={rubriekMessage.kind === 'error' ? 'message error' : 'message'} role="status">
                {rubriekMessage.text}
              </p>
            )}
          </>
        )}
      </section>

      {speechSupported() && (
        <section className="setting">
          <h2>Spraak</h2>
          <p className="muted">Met de microfoonknop onderaan het weekscherm spreek je een dag in. Werkt alleen met internet.</p>
          <div className="modes single" role="group" aria-label="Spraak">
            <button
              type="button"
              className={speechEnabled ? 'mode selected' : 'mode'}
              aria-pressed={speechEnabled}
              onClick={() => onChangeSpeechEnabled(!speechEnabled)}
            >
              <Mic size={20} strokeWidth={1.75} aria-hidden />
              <span>Microfoon</span>
            </button>
          </div>
        </section>
      )}

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

      <p className="version">Versie: {__APP_VERSION__}</p>
    </main>
  )
}
