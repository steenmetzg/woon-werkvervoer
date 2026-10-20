import { ArrowLeft, House } from 'lucide-react'
import { addDays, compactDay, dateKey, fullDate, monthName, overviewPeriod } from './dates'
import type { Registrations } from './storage'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

interface Props {
  registrations: Registrations
  today: Date
  onClose: () => void
}

export default function HomeOffice({ registrations, today, onClose }: Props) {
  const { start, end, months } = overviewPeriod(today)

  // Alle dagen in de periode met Thuis, gegroepeerd per kalendermaand.
  const columns = months.map((month) => {
    const days: Date[] = []
    const first = month < start ? start : month
    for (let d = first; d.getMonth() === month.getMonth() && d <= end; d = addDays(d, 1)) {
      if (registrations[dateKey(d)] === 'thuis') days.push(d)
    }
    return { month, days }
  })

  return (
    <main className="app">
      <header className="settings-header">
        <button type="button" className="icon-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1 className="wrap">Overzicht thuiswerkvergoeding</h1>
      </header>

      <div className="period">
        <House className="period-icon" size={28} strokeWidth={1.75} aria-label="Thuis" />
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
