import { useEffect, useId, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { useSpeech } from './speech'
import { MAX_TRIP } from './trips'

interface Props {
  title: string
  value: string
  onSave: (text: string) => void
  onCancel: () => void
  /** Toon linksonder een microfoontje om de omschrijving in te spreken (F37). */
  speech?: boolean
}

/**
 * Invulvenster voor de ritomschrijving van een dag (F37), opgemaakt als de andere meldingen (wit met een blauwe
 * streep links) en direct onder de regel van de datum, zodat het toetsenbord van de telefoon het niet bedekt.
 */
export default function TripDialog({ title, value, onSave, onCancel, speech = false }: Props) {
  const [text, setText] = useState(value)
  const [speechError, setSpeechError] = useState<string | null>(null)
  // Ingesproken tekst komt achter wat er al staat; in een leeg veld met een hoofdletter.
  const dictation = useSpeech(
    (alternatives) => {
      const heard = alternatives[0].trim()
      if (!heard) return
      setText((prev) => {
        const current = prev.trim()
        const next = current ? `${current} ${heard}` : heard.charAt(0).toUpperCase() + heard.slice(1)
        return next.slice(0, MAX_TRIP)
      })
    },
    setSpeechError,
  )
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
      {speechError && (
        <p className="trip-speech-error" role="status">
          {speechError}
        </p>
      )}
      <div className="confirm-buttons">
        {speech && (
          <button
            type="button"
            className={dictation.listening ? 'trip-mic listening' : 'trip-mic'}
            aria-label={dictation.listening ? 'Stoppen met luisteren' : 'Ritomschrijving inspreken'}
            aria-pressed={dictation.listening}
            onClick={() => {
              setSpeechError(null)
              if (dictation.listening) dictation.stop()
              else dictation.start()
            }}
          >
            <Mic size={18} strokeWidth={2} aria-hidden />
          </button>
        )}
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
