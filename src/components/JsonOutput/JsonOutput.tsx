type Props = {
  title: string
  content: Record<string, unknown>
}


type JsonEntry = [
  string,
  unknown
]

function getValueComponent(value: unknown) {
  if (typeof value === 'string') {
    return <span>"{value}"</span>
  }


  if (typeof value === 'number') {
    return <span>{value}</span>
  }




  return null
}


function syntaxHighlight(json: string, indent = 0) {
  const parsed = JSON.parse(json)

  const renderer = Object.entries(parsed).map(([key, value]: JsonEntry) => (
    <div className="" style={{ marginLeft: `${indent + 1 * 20}px` }}>
      <span className="text-yellow-400 font-bold">"{key}": </span>
      {getValueComponent(value)}
    </div>
  ))

  return (
    <div className="font-mono">
      <div className="text-red-400">{'{'}</div>
      {renderer}
      <div className="text-red-400">{'}'}</div>
    </div>
  )
}
export default function JsonOutput({ title, content }: Props) {
  const json = JSON.stringify(content)

  return (
    <div className="text-md p-2 bg-slate-900 rounded w-full">
      <h3 className="text-sm mb-6 text-slate-600 uppercase font-bold">
        {title}
      </h3>
      <pre>{syntaxHighlight(json)}</pre>
    </div>
  )
}
