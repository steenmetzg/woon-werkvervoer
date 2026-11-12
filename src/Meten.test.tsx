import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { countUrl, setMetenVoorTest, startMeten, tel } from './meten'

const ECHT = { hostname: 'steenmetzg.github.io', pathname: '/woon-werkvervoer/' }

function tellingen(send: ReturnType<typeof vi.fn>) {
  return send.mock.calls.map(([url]) => new URL(url as string).searchParams.get('p'))
}

afterEach(() => {
  setMetenVoorTest(null, null)
  vi.restoreAllMocks()
})

describe('AC68 (F39): tellen bij starten en bij elk overzicht', () => {
  it('telt één start en één keer per geopend overzicht, met alleen de naam van de telling', async () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    const user = userEvent.setup()
    startMeten()
    render(<App />)
    expect(tellingen(send)).toEqual(['start-browser'])

    const knoppen = [
      'Overzicht thuiswerkvergoeding',
      'Overzicht treinvergoeding',
      'Overzicht fietsdagen',
      'Overzicht kilometervergoeding',
      'Overzicht vrije dagen',
      'Overzicht uren',
    ]
    for (const naam of knoppen) {
      await user.click(screen.getByRole('button', { name: naam }))
      await user.click(screen.getByRole('button', { name: 'Terug' }))
    }
    expect(tellingen(send)).toEqual([
      'start-browser',
      'overzicht-thuis',
      'overzicht-trein',
      'overzicht-fiets',
      'overzicht-auto',
      'overzicht-vrij',
      'overzicht-uren',
    ])
  })

  it('stuurt alleen naam, titel, gebeurtenis en een willekeurig getal naar GoatCounter', () => {
    const url = new URL(countUrl('overzicht-fiets', 'abc'))
    expect(url.origin + url.pathname).toBe('https://steenmetzg.goatcounter.com/count')
    expect([...url.searchParams.entries()]).toEqual([
      ['p', 'overzicht-fiets'],
      ['t', 'Overzicht Fiets'],
      ['e', 'true'],
      ['rnd', 'abc'],
    ])
  })

  it('telt een installatie', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    startMeten()
    window.dispatchEvent(new Event('appinstalled'))
    expect(tellingen(send)).toContain('installatie')
  })
})

describe('AC69 (F39): zonder internet of bij een fout gebeurt er niets', () => {
  it('telt niet zonder internet, ook niet later', () => {
    const send = vi.fn()
    setMetenVoorTest(ECHT, send)
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    tel('overzicht-auto')
    online.mockReturnValue(true)
    expect(send).not.toHaveBeenCalled()
  })

  it('geeft geen foutmelding als versturen mislukt', () => {
    setMetenVoorTest(ECHT, () => {
      throw new Error('geen verbinding')
    })
    expect(() => tel('start-browser')).not.toThrow()
  })
})

describe('AC70 (F39): de testversie en de tests tellen niet', () => {
  it('telt niet in de submap test/', () => {
    const send = vi.fn()
    setMetenVoorTest({ hostname: 'steenmetzg.github.io', pathname: '/woon-werkvervoer/test/' }, send)
    tel('start-browser')
    expect(send).not.toHaveBeenCalled()
  })

  it('telt niet in de tests zelf (localhost)', () => {
    const send = vi.fn(() => true)
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { sendBeacon: send }))
    tel('start-browser')
    vi.unstubAllGlobals()
    expect(send).not.toHaveBeenCalled()
  })
})

describe('AC71 (F40): de informatiepagina vertelt het, uitzetten kan niet', () => {
  it('noemt het anoniem tellen bij Je gegevens en backups', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Informatie' }))
    const sectie = screen.getByRole('heading', { name: 'Je gegevens en backups' }).parentElement!
    expect(sectie).toHaveTextContent(
      'De app telt anoniem hoe vaak hij wordt geopend en welke overzichten worden bekeken; wat je invult, wordt nooit verstuurd.',
    )
  })

  it('heeft geen knop om het tellen uit te zetten', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.queryByRole('button', { name: /meten/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/gebruik meten/i)).not.toBeInTheDocument()
  })
})
