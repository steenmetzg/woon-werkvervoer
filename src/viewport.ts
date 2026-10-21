import { isInstalledApp } from './installPrompt'

/**
 * De geïnstalleerde app tekent Android altijd tot onder de systeembalken. Alleen met
 * viewport-fit=cover geeft Chrome dan door hoe hoog die balken zijn
 * (env(safe-area-inset-*)), zodat de app er ruimte voor kan laten. In de browser
 * zetten we het niet aan: daar houdt Chrome de app zelf boven de knoppenbalk.
 */
export function fitInstalledAppToSystemBars(): void {
  if (!isInstalledApp()) return
  const viewport = document.querySelector('meta[name="viewport"]')
  const content = viewport?.getAttribute('content')
  if (viewport && content && !content.includes('viewport-fit')) {
    viewport.setAttribute('content', `${content}, viewport-fit=cover`)
  }
}
