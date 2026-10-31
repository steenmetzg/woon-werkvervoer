import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { mondayOf } from './dates'
import { parseVoiceCommand } from './speech'
import { MODES, STORAGE_KEY } from './storage'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Vandaag" is in deze tests woensdag 21 oktober 2026.
const TODAY = new Date(2026, 9, 21, 9, 0)

// Nagemaakte spraakherkenning van Chrome: de test bepaalt wat er "gehoord" wordt.
class FakeRecognition {
  static last: FakeRecognition | null = null
  lang = ''
  interimResults = true
  maxAlternatives = 1
  continuous = true
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  onend: (() => void) | null = null
  started = false
  start() {
    this.started = true
    FakeRecognition.last = this
  }
  abort() {
    this.onerror?.({ error: 'aborted' })
    this.onend?.()
  }
  hear(...alternatives: string[]) {
    act(() => {
      this.onresult?.({ results: [alternatives.map((transcript) => ({ transcript }))] })
      this.onend?.()
    })
  }
  fail(error: string) {
    act(() => {
      this.onerror?.({ error })
      this.onend?.()
    })
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
  FakeRecognition.last = null
  ;(window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = FakeRecognition
})

afterEach(() => {
  vi.useRealTimers()
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
})

function parse(text: string) {
  return parseVoiceCommand(text, TODAY, mondayOf(TODAY), MODES)
}

function day(label: RegExp) {
  return screen.getByRole('listitem', { name: label })
}

function pressed(label: RegExp) {
  return within(day(label))
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => b.textContent)
}

async function speak(...alternatives: string[]) {
  await userEvent.click(screen.getByRole('button', { name: 'Inspreken' }))
  FakeRecognition.last!.hear(...alternatives)
}

describe('AC46: zinnen begrijpen', () => {
  it('herkent keuze en datum', () => {
    expect(parse('fiets op 1 oktober')).toEqual({ ok: true, modes: ['fiets'], date: new Date(2026, 9, 1) })
    expect(parse('Trein op 1e oktober.')).toEqual({ ok: true, modes: ['trein'], date: new Date(2026, 9, 1) })
    expect(parse('eerste oktober thuis')).toEqual({ ok: true, modes: ['thuis'], date: new Date(2026, 9, 1) })
    expect(parse('auto 2 oktober 2025')).toEqual({ ok: true, modes: ['auto'], date: new Date(2025, 9, 2) })
    expect(parse('thuis 5/10')).toEqual({ ok: true, modes: ['thuis'], date: new Date(2026, 9, 5) })
  })

  it('kent vandaag, gisteren, eergisteren, morgen en zonder datum vandaag', () => {
    expect(parse('vandaag thuis')).toMatchObject({ date: new Date(2026, 9, 21) })
    expect(parse('gisteren met de trein')).toMatchObject({ date: new Date(2026, 9, 20) })
    expect(parse('eergisteren gefietst')).toMatchObject({ modes: ['fiets'], date: new Date(2026, 9, 19) })
    expect(parse('morgen auto')).toMatchObject({ date: new Date(2026, 9, 22) })
    expect(parse('thuisgewerkt')).toMatchObject({ modes: ['thuis'], date: new Date(2026, 9, 21) })
  })

  it('kent weekdagen in de getoonde week, en vorige of volgende week', () => {
    expect(parse('maandag fiets')).toMatchObject({ date: new Date(2026, 9, 19) })
    expect(parse('vrijdag trein')).toEqual({ ok: true, modes: ['trein'], date: new Date(2026, 9, 23) })
    expect(parse('vorige week dinsdag auto')).toMatchObject({ date: new Date(2026, 9, 13) })
    expect(parse('volgende week maandag vrij')).toMatchObject({ modes: ['vrij'], date: new Date(2026, 9, 26) })
  })

  it('verwart vrijdag niet met Vrij, en kent vrije dag en vakantie', () => {
    expect(parse('vrijdag')).toMatchObject({ ok: false })
    expect(parse('vrijdag vrije dag')).toMatchObject({ modes: ['vrij'], date: new Date(2026, 9, 23) })
    expect(parse('vakantie op 30 oktober')).toMatchObject({ modes: ['vrij'] })
  })

  it('combineert Trein, Fiets en Auto in de vaste volgorde', () => {
    expect(parse('fiets en trein gisteren')).toMatchObject({ modes: ['trein', 'fiets'] })
  })

  it('kiest het jaar dat het dichtst bij vandaag ligt', () => {
    const january = new Date(2027, 0, 5)
    expect(parseVoiceCommand('thuis 21 december', january, mondayOf(january), MODES)).toMatchObject({
      date: new Date(2026, 11, 21),
    })
  })

  it('geeft een duidelijke melding als het niet klopt', () => {
    expect(parse('hallo')).toEqual({ ok: false, error: 'Ik hoorde "hallo", maar geen Thuis, Trein, Fiets, Auto of Vrij.' })
    expect(parse('thuis zaterdag')).toEqual({ ok: false, error: 'Zaterdag 24 oktober is geen werkdag.' })
    expect(parse('thuis 31 februari')).toMatchObject({ ok: false, error: expect.stringContaining('bestaat niet') })
    expect(parse('thuis en fiets')).toMatchObject({ ok: false, error: expect.stringContaining('niet samen') })
    expect(parseVoiceCommand('auto vandaag', TODAY, mondayOf(TODAY), ['thuis', 'fiets'])).toEqual({
      ok: false,
      error: 'Auto staat uit in de instellingen.',
    })
  })
})

describe('AC47: inspreken met de microfoonknop', () => {
  it('legt de dag vast, toont een bevestiging en gaat naar die week', async () => {
    render(<App />)
    await speak('fiets op 1 oktober')
    const recognition = FakeRecognition.last!
    expect(recognition.lang).toBe('nl-NL')
    expect(screen.getByRole('status')).toHaveTextContent('Fiets vastgelegd op donderdag 1 oktober.')
    expect(pressed(/^donderdag 1 oktober$/)).toEqual(['Fiets'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ '2026-10-01': ['fiets'] })
  })

  it('vervangt wat er al stond, en de eerste zin die klopt telt', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': ['thuis'] }))
    render(<App />)
    await speak('wiet gisteren', 'fiets en trein gisteren')
    expect(pressed(/^dinsdag 20 oktober$/)).toEqual(['Trein', 'Fiets'])
    expect(screen.getByRole('status')).toHaveTextContent('Trein en Fiets vastgelegd op dinsdag 20 oktober.')
  })

  it('toont een melding als het niet lukt en verandert niets', async () => {
    render(<App />)
    await speak('hallo daar')
    expect(screen.getByRole('status')).toHaveTextContent('Ik hoorde "hallo daar"')
    expect(screen.queryByRole('button', { name: 'Ongedaan maken' })).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{}')

    await userEvent.click(screen.getByRole('button', { name: 'Inspreken' }))
    FakeRecognition.last!.fail('network')
    expect(screen.getByRole('status')).toHaveTextContent('Spraakherkenning werkt alleen met internet.')
  })

  it('laat zien dat hij luistert en stopt bij nog een tik', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Inspreken' }))
    expect(screen.getByText('Luisteren…')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Stoppen met luisteren' }))
    expect(screen.queryByText('Luisteren…')).toBeNull()
    expect(screen.getByRole('button', { name: 'Inspreken' })).toBeInTheDocument()
  })
})

describe('AC48: ongedaan maken', () => {
  it('zet de dag terug zoals hij was', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-20': ['thuis'] }))
    render(<App />)
    await speak('gisteren auto')
    expect(pressed(/^dinsdag 20 oktober$/)).toEqual(['Auto'])
    await userEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(pressed(/^dinsdag 20 oktober$/)).toEqual(['Thuis'])
    expect(screen.queryByRole('status')).toBeNull()

    await speak('vandaag trein')
    await userEvent.click(screen.getByRole('button', { name: 'Ongedaan maken' }))
    expect(pressed(/^woensdag 21 oktober$/)).toEqual([])
  })
})

describe('AC50: met spraak naar een week gaan', () => {
  it('begrijpt ga naar, toon de week van en laat zien', () => {
    const monday = new Date(2026, 8, 28)
    expect(parse('ga naar 1 oktober')).toEqual({ ok: true, goto: monday })
    expect(parse('Toon de week van 1 oktober')).toEqual({ ok: true, goto: monday })
    expect(parse('laat 1 oktober zien')).toEqual({ ok: true, goto: monday })
    expect(parse('ga naar zaterdag 3 oktober')).toEqual({ ok: true, goto: monday })
    expect(parse('ga naar vorige week')).toEqual({ ok: true, goto: new Date(2026, 9, 12) })
    expect(parse('toon volgende week')).toEqual({ ok: true, goto: new Date(2026, 9, 26) })
    expect(parse('ga naar deze week')).toEqual({ ok: true, goto: new Date(2026, 9, 19) })
    expect(parse('ga naar 31 februari')).toMatchObject({ ok: false, error: expect.stringContaining('bestaat niet') })
    // Met een keuze erbij wordt het gewoon ingevuld.
    expect(parse('fiets naar 1 oktober')).toMatchObject({ ok: true, modes: ['fiets'] })
  })

  it('springt naar die week en verandert niets', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ '2026-10-01': ['trein'] }))
    render(<App />)
    await speak('ga naar 1 oktober')
    expect(screen.getByRole('status')).toHaveTextContent('Week van 28 sep – 2 okt.')
    expect(screen.queryByRole('button', { name: 'Ongedaan maken' })).toBeNull()
    expect(pressed(/^donderdag 1 oktober$/)).toEqual(['Trein'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ '2026-10-01': ['trein'] })
  })
})

describe('AC51: melding verdwijnt vanzelf', () => {
  it('sluit na 6 seconden, met en zonder Ongedaan maken', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(TODAY)
    render(<App />)
    for (const zin of ['gisteren auto', 'ga naar 1 oktober', 'hallo']) {
      fireEvent.click(screen.getByRole('button', { name: 'Inspreken' }))
      FakeRecognition.last!.hear(zin)
      expect(screen.getByRole('status')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(5900))
      expect(screen.getByRole('status')).toBeInTheDocument()
      act(() => vi.advanceTimersByTime(200))
      expect(screen.queryByRole('status')).toBeNull()
    }
  })
})

describe('AC49: microfoonknop aan en uit', () => {
  it('kan uit in de instellingen en blijft dan uit', async () => {
    const { unmount } = render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    const toggle = within(screen.getByRole('group', { name: 'Spraak' })).getByRole('button', { name: 'Microfoon' })
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Terug' }))
    expect(screen.queryByRole('button', { name: 'Inspreken' })).toBeNull()
    unmount()
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Inspreken' })).toBeNull()
  })

  it('is er niet als de browser geen spraak herkent', async () => {
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Inspreken' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
    expect(screen.queryByRole('group', { name: 'Spraak' })).toBeNull()
  })
})
