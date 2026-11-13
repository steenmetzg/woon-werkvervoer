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
  vi.restoreAllMocks()
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
    expect(screen.getByRole('status')).toHaveTextContent(
      'De vraag om de app op je telefoon te installeren staat onderaan in het startscherm als de app geïnstalleerd kan worden.',
    )
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

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

describe('AC73: vraag om te installeren op een iPhone of iPad', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE)
  })

  it('toont de vraag zonder melding van Chrome, met Niet nu en Hoe?', () => {
    render(<App />)
    expect(installQuestion()).toHaveTextContent('WoonWerk als app installeren?')
    expect(screen.getByRole('button', { name: 'Hoe?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Niet nu' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Installeren' })).not.toBeInTheDocument()
  })

  it('legt bij Hoe? uit hoe je de app op het beginscherm zet; Oké sluit de vraag voor 30 dagen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Hoe?' }))
    expect(installQuestion()).toHaveTextContent('Tik op de Deel-knop')
    expect(installQuestion()).toHaveTextContent('Zet op beginscherm')
    await user.click(screen.getByRole('button', { name: 'Oké' }))
    expect(installQuestion()).not.toBeInTheDocument()
    expect(localStorage.getItem(INSTALL_LATER_KEY)).not.toBeNull()
  })

  it('vraagt na "Niet nu" pas na 30 dagen opnieuw', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Niet nu' }))
    expect(installQuestion()).not.toBeInTheDocument()
    unmount()
    vi.setSystemTime(new Date(2026, 10, 20, 9, 1))
    render(<App />)
    expect(installQuestion()).toBeInTheDocument()
  })

  it('toont geen vraag in de app op het beginscherm', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(display-mode: standalone)' }))
    render(<App />)
    expect(installQuestion()).not.toBeInTheDocument()
  })
})
