import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Info as InfoIcon, Mic, Settings as SettingsIcon, X } from 'lucide-react'
import { dateKey, longLabel, mondayOf, shortLabel, addDays, weekLabel, workdays } from './dates'
import BadgeIcon from './BadgeIcon'
import { isDeclaredMode, loadDeclared, saveDeclared, type Declared } from './declared'
import { useInstallPrompt } from './installPrompt'
import Info from './Info'
import Overview from './Overview'
import { dueReminders } from './reminders'
import { MODE_INFO } from './modeInfo'
import Settings from './Settings'
import { confirmation, gotoConfirmation, loadSpeechEnabled, parseVoiceCommand, saveSpeechEnabled, speechSupported, useSpeech } from './speech'
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
// Pas na zoveel pixels beslissen we of de vinger horizontaal (week volgt de vinger) of verticaal (scrollen) beweegt.
const SWIPE_LOCK_DISTANCE = 10
// Duur van het schuiven naar een andere week, in milliseconden (zelfde waarde als in index.css).
const SLIDE_MS = 250
// Zo lang blijft een melding van de spraakbediening staan, in milliseconden.
const VOICE_MESSAGE_MS = 6000

// "Minder beweging" in de telefoon: dan wisselt de week direct, zonder schuiven.
function prefersReducedMotion() {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [today, setToday] = useState(() => new Date())
  const thisMonday = mondayOf(today)
  const [monday, setMonday] = useState(thisMonday)
  // Weekwissel als een strook met drie weken naast elkaar (vorige, deze, volgende).
  // dragX: hoe ver de strook tijdens het swipen met de vinger is meegeschoven.
  // slide: de week waar de strook naartoe schuift; als hij er is, wordt dat de getoonde week.
  // settling: de strook schuift terug na een te korte swipe.
  const [dragX, setDragX] = useState(0)
  const [slide, setSlide] = useState<{ target: Date; dir: 1 | -1 } | null>(null)
  const [settling, setSettling] = useState(false)
  const [registrations, setRegistrations] = useState<Registrations>(loadRegistrations)
  const [enabledModes, setEnabledModes] = useState<Mode[]>(loadEnabledModes)
  const [declared, setDeclared] = useState<Declared>(loadDeclared)
  const [screen, setScreen] = useState<'week' | 'settings' | 'info' | keyof typeof OVERVIEWS>('week')
  const installPrompt = useInstallPrompt()
  // Spraakbediening (F29, F30).
  const [speechEnabled, setSpeechEnabled] = useState(loadSpeechEnabled)
  const [voiceMessage, setVoiceMessage] = useState<{
    kind: 'ok' | 'error'
    text: string
    undo?: { key: string; before: Mode[] | undefined }
  } | null>(null)
  const speech = useSpeech(handleHeard, (text) => setVoiceMessage({ kind: 'error', text }))
  const showMic = speechEnabled && speechSupported()

  useEffect(() => {
    saveRegistrations(registrations)
  }, [registrations])

  useEffect(() => {
    saveEnabledModes(enabledModes)
  }, [enabledModes])

  useEffect(() => {
    saveDeclared(declared)
  }, [declared])

  useEffect(() => {
    saveSpeechEnabled(speechEnabled)
  }, [speechEnabled])

  // De melding van de spraakbediening verdwijnt vanzelf na een paar seconden.
  useEffect(() => {
    if (!voiceMessage) return
    const timer = setTimeout(() => setVoiceMessage(null), VOICE_MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [voiceMessage])

  // Een app op het beginscherm blijft soms dagen open staan: werk "vandaag" bij
  // zodra de app weer in beeld komt.
  useEffect(() => {
    function refreshToday() {
      if (document.visibilityState === 'visible') setToday(new Date())
    }
    document.addEventListener('visibilitychange', refreshToday)
    return () => document.removeEventListener('visibilitychange', refreshToday)
  }, [])

  const todayKey = dateKey(today)
  const isThisWeek = dateKey(slide ? slide.target : monday) === dateKey(thisMonday)
  // Thuis staat altijd aan; de andere overzichten alleen als hun vervoervorm aan staat.
  const reminders = dueReminders(declared, enabledModes, today)
  const overviewModes = (Object.keys(OVERVIEWS) as (keyof typeof OVERVIEWS)[]).filter((mode) =>
    enabledModes.includes(mode),
  )

  // De week die getoond wordt of waar de strook al naartoe schuift.
  const shownMonday = slide ? slide.target : monday

  function goToWeek(next: Date) {
    // Tik je snel nog een keer, dan is de vorige wissel meteen klaar.
    const from = shownMonday
    if (slide) setMonday(slide.target)
    setSettling(false)
    if (next.getTime() === from.getTime() || prefersReducedMotion()) {
      setSlide(null)
      setMonday(next)
      return
    }
    setSlide({ target: next, dir: next.getTime() > from.getTime() ? 1 : -1 })
  }

  function finishSlide() {
    if (slide) setMonday(slide.target)
    setSlide(null)
    setSettling(false)
  }

  // Vangnet als de browser het einde van het schuiven niet meldt (bijv. als de app op de achtergrond gaat).
  useEffect(() => {
    if (!slide) return
    const timer = setTimeout(finishSlide, SLIDE_MS + 750)
    return () => clearTimeout(timer)
  })

  // Swipen: naar links = volgende week, naar rechts = vorige week. Tijdens het swipen schuift de week
  // met de vinger mee. Alleen een duidelijke, vooral horizontale beweging telt, zodat scrollen en tikken
  // gewoon werken.
  const touchStart = useRef<{ x: number; y: number; direction: 'horizontal' | 'vertical' | null } | null>(null)

  function handleTouchStart(e: TouchEvent) {
    if (slide) finishSlide()
    setDragX(0)
    if (e.touches.length !== 1) {
      touchStart.current = null
      return
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, direction: null }
  }

  function handleTouchMove(e: TouchEvent) {
    const start = touchStart.current
    if (!start || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - start.x
    const dy = e.touches[0].clientY - start.y
    if (start.direction === null && Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_LOCK_DISTANCE) {
      start.direction = Math.abs(dx) >= Math.abs(dy) * 1.5 ? 'horizontal' : 'vertical'
    }
    if (start.direction === 'horizontal') setDragX(dx)
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (dragX !== 0) {
      setDragX(0)
      setSettling(!prefersReducedMotion())
    }
    if (!start || e.changedTouches.length === 0 || start.direction === 'vertical') return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return
    goToWeek(addDays(shownMonday, dx < 0 ? 7 : -7))
  }

  function renderDay(day: Date) {
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

  // De spraakherkenning geeft soms een paar mogelijke zinnen; de eerste die klopt, telt.
  function handleHeard(alternatives: string[]) {
    const results = alternatives.map((text) => parseVoiceCommand(text, new Date(), shownMonday, enabledModes))
    const command = results.find((r) => r.ok) ?? results[0]
    if (!command.ok) {
      setVoiceMessage({ kind: 'error', text: command.error })
      return
    }
    // Alleen naar een week gaan (F31), er verandert niets aan de keuzes.
    if ('goto' in command) {
      setVoiceMessage({ kind: 'ok', text: gotoConfirmation(command.goto, new Date()) })
      if (command.goto.getTime() !== shownMonday.getTime()) goToWeek(command.goto)
      return
    }
    const key = dateKey(command.date)
    const before = registrations[key]
    setRegistrations((prev) => ({ ...prev, [key]: command.modes }))
    setVoiceMessage({ kind: 'ok', text: confirmation(command.modes, command.date), undo: { key, before } })
    const week = mondayOf(command.date)
    if (week.getTime() !== shownMonday.getTime()) goToWeek(week)
  }

  function undoVoice() {
    const undo = voiceMessage?.undo
    if (!undo) return
    setRegistrations((prev) => {
      const next = { ...prev }
      if (undo.before) next[undo.key] = undo.before
      else delete next[undo.key]
      return next
    })
    setVoiceMessage(null)
  }

  function toggleListening() {
    if (speech.listening) {
      speech.stop()
      return
    }
    setVoiceMessage(null)
    speech.start()
  }

  if (screen === 'settings') {
    return (
      <Settings
        registrations={registrations}
        enabledModes={enabledModes}
        onChangeEnabledModes={setEnabledModes}
        declared={declared}
        speechEnabled={speechEnabled}
        onChangeSpeechEnabled={setSpeechEnabled}
        onRestore={(restored, restoredDeclared) => {
          setRegistrations(restored)
          // Een backup van voor WoonWerk 1.10 heeft geen gedeclareerde dagen; dan blijven de huidige staan.
          if (restoredDeclared) setDeclared(restoredDeclared)
        }}
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
        declared={
          isDeclaredMode(screen)
            ? {
                date: declared[screen],
                onChange: (date) =>
                  setDeclared((prev) => {
                    const next = { ...prev }
                    if (date) next[screen] = date
                    else delete next[screen]
                    return next
                  }),
              }
            : undefined
        }
        onClose={() => setScreen('week')}
      />
    )
  }

  return (
    <main
      className="app week"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null
        setDragX(0)
      }}
    >
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
            onClick={() => goToWeek(addDays(shownMonday, -7))}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="week-label">{weekLabel(shownMonday, today.getFullYear())}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Volgende week"
            onClick={() => goToWeek(addDays(shownMonday, 7))}
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className="today-button"
            disabled={isThisWeek}
            onClick={() => goToWeek(thisMonday)}
          >
            Deze week
          </button>
        </nav>
      </header>

      <div className="week-viewport">
        <div
          className={slide || settling ? 'week-track sliding' : 'week-track'}
          style={{
            transform: slide
              ? `translateX(${slide.dir === 1 ? -200 : 0}%)`
              : `translateX(calc(-100% + ${dragX}px))`,
          }}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget) finishSlide()
          }}
        >
          {[
            slide?.dir === -1 ? slide.target : addDays(monday, -7),
            monday,
            slide?.dir === 1 ? slide.target : addDays(monday, 7),
          ].map((weekStart) => {
            const current = weekStart === monday
            return (
              // Vaste sleutel per week, zodat de binnengeschoven week na het schuiven gewoon blijft staan.
              <ol key={dateKey(weekStart)} className="days" aria-hidden={current ? undefined : true} inert={!current}>
                {workdays(weekStart).map(renderDay)}
              </ol>
            )
          })}
        </div>
      </div>

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
        {reminders.map(({ mode, title, text }) => (
          <button key={mode} type="button" className="reminder" onClick={() => setScreen(mode)}>
            <BadgeIcon Icon={MODE_INFO[mode].Icon} />
            <span>
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
          </button>
        ))}
        {showMic && speech.listening && (
          <section className="voice" aria-live="polite">
            <p>
              <strong>Luisteren…</strong> Zeg bijvoorbeeld: "fiets op 1 oktober".
            </p>
          </section>
        )}
        {showMic && !speech.listening && voiceMessage && (
          <section className={voiceMessage.kind === 'error' ? 'voice error' : 'voice'} aria-live="polite">
            <p role="status">{voiceMessage.text}</p>
            {voiceMessage.undo && (
              <button type="button" className="voice-undo" onClick={undoVoice}>
                Ongedaan maken
              </button>
            )}
            <button type="button" className="voice-close" aria-label="Melding sluiten" onClick={() => setVoiceMessage(null)}>
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </section>
        )}
        <nav className="overview-bar" aria-label="Overzichten">
          {showMic && (
            <button
              type="button"
              className={speech.listening ? 'icon-button mic listening' : 'icon-button mic'}
              aria-label={speech.listening ? 'Stoppen met luisteren' : 'Inspreken'}
              aria-pressed={speech.listening}
              onClick={toggleListening}
            >
              <Mic size={18} strokeWidth={2} aria-hidden />
            </button>
          )}
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
