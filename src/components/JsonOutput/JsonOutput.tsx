type Props = {
  title: string
  content: Record<string, unknown>
}

type JsonEntry = [string, unknown]

function getValueComponent(value: unknown) {
  if (typeof value === 'string') {
    return <span className="text-green-400">&quot;{value}&quot;</span>
  }

  if (typeof value === 'number') {
    return <span className="text-blue-400">{value}</span>
  }

  if (typeof value === 'boolean') {
    return <span className="text-orange-400">{value.toString()}</span>
  }

  if (value === null) {
    return <span className="text-gray-500 italic">null</span>
  }

  if (Array.isArray(value)) {
    return (
      <span className="text-gray-300">
        [<span className="text-gray-500">{value.length} items</span>]
      </span>
    )
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    return (
      <span className="text-gray-300">
        {'{'}
        <span className="text-gray-500">{keys.length} properties</span>
        {'}'}
      </span>
    )
  }

  return <span className="text-gray-500">{String(value)}</span>
}

function syntaxHighlight(json: string, indent = 0) {
  const parsed = JSON.parse(json)

  const renderer = Object.entries(parsed).map(([key, value]: JsonEntry) => (
    <div
      key={key}
      className="flex items-center"
      style={{ marginLeft: `${indent + 1 * 16}px` }}
    >
      <span className="text-purple-400 font-medium">&quot;{key}&quot;</span>
      <span className="text-gray-400 mx-1">:</span>
      {getValueComponent(value)}
    </div>
  ))

  return (
    <div className="font-mono text-sm">
      <div className="text-gray-200 font-bold">{'{'}</div>
      {renderer}
      <div className="text-gray-200 font-bold">{'}'}</div>
    </div>
  )
}
export default function JsonOutput({ title, content }: Props) {
  const json = JSON.stringify(content)

  return (
    <div className="p-4 bg-gray-900/20 rounded-lg w-full">
      {title && (
        <h3 className="text-sm mb-4 text-gray-400 uppercase font-medium tracking-wide">
          {title}
        </h3>
      )}
      <div className="bg-gray-900/40 p-3 rounded border border-gray-800">
        {syntaxHighlight(json)}
      </div>
    </div>
  )
}
