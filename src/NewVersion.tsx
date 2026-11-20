import { Clock, ClockPlus, Mic, PenLine, X, type LucideIcon } from 'lucide-react'
import MicPlus from './MicPlus'
import { RELEASE_TEKSTEN } from './releaseTekst'

// De iconen die in een releasetekst tussen blokhaken mogen staan (zie releaseTekst.ts).
const ICONEN: Record<string, { Icon: LucideIcon; naam: string }> = {
  klokplus: { Icon: ClockPlus, naam: 'klokje met plusje' },
  micplus: { Icon: MicPlus, naam: 'microfoon met plusje' },
  microfoon: { Icon: Mic, naam: 'microfoon' },
  potlood: { Icon: PenLine, naam: 'potloodje' },
  klok: { Icon: Clock, naam: 'klokje' },
}

/** Zet "[klokplus]" in de tekst om in het icoon zelf. */
function metIconen(tekst: string) {
  return tekst.split(/(\[[a-z]+\])/).map((deel, i) => {
    const icoon = ICONEN[deel.slice(1, -1)]
    if (!deel.startsWith('[') || !icoon) return deel
    const { Icon, naam } = icoon
    return (
      <span key={i} className="inline-icon" role="img" aria-label={naam}>
        <Icon size={16} strokeWidth={1.75} aria-hidden />
      </span>
    )
  })
}

/** Melding na het bijwerken van de app (F41): titel met het versienummer en de tekst van die versie. */
export default function NewVersion({ version, onClose }: { version: string; onClose: () => void }) {
  const tekst = RELEASE_TEKSTEN[version]
  return (
    <section className="new-version" aria-label="Nieuwe versie">
      <div>
        <strong>Nieuwe versie geïnstalleerd (v{version})</strong>
        {tekst && <p>{metIconen(tekst)}</p>}
      </div>
      <button type="button" className="new-version-close" aria-label="Melding nieuwe versie sluiten" onClick={onClose}>
        <X size={18} strokeWidth={1.75} aria-hidden />
      </button>
    </section>
  )
}
