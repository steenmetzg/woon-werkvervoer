import { useEffect, useRef, useState } from 'react'
import { addDays, longLabel, mondayOf, weekLabel } from './dates'
import { DEFAULT_OMSCHRIJVING, hoursText, MAX_OMSCHRIJVING, roundQuarter, type HourLine, type Rubriek } from './hours'
import { MODE_INFO } from './modeInfo'
import { MODES, type Mode } from './storage'

// Spraakbediening (F29, F31, F35): met de microfoonknop zeg je bijvoorbeeld "fiets op 1 oktober" of
// "2 uur NVWA overleg met de inspectie gisteren".
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
  | { ok: true; hours: HourLine; date: Date }
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

/** Een gevonden datum met de woorden in de zin waar hij stond (vanaf woord `start`, `count` woorden). */
interface DateMatch {
  /** `null` = een datum die niet bestaat. */
  date: Date | null
  start: number
  count: number
}

/** Welke woorden (in een zin met enkele spaties) een gevonden stuk tekst beslaat. */
function wordRange(text: string, index: number, matched: string): { start: number; count: number } {
  return { start: text.slice(0, index).split(' ').length - 1, count: matched.trim().split(' ').length }
}

/** Zoekt de datum in de zin. `undefined` = geen datum genoemd. */
function findDateMatch(text: string, today: Date, shownMonday: Date): DateMatch | undefined {
  const words = text.split(' ')
  const relative: [RegExp, (d: Date) => Date][] = [
    [/\beergisteren\b/, (d) => addDays(d, -2)],
    [/\bgisteren\b/, (d) => addDays(d, -1)],
    [/\bvandaag\b/, (d) => startOfDay(d)],
    [/\bmorgen\b/, (d) => addDays(d, 1)],
  ]
  for (const [pattern, toDate] of relative) {
    const m = pattern.exec(text)
    if (m) return { date: toDate(today), ...wordRange(text, m.index, m[0]) }
  }

  // "1 oktober", "1e oktober", "eerste oktober", eventueel met jaartal: "1 oktober 2026".
  for (let i = 1; i < words.length; i++) {
    const month = MAANDEN[words[i]]
    if (month === undefined) continue
    const day = toNumber(words[i - 1])
    if (day === null) continue
    const year = /^\d{4}$/.test(words[i + 1] ?? '') ? Number(words[i + 1]) : null
    const date = year === null ? closestYear(month, day, today) : sameDate(year, month, day)
    return { date, start: i - 1, count: year === null ? 2 : 3 }
  }

  // "1-10" of "1/10/2026".
  const numeric = /\b(\d{1,2})[-/](\d{1,2})(?:[-/](\d{4}))?\b/.exec(text)
  if (numeric) {
    const day = Number(numeric[1])
    const month = Number(numeric[2]) - 1
    const date = numeric[3] ? sameDate(Number(numeric[3]), month, day) : closestYear(month, day, today)
    return { date, ...wordRange(text, numeric.index, numeric[0]) }
  }

  // Een weekdag: in de week die op het scherm staat, of de week ervoor of erna.
  const weekday = WEEKDAGEN.findIndex((name) => words.includes(name))
  if (weekday >= 0) {
    let start = words.indexOf(WEEKDAGEN[weekday])
    let count = 1
    let monday = shownMonday
    if (/\b(vorige|afgelopen) week\b/.test(text)) monday = addDays(monday, -7)
    else if (/\b(volgende|komende) week\b/.test(text)) monday = addDays(monday, 7)
    if (start >= 2 && words[start - 1] === 'week' && /^(vorige|afgelopen|volgende|komende)$/.test(words[start - 2])) {
      start -= 2
      count += 2
    }
    return { date: addDays(monday, (weekday + 6) % 7), start, count }
  }
  return undefined
}

/** Zoekt de datum in de zin. `undefined` = geen datum genoemd, `null` = een datum die niet bestaat. */
function findDate(text: string, today: Date, shownMonday: Date): Date | null | undefined {
  return findDateMatch(text, today, shownMonday)?.date
}

// ---- Uren inspreken (F35), bijv. "2 uur NVWA overleg met de inspectie gisteren" ----

const GETAL = '(\\d+(?:_\\d+)?|een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|elf|twaalf)'

function getal(word: string): number {
  return /^\d/.test(word) ? Number(word.replace('_', '.')) : GETALLEN[word]
}

// Manieren om een aantal uur te zeggen, de langste eerst. Kommagetallen staan in de zin als "2_5".
const DUUR: [RegExp, (m: RegExpExecArray) => number][] = [
  [new RegExp(`\\b${GETAL} ?en ?(?:een )?half uur\\b`), (m) => getal(m[1]) + 0.5],
  [
    new RegExp(`\\b${GETAL} (?:uur|uren) (?:en )?(een kwartier|kwartier|een half|half|drie kwartier|(\\d+) (?:minuten|min))\\b`),
    (m) => getal(m[1]) + (m[3] ? Number(m[3]) / 60 : m[2].startsWith('drie') ? 0.75 : m[2].includes('half') ? 0.5 : 0.25),
  ],
  [/\banderhalf uur\b/, () => 1.5],
  [/\b(?:een )?half uur\b/, () => 0.5],
  [/\bdrie kwartier\b/, () => 0.75],
  [/\b(?:een )?kwartier\b/, () => 0.25],
  [new RegExp(`\\b${GETAL} (?:uur|uren)\\b`), (m) => getal(m[1])],
  [/\b(\d+) (?:minuten|min)\b/, (m) => Number(m[1]) / 60],
]

function findDuration(text: string): { uren: number; start: number; count: number } | null {
  for (const [pattern, value] of DUUR) {
    const m = pattern.exec(text)
    if (m) return { uren: value(m), ...wordRange(text, m.index, m[0]) }
  }
  return null
}

/** Dezelfde schrijfwijze als de gesproken zin, zodat de naam van een rubriek te vinden is. */
function normalizeName(naam: string): string {
  return naam
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** De rubriek die het eerst in de zin genoemd wordt. */
function findRubriek(text: string, rubrieken: readonly Rubriek[]): { rubriek: Rubriek; start: number; count: number } | null {
  let best: { rubriek: Rubriek; start: number; count: number; index: number } | null = null
  for (const rubriek of rubrieken) {
    const name = normalizeName(rubriek.naam)
    if (!name) continue
    const m = new RegExp(`(?:^| )(${escapeRegExp(name)})(?= |$)`).exec(text)
    if (!m) continue
    const index = m.index + m[0].length - m[1].length
    if (!best || index < best.index) best = { rubriek, index, ...wordRange(text, index, m[1]) }
  }
  return best
}

// Woordjes aan het begin of eind van de omschrijving die er niet bij horen ("2 uur aan NVWA", "op 1 oktober").
const VULWOORDEN = new Set([
  'op', 'voor', 'aan', 'met', 'bij', 'en', 'van', 'de', 'het', 'een', 'in', 'uur', 'rubriek', 'omschrijving',
  'gewerkt', 'besteed', 'geschreven', 'gedaan',
])

function joinRubrieken(rubrieken: readonly Rubriek[]): string {
  const names = rubrieken.map((r) => r.naam)
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} of ${names[names.length - 1]}`
}

function parseHoursCommand(
  spoken: string,
  text: string,
  cased: string,
  today: Date,
  shownMonday: Date,
  rubrieken: readonly Rubriek[],
  defaultDay: Date | null,
): VoiceCommand | null {
  const duration = findDuration(text)
  const rubriek = findRubriek(text, rubrieken)
  if (!duration && !rubriek) return null
  if (rubrieken.length === 0) return { ok: false, error: 'Maak eerst een rubriek via het tandwiel, bij Uren.' }
  if (!rubriek) return { ok: false, error: `Ik hoorde "${spoken}", maar geen rubriek (${joinRubrieken(rubrieken)}).` }
  if (!duration) return { ok: false, error: `Hoeveel uur? Zeg bijvoorbeeld "2 uur ${rubriek.rubriek.naam} overleg".` }
  const uren = roundQuarter(duration.uren)
  const match = findDateMatch(text, today, shownMonday)
  if (match && match.date === null) return { ok: false, error: `Ik hoorde "${spoken}", maar die datum bestaat niet.` }
  const day = match?.date ?? defaultDay ?? startOfDay(today)
  if (day.getDay() === 0 || day.getDay() === 6) return { ok: false, error: `${capitalize(longLabel(day))} is geen werkdag.` }

  // De omschrijving is wat overblijft als de rubriek, het aantal uur en de datum eruit zijn.
  const omschrijving = description(text, cased, [duration, rubriek, match]) || DEFAULT_OMSCHRIJVING
  return { ok: true, hours: { rubriek: rubriek.rubriek.id, uren, omschrijving }, date: day }
}

/** Wat er van de zin overblijft zonder de herkende delen, met een hoofdletter en zonder losse vulwoordjes. */
function description(
  text: string,
  cased: string,
  parts: readonly ({ start: number; count: number } | null | undefined)[],
): string {
  const words = text.split(' ')
  const casedWords = cased.split(' ')
  const used = new Set<number>()
  for (const part of parts) {
    if (!part) continue
    for (let i = part.start; i < part.start + part.count; i++) used.add(i)
    // "op 1 oktober", "op de 1e": die woordjes ervoor horen bij de datum.
    for (let i = part.start - 1; i >= 0 && (words[i] === 'op' || words[i] === 'de'); i--) used.add(i)
  }
  let rest = words.map((_, i) => (used.has(i) ? null : i)).filter((i): i is number => i !== null)
  while (rest.length > 0 && VULWOORDEN.has(words[rest[0]])) rest = rest.slice(1)
  while (rest.length > 0 && VULWOORDEN.has(words[rest[rest.length - 1]])) rest = rest.slice(0, -1)
  return capitalize(
    rest
      .map((i) => casedWords[i] ?? words[i])
      .join(' ')
      .replace(/(\d)_(\d)/g, '$1,$2'),
  ).slice(0, MAX_OMSCHRIJVING)
}

/**
 * Eén regel voor een vaste rubriek (de microfoon-met-plusje bij een rubriek op het scherm Uren, F36): alleen
 * het aantal uur en de omschrijving, bijvoorbeeld "2 uur overleg met de inspectie". Rubriek en dag liggen vast.
 */
export function parseHoursLine(
  spoken: string,
  rubriek: string,
): { ok: true; line: HourLine } | { ok: false; error: string } {
  const cased = normalizeSpoken(spoken)
  const text = cased.toLowerCase()
  const duration = findDuration(text)
  if (!duration) return { ok: false, error: `Ik hoorde "${spoken}", maar geen aantal uur. Zeg bijvoorbeeld "2 uur overleg".` }
  return {
    ok: true,
    line: { rubriek, uren: roundQuarter(duration.uren), omschrijving: description(text, cased, [duration]) || DEFAULT_OMSCHRIJVING },
  }
}

function joinLabels(modes: Mode[]): string {
  const labels = modes.map((m) => MODE_INFO[m].label)
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} en ${labels[labels.length - 1]}`
}

/** De zin in een vaste schrijfwijze: zonder accenten en leestekens, kommagetallen als "2_5", losse letters aan elkaar ("n v w a" wordt "nvwa"). */
function normalizeSpoken(spoken: string): string {
  return spoken
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d)\u00bd/g, '$1_5')
    .replace(/\u00bd/g, '0_5')
    .replace(/(\d)[.,](\d)/g, '$1_$2')
    .replace(/[.,!?;:"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-zA-Z](?: [a-zA-Z]\b)+/g, (letters) => letters.replace(/ /g, ''))
}

/**
 * Haalt keuze(s) en datum, of uren met rubriek en omschrijving, uit een gesproken zin. Zonder datum geldt
 * vandaag, of bij uren `defaultDay` als die is meegegeven (op het scherm Uren de dag die open staat).
 * `rubrieken` is `null` als de urenregistratie uit staat.
 */
export function parseVoiceCommand(
  spoken: string,
  today: Date,
  shownMonday: Date,
  enabledModes: readonly Mode[],
  rubrieken: readonly Rubriek[] | null = null,
  defaultDay: Date | null = null,
): VoiceCommand {
  const cased = normalizeSpoken(spoken)
  const text = cased.toLowerCase()
  if (rubrieken) {
    const hours = parseHoursCommand(spoken, text, cased, today, shownMonday, rubrieken, defaultDay)
    if (hours) return hours
  }
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

/** Bijv. "2,5 uur NVWA vastgelegd op donderdag 1 oktober: Overleg met de inspectie." */
export function hoursConfirmation(line: HourLine, naam: string, date: Date): string {
  const what = `${hoursText(line.uren)} ${naam} vastgelegd op ${longLabel(date)}`
  return line.omschrijving ? `${what}: ${line.omschrijving}.` : `${what}.`
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
