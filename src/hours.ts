// Urenregistratie (F32 t/m F35): per dag regels met een rubriek, een aantal uur (op een kwartier) en een
// korte omschrijving. De rubrieken maak en beheer je in de instellingen.

export interface Rubriek {
  /** Vaste sleutel; de naam kun je aanpassen zonder dat de geregistreerde uren hun rubriek kwijtraken. */
  id: string
  naam: string
}

export interface HourLine {
  rubriek: string
  /** Aantal uur, altijd een veelvoud van 0,25. */
  uren: number
  omschrijving: string
}

/** Per datum (JJJJ-MM-DD) de regels van die dag, nooit een lege lijst. */
export type Hours = Record<string, HourLine[]>

export const MAX_RUBRIEKEN = 8
export const MAX_NAAM = 20
export const MAX_OMSCHRIJVING = 80
/** Het meeste wat je op één regel kunt kiezen. */
export const MAX_UREN_PER_REGEL = 12

export const DEFAULT_RUBRIEKEN: Rubriek[] = [
  { id: 'nvwa', naam: 'NVWA' },
  { id: 'ilt', naam: 'ILT' },
]

export const HOURS_KEY = 'uren-registraties'
export const RUBRIEKEN_KEY = 'uren-rubrieken'
export const HOURS_ENABLED_KEY = 'uren-aan'

export function newRubriekId(): string {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Afronden op een kwartier, tussen 0,25 en 24 uur. */
export function roundQuarter(value: number): number {
  return Math.min(24, Math.max(0.25, Math.round(value * 4) / 4))
}

/** Bijv. "8", "7,5" of "7,25". */
export function formatHours(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',')
}

/** Bijv. "1 uur" of "2,5 uur". */
export function hoursText(value: number): string {
  return `${formatHours(value)} uur`
}

export function sumHours(lines: readonly HourLine[]): number {
  return lines.reduce((total, line) => total + line.uren, 0)
}

export function lineCount(hours: Hours): number {
  return Object.values(hours).reduce((n, lines) => n + lines.length, 0)
}

/** Hoeveel regels een rubriek heeft (een rubriek met regels kun je niet verwijderen). */
export function linesWithRubriek(hours: Hours, id: string): number {
  return Object.values(hours).reduce((n, lines) => n + lines.filter((l) => l.rubriek === id).length, 0)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Haalt de geldige rubrieken uit willekeurige gegevens; `null` als het geen lijst is. */
export function parseRubrieken(value: unknown): Rubriek[] | null {
  if (!Array.isArray(value)) return null
  const result: Rubriek[] = []
  for (const item of value) {
    if (!isObject(item) || typeof item.id !== 'string' || typeof item.naam !== 'string') continue
    const naam = item.naam.trim().slice(0, MAX_NAAM)
    if (!item.id || !naam || result.some((r) => r.id === item.id)) continue
    result.push({ id: item.id, naam })
    if (result.length === MAX_RUBRIEKEN) break
  }
  return result
}

/** Haalt de geldige regels uit willekeurige gegevens; `null` als het geen object is. */
export function parseHours(value: unknown): Hours | null {
  if (!isObject(value)) return null
  const result: Hours = {}
  for (const [key, list] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Array.isArray(list)) continue
    const lines: HourLine[] = []
    for (const item of list) {
      if (!isObject(item) || typeof item.rubriek !== 'string' || typeof item.uren !== 'number') continue
      if (!(item.uren > 0)) continue
      const omschrijving = typeof item.omschrijving === 'string' ? item.omschrijving.slice(0, MAX_OMSCHRIJVING) : ''
      lines.push({ rubriek: item.rubriek, uren: roundQuarter(item.uren), omschrijving })
    }
    if (lines.length > 0) result[key] = lines
  }
  return result
}

function load<T>(key: string, parse: (value: unknown) => T | null, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback()
    return parse(JSON.parse(raw)) ?? fallback()
  } catch {
    return fallback()
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Opslag niet beschikbaar; de gegevens gelden dan alleen zolang de app open is.
  }
}

export function loadHours(): Hours {
  return load(HOURS_KEY, parseHours, () => ({}))
}

export function saveHours(hours: Hours): void {
  save(HOURS_KEY, hours)
}

/** Zonder opgeslagen rubrieken begin je met NVWA en ILT. */
export function loadRubrieken(): Rubriek[] {
  return load(RUBRIEKEN_KEY, parseRubrieken, () => DEFAULT_RUBRIEKEN.map((r) => ({ ...r })))
}

export function saveRubrieken(rubrieken: Rubriek[]): void {
  save(RUBRIEKEN_KEY, rubrieken)
}

/** Staat de urenregistratie aan in de instellingen (F32)? Standaard wel. */
export function loadHoursEnabled(): boolean {
  try {
    return localStorage.getItem(HOURS_ENABLED_KEY) !== 'nee'
  } catch {
    return true
  }
}

export function saveHoursEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(HOURS_ENABLED_KEY)
    else localStorage.setItem(HOURS_ENABLED_KEY, 'nee')
  } catch {
    // Opslag niet beschikbaar; de instelling geldt dan alleen zolang de app open is.
  }
}

export function rubriekNaam(rubrieken: readonly Rubriek[], id: string): string {
  return rubrieken.find((r) => r.id === id)?.naam ?? 'Onbekende rubriek'
}

export interface MonthGroup {
  /** Eerste dag van de maand. */
  month: Date
  total: number
  groups: { rubriek: string; naam: string; total: number; lines: { date: string; line: HourLine }[] }[]
}

/** Alle uren per maand (nieuwste eerst) en daarbinnen per rubriek (in de volgorde van de instellingen). */
export function groupHours(hours: Hours, rubrieken: readonly Rubriek[]): MonthGroup[] {
  const byMonth = new Map<string, { date: string; line: HourLine }[]>()
  for (const date of Object.keys(hours).sort()) {
    const month = date.slice(0, 7)
    const list = byMonth.get(month) ?? []
    for (const line of hours[date]) list.push({ date, line })
    byMonth.set(month, list)
  }
  const order = (id: string) => {
    const i = rubrieken.findIndex((r) => r.id === id)
    return i < 0 ? rubrieken.length : i
  }
  return [...byMonth.keys()]
    .sort()
    .reverse()
    .map((month) => {
      const entries = byMonth.get(month)!
      const ids = [...new Set(entries.map((e) => e.line.rubriek))].sort((a, b) => order(a) - order(b))
      const groups = ids.map((id) => {
        const lines = entries.filter((e) => e.line.rubriek === id)
        return { rubriek: id, naam: rubriekNaam(rubrieken, id), total: sumHours(lines.map((e) => e.line)), lines }
      })
      const [year, m] = month.split('-').map(Number)
      return { month: new Date(year, m - 1, 1), total: sumHours(entries.map((e) => e.line)), groups }
    })
}
