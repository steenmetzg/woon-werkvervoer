import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { DECLARED_KEY } from './declared'
import { dueReminders, reminderFrom } from './reminders'

vi.mock('./folderStore', () => ({
  loadStoredFolder: async () => null,
  storeFolder: async () => {},
}))

// "Vandaag" is in deze tests woensdag 21 oktober 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 9, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

const ALL_MODES = ['thuis', 'trein', 'fiets', 'auto', 'vrij'] as const

function reminderButtons() {
  return screen.queryAllByRole('button', { name: /^Tip: Declareer tijdig/ })
}

function reminder(name: string) {
  return screen.getByRole('button', { name: new RegExp(`^Tip: Declareer tijdig je ${name}\\.`) })
}

function settingButton(mode: string) {
  return within(screen.getByRole('group', { name: 'Vervoervormen' })).getByRole('button', { name: mode })
}

describe('AC42: herinnering om te declareren', () => {
  it('rekent 3 maanden min 7 dagen na de laatst gedeclareerde dag', () => {
    expect(reminderFrom(new Date(2026, 6, 28))).toEqual(new Date(2026, 9, 21))
    // 30 november + 3 maanden = 28 februari (de laatste dag van februari), min 7 dagen = 21 februari.
    expect(reminderFrom(new Date(2026, 10, 30))).toEqual(new Date(2027, 1, 21))
  })

  it('toont de herinnering voor Thuis op de dag zelf, met de datum voluit', () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-07-28' }))
    render(<App />)
    expect(reminderButtons()).toHaveLength(1)
    expect(reminder('thuiswerkvergoeding')).toHaveTextContent(
      'Tip: Declareer tijdig je thuiswerkvergoeding.Je hebt je thuiswerkvergoeding voor het laatst gedeclareerd op 28 juli 2026.',
    )
  })

  it('toont nog geen herinnering een dag eerder, en ook niet zonder datum', () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ thuis: '2026-07-29' }))
    const { unmount } = render(<App />)
    expect(reminderButtons()).toHaveLength(0)
    unmount()
    localStorage.removeItem(DECLARED_KEY)
    render(<App />)
    expect(reminderButtons()).toHaveLength(0)
  })

  it('toont Trein en Auto onder elkaar met hun eigen tekst', () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ auto: '2026-07-01', trein: '2026-07-01' }))
    render(<App />)
    expect(reminderButtons().map((b) => b.textContent)).toEqual([
      'Tip: Declareer tijdig je vergoeding treinreis.Je hebt je vergoeding treinreis voor het laatst gedeclareerd op 1 juli 2026.',
      'Tip: Declareer tijdig je kilometervergoeding.Je hebt je kilometervergoeding voor het laatst gedeclareerd op 1 juli 2026.',
    ])
  })

  it('opent het overzicht bij tikken en verdwijnt na leegmaken of een nieuwe datum', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ auto: '2026-07-01', thuis: '2026-07-01' }))
    const user = userEvent.setup()
    render(<App />)

    await user.click(reminder('kilometervergoeding'))
    expect(screen.getByRole('heading', { name: 'Overzicht kilometervergoeding' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Laatst gedeclareerde dag:'), { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(reminderButtons()).toHaveLength(1)

    await user.click(reminder('thuiswerkvergoeding'))
    expect(screen.getByRole('heading', { name: 'Overzicht thuiswerkvergoeding' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Laatst gedeclareerde dag:'), { target: { value: '2026-10-20' } })
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(reminderButtons()).toHaveLength(0)
  })

  it('verdwijnt als Auto uit staat en komt terug als Auto weer aan gaat', async () => {
    localStorage.setItem(DECLARED_KEY, JSON.stringify({ auto: '2026-07-01' }))
    const user = userEvent.setup()
    render(<App />)
    const toggleAuto = async () => {
      await user.click(screen.getByRole('button', { name: 'Instellingen en backup' }))
      await user.click(settingButton('Auto'))
      await user.click(screen.getByRole('button', { name: 'Terug' }))
    }

    await toggleAuto()
    expect(reminderButtons()).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(DECLARED_KEY)!)).toEqual({ auto: '2026-07-01' })
    await toggleAuto()
    expect(reminder('kilometervergoeding')).toBeInTheDocument()
  })

  it('geeft alleen herinneringen voor vormen die aan staan', () => {
    const declared = { thuis: '2026-07-01', trein: '2026-07-01', auto: '2026-07-01' }
    const today = new Date(2026, 9, 21)
    expect(dueReminders(declared, [...ALL_MODES], today).map((r) => r.mode)).toEqual(['thuis', 'trein', 'auto'])
    expect(dueReminders(declared, ['thuis', 'fiets'], today).map((r) => r.mode)).toEqual(['thuis'])
  })
})
