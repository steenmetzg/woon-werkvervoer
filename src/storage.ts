export const MODES = ['thuis', 'trein', 'fiets', 'auto', 'vrij'] as const
export type Mode = (typeof MODES)[number]
/** Per datum de gekozen keuzes, altijd in de vaste volgorde en nooit leeg. */
export type Registrations = Record<string, Mode[]>

export const STORAGE_KEY = 'vervoer-registraties'

/** Thuis en Vrij gaan nooit samen met een andere keuze. */
const ALONE: readonly Mode[] = ['thuis', 'vrij']

/** De keuzes van een dag na een tik op `mode` (F2 en F3). */
export function toggleMode(current: readonly Mode[], mode: Mode): Mode[] {
  if (current.includes(mode)) return current.filter((m) => m !== mode)
  if (ALONE.includes(mode)) return [mode]
  return MODES.filter((m) => m === mode || (current.includes(m) && !ALONE.includes(m)))
}

/** Maakt een geldige lijst keuzes van één keuze (oude vorm) of een lijst; `null` als er niets geldigs in zit. */
function parseDay(value: unknown): Mode[] | null {
  const list: unknown[] = Array.isArray(value) ? value : [value]
  const modes = MODES.filter((m) => list.includes(m))
  const alone = modes.find((m) => ALONE.includes(m))
  if (alone) return [alone]
  return modes.length > 0 ? modes : null
}

/** Haalt de geldige keuzes uit willekeurige gegevens; `null` als het geen object is. */
export function parseRegistrations(value: unknown): Registrations | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const result: Registrations = {}
  for (const [key, day] of Object.entries(value)) {
    const modes = parseDay(day)
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && modes) result[key] = modes
  }
  return result
}

export function loadRegistrations(): Registrations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return parseRegistrations(JSON.parse(raw)) ?? {}
  } catch {
    return {}
  }
}

export function saveRegistrations(registrations: Registrations): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations))
  } catch {
    // Opslag niet beschikbaar (bijv. privévenster); de app werkt dan zonder onthouden.
  }
}

export const ENABLED_KEY = 'vervoer-aan'

/** Welke keuzes aan staan, in de vaste volgorde. Thuis staat altijd aan. */
export function loadEnabledModes(): Mode[] {
  try {
    const raw = localStorage.getItem(ENABLED_KEY)
    if (!raw) return [...MODES]
    const stored: unknown = JSON.parse(raw)
    if (!Array.isArray(stored)) return [...MODES]
    return MODES.filter((mode) => mode === 'thuis' || stored.includes(mode))
  } catch {
    return [...MODES]
  }
}

export function saveEnabledModes(modes: Mode[]): void {
  try {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(modes))
  } catch {
    // Opslag niet beschikbaar; de instelling geldt dan alleen zolang de app open is.
  }
}
