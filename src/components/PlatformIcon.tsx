import { Globe, Layers, Server, Smartphone, Tablet } from 'lucide-react'
import type { PlatformKind } from '@/shared/contracts'

export const PLATFORM_TYPES = [
  { kind: 'ios', label: 'iOS', description: 'Configuration for an iPhone or iPad app.', name: 'ios', icon: Tablet },
  { kind: 'android', label: 'Android', description: 'Configuration for an Android app.', name: 'android', icon: Smartphone },
  { kind: 'web', label: 'Web', description: 'Configuration for a website or browser app.', name: 'web', icon: Globe },
  { kind: 'service', label: 'API/service', description: 'Configuration for a backend API or service.', name: 'api', icon: Server },
  { kind: 'custom', label: 'Custom', description: 'A configuration group for any other app or service.', name: '', icon: Layers },
] as const

export default function PlatformIcon({ kind, className = 'h-5 w-5 shrink-0' }: { kind?: PlatformKind; className?: string }) {
  const Icon = (PLATFORM_TYPES.find((type) => type.kind === kind) ?? PLATFORM_TYPES[4]).icon
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />
}
