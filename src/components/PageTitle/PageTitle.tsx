type Props = {
  platform: string
  version?: string
  subtitle?: string
}

export default function PageTitle({ platform, version, subtitle }: Props) {
  return (
    <div>
      <h2 className="text-4xl font-mono font-bold">
        {platform}
        {version && (
          <span className="text-sm text-slate-400 font-normal px-2">
            /v{version}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
