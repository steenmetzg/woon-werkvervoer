import { createLucideIcon } from 'lucide-react'

/** Microfoon met een plusje rechtsonder, in dezelfde stijl als het klokje met plusje (ClockPlus) van Lucide. */
const MicPlus = createLucideIcon('mic-plus', [
  ['rect', { x: '5.5', y: '2', width: '6', height: '11', rx: '3', key: 'mp1' }],
  ['path', { d: 'M15 9.5v1a6.5 6.5 0 0 1-13 0v-1', key: 'mp2' }],
  ['path', { d: 'M8.5 17v4', key: 'mp3' }],
  ['path', { d: 'M16 19h6', key: 'mp4' }],
  ['path', { d: 'M19 16v6', key: 'mp5' }],
])

export default MicPlus
