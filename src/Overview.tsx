import { useState } from 'react'
import { ArrowLeft, X, type LucideIcon } from 'lucide-react'
import BadgeIcon from './BadgeIcon'
import { addDays, addMonths, compactDay, dateKey, monthName, monthsBetween, nextWorkday, parseDateKey, workdayFrom } from './dates'
import type { Mode, Registrations } from './storage'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface Props {
  /** De keuze waarvoor het overzicht de dagen toont, bijv. 'thuis' of 'auto'. */
  mode: Mode
  title: string
  Icon: LucideIcon
  /** Het tekentje in het rondje bij het icoon; standaard een euroteken. */
  Badge?: LucideIcon
  iconLabel: string
  registrations: Registrations
  today: Date
  /** Alleen bij Thuis, Trein en Auto: de datum van de laatste declaratie (leeg als die nog niet is gekozen). */
  declared?: { date: string | undefined; onChange: (date: string | undefined) => void }
  onClose: () => void
}

/**
 * Overzicht van alle dagen met één bepaalde keuze, per maand een kolom (vier naast elkaar, daarna een
 * nieuwe rij). De periode is aan te passen; zie F15 en F25 in SPEC.md voor de standaardperiode.
 */
export default function Overview({ mode, title, Icon, Badge, iconLabel, registrations, today, declared, onClose }: Props) {
  // Een met de hand gekozen vanaf- of tot-datum; zonder keuze geldt de standaard.
  const [chosenStart, setChosenStart] = useState<Date | null>(null)
  const [chosenEnd, setChosenEnd] = useState<Date | null>(null)

  const todayDate = addDays(today, 0)
  const threeMonthsAgo = addMonths(todayDate, -3)
  const lastDeclared = declared?.date ? parseDateKey(declared.date) : null
  const defaultStart = !declared ? threeMonthsAgo : lastDeclared ? nextWorkday(lastDeclared) : workdayFrom(threeMonthsAgo)
  const start = chosenStart ?? defaultStart
  const latestEnd = addMonths(start, 3)
  const defaultEnd = declared && latestEnd < todayDate ? latestEnd : todayDate
  const end = chosenEnd ?? defaultEnd
  const months = monthsBetween(start, end)
  // Bij meer dan een jaar komt dezelfde maand twee keer voor; dan staat het jaartal erbij.
  const withYear = months.length > 12

  // Alle dagen in de periode met deze keuze, gegroepeerd per kalendermaand.
  const columns = months.map((month) => {
    const days: Date[] = []
    const first = month < start ? start : month
    for (let d = first; d.getMonth() === month.getMonth() && d <= end; d = addDays(d, 1)) {
      if (registrations[dateKey(d)]?.includes(mode)) days.push(d)
    }
    const name = withYear ? `${monthName(month)} ${month.getFullYear()}` : monthName(month)
    return { month, name, days }
  })

  function changeDeclared(value: string) {
    declared?.onChange(value || undefined)
    // Een nieuwe declaratiedatum zet de periode weer op de standaard.
    setChosenStart(null)
    setChosenEnd(null)
  }

  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1 className="wrap">{title}</h1>
        <BadgeIcon Icon={Icon} Badge={Badge} className="period-icon" size={28} label={iconLabel} />
      </header>

      <div className="period">
        <div className="period-fields">
          {declared && (
            <>
              <label htmlFor="laatste-declaratie">Laatst gedeclareerde dag:</label>
              <div className="date-with-clear">
                <input
                  id="laatste-declaratie"
                  type="date"
                  value={declared.date ?? ''}
                  onChange={(e) => changeDeclared(e.target.value)}
                />
                {/* Het kalendertje van Android heeft geen knop om de datum leeg te maken. */}
                {declared.date && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Laatst gedeclareerde dag wissen"
                    onClick={() => changeDeclared('')}
                  >
                    <X size={18} strokeWidth={1.75} aria-hidden />
                  </button>
                )}
              </div>
            </>
          )}
          {/* "Toon vanaf" en "Tot en met" naast elkaar. */}
          <div className="period-range">
            <div className="period-field">
              <label htmlFor="vanaf">Toon vanaf</label>
              <input
                id="vanaf"
                type="date"
                value={dateKey(start)}
                onChange={(e) => setChosenStart(parseDateKey(e.target.value))}
              />
            </div>
            <div className="period-field">
              <label htmlFor="tot">Tot en met</label>
              <input
                id="tot"
                type="date"
                value={dateKey(end)}
                onChange={(e) => setChosenEnd(parseDateKey(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {columns.length > 0 ? (
        <div className="months">
          {columns.map(({ month, name, days }) => (
            <section key={dateKey(month)} className="month" aria-label={name}>
              <h2>{capitalize(name)}</h2>
              {days.length > 0 ? (
                <ul>
                  {days.map((d) => (
                    <li key={dateKey(d)}>{compactDay(d)}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">–</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="muted empty-period">Geen dagen: de vanaf-datum ligt na de tot en met-datum.</p>
      )}
    </main>
  )
}
