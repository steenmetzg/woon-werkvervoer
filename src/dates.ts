const WEEKDAGEN_KORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const WEEKDAGEN_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const MAANDEN_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const MAANDEN_LANG = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + days)
  return d
}

/** De maandag van de week waarin `date` valt. */
export function mondayOf(date: Date): Date {
  const offset = (date.getDay() + 6) % 7
  return addDays(date, -offset)
}

/** Maandag t/m vrijdag van de week die op `monday` begint. */
export function workdays(monday: Date): Date[] {
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
}

/** Sleutel voor opslag, bijv. "2026-10-20" (lokale tijd). */
export function dateKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/** Bijv. "ma 20 okt". */
export function shortLabel(date: Date): string {
  return `${WEEKDAGEN_KORT[date.getDay()]} ${date.getDate()} ${MAANDEN_KORT[date.getMonth()]}`
}

/** Bijv. "maandag 20 oktober". */
export function longLabel(date: Date): string {
  return `${WEEKDAGEN_LANG[date.getDay()]} ${date.getDate()} ${MAANDEN_LANG[date.getMonth()]}`
}

/** Bijv. "20 – 24 okt 2026" of "27 okt – 31 okt 2026". */
export function weekLabel(monday: Date): string {
  const friday = addDays(monday, 4)
  const start =
    monday.getMonth() === friday.getMonth()
      ? `${monday.getDate()}`
      : `${monday.getDate()} ${MAANDEN_KORT[monday.getMonth()]}`
  return `${start} – ${friday.getDate()} ${MAANDEN_KORT[friday.getMonth()]} ${friday.getFullYear()}`
}
