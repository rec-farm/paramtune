type Props = {
  platform: string
  version?: string
  subtitle?: string
}

export default function PageTitle({ platform, version, subtitle }: Props) {
  return (
    <div className="space-y-2">
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
