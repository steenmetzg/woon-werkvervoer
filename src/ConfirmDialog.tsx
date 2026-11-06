import { useEffect, useId, useRef } from 'react'

interface Props {
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Eigen bevestigingsvraag van de app, opgemaakt als de andere meldingen (wit met een blauwe streep links), op de
 * plek waar je tikte. Het venster van de browser zelf (window.confirm) toont altijd het webadres als titel
 * ("steenmetzg.github.io meldt het volgende"); hier kiezen we de titel zelf.
 */
export default function ConfirmDialog({ title, text, confirmLabel, onConfirm, onCancel }: Props) {
  const cancel = useRef<HTMLButtonElement>(null)
  const id = useId()
  // De veilige keuze krijgt de focus; Escape annuleert.
  useEffect(() => {
    cancel.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="confirm" role="alertdialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`}>
      <strong id={`${id}-title`}>{title}</strong>
      <p id={`${id}-text`}>{text}</p>
      <div className="confirm-buttons">
        <button ref={cancel} type="button" onClick={onCancel}>
          Annuleren
        </button>
        <button type="button" className="confirm-yes" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
