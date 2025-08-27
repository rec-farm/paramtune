'use client'

import { useMemo, useState } from 'react'
import ReactJson from 'react-json-view'

type Props = {
  title: string
  name?: string
  defaultValue?: string
}

function safeParseJson(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export default function JsonEditable({ title, name, defaultValue }: Props) {
  const initial = useMemo(() => safeParseJson(defaultValue), [defaultValue])
  const [data, setData] = useState<Record<string, unknown>>(initial)

  return (
    <div className="text-md p-2 bg-slate-900 rounded w-full">
      <h3 className="text-sm mb-6 text-slate-600 uppercase font-bold">
        {title}
      </h3>

      <input type="hidden" name={name} value={JSON.stringify(data)} />

      <div className="bg-slate-800 rounded p-2">
        <ReactJson
          name={false}
          src={data}
          theme="twilight"
          iconStyle="circle"
          displayObjectSize={false}
          displayDataTypes={false}
          enableClipboard={true}
          onEdit={(edit) => setData(edit.updated_src as Record<string, unknown>)}
          onAdd={(add) => setData(add.updated_src as Record<string, unknown>)}
          onDelete={(del) => setData(del.updated_src as Record<string, unknown>)}
        />
      </div>
    </div>
  )
}
