import PlatformIcon from '@/components/PlatformIcon'
import type { PlatformKind } from '@/shared/contracts'
type Props = {
  kind?: PlatformKind
  platform: string
  version?: string
  subtitle?: string
}

// Detail header (§9): eyebrow names the type, the H1 is the identifier in mono
// with no purple period
export default function PageTitle({ platform, version, subtitle, kind }: Props) {
  return (
    <div>
      <p className="pt-eyebrow">{version ? 'Version' : 'Platform'}</p>
      <h1 className="mt-2 flex flex-wrap items-center gap-2 font-mono text-2xl md:text-[40px] md:leading-none font-medium tracking-[-0.02em] break-words">
        <PlatformIcon kind={kind} className="h-6 w-6 shrink-0" />
        {platform}
        {version && (
          <span className="ml-3 text-muted-foreground">v{version}</span>
        )}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-[45ch] text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}
