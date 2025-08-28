import NavigationPlatforms from '@/components/NavigationPlatforms'

export default async function Sidebar() {
  return (
    <aside className="hidden md:block w-64 shrink-0 border-r border-white/10 bg-neutral-950/40">
      <div className="px-4 py-4">
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2">Platforms</div>
        <div className="text-sm">
          <NavigationPlatforms />
        </div>
      </div>
    </aside>
  )
}

