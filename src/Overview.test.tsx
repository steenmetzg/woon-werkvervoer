import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ENABLED_KEY, STORAGE_KEY } from './storage'

// "Vandaag" is dinsdag 20 oktober 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

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
    expect(screen.getByTestId('vanaf')).toHaveTextContent('20 juli 2026')
    expect(screen.getByTestId('tot')).toHaveTextContent('20 oktober 2026')

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

  it('begint op de laatste dag van de maand als die dag niet bestaat', async () => {
    vi.setSystemTime(new Date(2026, 4, 31, 9, 0)) // zondag 31 mei 2026
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))
    expect(screen.getByTestId('vanaf')).toHaveTextContent('28 februari 2026')
    expect(screen.getAllByRole('region')).toHaveLength(4)
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
    expect(screen.getByTestId('vanaf')).toHaveTextContent('20 juli 2026')
    expect(screen.getByTestId('tot')).toHaveTextContent('20 oktober 2026')
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
