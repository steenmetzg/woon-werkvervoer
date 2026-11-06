import { ArrowLeft, Check, Clock } from 'lucide-react'
import BadgeIcon from './BadgeIcon'
import { compactDay, monthName, parseDateKey } from './dates'
import { formatHours, groupHours, type Hours, type Rubriek } from './hours'

interface Props {
  hours: Hours
  rubrieken: Rubriek[]
  onClose: () => void
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Overzicht van alle geregistreerde uren per maand (nieuwste eerst) en daarbinnen per rubriek (F34). */
export default function HoursOverview({ hours, rubrieken, onClose }: Props) {
  const months = groupHours(hours, rubrieken)
  return (
    <main className="app hours-overview">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1 className="wrap">Overzicht uren</h1>
        <BadgeIcon Icon={Clock} Badge={Check} className="period-icon" size={28} label="Uren" />
      </header>

      {months.length === 0 && <p className="muted">Nog geen uren geregistreerd.</p>}

      {months.map(({ month, total, groups }) => {
        const name = `${capitalize(monthName(month))} ${month.getFullYear()}`
        return (
          <section key={name} className="hours-month" aria-label={name}>
            <h2>
              <span>{name}</span>
              <span className="hours-sum">{formatHours(total)} uur</span>
            </h2>
            {groups.map((group) => (
              <section key={group.rubriek} className="hours-group" aria-label={`${group.naam} in ${name}`}>
                <h3>
                  <span>{group.naam}</span>
                  <span className="hours-sum">{formatHours(group.total)} uur</span>
                </h3>
                <ul>
                  {group.lines.map(({ date, line }, i) => (
                    <li key={`${date}-${i}`}>
                      <span className="hours-date">{compactDay(parseDateKey(date)!)}</span>
                      <span className="hours-amount">{formatHours(line.uren)}</span>
                      <span className="hours-text">{line.omschrijving}</span>
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
