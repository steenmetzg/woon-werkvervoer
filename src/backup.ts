import { dateKey } from './dates'
import { parseDeclared, type Declared } from './declared'
import { parseRegistrations, type Registrations } from './storage'

const APP_ID = 'woon-werkvervoer'

export interface Backup {
  app: typeof APP_ID
  /** 1: één keuze per dag (tot en met WoonWerk 1.5); 2: een lijst keuzes per dag. */
  versie: 1 | 2
  gemaakt: string
  registraties: Registrations
  /** Vanaf WoonWerk 1.8: per vorm de datum tot en met wanneer is gedeclareerd. Oudere apps negeren dit veld. */
  gedeclareerd?: Declared
}

/** Bijvoorbeeld 2026-10-21-woonwerk.json. Tot en met WoonWerk 1.7 was dat woon-werkvervoer-backup-2026-10-21.json. */
export function backupFileName(now: Date): string {
  return `${dateKey(now)}-woonwerk.json`
}

export function createBackup(registrations: Registrations, declared: Declared, now: Date): string {
  const backup: Backup = {
    app: APP_ID,
    versie: 2,
    gemaakt: now.toISOString(),
    registraties: registrations,
    gedeclareerd: declared,
  }
  return JSON.stringify(backup, null, 2)
}

/** Leest een backupbestand. Gooit een fout met een Nederlandse melding als het geen geldige backup is. */
export function parseBackup(text: string): {
  gemaakt: Date | null
  registraties: Registrations
  /** `null` als de backup geen datums bevat (gemaakt voor WoonWerk 1.8). */
  gedeclareerd: Declared | null
} {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Dit bestand is geen backup van WoonWerk.')
  }
  const backup = data as Partial<Backup> | null
  if (!backup || backup.app !== APP_ID) throw new Error('Dit bestand is geen backup van WoonWerk.')
  // Versie 1 had één keuze per dag; parseRegistrations zet die om naar een lijst.
  if (backup.versie !== 1 && backup.versie !== 2) throw new Error('Deze backup is gemaakt met een onbekende versie van de app.')
  const registraties = parseRegistrations(backup.registraties)
  if (!registraties) throw new Error('Deze backup is beschadigd.')
  const gemaakt = backup.gemaakt ? new Date(backup.gemaakt) : null
  const gedeclareerd = parseDeclared(backup.gedeclareerd)
  return { gemaakt: gemaakt && !isNaN(gemaakt.getTime()) ? gemaakt : null, registraties, gedeclareerd }
}
