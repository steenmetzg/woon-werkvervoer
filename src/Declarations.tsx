import { ArrowLeft } from 'lucide-react'
import BadgeIcon from './BadgeIcon'
import { dateKey } from './dates'
import { DECLARED_MODES, type Declared, type DeclaredMode } from './declared'
import { MODE_INFO } from './modeInfo'
import type { Mode } from './storage'

interface Props {
  declared: Declared
  enabledModes: Mode[]
  today: Date
  onChange: (declared: Declared) => void
  onClose: () => void
}

/** Scherm waarin je per vorm bijhoudt tot en met welke dag je declaraties hebt ingediend. */
export default function Declarations({ declared, enabledModes, today, onChange, onClose }: Props) {
  const modes = DECLARED_MODES.filter((mode) => enabledModes.includes(mode))

  function change(mode: DeclaredMode, value: string) {
    const next = { ...declared }
    // Een gewiste datum staat weer op vandaag.
    if (value) next[mode] = value
    else delete next[mode]
    onChange(next)
  }

  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Declaraties</h1>
      </header>

      {modes.map((mode) => {
        const { label, Icon } = MODE_INFO[mode]
        const id = `gedeclareerd-${mode}`
        return (
          <section key={mode} className="setting declared">
            <h2>
              <BadgeIcon Icon={Icon} className="declared-icon" />
              {label}
            </h2>
            <label htmlFor={id}>Gedeclareerd tot en met:</label>
            <input
              id={id}
              type="date"
              value={declared[mode] ?? dateKey(today)}
              onChange={(e) => change(mode, e.target.value)}
            />
          </section>
        )
      })}
    </main>
  )
}
