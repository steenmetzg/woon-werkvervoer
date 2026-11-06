import { formatHours } from './hours'

/** Een aantal uur zonder "uur", in twee kolommen zodat de komma's onder elkaar staan (bijv. "2" en ",5"). */
export default function Amount({ value, className }: { value: number; className: string }) {
  const [whole, decimals] = formatHours(value).split(',')
  return (
    <span className={className}>
      <span className="amount-int">{whole}</span>
      <span className="amount-dec">{decimals ? `,${decimals}` : ''}</span>
    </span>
  )
}
