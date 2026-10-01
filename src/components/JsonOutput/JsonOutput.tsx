type Props = {
  title: string
  content: Record<string, unknown>
}

type JsonEntry = [string, unknown]

function getValueComponent(value: unknown) {
  if (typeof value === 'string') {
    return <span className="text-syntax-string">&quot;{value}&quot;</span>
  }

  if (typeof value === 'number') {
    return <span className="text-syntax-number">{value}</span>
  }

  if (typeof value === 'boolean') {
    return <span className="text-syntax-literal">{value.toString()}</span>
  }

  if (value === null) {
    return <span className="text-syntax-literal">null</span>
  }

  if (Array.isArray(value)) {
    return (
      <span className="text-syntax-punct">
        [<span className="text-muted-foreground">{value.length} items</span>]
      </span>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    return (
      <span className="text-syntax-punct">
        {'{'}
        <span className="text-muted-foreground">{keys.length} properties</span>
        {'}'}
      </span>
    )
  }

  return <span className="text-muted-foreground">{String(value)}</span>
}

function syntaxHighlight(json: string, indent = 0) {
  const parsed = JSON.parse(json)

  const renderer = Object.entries(parsed).map(([key, value]: JsonEntry) => (
    <div
      key={key}
      className="flex items-center"
      style={{ marginLeft: `${indent + 1 * 16}px` }}
    >
      <span className={key.startsWith('@') ? 'text-syntax-extends' : 'text-syntax-key'}>
        &quot;{key}&quot;
      </span>
      <span className="text-syntax-punct mr-2">:</span>
      {getValueComponent(value)}
    </div>
  ))

  return (
    <div className="font-mono text-[13px] leading-[1.6]">
      <div className="text-syntax-punct">{'{'}</div>
      {renderer}
      <div className="text-syntax-punct">{'}'}</div>
    </div>
  )
}
export default function JsonOutput({ title, content }: Props) {
  const json = JSON.stringify(content)

  return (
    <div className="w-full">
      {title && (
        <h3 className="pt-label mb-4 text-muted-foreground">
          {title}
        </h3>
      )}
      <div className="pt-code overflow-x-auto">
        {syntaxHighlight(json)}
      </div>
    </div>
  )
}
