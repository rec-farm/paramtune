export default function MockDashboard() {
  return (
    <div className="flex flex-col md:flex-row h-[500px]">
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-r border-primary/10 p-8 flex flex-col bg-zinc-900/20">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-2 bg-primary" />
          <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
            ENDPOINTS
          </h4>
        </div>
        <ul className="space-y-6">
          <li className="relative">
            <span className="absolute -left-8 top-1/2 w-4 h-[1px] bg-primary" />
            <span className="text-xs text-white font-bold bg-primary/10 px-4 py-2 block border-l border-primary">
              ios-app.json
            </span>
          </li>
          <li className="px-4 text-xs text-gray-600 hover:text-primary cursor-pointer flex items-center gap-2">
            <span className="w-1 h-1 border border-gray-600" /> android-app.v2
          </li>
          <li className="px-4 text-xs text-gray-600 hover:text-primary cursor-pointer flex items-center gap-2">
            <span className="w-1 h-1 border border-gray-600" /> web-portal.main
          </li>
        </ul>
        <div className="mt-auto pt-8 border-t border-primary/5">
          <div className="h-1 w-full bg-zinc-800 relative">
            <div className="absolute inset-0 bg-primary w-2/3" />
          </div>
          <p className="text-[8px] mt-2 text-gray-600 font-fragmented">
            BUFFER_UTILIZATION: 67%
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 p-10 bg-black flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-6">
          <div className="relative">
            <h2 className="text-white text-5xl font-display font-bold tracking-widest mb-2">
              IOS_APP_STAGING
            </h2>
            <div className="flex items-center gap-4 text-primary/40 text-[10px] font-fragmented">
              <span>HASH: 0x82F...E92</span>
              <span className="w-1 h-1 bg-primary/40 rounded-full" />
              <span>LATENCY: 12ms</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-primary text-black px-8 py-3 font-display font-bold text-[10px] clip-brutalist text-center">
              COMMIT_CHANGES
            </div>
            <div className="border border-white/10 text-white/50 px-8 py-3 font-display font-bold text-[10px] text-center">
              LOGS
            </div>
          </div>
        </div>

        {/* JSON preview */}
        <div className="flex-1 border border-primary/10 p-6 font-fragmented text-[11px] text-gray-600 leading-relaxed overflow-hidden bg-zinc-950/50">
          <div className="flex gap-4 mb-2">
            <span className="text-primary/30">001</span>
            <span className="text-primary/80">{'{'}</span>
          </div>
          <div className="flex gap-4 mb-2">
            <span className="text-primary/30">002</span>
            <span className="pl-4">
              &quot;schema_version&quot;:{' '}
              <span className="text-white">&quot;3.0.4-build-92&quot;</span>,
            </span>
          </div>
          <div className="flex gap-4 mb-2">
            <span className="text-primary/30">003</span>
            <span className="pl-4">
              &quot;validation_logic&quot;:{' '}
              <span className="text-primary/40">[...]</span>,
            </span>
          </div>
          <div className="flex gap-4 mb-2">
            <span className="text-primary/30">004</span>
            <span className="pl-4">
              &quot;auto_failover&quot;:{' '}
              <span className="text-primary">true</span>,
            </span>
          </div>
          <div className="flex gap-4 mb-2 opacity-20">
            <span className="text-primary/30">005</span>
            <span className="pl-4">
              &quot;distributed_nodes&quot;: 12,
            </span>
          </div>
          <div className="mt-8 border-t border-primary/10 pt-4 flex justify-between">
            <span className="animate-pulse text-primary">READY_FOR_PATCH_03</span>
            <span className="text-gray-800">UTF-8 // JSON_TYPE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
