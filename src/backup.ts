import { dateKey } from './dates'
import { parseRegistrations, type Registrations } from './storage'

const APP_ID = 'woon-werkvervoer'

export interface Backup {
  app: typeof APP_ID
  versie: 1
  gemaakt: string
  registraties: Registrations
}

export function backupFileName(now: Date): string {
  return `${APP_ID}-backup-${dateKey(now)}.json`
}

export function createBackup(registrations: Registrations, now: Date): string {
  const backup: Backup = { app: APP_ID, versie: 1, gemaakt: now.toISOString(), registraties: registrations }
  return JSON.stringify(backup, null, 2)
}

/** Leest een backupbestand. Gooit een fout met een Nederlandse melding als het geen geldige backup is. */
export function parseBackup(text: string): { gemaakt: Date | null; registraties: Registrations } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Dit bestand is geen backup van Woon-werkvervoer.')
  }
  const backup = data as Partial<Backup> | null
  if (!backup || backup.app !== APP_ID) throw new Error('Dit bestand is geen backup van Woon-werkvervoer.')
  if (backup.versie !== 1) throw new Error('Deze backup is gemaakt met een onbekende versie van de app.')
  const registraties = parseRegistrations(backup.registraties)
  if (!registraties) throw new Error('Deze backup is beschadigd.')
  const gemaakt = backup.gemaakt ? new Date(backup.gemaakt) : null
  return { gemaakt: gemaakt && !isNaN(gemaakt.getTime()) ? gemaakt : null, registraties }
}
