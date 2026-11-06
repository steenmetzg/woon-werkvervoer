import type { ReactNode } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, ClockPlus, X } from 'lucide-react'
import { addDays, longLabel } from './dates'
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
  /** Onderaan: de meldingen en de microfoonknop van de spraakbediening (als die aan staat). */
  bottom?: ReactNode
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

/**
 * Scherm met de uren van één dag (F33): per rubriek een blok met een knop om een regel toe te voegen, en
 * daarin de regels met het aantal uur en een korte omschrijving op één regel.
 */
export default function DayHours({ day, lines, rubrieken, onChange, onChangeDay, onClose, bottom }: Props) {
  function update(index: number, change: Partial<HourLine>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...change } : line)))
  }

  const label = longLabel(day)
  // Regels van een rubriek die niet meer bestaat (bijv. na het inlezen van een backup) blijven zichtbaar.
  const missing = [...new Set(lines.map((l) => l.rubriek))].filter((id) => !rubrieken.some((r) => r.id === id))
  const groups = [
    ...rubrieken.map((r) => ({ id: r.id, naam: r.naam, known: true })),
    ...missing.map((id) => ({ id, naam: rubriekNaam(rubrieken, id), known: false })),
  ]

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

      {groups.length === 0 && <p className="muted">Maak eerst een rubriek via het tandwiel, bij Uren.</p>}

      <div className="hour-groups">
        {groups.map((group) => {
          const own = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.rubriek === group.id)
          const total = sumHours(own.map(({ line }) => line))
          return (
            <section key={group.id} className="hour-group" aria-label={group.naam}>
              <div className="hour-group-head">
                <h2>{group.naam}</h2>
                {total > 0 && <span className="hours-sum">{formatHours(total)} uur</span>}
                {group.known && (
                  <button
                    type="button"
                    className="icon-button add-line"
                    aria-label={`Regel toevoegen bij ${group.naam}`}
                    onClick={() => onChange([...lines, { rubriek: group.id, uren: 1, omschrijving: '' }])}
                  >
                    <ClockPlus size={20} strokeWidth={1.75} aria-hidden />
                  </button>
                )}
              </div>
              {own.length > 0 && (
                <ul>
                  {own.map(({ line, index }) => (
                    <li key={index} className="hour-line">
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
                      <input
                        type="text"
                        aria-label="Omschrijving"
                        placeholder="Omschrijving"
                        maxLength={MAX_OMSCHRIJVING}
                        value={line.omschrijving}
                        onChange={(e) => update(index, { omschrijving: e.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-button line-delete"
                        aria-label="Regel verwijderen"
                        onClick={() => onChange(lines.filter((_, i) => i !== index))}
                      >
                        <X size={18} strokeWidth={1.75} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <p className="hours-total">
        Totaal: <strong>{formatHours(sumHours(lines))} uur</strong>
      </p>

      {bottom && <div className="bottom">{bottom}</div>}
    </main>
  )
}
