import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createBackup, parseBackup } from './backup'
import { mondayOf } from './dates'
import { DEFAULT_RUBRIEKEN, HOURS_KEY, RUBRIEKEN_KEY, type Rubriek } from './hours'
import { parseVoiceCommand } from './speech'
import { MODES } from './storage'

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

beforeEach(() => {
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

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
}

function storeHours(hours: unknown, rubrieken: Rubriek[] = DEFAULT_RUBRIEKEN) {
  localStorage.setItem(HOURS_KEY, JSON.stringify(hours))
  localStorage.setItem(RUBRIEKEN_KEY, JSON.stringify(rubrieken))
}

describe('AC52: uren en rubrieken in de instellingen', () => {
  it('begint met NVWA en ILT en hernoemt een rubriek ook voor bestaande uren', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'nvwa', uren: 2, omschrijving: 'Overleg' }] })
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
    storeHours({ '2026-10-20': [{ rubriek: 'ilt', uren: 1, omschrijving: '' }] })
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Rubriek toevoegen' }))
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek Nieuwe rubriek' })).toBeInTheDocument()
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Rubriek toevoegen' }))
    expect(within(screen.getByRole('list', { name: 'Rubrieken' })).getAllByRole('listitem')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: 'Rubriek toevoegen' })).not.toBeInTheDocument()
    expect(screen.getByText('Je hebt het maximum van 8 rubrieken.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rubriek ILT verwijderen' }))
    expect(screen.getByText(/ILT heeft nog 1 regel met uren en kan niet worden verwijderd/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek ILT' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rubriek NVWA verwijderen' }))
    expect(screen.queryByRole('textbox', { name: 'Naam van rubriek NVWA' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rubriek toevoegen' })).toBeInTheDocument()
  })

  it('verbergt alles van de uren als Uren uit staat, ook na opnieuw openen', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'nvwa', uren: 2, omschrijving: '' }] })
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
    expect(screen.getByText('Dinsdag 20 oktober')).toBeInTheDocument()
    expect(screen.getByText(/Totaal:/)).toHaveTextContent('Totaal: 0 uur')

    // Per rubriek een blok met een knop om een regel toe te voegen; aantal uur en omschrijving op één regel.
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['NVWA', 'ILT'])
    await user.click(screen.getByRole('button', { name: 'Regel toevoegen bij NVWA' }))
    expect(lines()).toEqual([{ rubriek: 'NVWA', uren: '1 uur', omschrijving: '' }])
    await user.selectOptions(screen.getByRole('combobox', { name: 'Aantal uur' }), '2.5')
    await user.type(screen.getByRole('textbox', { name: 'Omschrijving' }), 'Overleg')
    await user.click(screen.getByRole('button', { name: 'Regel toevoegen bij ILT' }))
    expect(within(screen.getByRole('region', { name: 'NVWA' })).getByText('2,5 uur', { selector: '.hours-sum' })).toBeInTheDocument()
    expect(lines()).toEqual([
      { rubriek: 'NVWA', uren: '2,5 uur', omschrijving: 'Overleg' },
      { rubriek: 'ILT', uren: '1 uur', omschrijving: '' },
    ])
    expect(screen.getByText(/Totaal:/)).toHaveTextContent('Totaal: 3,5 uur')

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('3,5 u')
    expect(hoursChip('woensdag 21 oktober')).toHaveTextContent('')

    unmount()
    render(<App />)
    expect(hoursChip('dinsdag 20 oktober')).toHaveTextContent('3,5 u')
    await user.click(hoursChip('dinsdag 20 oktober'))
    await user.click(screen.getAllByRole('button', { name: 'Regel verwijderen' })[1])
    expect(screen.getByText(/Totaal:/)).toHaveTextContent('Totaal: 2,5 uur')
  })

  it('gaat met de pijltjes naar de vorige en volgende werkdag en terug naar die week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('vrijdag 23 oktober'))
    await user.click(screen.getByRole('button', { name: 'Volgende dag' }))
    expect(screen.getByText('Maandag 26 oktober')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vorige dag' }))
    expect(screen.getByText('Vrijdag 23 oktober')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Volgende dag' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('aria-label', 'maandag 26 oktober')
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
      '2026-10-02': [{ rubriek: 'ilt', uren: 1.5, omschrijving: '' }],
      '2026-10-01': [{ rubriek: 'nvwa', uren: 2, omschrijving: 'Overleg' }],
      '2026-09-30': [{ rubriek: 'nvwa', uren: 3, omschrijving: '' }],
    })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht uren' }))
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Oktober 20263,5 uur',
      'September 20263 uur',
    ])
    const october = screen.getByRole('region', { name: 'Oktober 2026' })
    expect(within(october).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['NVWA2 uur', 'ILT1,5 uur'])
    const nvwa = within(october).getByRole('region', { name: 'NVWA in Oktober 2026' })
    expect(within(nvwa).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['do 12Overleg'])
    const september = screen.getByRole('region', { name: 'September 2026' })
    expect(within(september).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['NVWA3 uur'])

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
  function parse(text: string, rubrieken: Rubriek[] | null = DEFAULT_RUBRIEKEN) {
    return parseVoiceCommand(text, TODAY, mondayOf(TODAY), MODES, rubrieken)
  }

  it('begrijpt rubriek, aantal uur, datum en omschrijving', () => {
    expect(parse('2 uur NVWA overleg met de inspectie')).toEqual({
      ok: true,
      hours: { rubriek: 'nvwa', uren: 2, omschrijving: 'Overleg met de inspectie' },
      date: new Date(2026, 9, 21),
    })
    expect(parse('gisteren anderhalf uur aan ILT rapport schrijven')).toEqual({
      ok: true,
      hours: { rubriek: 'ilt', uren: 1.5, omschrijving: 'Rapport schrijven' },
      date: new Date(2026, 9, 20),
    })
    expect(parse('ILT drie kwartier op 1 oktober intake')).toEqual({
      ok: true,
      hours: { rubriek: 'ilt', uren: 0.75, omschrijving: 'Intake' },
      date: new Date(2026, 9, 1),
    })
    expect(parse('n v w a 2,5 uur')).toMatchObject({ hours: { rubriek: 'nvwa', uren: 2.5, omschrijving: '' } })
    expect(parse('tweeënhalf uur NVWA')).toMatchObject({ hours: { uren: 2.5 } })
    expect(parse('2 uur en een kwartier NVWA')).toMatchObject({ hours: { uren: 2.25 } })
    expect(parse('NVWA 50 minuten')).toMatchObject({ hours: { uren: 0.75 } })
    expect(parse('2 uur NVWA thuis')).toMatchObject({ hours: { rubriek: 'nvwa', omschrijving: 'Thuis' } })
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
    storeHours({ '2026-10-21': [{ rubriek: 'ilt', uren: 1, omschrijving: 'Mail' }] })
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

describe('AC58: uren inspreken op het scherm Uren', () => {
  it('legt de regel vast op de dag die open staat, of op de genoemde dag', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(hoursChip('maandag 19 oktober'))
    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    expect(screen.getByText(/Luisteren/).closest('section')).toHaveTextContent('"2 uur NVWA overleg"')
    FakeRecognition.last!.hear('2 uur NVWA overleg')
    expect(screen.getByRole('status')).toHaveTextContent('2 uur NVWA vastgelegd op maandag 19 oktober: Overleg.')
    expect(lines()).toEqual([{ rubriek: 'NVWA', uren: '2 uur', omschrijving: 'Overleg' }])

    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.hear('ILT een uur gisteren')
    expect(screen.getByText('Dinsdag 20 oktober')).toBeInTheDocument()
    expect(lines()).toEqual([{ rubriek: 'ILT', uren: '1 uur', omschrijving: '' }])
    await user.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(lines()).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.hear('fiets vandaag')
    expect(screen.getByRole('status')).toHaveTextContent('Hier spreek je uren in, bijvoorbeeld "2 uur NVWA overleg".')
  })
})

describe('AC56: uren in de backup', () => {
  it('neemt uren en rubrieken mee en zet ze terug bij inlezen', async () => {
    const rubrieken = [{ id: 'x1', naam: 'Project X' }]
    const uren = { '2026-10-19': [{ rubriek: 'x1', uren: 4, omschrijving: 'Bouwen' }] }
    const text = createBackup({ '2026-10-19': ['thuis'] }, {}, { uren, rubrieken }, TODAY)
    expect(JSON.parse(text)).toMatchObject({ versie: 2, rubrieken, uren })
    expect(parseBackup(text).uren).toEqual({ uren, rubrieken })

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const input = screen.getByLabelText('Backupbestand') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File([text], 'backup.json', { type: 'application/json' })] } })
    expect(await screen.findByText('Backup ingelezen: 1 dag en 1 urenregel.')).toBeInTheDocument()
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('met 1 dag en 1 urenregel inlezen? Dit vervangt al je huidige keuzes en uren.'))
    expect(screen.getByRole('textbox', { name: 'Naam van rubriek Project X' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(hoursChip('maandag 19 oktober')).toHaveTextContent('4 u')
  })

  it('laat de huidige uren staan bij een backup zonder uren', async () => {
    storeHours({ '2026-10-20': [{ rubriek: 'nvwa', uren: 2, omschrijving: '' }] })
    const old = JSON.stringify({ app: 'woon-werkvervoer', versie: 2, gemaakt: TODAY.toISOString(), registraties: {} })
    expect(parseBackup(old).uren).toBeNull()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    fireEvent.change(screen.getByLabelText('Backupbestand'), {
      target: { files: [new File([old], 'oud.json', { type: 'application/json' })] },
    })
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
