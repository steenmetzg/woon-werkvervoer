import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ENABLED_KEY, STORAGE_KEY } from './storage'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Vandaag" is in alle tests dinsdag 20 oktober 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function dayButtons(dayName: string) {
  return within(screen.getByRole('listitem', { name: dayName })).getAllByRole('button')
}

function settingButton(mode: string) {
  return within(screen.getByRole('group', { name: 'Vervoervormen' })).getByRole('button', { name: mode })
}

describe('AC22: vervoervormen aan- en uitzetten', () => {
  it('toont standaard alle vijf de knoppen en het overzicht auto', () => {
    render(<App />)
    expect(dayButtons('dinsdag 20 oktober').map((b) => b.textContent)).toEqual(['Thuis', 'Trein', 'Fiets', 'Auto', 'Vrij'])
    expect(screen.getByRole('button', { name: 'Overzicht auto' })).toBeInTheDocument()
  })

  it('verbergt uitgezette vormen bij elke dag en het overzicht auto, ook na opnieuw openen', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(settingButton('Trein'))
    await user.click(settingButton('Auto'))
    expect(settingButton('Trein')).toHaveAttribute('aria-pressed', 'false')
    expect(settingButton('Fiets')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Terug' }))

    for (const d of screen.getAllByRole('listitem')) {
      expect(within(d).getAllByRole('button').map((b) => b.textContent)).toEqual(['Thuis', 'Fiets', 'Vrij'])
    }
    expect(screen.queryByRole('button', { name: 'Overzicht auto' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' })).toBeInTheDocument()

    unmount()
    render(<App />)
    expect(dayButtons('dinsdag 20 oktober').map((b) => b.textContent)).toEqual(['Thuis', 'Fiets', 'Vrij'])
    expect(screen.queryByRole('button', { name: 'Overzicht auto' })).not.toBeInTheDocument()
  })
})

describe('AC23: Thuis staat altijd aan', () => {
  it('heeft een inactieve, aangezette knop Thuis', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(settingButton('Thuis')).toBeDisabled()
    expect(settingButton('Thuis')).toHaveAttribute('aria-pressed', 'true')
  })

  it('zet Thuis weer aan als het in de opslag toch uit staat', () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(['fiets']))
    render(<App />)
    expect(dayButtons('dinsdag 20 oktober').map((b) => b.textContent)).toEqual(['Thuis', 'Fiets'])
  })
})

describe('AC24: keuzes van een uitgezette vorm blijven bewaard', () => {
  it('verbergt dinsdag Auto als Auto uit staat en toont het weer als Auto aan gaat', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': 'auto' }))
    const user = userEvent.setup()
    render(<App />)
    const openSettings = () => user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))

    await openSettings()
    await user.click(settingButton('Auto'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(dayButtons('dinsdag 20 oktober').filter((b) => b.getAttribute('aria-pressed') === 'true')).toEqual([])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ '2026-10-20': 'auto' })

    await openSettings()
    await user.click(settingButton('Auto'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(within(screen.getByRole('listitem', { name: 'dinsdag 20 oktober' })).getByRole('button', { name: 'Auto' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Overzicht auto' })).toBeInTheDocument()
  })
})
