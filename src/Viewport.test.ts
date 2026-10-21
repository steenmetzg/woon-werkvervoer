import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'

describe('AC33: de app blijft boven de knoppenbalk van Android', () => {
  it('vraagt de browser niet om onder de systeembalken door te tekenen', () => {
    const viewport = html.match(/<meta name="viewport" content="([^"]*)"/)?.[1]
    expect(viewport).toBe('width=device-width, initial-scale=1.0')
    expect(viewport).not.toContain('viewport-fit=cover')
  })
})
