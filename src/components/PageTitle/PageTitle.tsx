type Props = {
  platform: string
  version?: string
  subtitle?: string
}

export default function PageTitle({ platform, version, subtitle }: Props) {
  return (
    <div>
      <h2 className="text-3xl font-display font-bold uppercase tracking-widest">
        {platform}
        {version && (
          <span className="text-sm text-primary/60 font-fragmented font-normal tracking-normal px-2">
            /v{version}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-500 font-fragmented uppercase tracking-wider">
          {subtitle}
        </p>
      )}
    </div>
  )
}
