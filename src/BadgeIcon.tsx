import { Euro, type LucideIcon } from 'lucide-react'

interface Props {
  Icon: LucideIcon
  /** Het tekentje in het rondje: een euroteken voor vergoedingen, een vinkje voor vrije dagen. */
  Badge?: LucideIcon
  size?: number
  className?: string
  label?: string
}

/** Een icoon met rechtsonder een wit rondje met een blauw tekentje, voor de knoppen en titels van de overzichten. */
export default function BadgeIcon({ Icon, Badge = Euro, size = 20, className, label }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon x={0} y={0} size={19.7} strokeWidth={1.75} />
      <circle cx={17.6} cy={17.6} r={5.2} fill="var(--bg)" stroke="var(--accent)" strokeWidth={1.1} />
      <Badge x={13.35} y={13.52} size={8.16} strokeWidth={2.4} color="var(--accent)" />
    </svg>
  )
}
