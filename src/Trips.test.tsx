import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createBackup, parseBackup } from './backup'
import { STORAGE_KEY } from './storage'
import { TRIPS_KEY } from './trips'

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

function day(name: string) {
  return within(screen.getByRole('listitem', { name }))
}

function pencil(name: string) {
  return day(name).queryByRole('button', { name: `Ritomschrijving op ${name}` })
}

function store(registrations: object, trips: object = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations))
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
}

describe('AC60: ritomschrijving invullen', () => {
  it('toont een potloodje op reisdagen en bewaart de omschrijving', async () => {
    store({ '2026-10-19': ['trein', 'auto'], '2026-10-20': ['thuis'] })
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    expect(pencil('dinsdag 20 oktober')).toBeNull()
    expect(pencil('woensdag 21 oktober')).toBeNull()

    await user.click(pencil('maandag 19 oktober')!)
    const dialog = screen.getByRole('dialog', { name: 'Rit ma 19 okt · Trein en Auto' })
    await user.type(within(dialog).getByRole('textbox', { name: 'Ritomschrijving' }), 'Zwolle v.v.')
    await user.click(within(dialog).getByRole('button', { name: 'Opslaan' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(day('maandag 19 oktober').getByText('Zwolle v.v.')).toBeInTheDocument()
    expect(pencil('maandag 19 oktober')).toHaveClass('filled')

    unmount()
    render(<App />)
    expect(day('maandag 19 oktober').getByText('Zwolle v.v.')).toBeInTheDocument()

    // Annuleren verandert niets.
    await user.click(pencil('maandag 19 oktober')!)
    await user.type(screen.getByRole('textbox', { name: 'Ritomschrijving' }), ' en terug')
    await user.click(screen.getByRole('button', { name: 'Annuleren' }))
    expect(day('maandag 19 oktober').getByText('Zwolle v.v.')).toBeInTheDocument()

    // Leegmaken en opslaan (met Enter) wist de omschrijving.
    await user.click(pencil('maandag 19 oktober')!)
    await user.clear(screen.getByRole('textbox', { name: 'Ritomschrijving' }))
    await user.keyboard('{Enter}')
    expect(day('maandag 19 oktober').queryByText('Zwolle v.v.')).toBeNull()
    expect(pencil('maandag 19 oktober')).not.toHaveClass('filled')
    expect(JSON.parse(localStorage.getItem(TRIPS_KEY)!)).toEqual({})
  })

  it('noemt alle drie de reisvormen in de titel', async () => {
    store({ '2026-10-19': ['trein', 'fiets', 'auto'] })
    const user = userEvent.setup()
    render(<App />)
    await user.click(pencil('maandag 19 oktober')!)
    expect(screen.getByRole('dialog', { name: 'Rit ma 19 okt · Trein, Fiets en Auto' })).toBeInTheDocument()
  })
})

describe('AC61: ritomschrijving en vervoervormen', () => {
  it('verbergt de omschrijving zonder reisvorm en toont hem daarna weer', async () => {
    store({ '2026-10-19': ['auto'] }, { '2026-10-19': 'Kampen' })
    const user = userEvent.setup()
    render(<App />)
    expect(day('maandag 19 oktober').getByText('Kampen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(within(screen.getByRole('group', { name: 'Vervoervormen' })).getByRole('button', { name: 'Auto' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(day('maandag 19 oktober').queryByText('Kampen')).toBeNull()
    expect(pencil('maandag 19 oktober')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(within(screen.getByRole('group', { name: 'Vervoervormen' })).getByRole('button', { name: 'Auto' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(day('maandag 19 oktober').getByText('Kampen')).toBeInTheDocument()

    await user.click(day('maandag 19 oktober').getByRole('button', { name: 'Thuis' }))
    expect(day('maandag 19 oktober').queryByText('Kampen')).toBeNull()
    expect(pencil('maandag 19 oktober')).toBeNull()
    await user.click(day('maandag 19 oktober').getByRole('button', { name: 'Fiets' }))
    expect(day('maandag 19 oktober').getByText('Kampen')).toBeInTheDocument()
  })
})

describe('AC62: ritten in de overzichten', () => {
  it('toont het overzicht kilometervergoeding als lijst per maand met omschrijvingen', async () => {
    store(
      { '2026-08-11': ['auto'], '2026-08-20': ['auto'], '2026-10-01': ['trein', 'auto'], '2026-10-02': ['thuis'] },
      { '2026-08-11': 'Amersfoort – Lelystad', '2026-10-01': 'Kampen v.v.' },
    )
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Overzicht kilometervergoeding' }))

    const month = (name: string) => within(screen.getByRole('region', { name }))
    expect(month('juli').getByText('–')).toBeInTheDocument()
    expect(month('augustus').getByText('2 dagen')).toBeInTheDocument()
    expect(month('augustus').getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'di 11Amersfoort – Lelystad',
      'do 20',
    ])
    expect(month('september').getByText('–')).toBeInTheDocument()
    expect(month('oktober').getByText('1 dag')).toBeInTheDocument()
    expect(month('oktober').getByText('Kampen v.v.')).toBeInTheDocument()

    // Dezelfde dag met dezelfde omschrijving in het overzicht treinvergoeding.
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht treinvergoeding' }))
    expect(month('oktober').getByText('Kampen v.v.')).toBeInTheDocument()

    // Thuiswerkvergoeding houdt de kolommen, zonder aantallen.
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Overzicht thuiswerkvergoeding' }))
    expect(month('oktober').getByText('vr 2')).toBeInTheDocument()
    expect(screen.queryByText('1 dag')).toBeNull()
  })
})

describe('AC63: ritomschrijvingen in de backup', () => {
  it('neemt de omschrijvingen mee en zet ze terug bij inlezen', async () => {
    const text = createBackup({ '2026-10-19': ['fiets'] }, {}, { uren: {}, rubrieken: [] }, { '2026-10-19': 'Station' }, new Date())
    expect(JSON.parse(text)).toMatchObject({ versie: 2, ritten: { '2026-10-19': 'Station' } })
    store({ '2026-10-20': ['auto'] }, { '2026-10-20': 'Oud' })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    fireEvent.change(screen.getByLabelText('Backupbestand'), {
      target: { files: [new File([text], 'backup.json', { type: 'application/json' })] },
    })
    await user.click(within(await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })).getByRole('button', { name: 'Inlezen' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(day('maandag 19 oktober').getByText('Station')).toBeInTheDocument()
    expect(screen.queryByText('Oud')).toBeNull()
  })

  it('laat de huidige omschrijvingen staan bij een backup zonder ritten', async () => {
    const old = JSON.stringify({ app: 'woon-werkvervoer', versie: 2, gemaakt: new Date().toISOString(), registraties: { '2026-10-20': ['auto'] } })
    expect(parseBackup(old).ritten).toBeNull()
    store({}, { '2026-10-20': 'Blijft' })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    fireEvent.change(screen.getByLabelText('Backupbestand'), {
      target: { files: [new File([old], 'oud.json', { type: 'application/json' })] },
    })
    await user.click(within(await screen.findByRole('alertdialog', { name: 'Backup inlezen?' })).getByRole('button', { name: 'Inlezen' }))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(day('dinsdag 20 oktober').getByText('Blijft')).toBeInTheDocument()
  })
})
