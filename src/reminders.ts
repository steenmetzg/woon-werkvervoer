import { addDays, addMonths, dateKey, parseDateKey } from './dates'
import { DECLARED_MODES, type Declared, type DeclaredMode } from './declared'
import type { Mode } from './storage'

const MAANDEN_LANG = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

/** Hoe de vergoeding heet in de herinnering. */
const COMPENSATION: Record<DeclaredMode, string> = {
  thuis: 'thuiswerkvergoeding',
  trein: 'vergoeding treinreis',
  auto: 'kilometervergoeding',
}

/** Per vorm de dag (JJJJ-MM-DD) waarop de herinnering met het x-je is weggezet; de dag erna komt hij terug. */
export type Dismissed = Partial<Record<DeclaredMode, string>>

export const DISMISSED_KEY = 'herinnering-weg'

export function loadDismissed(): Dismissed {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const value: unknown = raw ? JSON.parse(raw) : {}
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Dismissed) : {}
  } catch {
    return {}
  }
}

export function saveDismissed(dismissed: Dismissed): void {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
  } catch {
    // Opslag niet beschikbaar; de herinnering blijft dan weg zolang de app open is.
  }
}

/** Zoveel dagen voordat 3 maanden om zijn, verschijnt de herinnering. */
export const REMINDER_DAYS_BEFORE = 7

export interface Reminder {
  mode: DeclaredMode
  title: string
  text: string
}

/** Bijv. "28 juli 2026". */
function fullDate(date: Date): string {
  return `${date.getDate()} ${MAANDEN_LANG[date.getMonth()]} ${date.getFullYear()}`
}

/** Vanaf welke dag de herinnering verschijnt: laatst gedeclareerde dag + 3 maanden − 7 dagen. */
export function reminderFrom(declaredDay: Date): Date {
  return addDays(addMonths(declaredDay, 3), -REMINDER_DAYS_BEFORE)
}

/**
 * De herinneringen die vandaag nodig zijn, in de volgorde Thuis, Trein, Auto; alleen voor vormen die aan staan
 * en niet vandaag met het x-je weggezet.
 */
export function dueReminders(declared: Declared, enabledModes: Mode[], today: Date, dismissed: Dismissed = {}): Reminder[] {
  const todayKey = dateKey(today)
  const reminders: Reminder[] = []
  for (const mode of DECLARED_MODES) {
    if (!enabledModes.includes(mode) || dismissed[mode] === todayKey) continue
    const key = declared[mode]
    const day = key ? parseDateKey(key) : null
    if (!day || dateKey(reminderFrom(day)) > todayKey) continue
    const name = COMPENSATION[mode]
    reminders.push({
      mode,
      title: `Tip: Declareer tijdig je ${name}.`,
      text: `Je hebt je ${name} voor het laatst gedeclareerd op ${fullDate(day)}.`,
    })
  }
  return reminders
}
