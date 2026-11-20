import { ENABLED_KEY, STORAGE_KEY } from './storage'
import { DECLARED_KEY } from './declared'
import { HOURS_ENABLED_KEY, HOURS_KEY, RUBRIEKEN_KEY } from './hours'
import { INSTALL_LATER_KEY } from './installPrompt'
import { TRIPS_KEY } from './trips'

/** De versie van de app die het laatst is geopend (F41). */
export const LAATSTE_VERSIE_KEY = 'laatst-geopende-versie'

// Staat een van deze er al, dan is de app eerder gebruikt (ook als hij van voor F41 is).
const BESTAANDE_GEGEVENS = [
  STORAGE_KEY,
  ENABLED_KEY,
  DECLARED_KEY,
  HOURS_KEY,
  RUBRIEKEN_KEY,
  HOURS_ENABLED_KEY,
  TRIPS_KEY,
  INSTALL_LATER_KEY,
  'spraak-aan',
]

/**
 * Welke nieuwe versie gemeld moet worden, of null. Bij de eerste keer openen (nog niets opgeslagen)
 * is er niets te melden: dan is de app net geïnstalleerd, niet bijgewerkt.
 */
export function versionToAnnounce(current: string): string | null {
  try {
    const last = localStorage.getItem(LAATSTE_VERSIE_KEY)
    if (last === current) return null
    if (last === null && !BESTAANDE_GEGEVENS.some((key) => localStorage.getItem(key) !== null)) return null
    return current
  } catch {
    return null
  }
}

/** Onthoudt dat deze versie is geopend en gemeld. */
export function markVersionSeen(current: string): void {
  try {
    localStorage.setItem(LAATSTE_VERSIE_KEY, current)
  } catch {
    // Geen opslag: dan komt de melding de volgende keer gewoon nog eens.
  }
}
