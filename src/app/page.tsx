import dynamic from 'next/dynamic'
import Link from 'next/link'
import NavHeader from '@/components/NavHeader'
import Footer from '@/components/Footer'

const MockDashboard = dynamic(() => import('@/components/MockDashboard'), {
  loading: () => <div className="min-h-[400px]" />,
})

const QuickStart = dynamic(() => import('@/components/QuickStart'), {
  loading: () => <div className="min-h-[300px]" />,
})

export default function Home() {
  return (
    <>
      <NavHeader />
      <main className="relative z-10 pt-32 pb-24 overflow-hidden bg-grid-subtle">
        {/* Circuit line decorations */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-20">
          <div className="absolute top-[10%] left-[-5%] w-[40%] circuit-line rotate-12" />
          <div className="absolute top-[25%] right-[-10%] w-[50%] circuit-line -rotate-6" />
          <div className="absolute bottom-[15%] left-[20%] w-[30%] circuit-line rotate-45" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Feature tags */}
          <div className="absolute -top-12 left-10 bg-black border border-primary/20 p-4 transform -rotate-2">
            <div className="flex gap-6">
              <span className="text-[9px] font-bold tracking-widest text-primary">
                <span className="animate-pulse">_</span> OPEN SOURCE
              </span>
              <span className="text-[9px] font-bold tracking-widest text-gray-600">
                SELF-HOSTED
              </span>
              <span className="text-[9px] font-bold tracking-widest text-gray-600">
                API-FIRST
              </span>
            </div>
          </div>

          {/* Main title */}
          <div className="relative mb-20">
            <h1 className="wide-title font-display font-bold text-primary text-center opacity-90 mix-blend-screen">
              PARAMTUNE
            </h1>
            <h1
              className="wide-title font-display font-bold text-white/5 absolute inset-0 text-center translate-x-1 -translate-y-1 pointer-events-none"
              aria-hidden="true"
            >
              PARAMTUNE
            </h1>
          </div>

          {/* Hero grid */}
          <div className="grid grid-cols-12 gap-8 items-start mb-24">
            {/* Description panel */}
            <div className="col-span-12 md:col-span-7 bg-white/5 backdrop-blur-md p-8 border-l-8 border-primary clip-tagline relative -translate-x-4 md:-translate-x-8">
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-primary" />
              <p className="text-lg md:text-xl text-white/80 leading-relaxed font-fragmented tracking-tight">
                Stop scattering configs across repos and services. ParamTune
                gives your team one place to manage, version, and validate JSON
                schemas for every platform—fully self-hosted, so you own your
                data.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-12 h-[1px] bg-primary/40" />
                <span className="text-[10px] text-primary/60 uppercase">
                  System Ready // Data_Stream_Active
                </span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="col-span-12 md:col-span-5 flex flex-col gap-4 mt-8 md:mt-24">
              <div className="flex items-center gap-4">
                <div className="h-px flex-grow bg-primary/20" />
                <a
                  href="#quickstart"
                  className="bg-primary text-black px-10 py-5 font-display font-bold text-sm tracking-widest hover:translate-x-2 transition-transform clip-brutalist"
                >
                  GET STARTED
                </a>
              </div>
              <div className="flex items-center gap-4 self-end">
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-primary/50 text-primary px-10 py-5 font-display font-bold text-sm tracking-widest hover:bg-primary hover:text-black transition-all"
                >
                  GITHUB_REPO
                </Link>
                <div className="h-px w-24 bg-primary/20" />
              </div>
            </div>
          </div>

          {/* Product Preview */}
          <section className="relative mt-32">
            <div className="absolute -inset-4 border border-primary/10 pointer-events-none -rotate-1" />
            <div className="absolute -inset-2 border-r-4 border-b-4 border-primary/20 pointer-events-none translate-x-4 translate-y-4" />
            <div className="bg-black/90 border-fragment shadow-[0_0_50px_rgba(217,249,157,0.05)] relative z-20 overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-zinc-900/80 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
                <div className="flex space-x-3">
                  <div className="w-2 h-2 bg-primary/40" />
                  <div className="w-2 h-2 bg-primary/40" />
                  <div className="w-2 h-2 bg-primary/40" />
                </div>
                <div className="text-[9px] font-fragmented text-primary/40 uppercase tracking-[0.4em]">
                  SECURE_ACCESS://LOCALHOST:3000/NODE_DASHBOARD
                </div>
              </div>
              <MockDashboard />
            </div>
          </section>
        </div>

        {/* Quick Start */}
        <div className="mt-32">
          <QuickStart />
        </div>

        {/* Who It's For Section */}
        <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-20 mt-16">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-widest uppercase mb-4">
              WHO_ITS_FOR
            </h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="h-px w-16 bg-primary/30" />
              <p className="text-sm text-gray-500 font-fragmented uppercase tracking-wider">
                Built for teams who need control
              </p>
              <div className="h-px w-16 bg-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tag: '001',
                title: 'MOBILE_TEAMS',
                description:
                  'Manage feature flags and remote configs across iOS and Android releases with schema validation.',
              },
              {
                tag: '002',
                title: 'PLATFORM_ENG',
                description:
                  'Centralize service configuration with version history and rollback support.',
              },
              {
                tag: '003',
                title: 'MULTI_TENANT',
                description:
                  'Give each customer their own config namespace with clear separation.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`group p-8 border border-primary/20 bg-black/40 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 relative animate-in ${
                  index === 0
                    ? 'stagger-1'
                    : index === 1
                      ? 'stagger-2'
                      : 'stagger-3'
                }`}
              >
                <span className="absolute top-4 right-4 text-[9px] font-fragmented text-primary/30">
                  {item.tag}
                </span>
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary" />
                    <h3 className="text-lg font-display font-bold uppercase tracking-widest">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed font-fragmented">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-widest uppercase mb-4">
              CORE_FEATURES
            </h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="h-px w-16 bg-primary/30" />
              <p className="text-sm text-gray-500 font-fragmented uppercase tracking-wider">
                Everything you need to safely evolve configs
              </p>
              <div className="h-px w-16 bg-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                tag: 'HISTORY',
                title: 'VERSIONED_CONFIGS',
                description:
                  'Track every change to your configuration with immutable history and easy rollbacks per platform or environment.',
              },
              {
                tag: 'SAFETY',
                title: 'SCHEMA_FIRST',
                description:
                  'Back your configs with JSON schemas, get instant validation, and catch breaking changes before they reach production.',
              },
              {
                tag: 'PLATFORM',
                title: 'MULTI_PLATFORM',
                description:
                  'Model iOS, Android, Web, backends, and more in one place with clear versions and environments for each.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-8 border border-primary/30 bg-black/50 hover:bg-primary/5 hover:border-primary/60 transition-all duration-300 relative animate-in ${
                  index === 0
                    ? 'stagger-1'
                    : index === 1
                      ? 'stagger-2'
                      : 'stagger-3'
                }`}
              >
                <div className="absolute top-0 right-0 px-4 py-2 bg-primary/10 border-l border-b border-primary/30 text-[9px] font-fragmented font-bold uppercase tracking-[0.3em] text-primary">
                  {feature.tag}
                </div>
                <div className="space-y-4 pt-6">
                  <h3 className="text-xl font-display font-bold uppercase tracking-widest group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed font-fragmented text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Self-Host Section */}
        <section className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-widest uppercase mb-4">
              WHY_SELF_HOST
            </h2>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="h-px w-16 bg-primary/30" />
              <p className="text-sm text-gray-500 font-fragmented uppercase tracking-wider">
                Keep your data under your control
              </p>
              <div className="h-px w-16 bg-primary/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                comparison: 'VS_SAAS',
                benefit: 'No per-seat pricing. Free forever.',
                detail:
                  'Unlike LaunchDarkly or ConfigCat, ParamTune has no usage limits or monthly fees.',
              },
              {
                comparison: 'VS_GIT',
                benefit: 'Visual editor, instant validation, change history UI.',
                detail:
                  'Get a real UI instead of editing JSON files in pull requests.',
              },
              {
                comparison: 'VS_VENDOR',
                benefit: 'No lock-in. Your data stays on your infrastructure.',
                detail:
                  'Unlike Firebase Remote Config, you control where your data lives.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`p-6 border-l-4 border-primary/40 bg-black/30 hover:bg-black/50 hover:border-primary/70 transition-all duration-300 animate-in ${
                  index === 0
                    ? 'stagger-1'
                    : index === 1
                      ? 'stagger-2'
                      : 'stagger-3'
                }`}
              >
                <div className="space-y-3">
                  <div className="text-[10px] font-display font-bold text-primary uppercase tracking-[0.3em]">
                    {item.comparison}
                  </div>
                  <h3 className="text-lg font-bold">{item.benefit}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-fragmented">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative mx-auto max-w-7xl px-6 pb-20 md:pb-24">
          <div className="text-center space-y-8 border-t border-b border-primary/20 py-16 md:py-20 relative">
            <div className="absolute inset-0 bg-primary/5 -skew-y-1" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-display font-bold tracking-widest mb-4">
                READY_TO_START
              </h2>
              <p className="text-lg text-gray-500 mb-8 font-fragmented">
                Take control of your configuration management today.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-primary text-black px-12 py-5 font-display font-bold text-sm tracking-widest hover:translate-x-2 transition-transform clip-brutalist"
              >
                OPEN_DASHBOARD
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
