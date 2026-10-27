import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'

// Een opgeslagen backupmap leeft in de tests in het geheugen in plaats van IndexedDB.
const folderMemory = vi.hoisted(() => ({ handle: null as unknown }))
vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => folderMemory.handle,
  storeFolder: async (handle: unknown) => {
    folderMemory.handle = handle
  },
}))

/** Een nagebootste map op de telefoon die bijhoudt welke bestanden erin worden geschreven. */
function fakeFolder(name: string) {
  const files: Record<string, string> = {}
  return {
    files,
    handle: {
      name,
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getFileHandle: async (fileName: string) => ({
        createWritable: async () => ({
          write: async (text: string) => {
            files[fileName] = text
          },
          close: async () => {},
        }),
      }),
    },
  }
}

const win = window as unknown as { showDirectoryPicker?: unknown }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 20, 9, 0))
  folderMemory.handle = null
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  delete win.showDirectoryPicker
})

function chosenModes(dayName: string) {
  return within(screen.getByRole('listitem', { name: dayName }))
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => b.textContent)
}

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
}

function backupFile(content: unknown, name = 'woon-werkvervoer-backup-2026-10-01.json') {
  const text = typeof content === 'string' ? content : JSON.stringify(content)
  return new File([text], name, { type: 'application/json' })
}

const validBackup = {
  app: 'woon-werkvervoer',
  versie: 1,
  gemaakt: '2026-10-01T08:00:00.000Z',
  registraties: { '2026-10-19': 'auto', '2026-10-21': 'vrij' },
}

describe('AC40: versienummer onderaan de instellingen', () => {
  it('toont de versie van de app in kleine tekst', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    const version = screen.getByText('Versie: 1.13.0')
    expect(version).toHaveClass('version')
    expect(version.closest('main')?.lastElementChild).toBe(version)
  })
})

describe('AC13: instellingen openen en sluiten', () => {
  it('opent de instellingen en gaat met Terug naar dezelfde week', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Volgende week' }))
    await openSettings(user)
    expect(screen.getByRole('heading', { name: 'Instellingen en backup' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('maandag 26 oktober')
  })
})

describe('AC14: backupmap kiezen', () => {
  it('toont de gekozen map, ook na opnieuw openen', async () => {
    const folder = fakeFolder('Woon-werkvervoer')
    win.showDirectoryPicker = vi.fn(async () => folder.handle)
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await openSettings(user)
    expect(screen.getByTestId('backupmap')).toHaveTextContent('Nog geen map gekozen')
    await user.click(screen.getByRole('button', { name: 'Map kiezen' }))
    expect(screen.getByTestId('backupmap')).toHaveTextContent('Map: Woon-werkvervoer')
    unmount()

    render(<App />)
    await openSettings(user)
    await waitFor(() => expect(screen.getByTestId('backupmap')).toHaveTextContent('Map: Woon-werkvervoer'))
  })
})

describe('AC15: backup maken', () => {
  it('schrijft een backup met alle ingevulde dagen in de gekozen map', async () => {
    const folder = fakeFolder('Woon-werkvervoer')
    folderMemory.handle = folder.handle
    win.showDirectoryPicker = vi.fn()
    const user = userEvent.setup()
    render(<App />)
    await user.click(within(screen.getByRole('listitem', { name: 'maandag 19 oktober' })).getByRole('button', { name: 'Trein' }))
    await user.click(within(screen.getByRole('listitem', { name: 'dinsdag 20 oktober' })).getByRole('button', { name: 'Fiets' }))
    await openSettings(user)
    await waitFor(() => expect(screen.getByTestId('backupmap')).toHaveTextContent('Woon-werkvervoer'))
    await user.click(screen.getByRole('button', { name: 'Backup maken' }))

    const written = folder.files['2026-10-20-woonwerk.json']
    expect(JSON.parse(written)).toMatchObject({
      app: 'woon-werkvervoer',
      versie: 2,
      registraties: { '2026-10-19': ['trein'], '2026-10-20': ['fiets'] },
    })
    expect(screen.getByRole('status')).toHaveTextContent('opgeslagen als 2026-10-20-woonwerk.json in de map "Woon-werkvervoer"')
  })

  it('downloadt de backup als er geen map is gekozen', async () => {
    const blobs: Blob[] = []
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobs.push(blob as Blob)
      return 'blob:backup'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clicked: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this.download)
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-19': 'thuis' }))
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.click(screen.getByRole('button', { name: 'Backup maken' }))

    expect(clicked).toEqual(['2026-10-20-woonwerk.json'])
    expect(JSON.parse(await blobs[0].text()).registraties).toEqual({ '2026-10-19': ['thuis'] })
    expect(screen.getByRole('status')).toHaveTextContent('in Downloads')
  })
})

describe('AC16: backup inlezen', () => {
  it('vervangt alle keuzes door die uit de backup', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': 'fiets' }))
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile(validBackup))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen: 2 dagen'))

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(chosenModes('maandag 19 oktober')).toEqual(['Auto'])
    expect(chosenModes('dinsdag 20 oktober')).toEqual([])
    expect(chosenModes('woensdag 21 oktober')).toEqual(['Vrij'])
  })

  it('leest backups met de oude en de nieuwe bestandsnaam', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    for (const name of ['woon-werkvervoer-backup-2026-10-01.json', '2026-10-01-woonwerk.json']) {
      await user.upload(screen.getByLabelText('Backupbestand'), backupFile(validBackup, name))
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen: 2 dagen'))
    }
  })

  it('leest ook een nieuwe backup met meerdere keuzes per dag', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.upload(
      screen.getByLabelText('Backupbestand'),
      backupFile({ ...validBackup, versie: 2, registraties: { '2026-10-19': ['fiets', 'trein'], '2026-10-20': ['thuis'] } }),
    )
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Backup ingelezen: 2 dagen'))

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(chosenModes('maandag 19 oktober')).toEqual(['Trein', 'Fiets'])
    expect(chosenModes('dinsdag 20 oktober')).toEqual(['Thuis'])
  })

  it('weigert een ongeldig bestand en laat de keuzes ongemoeid', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': 'fiets' }))
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile('{"iets": "anders"}', 'boodschappen.json'))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('geen backup van WoonWerk'))
    expect(confirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(chosenModes('dinsdag 20 oktober')).toEqual(['Fiets'])
  })

  it('verandert niets als ik de bevestiging annuleer', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': 'fiets' }))
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)
    await user.upload(screen.getByLabelText('Backupbestand'), backupFile(validBackup))
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(chosenModes('dinsdag 20 oktober')).toEqual(['Fiets'])
    expect(chosenModes('maandag 19 oktober')).toEqual([])
  })
})
