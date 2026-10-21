import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'
import main from './main.tsx?raw'

describe('AC39: de app blijft boven de knoppenbalk van Android', () => {
  it('vraagt de browser nooit om onder de systeembalken door te tekenen, ook niet als geïnstalleerde app', () => {
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0" />')
    expect(html).not.toContain('viewport-fit')
    expect(main).not.toContain('viewport-fit')
  })
})

describe('AC39: knoppenbalk van Android in de geïnstalleerde app', () => {
  it('laat de kleur van de balk aan de telefoon over (geen theme_color in het manifest)', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))
    expect(manifest).not.toHaveProperty('theme_color')
    expect(manifest.background_color).toBe('#ffffff')
  })
})
