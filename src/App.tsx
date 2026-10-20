import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Bike, Car, ChevronLeft, ChevronRight, House, TrainFront, TreePalm, type LucideIcon } from 'lucide-react'
import { dateKey, longLabel, mondayOf, shortLabel, addDays, weekLabel, workdays } from './dates'
import { MODES, loadRegistrations, saveRegistrations, type Mode, type Registrations } from './storage'

const MODE_INFO: Record<Mode, { label: string; Icon: LucideIcon }> = {
  thuis: { label: 'Thuis', Icon: House },
  trein: { label: 'Trein', Icon: TrainFront },
  fiets: { label: 'Fiets', Icon: Bike },
  auto: { label: 'Auto', Icon: Car },
  vrij: { label: 'Vrij', Icon: TreePalm },
}

const SWIPE_MIN_DISTANCE = 50

export default function App() {
  const [today, setToday] = useState(() => new Date())
  const thisMonday = mondayOf(today)
  const [monday, setMonday] = useState(thisMonday)
  const [registrations, setRegistrations] = useState<Registrations>(loadRegistrations)

  useEffect(() => {
    saveRegistrations(registrations)
  }, [registrations])

  // Een app op het beginscherm blijft soms dagen open staan: werk "vandaag" bij
  // zodra de app weer in beeld komt.
  useEffect(() => {
    function refreshToday() {
      if (document.visibilityState === 'visible') setToday(new Date())
    }
    document.addEventListener('visibilitychange', refreshToday)
    return () => document.removeEventListener('visibilitychange', refreshToday)
  }, [])

  const days = workdays(monday)
  const todayKey = dateKey(today)
  const isThisWeek = dateKey(monday) === dateKey(thisMonday)

  // Swipen: naar links = volgende week, naar rechts = vorige week.
  // Alleen een duidelijke, vooral horizontale beweging telt, zodat scrollen en tikken gewoon werken.
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) {
      touchStart.current = null
      return
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start || e.changedTouches.length === 0) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    setMonday((m) => addDays(m, dx < 0 ? 7 : -7))
  }

  function choose(day: Date, mode: Mode) {
    const key = dateKey(day)
    setRegistrations((prev) => {
      const next = { ...prev }
      if (next[key] === mode) delete next[key]
      else next[key] = mode
      return next
    })
  }

  const totals = MODES.map((mode) => ({
    mode,
    count: days.filter((d) => registrations[dateKey(d)] === mode).length,
  }))

  return (
    <main className="app" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header className="header">
        <h1>Woon-werkvervoer</h1>
        <nav className="week-nav" aria-label="Week kiezen">
          <button
            type="button"
            className="icon-button"
            aria-label="Vorige week"
            onClick={() => setMonday(addDays(monday, -7))}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="week-label">{weekLabel(monday)}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Volgende week"
            onClick={() => setMonday(addDays(monday, 7))}
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </nav>
        <button
          type="button"
          className="today-button"
          disabled={isThisWeek}
          onClick={() => setMonday(thisMonday)}
        >
          Deze week
        </button>
      </header>

      <ol className="days">
        {days.map((day) => {
          const key = dateKey(day)
          const isToday = key === todayKey
          const chosen = registrations[key]
          return (
            <li
              key={key}
              className={isToday ? 'day today' : 'day'}
              aria-label={longLabel(day)}
              aria-current={isToday ? 'date' : undefined}
            >
              <div className="day-label">
                {shortLabel(day)}
                {isToday && <span className="today-tag">vandaag</span>}
              </div>
              <div className="modes" role="group" aria-label={`Vervoer op ${longLabel(day)}`}>
                {MODES.map((mode) => {
                  const { label, Icon } = MODE_INFO[mode]
                  const selected = chosen === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={selected ? 'mode selected' : 'mode'}
                      aria-pressed={selected}
                      onClick={() => choose(day, mode)}
                    >
                      <Icon size={20} strokeWidth={1.75} aria-hidden />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ol>

      <footer className="totals" aria-label="Weektotalen" data-testid="totalen">
        {totals.map(({ mode, count }, i) => (
          <span key={mode} className="total">
            {i > 0 && <span className="sep" aria-hidden>{' · '}</span>}
            {MODE_INFO[mode].label} {count}
          </span>
        ))}
      </footer>
    </main>
  )
}
