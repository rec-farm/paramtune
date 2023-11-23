'use client'

import { type HTMLProps } from "react"

type Props = HTMLProps<HTMLTextAreaElement> & {
  title: string
}

export default function JsonEditable({ title, ...props }: Props) {
  return (
    <div className="text-md p-2 bg-slate-900 rounded w-full">
      <h3 className="text-sm mb-6 text-slate-600 uppercase font-bold">
        {title}
      </h3>
      <textarea
        className="bg-transparent font-mono h-full w-full"
        rows={6}
        {...props}
      />
    </div>
  )
}
