import { ArrowLeft, type LucideIcon } from 'lucide-react'
import BadgeIcon from './BadgeIcon'
import { addDays, compactDay, dateKey, fullDate, monthName, overviewPeriod } from './dates'
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
  onClose: () => void
}

/** Overzicht van alle dagen met één bepaalde keuze, van 3 maanden geleden tot vandaag, per maand een kolom. */
export default function Overview({ mode, title, Icon, Badge, iconLabel, registrations, today, onClose }: Props) {
  const { start, end, months } = overviewPeriod(today)

  // Alle dagen in de periode met deze keuze, gegroepeerd per kalendermaand.
  const columns = months.map((month) => {
    const days: Date[] = []
    const first = month < start ? start : month
    for (let d = first; d.getMonth() === month.getMonth() && d <= end; d = addDays(d, 1)) {
      if (registrations[dateKey(d)] === mode) days.push(d)
    }
    return { month, days }
  })

  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1 className="wrap">{title}</h1>
      </header>

      <div className="period">
        <BadgeIcon Icon={Icon} Badge={Badge} className="period-icon" size={28} label={iconLabel} />
        <dl>
          <div>
            <dt>Vanaf</dt>
            <dd data-testid="vanaf">{fullDate(start)}</dd>
          </div>
          <div>
            <dt>Tot en met</dt>
            <dd data-testid="tot">{fullDate(end)}</dd>
          </div>
        </dl>
      </div>

      <div className="months">
        {columns.map(({ month, days }) => (
          <section key={dateKey(month)} className="month" aria-label={monthName(month)}>
            <h2>{capitalize(monthName(month))}</h2>
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
    </main>
  )
}
