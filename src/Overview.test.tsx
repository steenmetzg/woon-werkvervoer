import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createBackup } from './backup'
import { DECLARED_KEY } from './declared'
import { ENABLED_KEY, STORAGE_KEY } from './storage'

// "Vandaag" is dinsdag 20 oktober 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// De backupmap leeft in de tests niet in IndexedDB.
vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

function column(month: string) {
  return within(screen.getByRole('region', { name: month }))
}

describe('AC20: overzicht thuiswerkvergoeding', () => {
  it('toont de thuisdagen van 20 juli t/m vandaag, per maand in een eigen kolom', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-17': 'thuis', // vóór de periode
        '2026-07-20': 'thuis',
        '2026-07-31': 'thuis',
        '2026-08-03': 'thuis',
        '2026-08-04': 'trein', // andere keuze
        '2026-08-28': 'thuis',
        '2026-10-01': 'thuis',
        '2026-10-20': 'thuis', // vandaag
        '2026-10-21': 'thuis', // na vandaag
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))

    expect(screen.getByRole('heading', { name: 'Overzicht thuiswerkvergoeding' })).toBeInTheDocument()
    expect(screen.getByLabelText('Thuis')).toBeInTheDocument()
    expect(screen.getByLabelText('Toon vanaf')).toHaveValue('2026-07-20')
    expect(screen.getByLabelText('Tot en met')).toHaveValue('2026-10-20')

    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'juli',
      'augustus',
      'september',
      'oktober',
    ])
    expect(column('juli').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ma 20', 'vr 31'])
    expect(column('augustus').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ma 3', 'vr 28'])
    expect(column('september').queryAllByRole('listitem')).toHaveLength(0)
    expect(column('september').getByText('–')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Juli',
      'Augustus',
      'September',
      'Oktober',
    ])
    expect(column('oktober').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['do 1', 'di 20'])
  })

  it('begint op de laatste dag van de maand als die dag niet bestaat, bij Thuis op de eerste werkdag daarna', async () => {
    vi.setSystemTime(new Date(2026, 4, 31, 9, 0)) // zondag 31 mei 2026
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht vrije dagen' }))
    expect(screen.getByLabelText('Toon vanaf')).toHaveValue('2026-02-28')
    expect(screen.getAllByRole('region')).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'Terug' }))

    // Zaterdag 28 februari is geen werkdag: het overzicht thuiswerkvergoeding begint op maandag 2 maart.
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))
    expect(screen.getByLabelText('Toon vanaf')).toHaveValue('2026-03-02')
    expect(screen.getByLabelText('Tot en met')).toHaveValue('2026-05-31')
    expect(screen.getAllByRole('region')).toHaveLength(3)
  })

  it('gaat met Terug naar dezelfde week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Vorige week' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 12 oktober')
  })
})

describe('AC21: overzicht kilometervergoeding', () => {
  it('toont precies hetzelfde overzicht, maar dan voor de dagen met Auto', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-17': 'auto', // vóór de periode
        '2026-07-21': 'auto',
        '2026-08-03': 'thuis', // andere keuze
        '2026-08-04': ['trein', 'fiets'], // zonder auto
        '2026-09-15': ['trein', 'auto'], // auto samen met trein telt mee
        '2026-10-20': 'auto', // vandaag
        '2026-10-22': 'auto', // na vandaag
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht kilometervergoeding' }))

    expect(screen.getByRole('heading', { name: 'Overzicht kilometervergoeding' })).toBeInTheDocument()
    expect(screen.getByLabelText('Auto')).toBeInTheDocument()
    expect(screen.getByLabelText('Toon vanaf')).toHaveValue('2026-07-20')
    expect(screen.getByLabelText('Tot en met')).toHaveValue('2026-10-20')
    expect(column('juli').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['di 21'])
    expect(column('augustus').queryAllByRole('listitem')).toHaveLength(0)
    expect(column('september').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['di 15'])
    expect(column('oktober').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['di 20'])

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 19 oktober')
  })
})

describe('AC29: overzicht vrije dagen', () => {
  it('toont precies hetzelfde overzicht, maar dan voor de dagen met Vrij', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-17': 'vrij', // vóór de periode
        '2026-08-03': 'vrij',
        '2026-08-04': 'auto', // andere keuze
        '2026-10-19': 'vrij',
        '2026-10-23': 'vrij', // na vandaag
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht vrije dagen' }))

    expect(screen.getByRole('heading', { name: 'Overzicht vrije dagen' })).toBeInTheDocument()
    expect(screen.getByLabelText('Vrij')).toBeInTheDocument()
    expect(column('juli').queryAllByRole('listitem')).toHaveLength(0)
    expect(column('augustus').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ma 3'])
    expect(column('september').queryAllByRole('listitem')).toHaveLength(0)
    expect(column('oktober').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ma 19'])

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 19 oktober')
  })

  it('heeft geen knop als Vrij uit staat', () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(['thuis', 'trein', 'fiets', 'auto']))
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Overzicht vrije dagen' })).not.toBeInTheDocument()
  })
})

describe('AC34: overzicht treinvergoeding en overzicht fietsdagen', () => {
  it.each([
    ['Overzicht treinvergoeding', 'Trein', 'trein'],
    ['Overzicht fietsdagen', 'Fiets', 'fiets'],
  ])('%s toont alleen de dagen met %s, ook in combinatie', async (title, label, mode) => {
    const other = mode === 'trein' ? 'fiets' : 'trein'
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        '2026-07-17': [mode], // vóór de periode
        '2026-08-03': [mode],
        '2026-08-04': [other], // andere keuze
        '2026-09-15': ['trein', 'fiets'], // samen met een andere keuze
        '2026-10-23': [mode], // na vandaag
      }),
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: title }))

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.getByLabelText(label)).toBeInTheDocument()
    expect(column('juli').queryAllByRole('listitem')).toHaveLength(0)
    expect(column('augustus').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['ma 3'])
    expect(column('september').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['di 15'])
    expect(column('oktober').queryAllByRole('listitem')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 19 oktober')
  })

  it('heeft geen knoppen als Trein en Fiets uit staan', () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(['thuis', 'auto', 'vrij']))
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Overzicht treinvergoeding' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Overzicht fietsdagen' })).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: 'Overzichten' }))
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Overzicht thuiswerkvergoeding', 'Overzicht kilometervergoeding', 'Overzicht vrije dagen'])
  })
})

describe('AC36: datum laatste declaratie', () => {
  function dateField() {
    return screen.getByLabelText('Laatst gedeclareerde dag:') as HTMLInputElement
  }

  it('heeft in de overzichten van Thuis, Trein en Auto een leeg datumveld dat een gekozen datum onthoudt', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht treinvergoeding' }))
    expect(dateField().type).toBe('date')
    expect(dateField().value).toBe('')
    fireEvent.change(dateField(), { target: { value: '2026-09-30' } })
    expect(dateField().value).toBe('2026-09-30')
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 26 oktober')

    // Elke vorm heeft een eigen datum.
    for (const name of ['Overzicht thuiswerkvergoeding', 'Overzicht kilometervergoeding']) {
      await user.click(screen.getByRole('button', { name }))
      expect(dateField().value).toBe('')
      await user.click(screen.getByRole('button', { name: 'Terug' }))
    }
    unmount()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht treinvergoeding' }))
    expect(dateField().value).toBe('2026-09-30')
    fireEvent.change(dateField(), { target: { value: '' } })
    expect(dateField().value).toBe('')
    expect(JSON.parse(localStorage.getItem(DECLARED_KEY)!)).toEqual({})
  })

  it('heeft geen datumveld in de overzichten fietsdagen en vrije dagen', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const name of ['Overzicht fietsdagen', 'Overzicht vrije dagen']) {
      await user.click(screen.getByRole('button', { name }))
      expect(screen.queryByLabelText('Laatst gedeclareerde dag:')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Terug' }))
    }
  })

})

describe('AC41: laatst gedeclareerde dagen in de backup', () => {
  it('neemt de dagen mee in de backup en zet ze terug bij inlezen', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-09-30', auto: '2026-10-02' }))
    expect(JSON.parse(createBackup({}, { thuis: '2026-09-30', auto: '2026-10-02' }, new Date(2026, 9, 20))).gedeclareerd).toEqual({
      thuis: '2026-09-30',
      auto: '2026-10-02',
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const backup = { app: 'woon-werkvervoer', versie: 2, gemaakt: '2026-10-01T08:00:00.000Z', registraties: {}, gedeclareerd: { trein: '2026-08-31' } }
    await user.upload(screen.getByLabelText('Backupbestand'), new File([JSON.stringify(backup)], 'b.json'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    for (const [name, value] of [
      ['Overzicht thuiswerkvergoeding', ''],
      ['Overzicht treinvergoeding', '2026-08-31'],
      ['Overzicht kilometervergoeding', ''],
    ]) {
      await user.click(screen.getByRole('button', { name }))
      expect(screen.getByLabelText('Laatst gedeclareerde dag:')).toHaveValue(value)
      await user.click(screen.getByRole('button', { name: 'Terug' }))
    }
  })

  it('laat de dagen staan bij een backup van een oudere versie zonder gedeclareerde dagen', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-09-30' }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const old = { app: 'woon-werkvervoer', versie: 2, gemaakt: '2026-10-01T08:00:00.000Z', registraties: {} }
    await user.upload(screen.getByLabelText('Backupbestand'), new File([JSON.stringify(old)], 'b.json'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))
    expect(screen.getByLabelText('Laatst gedeclareerde dag:')).toHaveValue('2026-09-30')
  })
})

describe('AC38: periode van de overzichten', () => {
  function field(label: string) {
    return screen.getByLabelText(label) as HTMLInputElement
  }

  function regions() {
    return screen.queryAllByRole('region').map((r) => r.getAttribute('aria-label'))
  }

  async function openOverview(name: string) {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name }))
  }

  it('begint de dag na de laatste declaratie, of de eerste werkdag daarna', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-09-30': 'thuis', '2026-10-01': 'thuis' }))
    await openOverview('Overzicht thuiswerkvergoeding')
    fireEvent.change(field('Laatst gedeclareerde dag:'), { target: { value: '2026-09-30' } })
    expect(field('Toon vanaf').value).toBe('2026-10-01')
    expect(field('Tot en met').value).toBe('2026-10-20')
    expect(regions()).toEqual(['oktober'])
    expect(column('oktober').getAllByRole('listitem').map((li) => li.textContent)).toEqual(['do 1'])

    // Vrijdag 16 oktober gedeclareerd: het overzicht begint op maandag 19 oktober.
    fireEvent.change(field('Laatst gedeclareerde dag:'), { target: { value: '2026-10-16' } })
    expect(field('Toon vanaf').value).toBe('2026-10-19')
  })

  it('loopt tot 3 maanden na de vanaf-datum als dat vóór vandaag ligt', async () => {
    await openOverview('Overzicht kilometervergoeding')
    fireEvent.change(field('Laatst gedeclareerde dag:'), { target: { value: '2025-12-31' } })
    expect(field('Toon vanaf').value).toBe('2026-01-01')
    expect(field('Tot en met').value).toBe('2026-04-01')
    expect(regions()).toEqual(['januari', 'februari', 'maart', 'april'])
  })

  it('past het overzicht aan als je de vanaf- of tot-datum met de hand kiest', async () => {
    await openOverview('Overzicht treinvergoeding')
    fireEvent.change(field('Toon vanaf'), { target: { value: '2026-05-04' } })
    expect(field('Tot en met').value).toBe('2026-08-04')
    expect(regions()).toEqual(['mei', 'juni', 'juli', 'augustus'])

    fireEvent.change(field('Tot en met'), { target: { value: '2026-10-20' } })
    expect(regions()).toEqual(['mei', 'juni', 'juli', 'augustus', 'september', 'oktober'])

    // Een nieuwe declaratiedatum zet de periode weer op de standaard.
    fireEvent.change(field('Laatst gedeclareerde dag:'), { target: { value: '2026-09-30' } })
    expect(field('Toon vanaf').value).toBe('2026-10-01')
    expect(field('Tot en met').value).toBe('2026-10-20')
  })

  it('meldt het als de vanaf-datum na de tot-datum ligt', async () => {
    await openOverview('Overzicht thuiswerkvergoeding')
    fireEvent.change(field('Laatst gedeclareerde dag:'), { target: { value: '2026-10-20' } })
    expect(field('Toon vanaf').value).toBe('2026-10-21')
    expect(field('Tot en met').value).toBe('2026-10-20')
    expect(regions()).toEqual([])
    expect(screen.getByText(/de vanaf-datum ligt na de tot en met-datum/)).toBeInTheDocument()
  })

  it('laat bij Fiets en Vrij de periode ook aanpassen, met vandaag als standaard tot-datum', async () => {
    await openOverview('Overzicht fietsdagen')
    expect(field('Toon vanaf').value).toBe('2026-07-20')
    expect(field('Tot en met').value).toBe('2026-10-20')
    fireEvent.change(field('Toon vanaf'), { target: { value: '2026-01-05' } })
    expect(field('Tot en met').value).toBe('2026-10-20')
    expect(regions()).toHaveLength(10)
  })

  it('zet bij een periode van meer dan een jaar het jaartal bij de maanden', async () => {
    await openOverview('Overzicht vrije dagen')
    fireEvent.change(field('Toon vanaf'), { target: { value: '2025-07-01' } })
    expect(regions()[0]).toBe('juli 2025')
    expect(regions().at(-1)).toBe('oktober 2026')
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent('Juli 2025')
  })
})
