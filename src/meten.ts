// Gebruik meten (F39): anoniem tellen met GoatCounter, zonder cookies en zonder script van GoatCounter.
// Alleen de naam van de telling gaat weg, nooit wat je invult. Alles hierover staat in dit bestand,
// zodat de functie makkelijk weer weg kan.

import { isIos } from './installPrompt'

const COUNT_URL = 'https://steenmetzg.goatcounter.com/count'
/** Alleen de echte app telt; de testversie (submap test/), de tests en de computer van de ontwikkelaar niet. */
const LIVE_HOST = 'steenmetzg.github.io'

export type Telling =
  | 'start-geinstalleerd'
  | 'start-browser'
  | 'installatie'
  | 'overzicht-thuis'
  | 'overzicht-trein'
  | 'overzicht-fiets'
  | 'overzicht-auto'
  | 'overzicht-vrij'
  | 'overzicht-uren'

/** Elke telling begint met de naam van de app, zodat je hem bij GoatCounter herkent tussen andere apps. */
const VOORVOEGSEL = 'woonwerk-'

const TITELS: Record<Telling, string> = {
  'start-geinstalleerd': 'WoonWerk gestart (geïnstalleerd)',
  'start-browser': 'WoonWerk gestart (browser)',
  installatie: 'WoonWerk geïnstalleerd',
  'overzicht-thuis': 'WoonWerk overzicht Thuis',
  'overzicht-trein': 'WoonWerk overzicht Trein',
  'overzicht-fiets': 'WoonWerk overzicht Fiets',
  'overzicht-auto': 'WoonWerk overzicht Auto',
  'overzicht-vrij': 'WoonWerk overzicht Vrij',
  'overzicht-uren': 'WoonWerk overzicht Uren',
}

interface Plek {
  hostname: string
  pathname: string
}

/** Of er geteld mag worden: alleen in de echte app en alleen met internet. */
export function mayCount(plek: Plek, online: boolean): boolean {
  return online && plek.hostname === LIVE_HOST && !plek.pathname.includes('/test/')
}

/** Het adres van één telling, met alleen de naam en de titel. */
export function countUrl(telling: Telling, rnd = Math.random().toString(36).slice(2)): string {
  const params = new URLSearchParams({ p: VOORVOEGSEL + telling, t: TITELS[telling], e: 'true', rnd })
  return `${COUNT_URL}?${params}`
}

function verstuur(url: string) {
  if (navigator.sendBeacon?.(url)) return
  // Lukt het niet via sendBeacon, dan een onzichtbaar plaatje.
  new Image().src = url
}

// Voor de tests: een andere plek en een andere manier van versturen.
let plekVoorTest: Plek | null = null
let verstuurVoorTest: ((url: string) => void) | null = null
export function setMetenVoorTest(plek: Plek | null, send: ((url: string) => void) | null) {
  plekVoorTest = plek
  verstuurVoorTest = send
}

/** Telt één keer; geen internet of een fout: dan gebeurt er niets, ook niet later. */
export function tel(telling: Telling) {
  try {
    if (!mayCount(plekVoorTest ?? window.location, navigator.onLine)) return
    ;(verstuurVoorTest ?? verstuur)(countUrl(telling))
  } catch {
    // Tellen is nooit belangrijker dan de app zelf.
  }
}

function isInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

/** Onthoudt dat de installatie op een iPhone of iPad al geteld is. */
export const IOS_INSTALLATIE_KEY = 'installatie-geteld'

/**
 * Een iPhone of iPad meldt een installatie niet. Daarom telt daar de eerste start vanaf het beginscherm
 * als installatie (vanaf versie 1.24.0); de app op het beginscherm heeft daar zijn eigen, nog lege opslag.
 */
function telIosInstallatie() {
  try {
    if (!isIos() || localStorage.getItem(IOS_INSTALLATIE_KEY)) return
    localStorage.setItem(IOS_INSTALLATIE_KEY, '1')
  } catch {
    return
  }
  tel('installatie')
}

/** Eén keer bij het openen van de app: telt de start. Een installatie telt apart, zie installPrompt.ts. */
export function startMeten() {
  if (isInstalled()) {
    tel('start-geinstalleerd')
    telIosInstallatie()
  } else tel('start-browser')
}

/** De telling voor het openen van een scherm, of `null` als het geen overzicht is. */
export function overviewTelling(screen: string): Telling | null {
  return ['thuis', 'trein', 'fiets', 'auto', 'vrij', 'uren'].includes(screen) ? (`overzicht-${screen}` as Telling) : null
}
