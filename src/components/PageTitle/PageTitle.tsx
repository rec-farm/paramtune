import Breadcrumbs from '@/components/Breadcrumbs'

type Props = {
  platform: string
  version?: string
  subtitle?: string
}

export default function PageTitle({ platform, version, subtitle }: Props) {
  const platformHref = `/dashboard/${encodeURIComponent(platform)}`

  return (
    <div className="space-y-2">
      <Breadcrumbs
        items={[
          { label: 'Overview', href: '/dashboard' },
          { label: platform, href: platformHref },
          ...(version ? [{ label: `v${version}` }] : []),
        ]}
      />
      <h1 className="pt-display text-xl break-words">
        {platform}
        {version && (
          <span className="ml-2 align-middle text-base font-fragmented font-normal normal-case tracking-normal text-muted-foreground">
            v{version}
          </span>
        )}
      </h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  )
}
