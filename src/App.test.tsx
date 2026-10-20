import { readFileSync } from 'node:fs'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'

// "Vandaag" is in alle tests dinsdag 20 oktober 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function day(name: string) {
  return screen.getByRole('listitem', { name })
}

function modeButton(dayName: string, mode: string) {
  return within(day(dayName)).getByRole('button', { name: mode })
}

function chosenModes(dayName: string) {
  return within(day(dayName))
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => b.textContent)
}

describe('AC1: weekoverzicht', () => {
  it('toont maandag t/m vrijdag van de huidige week met de juiste datums', () => {
    render(<App />)
    const days = screen.getAllByRole('listitem')
    expect(days.map((d) => d.getAttribute('aria-label'))).toEqual([
      'maandag 19 oktober',
      'dinsdag 20 oktober',
      'woensdag 21 oktober',
      'donderdag 22 oktober',
      'vrijdag 23 oktober',
    ])
    expect(screen.getByText('ma 19 okt')).toBeInTheDocument()
    expect(screen.getByText('vr 23 okt')).toBeInTheDocument()
    expect(screen.queryByText(/zaterdag|zondag|^za |^zo /)).not.toBeInTheDocument()
  })
})

describe('AC2 en AC3: vervoer kiezen', () => {
  it('markeert alleen de gekozen knop bij die dag', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(modeButton('dinsdag 20 oktober', 'Fiets'))
    expect(chosenModes('dinsdag 20 oktober')).toEqual(['Fiets'])
  })

  it('verandert niets aan de andere dagen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(modeButton('dinsdag 20 oktober', 'Fiets'))
    for (const other of ['maandag 19 oktober', 'woensdag 21 oktober', 'donderdag 22 oktober', 'vrijdag 23 oktober']) {
      expect(chosenModes(other)).toEqual([])
    }
  })
})

describe('AC4 en AC5: keuze wijzigen of wissen', () => {
  it('wijzigt de keuze bij een klik op een ander vervoermiddel', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(modeButton('dinsdag 20 oktober', 'Fiets'))
    await user.click(modeButton('dinsdag 20 oktober', 'Trein'))
    expect(chosenModes('dinsdag 20 oktober')).toEqual(['Trein'])
  })

  it('wist de keuze bij een tweede klik op hetzelfde vervoermiddel', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(modeButton('dinsdag 20 oktober', 'Fiets'))
    await user.click(modeButton('dinsdag 20 oktober', 'Fiets'))
    expect(chosenModes('dinsdag 20 oktober')).toEqual([])
  })
})

describe('AC6: bladeren', () => {
  it('gaat naar de volgende week en terug naar deze week, en bewaart keuzes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 26 oktober')
    expect(screen.getAllByRole('listitem')[4]).toHaveAccessibleName('vrijdag 30 oktober')

    await user.click(modeButton('woensdag 28 oktober', 'Auto'))
    await user.click(screen.getByRole('button', { name: 'Deze week' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 19 oktober')

    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    expect(chosenModes('woensdag 28 oktober')).toEqual(['Auto'])
  })

  it('gaat naar de vorige week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Vorige week' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 12 oktober')
  })
})

describe('AC7: vandaag herkennen', () => {
  it('markeert vandaag in de huidige week', () => {
    render(<App />)
    expect(day('dinsdag 20 oktober')).toHaveAttribute('aria-current', 'date')
    expect(screen.getAllByRole('listitem').filter((d) => d.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('markeert niets in een andere week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    expect(screen.getAllByRole('listitem').filter((d) => d.hasAttribute('aria-current'))).toHaveLength(0)
  })
})

describe('AC8: weektotalen', () => {
  it('telt per vervoermiddel de gekozen dagen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(modeButton('maandag 19 oktober', 'Trein'))
    await user.click(modeButton('dinsdag 20 oktober', 'Trein'))
    await user.click(modeButton('woensdag 21 oktober', 'Fiets'))
    await user.click(modeButton('donderdag 22 oktober', 'Thuis'))
    expect(screen.getByTestId('totalen')).toHaveTextContent('Trein 2 · Fiets 1 · Auto 0 · Thuis 1')
  })
})

describe('AC9: onthouden', () => {
  it('toont na opnieuw laden dezelfde keuzes', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(modeButton('maandag 19 oktober', 'Trein'))
    await user.click(modeButton('vrijdag 23 oktober', 'Thuis'))
    unmount()

    render(<App />)
    expect(chosenModes('maandag 19 oktober')).toEqual(['Trein'])
    expect(chosenModes('vrijdag 23 oktober')).toEqual(['Thuis'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      '2026-10-19': 'trein',
      '2026-10-23': 'thuis',
    })
  })

  it('negeert beschadigde opgeslagen gegevens', () => {
    localStorage.setItem(STORAGE_KEY, '{kapot')
    render(<App />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })
})

describe('AC10: op beginscherm', () => {
  it('heeft een app-manifest met naam, iconen en schermvullende weergave', () => {
    const html = readFileSync('index.html', 'utf8')
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('rel="apple-touch-icon"')

    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))
    expect(manifest.name).toBe('Woon-werkvervoer')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
  })
})
