import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Info as InfoIcon, Settings as SettingsIcon } from 'lucide-react'
import { dateKey, longLabel, mondayOf, shortLabel, addDays, weekLabel, workdays } from './dates'
import BadgeIcon from './BadgeIcon'
import { useInstallPrompt } from './installPrompt'
import Info from './Info'
import Overview from './Overview'
import { MODE_INFO } from './modeInfo'
import Settings from './Settings'
import {
  loadEnabledModes,
  loadRegistrations,
  saveEnabledModes,
  saveRegistrations,
  toggleMode,
  type Mode,
  type Registrations,
} from './storage'

// In de vaste volgorde Thuis, Trein, Fiets, Auto, Vrij. Zonder vinkje krijgt het icoon een euroteken.
const OVERVIEWS = {
  thuis: { title: 'Overzicht thuiswerkvergoeding', check: false },
  trein: { title: 'Overzicht treinvergoeding', check: false },
  fiets: { title: 'Overzicht fietsdagen', check: true },
  auto: { title: 'Overzicht kilometervergoeding', check: false },
  vrij: { title: 'Overzicht vrije dagen', check: true },
} as const

const SWIPE_MIN_DISTANCE = 50

export default function App() {
  const [today, setToday] = useState(() => new Date())
  const thisMonday = mondayOf(today)
  const [monday, setMonday] = useState(thisMonday)
  const [registrations, setRegistrations] = useState<Registrations>(loadRegistrations)
  const [enabledModes, setEnabledModes] = useState<Mode[]>(loadEnabledModes)
  const [screen, setScreen] = useState<'week' | 'settings' | 'info' | keyof typeof OVERVIEWS>('week')
  const installPrompt = useInstallPrompt()

  useEffect(() => {
    saveRegistrations(registrations)
  }, [registrations])

  useEffect(() => {
    saveEnabledModes(enabledModes)
  }, [enabledModes])

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
  // Thuis staat altijd aan; de andere overzichten alleen als hun vervoervorm aan staat.
  const overviewModes = (Object.keys(OVERVIEWS) as (keyof typeof OVERVIEWS)[]).filter((mode) =>
    enabledModes.includes(mode),
  )

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
      const modes = toggleMode(prev[key] ?? [], mode)
      if (modes.length > 0) next[key] = modes
      else delete next[key]
      return next
    })
  }

  if (screen === 'settings') {
    return (
      <Settings
        registrations={registrations}
        enabledModes={enabledModes}
        onChangeEnabledModes={setEnabledModes}
        onRestore={setRegistrations}
        onClose={() => setScreen('week')}
      />
    )
  }

  if (screen === 'info') {
    return <Info onClose={() => setScreen('week')} />
  }

  if (screen !== 'week') {
    const { title, check } = OVERVIEWS[screen]
    const { label, Icon } = MODE_INFO[screen]
    return (
      <Overview
        mode={screen}
        title={title}
        Icon={Icon}
        Badge={check ? Check : undefined}
        iconLabel={label}
        registrations={registrations}
        today={today}
        onClose={() => setScreen('week')}
      />
    )
  }

  return (
    <main className="app week" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <header className="header">
        <h1>WoonWerk</h1>
        <div className="header-actions">
          <button type="button" className="icon-button" aria-label="Informatie" onClick={() => setScreen('info')}>
            <InfoIcon size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Instellingen en backup"
            onClick={() => setScreen('settings')}
          >
            <SettingsIcon size={20} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <nav className="week-nav" aria-label="Week kiezen">
          <button
            type="button"
            className="icon-button"
            aria-label="Vorige week"
            onClick={() => setMonday(addDays(monday, -7))}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="week-label">{weekLabel(monday, today.getFullYear())}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Volgende week"
            onClick={() => setMonday(addDays(monday, 7))}
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="today-button"
            disabled={isThisWeek}
            onClick={() => setMonday(thisMonday)}
          >
            Deze week
          </button>
        </nav>
      </header>

      <ol className="days">
        {days.map((day) => {
          const key = dateKey(day)
          const isToday = key === todayKey
          const chosen = registrations[key] ?? []
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
                {enabledModes.map((mode) => {
                  const { label, Icon } = MODE_INFO[mode]
                  const selected = chosen.includes(mode)
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

      <div className="bottom">
        {installPrompt.show && (
          <section className="install" aria-label="App installeren">
            <p>WoonWerk als app installeren?</p>
            <button type="button" onClick={installPrompt.notNow}>
              Niet nu
            </button>
            <button type="button" className="install-now" onClick={installPrompt.install}>
              Installeren
            </button>
          </section>
        )}
        <nav className="overview-bar" aria-label="Overzichten">
          {overviewModes.map((mode) => {
            const { title, check } = OVERVIEWS[mode]
            return (
              <button key={mode} type="button" className="icon-button" aria-label={title} onClick={() => setScreen(mode)}>
                <BadgeIcon Icon={MODE_INFO[mode].Icon} Badge={check ? Check : undefined} />
              </button>
            )
          })}
        </nav>
      </div>
    </main>
  )
}
