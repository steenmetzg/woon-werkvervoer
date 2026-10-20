import { useEffect, useState } from 'react'

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

function isInstalledApp(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

function askedLaterRecently(now: Date): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_LATER_KEY)
    if (!raw) return false
    const since = now.getTime() - Number(raw)
    return since >= 0 && since < INSTALL_LATER_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
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

  useEffect(() => {
    const update = () => setEvent(pending)
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
  }

  return {
    show: event !== null && !later && !isInstalledApp(),
    install,
    notNow,
  }
}
