import { Bike, Car, House, TrainFront, TreePalm, type LucideIcon } from 'lucide-react'
import type { Mode } from './storage'

export const MODE_INFO: Record<Mode, { label: string; Icon: LucideIcon }> = {
  thuis: { label: 'Thuis', Icon: House },
  trein: { label: 'Trein', Icon: TrainFront },
  fiets: { label: 'Fiets', Icon: Bike },
  auto: { label: 'Auto', Icon: Car },
  vrij: { label: 'Vrij', Icon: TreePalm },
}
