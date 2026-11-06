import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react'
import { addDays, dateKey, longLabel } from './dates'
import {
  formatHours,
  hoursText,
  MAX_OMSCHRIJVING,
  MAX_UREN_PER_REGEL,
  rubriekNaam,
  sumHours,
  type HourLine,
  type Rubriek,
} from './hours'

interface Props {
  day: Date
  lines: HourLine[]
  rubrieken: Rubriek[]
  onChange: (lines: HourLine[]) => void
  onChangeDay: (day: Date) => void
  onClose: () => void
}

// Keuzes voor het aantal uur: 0,25 tot en met 12, per kwartier.
const UREN_KEUZES = Array.from({ length: MAX_UREN_PER_REGEL * 4 }, (_, i) => (i + 1) / 4)

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** De werkdag ervoor of erna (het weekend slaan we over). */
function otherWorkday(day: Date, step: 1 | -1): Date {
  let d = addDays(day, step)
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, step)
  return d
}

/** Scherm met de uren van één dag (F33): regels met rubriek, aantal uur en een korte omschrijving. */
export default function DayHours({ day, lines, rubrieken, onChange, onChangeDay, onClose }: Props) {
  function update(index: number, change: Partial<HourLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...change } : line)))
  }

  function add() {
    // Een nieuwe regel krijgt de rubriek van de regel erboven en 1 uur.
    const rubriek = lines[lines.length - 1]?.rubriek ?? rubrieken[0]?.id
    if (!rubriek) return
    onChange([...lines, { rubriek, uren: 1, omschrijving: '' }])
  }

  const label = longLabel(day)
  // Een regel met een rubriek die niet meer bestaat (bijv. na het inlezen van een backup) blijft zichtbaar.
  const missing = [...new Set(lines.map((l) => l.rubriek))].filter((id) => !rubrieken.some((r) => r.id === id))

  return (
    <main className="app day-hours">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Uren</h1>
        <Clock className="period-icon" size={24} strokeWidth={1.75} aria-hidden />
      </header>

      <nav className="week-nav day-nav" aria-label="Dag kiezen">
        <button type="button" className="icon-button" aria-label="Vorige dag" onClick={() => onChangeDay(otherWorkday(day, -1))}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <span className="week-label">{capitalize(label)}</span>
        <button type="button" className="icon-button" aria-label="Volgende dag" onClick={() => onChangeDay(otherWorkday(day, 1))}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </button>
      </nav>

      {lines.length > 0 && (
        <ol className="hour-lines" aria-label={`Uren op ${label}`}>
          {lines.map((line, index) => (
            <li key={`${dateKey(day)}-${index}`} className="hour-line" aria-label={`Regel ${index + 1}`}>
              <div className="hour-line-top">
                <select
                  aria-label="Rubriek"
                  value={line.rubriek}
                  onChange={(e) => update(index, { rubriek: e.target.value })}
                >
                  {rubrieken.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.naam}
                    </option>
                  ))}
                  {missing.map((id) => (
                    <option key={id} value={id}>
                      {rubriekNaam(rubrieken, id)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Aantal uur"
                  className="hour-amount"
                  value={String(line.uren)}
                  onChange={(e) => update(index, { uren: Number(e.target.value) })}
                >
                  {/* Een ingesproken regel kan meer dan 12 uur hebben; die waarde moet er dan ook bij staan. */}
                  {(UREN_KEUZES.includes(line.uren) ? UREN_KEUZES : [...UREN_KEUZES, line.uren]).map((value) => (
                    <option key={value} value={String(value)}>
                      {hoursText(value)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-button line-delete"
                  aria-label="Regel verwijderen"
                  onClick={() => onChange(lines.filter((_, i) => i !== index))}
                >
                  <X size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </div>
              <input
                type="text"
                aria-label="Omschrijving"
                placeholder="Korte omschrijving"
                maxLength={MAX_OMSCHRIJVING}
                value={line.omschrijving}
                onChange={(e) => update(index, { omschrijving: e.target.value })}
              />
            </li>
          ))}
        </ol>
      )}

      {rubrieken.length > 0 ? (
        <button type="button" className="wide-button add-line" onClick={add}>
          <Plus size={20} strokeWidth={1.75} aria-hidden />
          Regel toevoegen
        </button>
      ) : (
        <p className="muted">Maak eerst een rubriek via het tandwiel, bij Uren.</p>
      )}

      <p className="hours-total">
        Totaal: <strong>{formatHours(sumHours(lines))} uur</strong>
      </p>
    </main>
  )
}
