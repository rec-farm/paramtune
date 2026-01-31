type Props = {
  platform: string
  version?: string
  subtitle?: string
}

export default function PageTitle({ platform, version, subtitle }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-mono font-bold uppercase tracking-wider">
        {platform}
        {version && (
          <span className="text-sm text-primary/60 font-normal tracking-normal px-2">
            /v{version}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground uppercase tracking-wide">{subtitle}</p>
      )}
    </div>
  )
}
