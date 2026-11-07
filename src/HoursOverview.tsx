import { useState } from 'react'
import { ArrowLeft, Check, Clock } from 'lucide-react'
import Amount from './Amount'
import BadgeIcon from './BadgeIcon'
import { addDays, addMonths, compactDay, dateKey, monthName, parseDateKey } from './dates'
import { groupHours, type Hours, type Rubriek } from './hours'

interface Props {
  hours: Hours
  rubrieken: Rubriek[]
  today: Date
  onClose: () => void
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Overzicht van de geregistreerde uren per maand (nieuwste eerst) en daarbinnen per rubriek (F34). Alle
 * aantallen staan rechts in één kolom, op de komma uitgelijnd. De periode is aan te passen; standaard
 * precies 3 maanden geleden tot en met vandaag, zoals bij het overzicht fietsdagen (F26).
 */
export default function HoursOverview({ hours, rubrieken, today, onClose }: Props) {
  // Een met de hand gekozen vanaf- of tot-datum; zonder keuze geldt de standaard.
  const [chosenStart, setChosenStart] = useState<Date | null>(null)
  const [chosenEnd, setChosenEnd] = useState<Date | null>(null)

  const todayDate = addDays(today, 0)
  const start = chosenStart ?? addMonths(todayDate, -3)
  const end = chosenEnd ?? todayDate
  const startKey = dateKey(start)
  const endKey = dateKey(end)
  const hasHours = Object.values(hours).some((lines) => lines.length > 0)

  // Alleen de uren binnen de gekozen periode tellen mee, ook in de totalen.
  const inPeriod: Hours = {}
  for (const [date, lines] of Object.entries(hours)) {
    if (date >= startKey && date <= endKey) inPeriod[date] = lines
  }
  const months = start > end ? [] : groupHours(inPeriod, rubrieken)
  return (
    <main className="app hours-overview">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1 className="wrap">Overzicht uren</h1>
        <BadgeIcon Icon={Clock} Badge={Check} className="period-icon" size={28} label="Uren" />
      </header>

      <div className="period">
        <div className="period-fields">
          {/* "Toon vanaf" en "Tot en met" naast elkaar, net als in de andere overzichten. */}
          <div className="period-range">
            <div className="period-field">
              <label htmlFor="vanaf">Toon vanaf</label>
              <input
                id="vanaf"
                type="date"
                value={startKey}
                onChange={(e) => setChosenStart(parseDateKey(e.target.value))}
              />
            </div>
            <div className="period-field">
              <label htmlFor="tot">Tot en met</label>
              <input
                id="tot"
                type="date"
                value={endKey}
                onChange={(e) => setChosenEnd(parseDateKey(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {!hasHours ? (
        <p className="muted empty-period">Nog geen uren geregistreerd.</p>
      ) : start > end ? (
        <p className="muted empty-period">Geen uren: de vanaf-datum ligt na de tot en met-datum.</p>
      ) : (
        months.length === 0 && <p className="muted empty-period">Geen uren in deze periode.</p>
      )}

      {months.map(({ month, total, groups }) => {
        const name = `${capitalize(monthName(month))} ${month.getFullYear()}`
        return (
          <section key={name} className="hours-month" aria-label={name}>
            <h2>
              <span>{name}</span>
              <Amount value={total} className="amount-cells" />
            </h2>
            {groups.map((group) => (
              <section key={group.rubriek} className="hours-group" aria-label={`${group.naam} in ${name}`}>
                <h3>
                  <span>{group.naam}</span>
                  <Amount value={group.total} className="amount-cells" />
                </h3>
                <ul>
                  {group.lines.map(({ date, line }, i) => (
                    <li key={`${date}-${i}`}>
                      <span className="hours-date">{compactDay(parseDateKey(date)!)}</span>
                      <span className="hours-text">{line.omschrijving}</span>
                      <Amount value={line.uren} className="amount-cells" />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </section>
        )
      })}
    </main>
  )
}
