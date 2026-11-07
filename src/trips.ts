import { MODE_INFO } from './modeInfo'
import type { Mode } from './storage'

/** Ritomschrijving per dag (F37): de datum (JJJJ-MM-DD) met een korte vrije tekst. */
export type Trips = Record<string, string>

export const TRIPS_KEY = 'rit-omschrijvingen'
export const MAX_TRIP = 200

/** De vervoervormen waarbij een ritomschrijving hoort, in de vaste volgorde. */
const TRAVEL: readonly Mode[] = ['trein', 'fiets', 'auto']

/** De reisvormen van een dag die aan staan; leeg als er geen potloodje hoort (Thuis, Vrij of niets gekozen). */
export function travelModes(chosen: readonly Mode[], enabled: readonly Mode[]): Mode[] {
  return TRAVEL.filter((m) => chosen.includes(m) && enabled.includes(m))
}

/** Bijv. "Trein", "Trein en Auto" of "Trein, Fiets en Auto". */
export function modesText(modes: readonly Mode[]): string {
  const labels = modes.map((m) => MODE_INFO[m].label)
  return labels.length <= 1 ? labels.join('') : `${labels.slice(0, -1).join(', ')} en ${labels[labels.length - 1]}`
}

/** Haalt de geldige omschrijvingen uit willekeurige gegevens; `null` als het geen object is. */
export function parseTrips(value: unknown): Trips | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const result: Trips = {}
  for (const [key, text] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || typeof text !== 'string') continue
    const trimmed = text.trim().slice(0, MAX_TRIP)
    if (trimmed) result[key] = trimmed
  }
  return result
}

export function loadTrips(): Trips {
  try {
    const raw = localStorage.getItem(TRIPS_KEY)
    return (raw && parseTrips(JSON.parse(raw))) || {}
  } catch {
    return {}
  }
}

export function saveTrips(trips: Trips): void {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  } catch {
    // Opslag niet beschikbaar; de omschrijvingen gelden dan alleen zolang de app open is.
  }
}
