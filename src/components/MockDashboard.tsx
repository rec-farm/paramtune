import { Smartphone, Globe, Server } from 'lucide-react'

const PLATFORMS = [
  { name: 'ios-app', icon: Smartphone, versions: 4, current: true },
  { name: 'android-app', icon: Smartphone, versions: 3, current: false },
  { name: 'web-portal', icon: Globe, versions: 2, current: false },
  { name: 'api-gateway', icon: Server, versions: 1, current: false },
]

const punct = 'text-syntax-punct'
const key = 'text-syntax-key'
const str = 'text-syntax-string'
const num = 'text-syntax-number'
const lit = 'text-syntax-literal'

export default function MockDashboard() {
  return (
    <div className="flex flex-col md:flex-row md:h-[480px]" aria-hidden="true">
      {/* Sidebar */}
      <aside className="md:w-64 border-b md:border-b-0 md:border-r border-border bg-surface py-4">
        <p className="pt-label text-meta px-4 mb-2">Platforms</p>
        <ul>
          {PLATFORMS.map(({ name, icon: Icon, versions, current }) => (
            <li
              key={name}
              className={`flex items-center gap-3 h-10 mx-3 px-3 rounded-sm font-mono text-sm border-[1.5px] ${
                current
                  ? 'bg-accent text-accent-foreground font-semibold border-border-strong shadow-hard'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <span className="flex-1 truncate">{name}</span>
              <span className="text-xs text-meta tabular-nums">{versions}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-6 md:p-8 flex flex-col gap-6 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="pt-eyebrow">Platform</p>
            <h3 className="font-mono text-2xl font-medium tracking-[-0.02em]">ios-app</h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center h-[22px] px-1.5 rounded-xs bg-surface-2 border border-border font-mono text-[11px] font-semibold">
                v2.4.0
              </span>
              <span className="inline-flex items-center h-[18px] px-1 rounded-xs bg-accent-tile text-accent-text text-[11px] font-semibold">
                latest
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="pt-btn pt-btn-secondary h-7 px-2.5 text-[13px]">History</span>
            <span className="pt-btn pt-btn-secondary h-7 px-2.5 text-[13px]">
              Save
            </span>
          </div>
        </div>

        {/* JSON preview */}
        <pre className="pt-code flex-1 overflow-hidden">
          <code>
            <span className={punct}>{'{'}</span>
            {'\n  '}
            <span className="text-syntax-extends">&quot;@extends&quot;</span>
            <span className={punct}>: </span>
            <span className={str}>&quot;ios-app@2.3.x&quot;</span>
            <span className={punct}>,</span>
            {'\n  '}
            <span className={key}>&quot;minSupportedVersion&quot;</span>
            <span className={punct}>: </span>
            <span className={str}>&quot;17.0&quot;</span>
            <span className={punct}>,</span>
            {'\n  '}
            <span className={key}>&quot;checkoutV2&quot;</span>
            <span className={punct}>: </span>
            <span className={lit}>true</span>
            <span className={punct}>,</span>
            {'\n  '}
            <span className={key}>&quot;maxCartItems&quot;</span>
            <span className={punct}>: </span>
            <span className={num}>50</span>
            {'\n'}
            <span className={punct}>{'}'}</span>
          </code>
        </pre>
      </div>
    </div>
  )
}
