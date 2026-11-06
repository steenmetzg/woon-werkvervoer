import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createBackup, parseBackup } from './backup'
import { mondayOf } from './dates'
import { HOURS_KEY, RUBRIEKEN_KEY, type Rubriek } from './hours'
import { parseHoursLine, parseVoiceCommand } from './speech'
import { MODES } from './storage'

/** Bevestigt de vraag "Backup inlezen?" met de knop Inlezen. */
async function confirmRestore() {
  await userEvent.click(within(await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })).getByRole('button', { name: 'Inlezen' }))
}


vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Vandaag" is in deze tests woensdag 21 oktober 2026.
const TODAY = new Date(2026, 9, 21, 9, 0)

class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  interimResults = true
  maxAlternatives = 1
  continuous = true
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  start() {
    FakeRecognition.last = this
  }
  abort() {
    this.onend?.()
  }
  hear(text: string) {
    act(() => {
      this.onresult?.({ results: [[{ transcript: text }]] })
      this.onend?.()
    })
  }
}

// In deze tests heten de rubrieken NVWA en ILT (de app zelf begint met "Mijn 1e rubriek").
const NVWA_ILT: Rubriek[] = [
  { id: 'n1', naam: 'NVWA' },
  { id: 'i1', naam: 'ILT' },
]

beforeEach(() => {
  localStorage.setItem(RUBRIEKEN_KEY, JSON.stringify(NVWA_ILT))
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
  ;(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = FakeRecognition
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
})

function hoursChip(dayName: string) {
  return within(screen.getByRole('listitem', { name: dayName })).getByRole('button', { name: /^Uren op/ })
}

function lines() {
  return screen.queryAllByRole('listitem').map((li) => ({
    rubriek: li.closest('section')!.getAttribute('aria-label'),
    uren: (within(li).getByRole('combobox', { name: 'Aantal uur' }) as HTMLSelectElement).selectedOptions[0].textContent,
    omschrijving: (within(li).getByRole('textbox', { name: 'Omschrijving' }) as HTMLInputElement).value,
  }))
}

/** Het totaal van de dag die open staat (de buurdagen staan verborgen klaar om in beeld te schuiven). */
function dayTotal() {
  return screen
    .getAllByText('Totaal')
    .map((el) => el.closest('p')!)
    .find((p) => !p.closest('[aria-hidden="true"]'))!
}

function swipeDay(from: { x: number; y: number }, to: { x: number; y: number }) {
  const target = screen.getByRole('main')
  fireEvent.touchStart(target, { touches: [{ clientX: from.x, clientY: from.y }] })
  fireEvent.touchMove(target, { touches: [{ clientX: to.x, clientY: to.y }] })
  fireEvent.touchEnd(target, { changedTouches: [{ clientX: to.x, clientY: to.y }] })
}

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
}

function storeHours(hours: unknown, rubrieken: Rubriek[] = NVWA_ILT) {
  localStorage.setItem(HOURS_KEY, JSON.stringify(hours))
  localStorage.setItem(RUBRIEKEN_KEY, JSON.stringify(rubrieken))
}

describe('AC52: uren en rubrieken in de instellingen', () => {
  it('begint met NVWA en ILT en hernoemt een rubriek ook voor bestaande uren', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'n1', uren: 2, omschrijving: 'Overleg' }] })
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await openSettings(user)
    const uren = within(screen.getByRole('group', { name: 'Uren' })).getByRole('button', { name: 'Uren' })
    expect(uren).toHaveAttribute('aria-pressed', 'true')
    const names = () => within(screen.getByRole('list', { name: 'Rubrieken' })).getAllByRole('textbox').map((i) => (i as HTMLInputElement).value)
    expect(names()).toEqual(['NVWA', 'ILT'])

    const nvwa = screen.getByRole('textbox', { name: 'Naam van rubriek NVWA' })
    await user.clear(nvwa)
    await user.type(nvwa, 'NVWA Utrecht{Enter}')
    expect(names()).toEqual(['NVWA Utrecht', 'ILT'])

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht uren' }))
    expect(screen.getByRole('region', { name: 'NVWA Utrecht in Oktober 2026' })).toBeInTheDocument()

    unmount()
    render(<App />)
    await user.click(hoursChip('dinsdag 20 oktober'))
    expect(lines()).toEqual([{ rubriek: 'NVWA Utrecht', uren: '2 uur', omschrijving: 'Overleg' }])
  })

  it('neemt een lege of dubbele naam niet over', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    const nvwa = screen.getByRole('textbox', { name: 'Naam van rubriek NVWA' })
    await user.clear(nvwa)
    await user.tab()
    expect(nvwa).toHaveValue('NVWA')
    expect(screen.getByText('Een rubriek moet een naam hebben.')).toBeInTheDocument()

    await user.clear(nvwa)
    await user.type(nvwa, 'ilt{Enter}')
    expect(nvwa).toHaveValue('NVWA')
    expect(screen.getByText('Er is al een rubriek ilt.')).toBeInTheDocument()
  })

  it('voegt rubrieken toe tot het maximum van 8 en verwijdert alleen een rubriek zonder uren', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'i1', uren: 1, omschrijving: '' }] })
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Rubriek toevoegen' }))
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek Nieuwe rubriek' })).toBeInTheDocument()
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Rubriek toevoegen' }))
    expect(within(screen.getByRole('list', { name: 'Rubrieken' })).getAllByRole('listitem')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: 'Rubriek toevoegen' })).not.toBeInTheDocument()
    expect(screen.getByText('Je hebt het maximum van 8 rubrieken.')).toBeInTheDocument()

    // Een rubriek met uren: eerst een eigen bevestigingsvenster; bij Annuleren blijft alles staan.
    await user.click(screen.getByRole('button', { name: 'Rubriek ILT verwijderen' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Deze rubriek bevat gegevens' })
    expect(dialog).toHaveTextContent('ILT heeft 1 regel met uren. Rubriek en uren verwijderen? Dit kan niet ongedaan worden gemaakt.')
    await user.click(within(dialog).getByRole('button', { name: 'Annuleren' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek ILT' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rubriek ILT verwijderen' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Verwijderen' }))
    expect(screen.queryByRole('textbox', { name: 'Naam van rubriek ILT' })).not.toBeInTheDocument()
    expect(screen.getByText('ILT en 1 regel met uren verwijderd.')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(HOURS_KEY)!)).toEqual({})

    // Een rubriek zonder uren gaat zonder vraag weg.
    await user.click(screen.getByRole('button', { name: 'Rubriek NVWA verwijderen' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Naam van rubriek NVWA' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rubriek toevoegen' })).toBeInTheDocument()
  })

  it('begint bij een nieuwe installatie met alleen "Mijn 1e rubriek" en laat bestaande rubrieken staan bij een update', async () => {
    localStorage.removeItem(RUBRIEKEN_KEY)
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await openSettings(user)
    const names = () => within(screen.getByRole('list', { name: 'Rubrieken' })).getAllByRole('textbox').map((i) => (i as HTMLInputElement).value)
    expect(names()).toEqual(['Mijn 1e rubriek'])
    unmount()

    // Na een update (rubrieken al opgeslagen, ook zonder uren) blijven ze precies zo.
    localStorage.setItem(RUBRIEKEN_KEY, JSON.stringify([{ id: 'nvwa', naam: 'NVWA' }, { id: 'ilt', naam: 'ILT' }]))
    render(<App />)
    await openSettings(user)
    expect(names()).toEqual(['NVWA', 'ILT'])
  })

  it('verbergt alles van de uren als Uren uit staat, ook na opnieuw openen', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'n1', uren: 2, omschrijving: '' }] })
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('2 u')
    await openSettings(user)
    await user.click(within(screen.getByRole('group', { name: 'Uren' })).getByRole('button', { name: 'Uren' }))
    expect(screen.queryByRole('list', { name: 'Rubrieken' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.queryByRole('button', { name: /^Uren op/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Overzicht uren' })).not.toBeInTheDocument()

    unmount()
    render(<App />)
    expect(screen.queryByRole('button', { name: /^Uren op/ })).not.toBeInTheDocument()
    await openSettings(user)
    await user.click(within(screen.getByRole('group', { name: 'Uren' })).getByRole('button', { name: 'Uren' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('2 u')
  })
})

describe('AC53: uren per dag', () => {
  it('voegt regels toe, telt ze op en onthoudt ze', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(hoursChip('dinsdag 20 oktober'))
    expect(screen.getByRole('heading', { name: 'Uren' })).toBeInTheDocument()
    expect(screen.getByText('di 20 okt')).toBeInTheDocument()
    expect(dayTotal()).toHaveTextContent(/^Totaal0$/)

    // Per rubriek een blok met een knop om een regel toe te voegen; aantal uur en omschrijving op één regel.
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['NVWA', 'ILT'])
    await user.click(screen.getByRole('button', { name: 'Regel toevoegen bij NVWA' }))
    expect(lines()).toEqual([{ rubriek: 'NVWA', uren: '1 uur', omschrijving: '' }])
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aantal uur' }), '2.5')
    await user.type(screen.getByRole('textbox', { name: 'Omschrijving' }), 'Overleg')
    await user.click(screen.getByRole('button', { name: 'Regel toevoegen bij ILT' }))
    expect(within(screen.getByRole('region', { name: 'NVWA' })).getByText((_, el) => el?.className === 'amount-sum' && el.textContent === '2,5')).toBeInTheDocument()
    // Het rubriektotaal staat onder de regels, niet naast de naam (vanaf 1.20.1).
    const nvwa = screen.getByRole('region', { name: 'NVWA' })
    expect(nvwa.querySelector('.hour-group-head .amount-sum')).toBeNull()
    expect(nvwa.querySelector('ul + .hour-group-total')).toHaveTextContent('2,5')
    expect(lines()).toEqual([
      { rubriek: 'NVWA', uren: '2,5 uur', omschrijving: 'Overleg' },
      { rubriek: 'ILT', uren: '1 uur', omschrijving: '' },
    ])
    expect(dayTotal()).toHaveTextContent(/^Totaal3,5$/)

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('3,5 u')
    expect(hoursChip('woensdag 21 oktober')).toHaveTextContent('')

    unmount()
    render(<App />)
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('3,5 u')
    await user.click(hoursChip('dinsdag 20 oktober'))
    await user.click(screen.getAllByRole('button', { name: 'Regel verwijderen' })[1])
    expect(dayTotal()).toHaveTextContent(/^Totaal2,5$/)
  })

  it('gaat met de pijltjes naar de vorige en volgende werkdag en terug naar die week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('vrijdag 23 oktober'))
    await user.click(screen.getByRole('button', { name: 'Volgende dag' }))
    expect(screen.getByText('ma 26 okt')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vorige dag' }))
    expect(screen.getByText('vr 23 okt')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volgende dag' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-label', 'maandag 26 oktober')
  })

  it('AC59: swipet naar de volgende en vorige werkdag en gaat met Vandaag naar vandaag', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('vrijdag 23 oktober'))
    const vandaag = screen.getByRole('button', { name: 'Vandaag' })
    expect(vandaag).toBeEnabled()
    swipeDay({ x: 300, y: 300 }, { x: 100, y: 310 })
    expect(screen.getByText('ma 26 okt')).toBeInTheDocument()
    swipeDay({ x: 100, y: 300 }, { x: 300, y: 290 })
    expect(screen.getByText('vr 23 okt')).toBeInTheDocument()
    // Te kort of vooral verticaal: de dag blijft staan.
    swipeDay({ x: 200, y: 300 }, { x: 170, y: 300 })
    swipeDay({ x: 200, y: 300 }, { x: 120, y: 100 })
    expect(screen.getByText('vr 23 okt')).toBeInTheDocument()
    await user.click(vandaag)
    expect(screen.getByText('wo 21 okt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vandaag' })).toBeDisabled()
  })

  it('vraagt om eerst een rubriek te maken als er geen zijn', async () => {
    storeHours({}, [])
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('dinsdag 20 oktober'))
    expect(screen.queryByRole('button', { name: /Regel toevoegen/ })).not.toBeInTheDocument()
    expect(screen.getByText('Maak eerst een rubriek via het tandwiel, bij Uren.')).toBeInTheDocument()
  })
})

describe('AC54: overzicht uren', () => {
  it('groepeert per maand (nieuwste eerst) en daarbinnen per rubriek', async () => {
    storeHours({
      '2026-10-02': [{ rubriek: 'i1', uren: 1.5, omschrijving: '' }],
      '2026-10-01': [{ rubriek: 'n1', uren: 2, omschrijving: 'Overleg' }],
      '2026-09-30': [{ rubriek: 'n1', uren: 3, omschrijving: '' }],
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht uren' }))
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Oktober 20263,5',
      'September 20263',
    ])
    const october = screen.getByRole('region', { name: 'Oktober 2026' })
    expect(within(october).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['NVWA2', 'ILT1,5'])
    const nvwa = within(october).getByRole('region', { name: 'NVWA in Oktober 2026' })
    expect(within(nvwa).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['do 1Overleg2'])
    const september = screen.getByRole('region', { name: 'September 2026' })
    expect(within(september).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['NVWA3'])

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-label', 'maandag 19 oktober')
  })

  it('meldt dat er nog geen uren zijn', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht uren' }))
    expect(screen.getByText('Nog geen uren geregistreerd.')).toBeInTheDocument()
  })
})

describe('AC55: uren inspreken', () => {
  function parse(text: string, rubrieken: Rubriek[] | null = NVWA_ILT) {
    return parseVoiceCommand(text, TODAY, mondayOf(TODAY), MODES, rubrieken)
  }

  it('begrijpt rubriek, aantal uur, datum en omschrijving', () => {
    expect(parse('2 uur NVWA overleg met de inspectie')).toEqual({
      ok: true,
      hours: { rubriek: 'n1', uren: 2, omschrijving: 'Overleg met de inspectie' },
      date: new Date(2026, 9, 21),
    })
    expect(parse('gisteren anderhalf uur aan ILT rapport schrijven')).toEqual({
      ok: true,
      hours: { rubriek: 'i1', uren: 1.5, omschrijving: 'Rapport schrijven' },
      date: new Date(2026, 9, 20),
    })
    expect(parse('ILT drie kwartier op 1 oktober intake')).toEqual({
      ok: true,
      hours: { rubriek: 'i1', uren: 0.75, omschrijving: 'Intake' },
      date: new Date(2026, 9, 1),
    })
    expect(parse('n v w a 2,5 uur')).toMatchObject({ hours: { rubriek: 'n1', uren: 2.5, omschrijving: '' } })
    expect(parse('tweeënhalf uur NVWA')).toMatchObject({ hours: { uren: 2.5 } })
    expect(parse('2 uur en een kwartier NVWA')).toMatchObject({ hours: { uren: 2.25 } })
    expect(parse('NVWA 50 minuten')).toMatchObject({ hours: { uren: 0.75 } })
    expect(parse('2 uur NVWA thuis')).toMatchObject({ hours: { rubriek: 'n1', omschrijving: 'Thuis' } })
  })

  it('geeft een melding als de rubriek of het aantal uur ontbreekt', () => {
    expect(parse('NVWA overleg')).toEqual({ ok: false, error: 'Hoeveel uur? Zeg bijvoorbeeld "2 uur NVWA overleg".' })
    expect(parse('3 uur overleg')).toEqual({ ok: false, error: 'Ik hoorde "3 uur overleg", maar geen rubriek (NVWA of ILT).' })
    expect(parse('2 uur NVWA zaterdag')).toEqual({ ok: false, error: 'Zaterdag 24 oktober is geen werkdag.' })
    // Zonder urenregistratie werkt de spraakbediening zoals voorheen.
    expect(parse('2 uur NVWA', null)).toMatchObject({ ok: false, error: expect.stringContaining('geen Thuis, Trein, Fiets, Auto of Vrij') })
    expect(parse('fiets op 1 oktober')).toMatchObject({ ok: true, modes: ['fiets'] })
  })

  it('voegt met de microfoon een regel toe en haalt hem weg met Ongedaan maken', async () => {
    storeHours({ '2026-10-21': [{ rubriek: 'i1', uren: 1, omschrijving: 'Mail' }] })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.hear('2 uur NVWA overleg')
    expect(screen.getByRole('status')).toHaveTextContent('2 uur NVWA vastgelegd op woensdag 21 oktober: Overleg.')
    expect(hoursChip('woensdag 21 oktober')).toHaveTextContent('3 u')

    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(hoursChip('woensdag 21 oktober')).toHaveTextContent('1 u')
    await user.click(hoursChip('woensdag 21 oktober'))
    expect(lines()).toEqual([{ rubriek: 'ILT', uren: '1 uur', omschrijving: 'Mail' }])
  })
})

describe('AC58: regel inspreken bij een rubriek', () => {
  it('legt alleen uren en omschrijving vast bij die rubriek op de dag die open staat', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('maandag 19 oktober'))
    expect(screen.queryByRole('button', { name: 'Inspreken' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Regel inspreken bij NVWA' }))
    expect(screen.getByRole('button', { name: 'Stoppen met luisteren' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Luisteren voor NVWA/).closest('section')).toHaveTextContent('"2 uur overleg"')
    FakeRecognition.last!.hear('2 uur overleg met de inspectie')
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 uur NVWA vastgelegd op maandag 19 oktober: Overleg met de inspectie.',
    )
    expect(lines()).toEqual([{ rubriek: 'NVWA', uren: '2 uur', omschrijving: 'Overleg met de inspectie' }])

    await user.click(screen.getByRole('button', { name: 'Regel inspreken bij ILT' }))
    FakeRecognition.last!.hear('een kwartier mail')
    expect(screen.getByText('ma 19 okt')).toBeInTheDocument()
    expect(lines()).toEqual([
      { rubriek: 'NVWA', uren: '2 uur', omschrijving: 'Overleg met de inspectie' },
      { rubriek: 'ILT', uren: '0,25 uur', omschrijving: 'Mail' },
    ])
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(lines()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Regel inspreken bij ILT' }))
    FakeRecognition.last!.hear('fiets vandaag')
    expect(screen.getByRole('status')).toHaveTextContent('Ik hoorde "fiets vandaag", maar geen aantal uur.')
    expect(lines()).toHaveLength(1)
  })

  it('begrijpt aantal uur en omschrijving zonder rubriek', () => {
    expect(parseHoursLine('anderhalf uur rapport schrijven', 'i1')).toEqual({
      ok: true,
      line: { rubriek: 'i1', uren: 1.5, omschrijving: 'Rapport schrijven' },
    })
    expect(parseHoursLine('overleg 45 minuten', 'n1')).toEqual({
      ok: true,
      line: { rubriek: 'n1', uren: 0.75, omschrijving: 'Overleg' },
    })
    expect(parseHoursLine('overleg', 'n1').ok).toBe(false)
  })
})

describe('AC56: uren in de backup', () => {
  it('neemt uren en rubrieken mee en zet ze terug bij inlezen', async () => {
    const rubrieken = [{ id: 'x1', naam: 'Project X' }]
    const uren = { '2026-10-19': [{ rubriek: 'x1', uren: 4, omschrijving: 'Bouwen' }] }
    const text = createBackup({ '2026-10-19': ['thuis'] }, {}, { uren, rubrieken }, TODAY)
    expect(JSON.parse(text)).toMatchObject({ versie: 2, rubrieken, uren })
    expect(parseBackup(text).uren).toEqual({ uren, rubrieken })

    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const input = screen.getByLabelText('Backupbestand') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([text], 'backup.json', { type: 'application/json' })] } })
    expect(await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })).toHaveTextContent(
      'met 1 dag en 1 urenregel inlezen? Dit vervangt al je huidige keuzes en uren.',
    )
    await confirmRestore()
    expect(await screen.findByText('Backup ingelezen: 1 dag en 1 urenregel.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek Project X' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('maandag 19 oktober')).toHaveTextContent('4 u')
  })

  it('laat de huidige uren staan bij een backup zonder uren', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'n1', uren: 2, omschrijving: '' }] })
    const old = JSON.stringify({ app: 'woon-werkvervoer', versie: 2, gemaakt: TODAY.toISOString(), registraties: {} })
    expect(parseBackup(old).uren).toBeNull()
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    fireEvent.change(screen.getByLabelText('Backupbestand'), {
      target: { files: [new File([old], 'oud.json', { type: 'application/json' })] },
    })
    await confirmRestore()
    expect(await screen.findByText('Backup ingelezen: 0 dagen.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('2 u')
  })
})

describe('AC57: past op het scherm', () => {
  it('zet zes overzichtsknoppen dichter op elkaar', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: 'Overzichten' })).toHaveClass('crowded')
  })
})
