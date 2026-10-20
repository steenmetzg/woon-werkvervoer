import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { INSTALL_LATER_KEY } from './installPrompt'

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
  // Ruim een opgevangen signaal op, zodat elke test schoon begint.
  window.dispatchEvent(new Event('appinstalled'))
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

/** Doet na wat Chrome doet als de app installeerbaar is. */
function chromeOffersInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => {}),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function installQuestion() {
  return screen.queryByRole('region', { name: 'App installeren' })
}

describe('AC25: vraag alleen als Chrome de app installeerbaar vindt', () => {
  it('toont geen vraag zonder melding van Chrome', () => {
    render(<App />)
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('toont de vraag met Installeren en Niet nu als Chrome de app installeerbaar vindt', () => {
    render(<App />)
    const event = chromeOffersInstall()
    expect(event.defaultPrevented).toBe(true)
    expect(installQuestion()).toHaveTextContent('WoonWerk als app installeren?')
    expect(screen.getByRole('button', { name: 'Installeren' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Niet nu' })).toBeInTheDocument()
  })

  it('toont ook de vraag als Chrome zich al meldde voordat het scherm klaar was', () => {
    chromeOffersInstall()
    render(<App />)
    expect(installQuestion()).toBeInTheDocument()
  })

  it('toont geen vraag in de geïnstalleerde app', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(display-mode: standalone)' }))
    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('toont de vraag niet in de instellingen', async () => {
    const user = userEvent.setup()
    render(<App />)
    chromeOffersInstall()
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(installQuestion()).not.toBeInTheDocument()
  })
})

describe('AC26: installeren', () => {
  it('opent het installatievenster van Chrome en de vraag is daarna weg', async () => {
    const user = userEvent.setup()
    render(<App />)
    const event = chromeOffersInstall('accepted')
    await user.click(screen.getByRole('button', { name: 'Installeren' }))
    expect(event.prompt).toHaveBeenCalledOnce()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(installQuestion()).not.toBeInTheDocument()
    expect(localStorage.getItem(INSTALL_LATER_KEY)).toBeNull()
  })
})

describe('AC27: Niet nu', () => {
  it('verbergt de vraag, ook na opnieuw openen', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    chromeOffersInstall()
    await user.click(screen.getByRole('button', { name: 'Niet nu' }))
    expect(installQuestion()).not.toBeInTheDocument()
    unmount()

    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).not.toBeInTheDocument()
    unmount()
  })

  it('vraagt na 30 dagen opnieuw', () => {
    localStorage.setItem(INSTALL_LATER_KEY, String(new Date(2026, 8, 20, 8, 0).getTime()))
    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).toBeInTheDocument()
  })

  it('vraagt binnen 30 dagen niet opnieuw', () => {
    localStorage.setItem(INSTALL_LATER_KEY, String(new Date(2026, 8, 21, 10, 0).getTime()))
    render(<App />)
    chromeOffersInstall()
    expect(installQuestion()).not.toBeInTheDocument()
  })

  it('telt het sluiten van het venster van Chrome als Niet nu', async () => {
    const user = userEvent.setup()
    render(<App />)
    chromeOffersInstall('dismissed')
    await user.click(screen.getByRole('button', { name: 'Installeren' }))
    expect(installQuestion()).not.toBeInTheDocument()
    expect(localStorage.getItem(INSTALL_LATER_KEY)).not.toBeNull()
  })
})

describe('AC28: vraag weer tonen vanuit de instellingen', () => {
  it('toont na "Niet nu" in de instellingen een knop die de vraag terugbrengt', async () => {
    const user = userEvent.setup()
    render(<App />)
    chromeOffersInstall()
    await user.click(screen.getByRole('button', { name: 'Niet nu' }))
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.getByText(/komt terug op 19 november/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Vraag weer tonen' }))
    expect(localStorage.getItem(INSTALL_LATER_KEY)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Vraag weer tonen' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(installQuestion()).toBeInTheDocument()
  })

  it('toont het onderdeel niet als je geen "Niet nu" koos', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.queryByRole('heading', { name: 'App installeren' })).not.toBeInTheDocument()
  })

  it('toont het onderdeel niet in de geïnstalleerde app', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(display-mode: standalone)' }))
    localStorage.setItem(INSTALL_LATER_KEY, String(new Date(2026, 9, 19).getTime()))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.queryByRole('heading', { name: 'App installeren' })).not.toBeInTheDocument()
  })
})
