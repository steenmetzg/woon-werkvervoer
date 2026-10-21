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

/** De herinneringen die vandaag nodig zijn, in de volgorde Thuis, Trein, Auto; alleen voor vormen die aan staan. */
export function dueReminders(declared: Declared, enabledModes: Mode[], today: Date): Reminder[] {
  const todayKey = dateKey(today)
  const reminders: Reminder[] = []
  for (const mode of DECLARED_MODES) {
    if (!enabledModes.includes(mode)) continue
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
