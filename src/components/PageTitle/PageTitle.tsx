type Props = {
  platform: string
  version?: string
}

export default function PageTitle({ platform, version }: Props) {
  return (
    <h2 className="text-4xl font-mono font-bold">
      {platform}
      {version && (
        <span className="text-sm text-slate-400 font-normal px-2">
          /v{version}
        </span>
      )}
    </h2>
  )
}
