import { afterEach, describe, expect, it, vi } from 'vitest'
import html from '../index.html?raw'
import { fitInstalledAppToSystemBars } from './viewport'

const BROWSER_VIEWPORT = 'width=device-width, initial-scale=1.0'

function setUp(installed: boolean) {
  document.head.innerHTML = `<meta name="viewport" content="${BROWSER_VIEWPORT}" />`
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: installed && query === '(display-mode: standalone)',
  }))
}

function viewport() {
  return document.querySelector('meta[name="viewport"]')?.getAttribute('content')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AC39: de app blijft boven de knoppenbalk van Android', () => {
  it('in de browser vraagt de app niet om onder de systeembalken door te tekenen', () => {
    expect(html).toContain(`<meta name="viewport" content="${BROWSER_VIEWPORT}" />`)
    setUp(false)
    fitInstalledAppToSystemBars()
    expect(viewport()).toBe(BROWSER_VIEWPORT)
  })

  it('in de geïnstalleerde app vraagt de app de hoogte van de systeembalken op', () => {
    setUp(true)
    fitInstalledAppToSystemBars()
    fitInstalledAppToSystemBars()
    expect(viewport()).toBe(`${BROWSER_VIEWPORT}, viewport-fit=cover`)
  })
})
