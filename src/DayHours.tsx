import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, ClockPlus, X } from 'lucide-react'
import Amount from './Amount'
import { addDays, dateKey, shortLabel } from './dates'
import {
  hoursText,
  MAX_OMSCHRIJVING,
  MAX_UREN_PER_REGEL,
  rubriekNaam,
  sumHours,
  type HourLine,
  type Hours,
  type Rubriek,
} from './hours'

interface Props {
  day: Date
  today: Date
  /** Alle uren; de buurdagen staan ernaast klaar om in beeld te schuiven. */
  hours: Hours
  rubrieken: Rubriek[]
  /** De nieuwe regels van de dag die open staat. */
  onChange: (lines: HourLine[]) => void
  onChangeDay: (day: Date) => void
  onClose: () => void
  /** Onderaan: de meldingen en de microfoonknop van de spraakbediening (als die aan staat). */
  bottom?: ReactNode
}

// Keuzes voor het aantal uur: 0,25 tot en met 12, per kwartier.
const UREN_KEUZES = Array.from({ length: MAX_UREN_PER_REGEL * 4 }, (_, i) => (i + 1) / 4)

/** De werkdag ervoor of erna (het weekend slaan we over). */
function otherWorkday(day: Date, step: 1 | -1): Date {
  let d = addDays(day, step)
  while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, step)
  return d
}

// Vanaf hoeveel pixels een beweging als swipe telt, en vanaf wanneer vastligt of hij horizontaal of verticaal is
// (dezelfde waarden als bij de weken op het hoofdscherm).
const SWIPE_MIN_DISTANCE = 50
const SWIPE_LOCK_DISTANCE = 10
const SLIDE_MS = 250

// "Minder beweging" in de telefoon: dan wisselt de dag direct, zonder schuiven.
function prefersReducedMotion() {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Scherm met de uren van één dag (F33): per rubriek een blok met een knop om een regel toe te voegen, en
 * daarin de regels met het aantal uur en een korte omschrijving op één regel. Bladeren gaat zoals de weken
 * op het hoofdscherm: een strook met de vorige, deze en de volgende werkdag die met de vinger meeschuift.
 */
export default function DayHours({ day, today, hours, rubrieken, onChange, onChangeDay, onClose, bottom }: Props) {
  // dragX: hoe ver de strook tijdens het swipen met de vinger is meegeschoven.
  // slide: de dag waar de strook naartoe schuift; als hij er is, wordt dat de getoonde dag.
  // settling: de strook schuift terug na een te korte swipe.
  const [dragX, setDragX] = useState(0)
  const [slide, setSlide] = useState<{ target: Date; dir: 1 | -1 } | null>(null)
  const [settling, setSettling] = useState(false)
  const touchStart = useRef<{ x: number; y: number; direction: 'horizontal' | 'vertical' | null } | null>(null)

  // De dag die getoond wordt of waar de strook al naartoe schuift.
  const shownDay = slide ? slide.target : day
  const isToday = dateKey(shownDay) === dateKey(today)

  function goToDay(next: Date) {
    // Tik je snel nog een keer, dan is de vorige wissel meteen klaar.
    const from = shownDay
    if (slide) onChangeDay(slide.target)
    setSettling(false)
    if (dateKey(next) === dateKey(from) || prefersReducedMotion()) {
      setSlide(null)
      onChangeDay(next)
      return
    }
    setSlide({ target: next, dir: next.getTime() > from.getTime() ? 1 : -1 })
  }

  function finishSlide() {
    if (slide) onChangeDay(slide.target)
    setSlide(null)
    setSettling(false)
  }

  // Vangnet als de browser het einde van het schuiven niet meldt (bijv. als de app op de achtergrond gaat).
  useEffect(() => {
    if (!slide) return
    const timer = setTimeout(finishSlide, SLIDE_MS + 750)
    return () => clearTimeout(timer)
  })

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
    goToDay(otherWorkday(shownDay, dx < 0 ? 1 : -1))
  }

  /** De blokken en het totaal van één dag; alleen de dag die open staat is te bewerken. */
  function renderDay(d: Date) {
    const lines = hours[dateKey(d)] ?? []
    function update(index: number, change: Partial<HourLine>) {
      onChange(lines.map((line, i) => (i === index ? { ...line, ...change } : line)))
    }
    // Regels van een rubriek die niet meer bestaat (bijv. na het inlezen van een backup) blijven zichtbaar.
    const missing = [...new Set(lines.map((l) => l.rubriek))].filter((id) => !rubrieken.some((r) => r.id === id))
    const groups = [
      ...rubrieken.map((r) => ({ id: r.id, naam: r.naam, known: true })),
      ...missing.map((id) => ({ id, naam: rubriekNaam(rubrieken, id), known: false })),
    ]
    return (
      <>
        <div className="hour-groups">
          {groups.map((group) => {
            const own = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.rubriek === group.id)
            const total = sumHours(own.map(({ line }) => line))
            return (
              <section key={group.id} className="hour-group" aria-label={group.naam}>
                <div className="hour-group-head">
                  <h2>{group.naam}</h2>
                  {total > 0 && <Amount value={total} className="amount-sum" />}
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
                        <input
                          type="text"
                          aria-label="Omschrijving"
                          placeholder="Omschrijving"
                          maxLength={MAX_OMSCHRIJVING}
                          value={line.omschrijving}
                          onChange={(e) => update(index, { omschrijving: e.target.value })}
                        />
                        {/* Het getal staat zelf in beeld, op de komma uitgelijnd; de onzichtbare keuzelijst erover
                            opent bij een tik de keuzelijst van de telefoon. */}
                        <span className="hour-amount">
                          <Amount value={line.uren} className="amount-cells" />
                          <select
                            aria-label="Aantal uur"
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
                        </span>
                        <button
                          type="button"
                          className="icon-button line-delete"
                          aria-label="Regel verwijderen"
                          onClick={() => onChange(lines.filter((_, i) => i !== index))}
                        >
                          <X size={16} strokeWidth={1.75} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>

        {/* Het eindtotaal in dezelfde kolom als de uren van de regels. */}
        <p className="hours-total">
          <span>Totaal</span>
          <Amount value={sumHours(lines)} className="amount-sum" />
        </p>
      </>
    )
  }

  return (
    <main
      className="app day-hours"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStart.current = null
        setDragX(0)
      }}
    >
      <header className="settings-header">
        <button type="button" className="back-button" aria-label="Terug" onClick={onClose}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <h1>Uren</h1>
        <Clock className="period-icon" size={24} strokeWidth={1.75} aria-hidden />
      </header>

      <nav className="week-nav day-nav" aria-label="Dag kiezen">
        <button type="button" className="icon-button" aria-label="Vorige dag" onClick={() => goToDay(otherWorkday(shownDay, -1))}>
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <span className="week-label">{shortLabel(shownDay)}</span>
        <button type="button" className="icon-button" aria-label="Volgende dag" onClick={() => goToDay(otherWorkday(shownDay, 1))}>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <button type="button" className="today-button" disabled={isToday} onClick={() => goToDay(today)}>
          Vandaag
        </button>
      </nav>

      {rubrieken.length === 0 && !hours[dateKey(day)]?.length && <p className="muted">Maak eerst een rubriek via het tandwiel, bij Uren.</p>}

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
            slide?.dir === -1 ? slide.target : otherWorkday(day, -1),
            day,
            slide?.dir === 1 ? slide.target : otherWorkday(day, 1),
          ].map((d) => {
            const current = d === day
            return (
              // Vaste sleutel per dag, zodat de binnengeschoven dag na het schuiven gewoon blijft staan.
              <div key={dateKey(d)} className="day-page" aria-hidden={current ? undefined : true} inert={!current}>
                {renderDay(d)}
              </div>
            )
          })}
        </div>
      </div>

      {bottom && <div className="bottom">{bottom}</div>}
    </main>
  )
}
