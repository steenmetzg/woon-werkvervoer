import type { Mode } from './storage'

/** De vormen waarvoor je bijhoudt tot en met welke dag je hebt gedeclareerd, in de vaste volgorde. */
export const DECLARED_MODES = ['thuis', 'trein', 'auto'] as const satisfies readonly Mode[]
export type DeclaredMode = (typeof DECLARED_MODES)[number]
/** Per vorm de datum (JJJJ-MM-DD) tot en met wanneer is gedeclareerd. Ontbreekt een vorm, dan staat die op vandaag. */
export type Declared = Partial<Record<DeclaredMode, string>>

export const DECLARED_KEY = 'gedeclareerd-tot'

/** Haalt de geldige datums uit willekeurige gegevens; `null` als het geen object is. */
export function parseDeclared(value: unknown): Declared | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const source = value as Record<string, unknown>
  const result: Declared = {}
  for (const mode of DECLARED_MODES) {
    const date = source[mode]
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) result[mode] = date
  }
  return result
}

export function loadDeclared(): Declared {
  try {
    const raw = localStorage.getItem(DECLARED_KEY)
    if (!raw) return {}
    return parseDeclared(JSON.parse(raw)) ?? {}
  } catch {
    return {}
  }
}

export function saveDeclared(declared: Declared): void {
  try {
    localStorage.setItem(DECLARED_KEY, JSON.stringify(declared))
  } catch {
    // Opslag niet beschikbaar; de datums gelden dan alleen zolang de app open is.
  }
}
