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
