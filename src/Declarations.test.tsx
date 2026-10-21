import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { DECLARED_KEY } from './declared'
import { ENABLED_KEY } from './storage'

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
  vi.restoreAllMocks()
})

function dateInputs() {
  return screen.getAllByLabelText('Gedeclareerd tot en met:') as HTMLInputElement[]
}

function sectionNames() {
  return screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
}

describe('AC36: declaraties bijhouden', () => {
  it('opent met de euroknop links van de i-knop een scherm met Thuis, Trein en Auto, standaard op vandaag', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Declaraties' })).toBeInTheDocument()
    expect(sectionNames()).toEqual(['Thuis', 'Trein', 'Auto'])
    expect(dateInputs().map((i) => i.type)).toEqual(['date', 'date', 'date'])
    expect(dateInputs().map((i) => i.value)).toEqual(['2026-10-20', '2026-10-20', '2026-10-20'])
    expect(screen.queryByRole('navigation', { name: 'Overzichten' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 26 oktober')
  })

  it('onthoudt een gekozen datum, ook na opnieuw openen; een gewiste datum staat weer op vandaag', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    fireEvent.change(dateInputs()[1], { target: { value: '2026-09-30' } })
    expect(dateInputs().map((i) => i.value)).toEqual(['2026-10-20', '2026-09-30', '2026-10-20'])
    unmount()

    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    expect(dateInputs().map((i) => i.value)).toEqual(['2026-10-20', '2026-09-30', '2026-10-20'])

    fireEvent.change(dateInputs()[1], { target: { value: '' } })
    expect(dateInputs()[1].value).toBe('2026-10-20')
    expect(JSON.parse(localStorage.getItem(DECLARED_KEY)!)).toEqual({})
  })

  it('toont alleen de vormen die aan staan', async () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(['thuis', 'fiets', 'auto', 'vrij']))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    expect(sectionNames()).toEqual(['Thuis', 'Auto'])

  })

  it('toont alleen Thuis als Trein en Auto uit staan', async () => {
    localStorage.setItem(ENABLED_KEY, JSON.stringify(['thuis', 'fiets']))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    expect(sectionNames()).toEqual(['Thuis'])
  })
})

describe('AC37: declaratiedatums in de backup', () => {
  it('neemt de datums mee in de backup en zet ze terug bij inlezen', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-09-30', auto: '2026-10-02' }))
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:backup'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    await user.click(screen.getByRole('button', { name: 'Backup maken' }))
    const backup = JSON.parse(await blobs[0].text())
    expect(backup.gedeclareerd).toEqual({ thuis: '2026-09-30', auto: '2026-10-02' })

    const file = new File([JSON.stringify({ ...backup, gedeclareerd: { trein: '2026-08-31' } })], 'b.json')
    await user.upload(screen.getByLabelText('Backupbestand'), file)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    expect(dateInputs().map((i) => i.value)).toEqual(['2026-10-20', '2026-08-31', '2026-10-20'])
  })

  it('laat de datums staan bij een backup van een oudere versie zonder datums', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-09-30' }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const old = { app: 'woon-werkvervoer', versie: 2, gemaakt: '2026-10-01T08:00:00.000Z', registraties: {} }
    await user.upload(screen.getByLabelText('Backupbestand'), new File([JSON.stringify(old)], 'b.json'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen'))
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    await user.click(screen.getByRole('button', { name: 'Declaraties' }))
    expect(within(screen.getByRole('main')).getAllByLabelText('Gedeclareerd tot en met:')[0]).toHaveValue('2026-09-30')
  })
})
