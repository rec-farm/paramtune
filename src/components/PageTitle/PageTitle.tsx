import Breadcrumbs from '@/components/Breadcrumbs'

type Props = {
  platform: string
  version?: string
  subtitle?: string
}

// Detail header (§9): eyebrow names the type, the H1 is the identifier in mono
// with no purple period
export default function PageTitle({ platform, version, subtitle }: Props) {
  const platformHref = `/dashboard/${encodeURIComponent(platform)}`

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/dashboard' },
          { label: platform, href: platformHref, mono: true },
          ...(version ? [{ label: `v${version}`, mono: true }] : []),
        ]}
      />
      <p className="pt-eyebrow mt-4">{version ? 'Version' : 'Platform'}</p>
      <h1 className="mt-2 font-mono text-2xl md:text-[40px] md:leading-none font-medium tracking-[-0.02em] break-words">
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
