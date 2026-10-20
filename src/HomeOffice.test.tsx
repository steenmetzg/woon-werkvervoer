import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'

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
