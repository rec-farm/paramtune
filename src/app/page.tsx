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
      <main className="relative pb-12 md:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-grid" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-20 md:pb-14 text-center">
          <div className="mx-auto max-w-4xl space-y-6 md:space-y-7">
            <div className="space-y-4 md:space-y-5">
              <Badge variant="secondary" className="mb-4 gap-2">
                Open source • Self-hosted • API-first
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                <span
                  className={`${stick.className} gradient-text brand-wordmark inline-block -rotate-1`}
                >
                  ParamTune
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Stop scattering configs across repos and services. ParamTune
                gives your team one place to manage, version, and validate JSON
                schemas for every platform—fully self-hosted, so you own your
                data.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 md:gap-4 pt-3">
              <a href="#quickstart">
                <Button size="lg">Get Started</Button>
              </a>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Product Screenshot */}
        <section className="relative mx-auto max-w-6xl px-6 pb-16 md:pb-20">
          <MockDashboard />
        </section>

        {/* Quick Start */}
        <QuickStart />

        {/* Who It's For Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Who It's For
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
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
              <Card key={index} className="text-center">
                <div className="space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-18">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              <Card
                key={index}
                variant="elevated"
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Self-Host Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Why Self-Host?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
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
              <Card key={index}>
                <div className="space-y-3">
                  <div className="text-xs font-medium text-primary uppercase tracking-wider">
                    {item.comparison}
                  </div>
                  <h3 className="text-lg font-semibold">{item.benefit}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative mx-auto max-w-6xl px-6 pb-16 md:pb-20">
          <div className="text-center">
            <Link href="/dashboard">
              <Button size="lg">Open Dashboard</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
