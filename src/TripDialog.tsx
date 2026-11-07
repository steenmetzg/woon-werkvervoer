import { useEffect, useId, useRef, useState } from 'react'
import { MAX_TRIP } from './trips'

interface Props {
  title: string
  value: string
  onSave: (text: string) => void
  onCancel: () => void
}

/**
 * Invulvenster voor de ritomschrijving van een dag (F37), opgemaakt als de andere meldingen (wit met een blauwe
 * streep links) en direct onder de regel van de datum, zodat het toetsenbord van de telefoon het niet bedekt.
 */
export default function TripDialog({ title, value, onSave, onCancel }: Props) {
  const [text, setText] = useState(value)
  const input = useRef<HTMLInputElement>(null)
  const id = useId()

  useEffect(() => {
    input.current?.focus()
  }, [])

  return (
    <form
      className="confirm trip-dialog"
      role="dialog"
      aria-labelledby={`${id}-title`}
      onSubmit={(e) => {
        e.preventDefault()
        onSave(text.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
    >
      <strong id={`${id}-title`}>{title}</strong>
      <input
        ref={input}
        type="text"
        aria-label="Ritomschrijving"
        placeholder="Bijv. trein Zwolle v.v."
        value={text}
        maxLength={MAX_TRIP}
        enterKeyHint="done"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="confirm-buttons">
        <button type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button type="submit" className="confirm-yes">
          Opslaan
        </button>
      </div>
    </form>
  )
}
