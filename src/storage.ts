export const MODES = ['thuis', 'trein', 'fiets', 'auto', 'vrij'] as const
export type Mode = (typeof MODES)[number]
export type Registrations = Record<string, Mode>

export const STORAGE_KEY = 'vervoer-registraties'

export function loadRegistrations(): Registrations {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const result: Registrations = {}
    for (const [key, value] of Object.entries(parsed)) {
      if ((MODES as readonly string[]).includes(value as string)) result[key] = value as Mode
    }
    return result
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
