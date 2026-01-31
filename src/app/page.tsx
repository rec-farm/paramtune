import dynamic from 'next/dynamic'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Footer from '@/components/Footer'
import NavHeader from '@/components/NavHeader'
import Link from 'next/link'

const MockDashboard = dynamic(() => import('@/components/MockDashboard'), {
  loading: () => <div className="min-h-[400px]" />,
})

const QuickStart = dynamic(() => import('@/components/QuickStart'), {
  loading: () => <div className="min-h-[300px]" />,
})
import { Stick } from 'next/font/google'
import { Github, Smartphone, Server, Users } from 'lucide-react'

const stick = Stick({
  weight: '400',
  subsets: ['latin'],
})

export default function Home() {
  return (
    <>
      <NavHeader />
      <main className="relative pb-12 md:pb-16 overflow-hidden pt-24">
        {/* Noise overlay on top of everything */}
        <div className="pointer-events-none fixed inset-0 z-50 bg-noise" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-6 pt-8 pb-16 md:pt-12 md:pb-20 text-center">
          <div className="mx-auto max-w-4xl space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/30 text-xs font-mono uppercase tracking-wider punk-border">
                <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
                Open source • Self-hosted • API-first
              </div>
              <h1 className="text-7xl md:text-9xl font-bold tracking-tighter">
                <span
                  className={`${stick.className} gradient-text brand-wordmark inline-block -rotate-2`}
                >
                  ParamTune
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl mx-auto leading-relaxed font-light">
                Stop scattering configs across repos and services. ParamTune
                gives your team one place to manage, version, and validate JSON
                schemas for every platform—fully self-hosted, so you own your
                data.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-6 pt-4">
              <a href="#quickstart">
                <Button size="lg" className="px-8 uppercase tracking-wide font-semibold">Get Started</Button>
              </a>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2 px-8 backdrop-blur-sm">
                  <Github className="w-5 h-5" />
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Product Screenshot */}
        <section className="relative mx-auto max-w-6xl px-6 pb-16 md:pb-20">
          <div className="border-2 border-primary/30 bg-black/60 p-2 md:p-4 hover:border-primary/50 transition-colors">
            <MockDashboard />
          </div>
        </section>

        {/* Quick Start */}
        <QuickStart />

        {/* Who It's For Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-4 inline-block border-b-2 border-primary/50 pb-2">
              Who It's For
            </h2>
            <p className="text-base md:text-lg text-foreground/70 max-w-xl mx-auto font-light">
              ParamTune is built for teams that need control over their
              configuration without vendor lock-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: 'Mobile Teams',
                description:
                  'Manage feature flags and remote configs across iOS and Android releases with schema validation.',
              },
              {
                icon: <Server className="w-6 h-6" />,
                title: 'Platform Engineers',
                description:
                  'Centralize service configuration with version history and rollback support.',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Multi-tenant Apps',
                description:
                  'Give each customer their own config namespace with clear separation.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`group p-6 border border-primary/20 bg-black/40 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 animate-in ${
                  index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : 'stagger-3'
                }`}
              >
                <div className="space-y-4 text-left">
                  <div className="h-12 w-12 flex items-center justify-center text-primary border border-primary/30 group-hover:border-primary/50 transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold uppercase tracking-wide">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase mb-4 inline-block border-b-4 border-primary pb-3">
              Everything you need
            </h2>
            <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto font-light">
              Built for teams who need to safely evolve configs across
              platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ),
                title: 'Versioned configs',
                description:
                  'Track every change to your configuration with immutable history and easy rollbacks per platform or environment.',
                badge: 'History & rollback',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
                title: 'Schema-first safety',
                description:
                  'Back your configs with JSON schemas, get instant validation, and catch breaking changes before they reach production.',
                badge: 'Safe by design',
              },
              {
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                ),
                title: 'Multi-platform aware',
                description:
                  'Model iOS, Android, Web, backends, and more in one place with clear versions and environments for each.',
                badge: 'Cross-platform',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group p-8 border border-primary/30 bg-black/50 hover:bg-primary/5 hover:border-primary/60 transition-all duration-300 relative animate-in ${
                  index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : 'stagger-3'
                }`}
              >
                <div className="absolute top-0 right-0 px-3 py-1 bg-primary/10 border-l border-b border-primary/30 text-[10px] font-mono uppercase tracking-wider text-primary">
                  {feature.badge}
                </div>
                <div className="space-y-4 pt-4">
                  <div className="h-16 w-16 flex items-center justify-center text-primary border-2 border-primary/30 group-hover:border-primary transition-all duration-300 bg-black/50">
                    {feature.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Self-Host Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-4 inline-block border-b-2 border-primary/50 pb-2">
              Why Self-Host?
            </h2>
            <p className="text-base md:text-lg text-foreground/70 max-w-xl mx-auto font-light">
              Keep your configuration data under your control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                comparison: 'vs SaaS tools',
                benefit: 'No per-seat pricing. Free forever.',
                detail:
                  'Unlike LaunchDarkly or ConfigCat, ParamTune has no usage limits or monthly fees.',
              },
              {
                comparison: 'vs Git-based configs',
                benefit: 'Visual editor, instant validation, change history UI.',
                detail:
                  'Get a real UI instead of editing JSON files in pull requests.',
              },
              {
                comparison: 'vs Vendor platforms',
                benefit: 'No lock-in. Your data stays on your infrastructure.',
                detail:
                  'Unlike Firebase Remote Config, you control where your data lives.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`p-6 border-l-2 border-primary/40 bg-black/30 hover:bg-black/50 hover:border-primary/70 transition-all duration-300 animate-in ${
                  index === 0 ? 'stagger-1' : index === 1 ? 'stagger-2' : 'stagger-3'
                }`}
              >
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                    {item.comparison}
                  </div>
                  <h3 className="text-lg font-bold">{item.benefit}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative mx-auto max-w-6xl px-6 pb-20 md:pb-24">
          <div className="text-center space-y-8 border-t border-b border-primary/20 py-16 md:py-20 relative">
            <div className="absolute inset-0 bg-primary/5 -skew-y-1" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Ready to get started?
              </h2>
              <p className="text-lg md:text-xl text-foreground/70 mb-8">
                Take control of your configuration management today.
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="px-12 uppercase tracking-wider font-bold shadow-2xl">
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
