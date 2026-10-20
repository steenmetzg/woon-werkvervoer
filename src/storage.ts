export const MODES = ['thuis', 'trein', 'fiets', 'auto', 'vrij'] as const
export type Mode = (typeof MODES)[number]
export type Registrations = Record<string, Mode>

export const STORAGE_KEY = 'vervoer-registraties'

/** Haalt de geldige keuzes uit willekeurige gegevens; `null` als het geen object is. */
export function parseRegistrations(value: unknown): Registrations | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const result: Registrations = {}
  for (const [key, mode] of Object.entries(value)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && (MODES as readonly string[]).includes(mode as string)) {
      result[key] = mode as Mode
    }
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
