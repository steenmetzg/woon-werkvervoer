import { useEffect, useState } from 'react'
import { tel } from './meten'

/** Het browsersignaal dat Chrome stuurt als de app installeerbaar is en nog niet geïnstalleerd. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const INSTALL_LATER_KEY = 'installatievraag-later'
export const INSTALL_LATER_DAYS = 30

// Chrome kan het signaal sturen voordat het scherm klaar is: vang het daarom meteen op.
let pending: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Geen standaardmelding van Chrome: de app toont zijn eigen balk.
    e.preventDefault()
    pending = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    pending = null
    notify()
  })
}

export function isInstalledApp(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

/**
 * Of dit een iPhone of iPad is. Daar stuurt geen enkele browser het signaal van Chrome: je installeert zelf
 * via de Deel-knop en "Zet op beginscherm" (F18). Een iPad doet zich soms voor als Mac, maar heeft een touchscreen.
 */
export function isIos(): boolean {
  try {
    const nav = window.navigator
    return /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  } catch {
    return false
  }
}

/** Tot wanneer de vraag na "Niet nu" wegblijft; `null` als hij niet wegblijft. */
export function askAgainFrom(now: Date): Date | null {
  try {
    const raw = localStorage.getItem(INSTALL_LATER_KEY)
    if (!raw) return null
    const chosen = Number(raw)
    const until = new Date(chosen + INSTALL_LATER_DAYS * 24 * 60 * 60 * 1000)
    return chosen <= now.getTime() && now < until ? until : null
  } catch {
    return null
  }
}

function askedLaterRecently(now: Date): boolean {
  return askAgainFrom(now) !== null
}

/** Vergeet "Niet nu", zodat de vraag weer verschijnt zodra Chrome de app installeerbaar vindt. */
export function forgetLater() {
  try {
    localStorage.removeItem(INSTALL_LATER_KEY)
  } catch {
    // Opslag niet beschikbaar; dan was er ook niets onthouden.
  }
  notify()
}

function rememberLater(now: Date) {
  try {
    localStorage.setItem(INSTALL_LATER_KEY, String(now.getTime()))
  } catch {
    // Opslag niet beschikbaar; de vraag kan dan de volgende keer terugkomen.
  }
}

/** Of de installatievraag getoond moet worden, met de acties voor de twee knoppen. */
export function useInstallPrompt() {
  const [event, setEvent] = useState(() => pending)
  const [later, setLater] = useState(() => askedLaterRecently(new Date()))
  const [ios] = useState(isIos)

  useEffect(() => {
    const update = () => {
      setEvent(pending)
      setLater(askedLaterRecently(new Date()))
    }
    listeners.add(update)
    update()
    return () => {
      listeners.delete(update)
    }
  }, [])

  function notNow() {
    rememberLater(new Date())
    setLater(true)
  }

  async function install() {
    if (!event) return
    // Het venster van Chrome kan maar één keer per signaal worden geopend.
    pending = null
    setEvent(null)
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'dismissed') notNow()
    // Gebruik meten (F39): een installatie telt als je in het venster van Chrome bevestigt.
    else tel('installatie')
  }

  return {
    // Op een iPhone of iPad komt de vraag zonder signaal, met uitleg in plaats van het venster van Chrome.
    show: (event !== null || ios) && !later && !isInstalledApp(),
    ios: ios && event === null,
    install,
    notNow,
  }
}
