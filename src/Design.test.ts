import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'

const css = readFileSync('src/index.css', 'utf8')

/** De regels van één CSS-selector, precies zoals ze in index.css staan. */
function rule(selector: string): string {
  const start = `\n${css}`.indexOf(`\n${selector} {`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('}', start))
}

describe('AC44: moderne uitstraling', () => {
  it('heeft een lichtgrijze achtergrond, ook in de statusbalk', () => {
    expect(rule(':root')).toContain('--bg: #f5f6f8;')
    expect(html).toContain('<meta name="theme-color" content="#f5f6f8" />')
  })

  it('maakt de knoppen wit met een schaduw en zonder zichtbare rand', () => {
    for (const selector of ['.icon-button', '.mode', '.wide-button']) {
      const r = rule(selector)
      expect(r).toContain('background: var(--surface);')
      expect(r).toContain('box-shadow: var(--shadow);')
      expect(r).toContain('border: 1px solid transparent;')
    }
  })

  it('geeft de herinnering links een streep in de accentkleur', () => {
    expect(rule('.reminder')).toContain('border-left: 5px solid var(--accent);')
  })
})
