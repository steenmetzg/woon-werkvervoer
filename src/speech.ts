import { useEffect, useRef, useState } from 'react'
import { addDays, longLabel, mondayOf, weekLabel } from './dates'
import { MODE_INFO } from './modeInfo'
import { MODES, type Mode } from './storage'

// Spraakbediening (F29): met de microfoonknop zeg je bijvoorbeeld "fiets op 1 oktober".
// Alles van de spraakbediening staat in dit bestand, zodat het makkelijk weer weg kan.

const MAANDEN: Record<string, number> = {
  januari: 0, jan: 0, februari: 1, feb: 1, maart: 2, mrt: 2, april: 3, apr: 3, mei: 4, juni: 5, jun: 5,
  juli: 6, jul: 6, augustus: 7, aug: 7, september: 8, sep: 8, sept: 8, oktober: 9, okt: 9, november: 10,
  nov: 10, december: 11, dec: 11,
}

// Getallen die de spraakherkenning soms als woord schrijft ("eerste oktober", "drie november").
const GETALLEN: Record<string, number> = {
  een: 1, eerste: 1, twee: 2, tweede: 2, drie: 3, derde: 3, vier: 4, vierde: 4, vijf: 5, vijfde: 5,
  zes: 6, zesde: 6, zeven: 7, zevende: 7, acht: 8, achtste: 8, negen: 9, negende: 9, tien: 10, tiende: 10,
  elf: 11, elfde: 11, twaalf: 12, twaalfde: 12,
}

const WEEKDAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']

// Welke woorden bij welke keuze horen. "vrijdag" telt niet als Vrij, want het hele woord moet kloppen.
const MODE_WORDS: Record<Mode, RegExp> = {
  thuis: /\b(thuis\w*|thuisgewerkt)\b/,
  trein: /\btrein\w*\b/,
  fiets: /\b(fiets\w*|gefietst)\b/,
  auto: /\bauto\b/,
  vrij: /\b(vrij|vrije|vakantie\w*|feestdag)\b/,
}

export type VoiceCommand =
  | { ok: true; modes: Mode[]; date: Date }
  | { ok: true; goto: Date }
  | { ok: false; error: string }

// Woorden waarmee je naar een week gaat zonder iets in te vullen (F31): "ga naar 1 oktober", "toon de week van
// 1 oktober", "laat 1 oktober zien".
const GOTO_WORDS = /\b(ga|gaan|naar|toon|tonen|laat|zien|open|bekijk|spring|week)\b/

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day)
  return date.getMonth() === month && date.getDate() === day ? date : null
}

/** Zonder jaartal: het jaar waarin die datum het dichtst bij vandaag ligt (in januari is "20 december" dus vorig jaar). */
function closestYear(month: number, day: number, today: Date): Date | null {
  const candidates = [-1, 0, 1]
    .map((offset) => sameDate(today.getFullYear() + offset, month, day))
    .filter((d): d is Date => d !== null)
  if (candidates.length === 0) return null
  const now = startOfDay(today).getTime()
  return candidates.reduce((best, d) => (Math.abs(d.getTime() - now) < Math.abs(best.getTime() - now) ? d : best))
}

function toNumber(word: string): number | null {
  const digits = /^(\d{1,2})(e|ste|de)?$/.exec(word)
  if (digits) return Number(digits[1])
  return GETALLEN[word] ?? null
}

/** Zoekt de datum in de zin. `undefined` = geen datum genoemd, `null` = een datum die niet bestaat. */
function findDate(text: string, today: Date, shownMonday: Date): Date | null | undefined {
  if (/\beergisteren\b/.test(text)) return addDays(today, -2)
  if (/\bgisteren\b/.test(text)) return addDays(today, -1)
  if (/\bvandaag\b/.test(text)) return startOfDay(today)
  if (/\bmorgen\b/.test(text)) return addDays(today, 1)

  // "1 oktober", "1e oktober", "eerste oktober", eventueel met jaartal: "1 oktober 2026".
  const words = text.split(' ')
  for (let i = 1; i < words.length; i++) {
    const month = MAANDEN[words[i]]
    if (month === undefined) continue
    const day = toNumber(words[i - 1])
    if (day === null) continue
    const year = /^\d{4}$/.test(words[i + 1] ?? '') ? Number(words[i + 1]) : null
    return year === null ? closestYear(month, day, today) : sameDate(year, month, day)
  }

  // "1-10" of "1/10/2026".
  const numeric = /\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{4}))?\b/.exec(text)
  if (numeric) {
    const day = Number(numeric[1])
    const month = Number(numeric[2]) - 1
    return numeric[3] ? sameDate(Number(numeric[3]), month, day) : closestYear(month, day, today)
  }

  // Een weekdag: in de week die op het scherm staat, of de week ervoor of erna.
  const weekday = WEEKDAGEN.findIndex((name) => new RegExp(`\\b${name}\\b`).test(text))
  if (weekday >= 0) {
    let monday = shownMonday
    if (/\b(vorige|afgelopen) week\b/.test(text)) monday = addDays(monday, -7)
    else if (/\b(volgende|komende) week\b/.test(text)) monday = addDays(monday, 7)
    return addDays(monday, (weekday + 6) % 7)
  }
  return undefined
}

function joinLabels(modes: Mode[]): string {
  const labels = modes.map((m) => MODE_INFO[m].label)
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} en ${labels[labels.length - 1]}`
}

/** Haalt keuze(s) en datum uit een gesproken zin. Zonder datum geldt vandaag. */
export function parseVoiceCommand(
  spoken: string,
  today: Date,
  shownMonday: Date,
  enabledModes: readonly Mode[],
): VoiceCommand {
  const text = spoken
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/[.,!?;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // "vrijdag" en "vrije dag" niet verwarren: haal eerst de weekdagen weg voordat we keuzes zoeken.
  const withoutDays = WEEKDAGEN.reduce((t, name) => t.replace(new RegExp(`\\b${name}\\b`, 'g'), ' '), text)
  const modes = MODES.filter((mode) => MODE_WORDS[mode].test(withoutDays))
  if (modes.length === 0 && GOTO_WORDS.test(text)) {
    const date = findDate(text, today, shownMonday)
    if (date === null) return { ok: false, error: `Ik hoorde "${spoken}", maar die datum bestaat niet.` }
    if (date) return { ok: true, goto: mondayOf(date) }
    if (/\bdeze week\b/.test(text)) return { ok: true, goto: mondayOf(today) }
    if (/\b(vorige|afgelopen) week\b/.test(text)) return { ok: true, goto: addDays(shownMonday, -7) }
    if (/\b(volgende|komende) week\b/.test(text)) return { ok: true, goto: addDays(shownMonday, 7) }
  }
  if (modes.length === 0) {
    return { ok: false, error: `Ik hoorde "${spoken}", maar geen Thuis, Trein, Fiets, Auto of Vrij.` }
  }
  const off = modes.filter((m) => !enabledModes.includes(m))
  if (off.length > 0) {
    return { ok: false, error: `${joinLabels(off)} staat uit in de instellingen.` }
  }
  if (modes.length > 1 && modes.some((m) => m === 'thuis' || m === 'vrij')) {
    return { ok: false, error: `Thuis en Vrij gaan niet samen met iets anders (ik hoorde "${spoken}").` }
  }
  const date = findDate(text, today, shownMonday)
  if (date === null) return { ok: false, error: `Ik hoorde "${spoken}", maar die datum bestaat niet.` }
  const day = date ?? startOfDay(today)
  if (day.getDay() === 0 || day.getDay() === 6) {
    return { ok: false, error: `${capitalize(longLabel(day))} is geen werkdag.` }
  }
  return { ok: true, modes, date: day }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Bijv. "Week van 28 sep – 2 okt." */
export function gotoConfirmation(monday: Date, today: Date): string {
  return `Week van ${weekLabel(monday, today.getFullYear())}.`
}

/** Bijv. "Fiets en Trein vastgelegd op woensdag 1 oktober." */
export function confirmation(modes: Mode[], date: Date): string {
  return `${joinLabels(modes)} vastgelegd op ${longLabel(date)}.`
}

// ---- Spraakherkenning van de browser (Web Speech API, in Chrome op Android) ----

interface RecognitionResultList {
  length: number
  [index: number]: { length: number; [index: number]: { transcript: string } }
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: { results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type RecognitionConstructor = new () => Recognition

function recognitionConstructor(): RecognitionConstructor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Kan deze browser spraak herkennen? Zo niet, dan is er geen microfoonknop. */
export function speechSupported(): boolean {
  return recognitionConstructor() !== null
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'WoonWerk mag de microfoon niet gebruiken. Geef toestemming in Chrome en probeer het opnieuw.',
  'service-not-allowed': 'WoonWerk mag de microfoon niet gebruiken. Geef toestemming in Chrome en probeer het opnieuw.',
  network: 'Spraakherkenning werkt alleen met internet. Probeer het later opnieuw.',
  'no-speech': 'Ik hoorde niets. Tik op de microfoon en probeer het opnieuw.',
  'audio-capture': 'Er is geen microfoon gevonden.',
}

export const SPEECH_KEY = 'spraak-aan'

/** Staat de microfoonknop aan in de instellingen (F30)? Standaard wel. */
export function loadSpeechEnabled(): boolean {
  try {
    return localStorage.getItem(SPEECH_KEY) !== 'nee'
  } catch {
    return true
  }
}

export function saveSpeechEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(SPEECH_KEY)
    else localStorage.setItem(SPEECH_KEY, 'nee')
  } catch {
    // Opslag niet beschikbaar; de instelling geldt dan alleen zolang de app open is.
  }
}

/**
 * Luisteren met de microfoon. `onHeard` krijgt de mogelijke zinnen (beste eerst),
 * `onError` een foutmelding in gewone taal.
 */
export function useSpeech(onHeard: (alternatives: string[]) => void, onError: (message: string) => void) {
  const [listening, setListening] = useState(false)
  const recognition = useRef<Recognition | null>(null)
  const handlers = useRef({ onHeard, onError })
  useEffect(() => {
    handlers.current = { onHeard, onError }
  })

  useEffect(() => () => recognition.current?.abort(), [])

  function start() {
    const Ctor = recognitionConstructor()
    if (!Ctor || recognition.current) return
    const r = new Ctor()
    r.lang = 'nl-NL'
    r.interimResults = false
    r.maxAlternatives = 3
    r.continuous = false
    r.onresult = (event) => {
      const result = event.results[0]
      const alternatives: string[] = []
      for (let i = 0; result && i < result.length; i++) alternatives.push(result[i].transcript)
      if (alternatives.length > 0) handlers.current.onHeard(alternatives)
    }
    r.onerror = (event) => {
      if (event.error !== 'aborted') handlers.current.onError(ERRORS[event.error] ?? 'Spraakherkenning lukte niet. Probeer het opnieuw.')
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
    }
    recognition.current = r
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      handlers.current.onError('Spraakherkenning lukte niet. Probeer het opnieuw.')
    }
  }

  function stop() {
    recognition.current?.abort()
  }

  return { listening, start, stop }
}
