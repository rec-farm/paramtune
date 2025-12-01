import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Stick } from 'next/font/google'
import { Rocket, Edit, Eye, Link2, Moon, Keyboard, Wrench } from 'lucide-react'

const stick = Stick({
  weight: '400',
  subsets: ['latin'],
})

export default function Home() {
  return (
    <>
      <main className="relative pb-12 md:pb-16">
        <div className="pointer-events-none absolute inset-0 bg-grid" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 md:pt-20 md:pb-14 text-center">
          <div className="mx-auto max-w-4xl space-y-6 md:space-y-7">
            <div className="space-y-4 md:space-y-5">
              <Badge variant="secondary" className="mb-4 gap-2">
                <Rocket className="w-4 h-4" />
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
                ParamTune is a free, open source configuration hub for teams who
                want full control. Self-host it anywhere and manage platform
                schemas and versions through a fast UI and a simple, JSON-first
                API.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 md:gap-4 pt-3">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative mx-auto max-w-6xl px-6 py-16 md:py-18">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to safely evolve configs across iOS, Android,
              Web, and more—without giving up ownership to a hosted service.
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

        {/* Additional Features Grid */}
        <section className="relative mx-auto max-w-6xl px-6 pb-12 md:pb-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Schema editor',
                description:
                  'Edit JSON schemas with focused tooling, history, and previews tailored for configuration work.',
                icon: <Edit className="w-5 h-5" />,
              },
              {
                title: 'Live config history',
                description:
                  'Understand what changed, when, and for which platform with at-a-glance version history.',
                icon: <Eye className="w-5 h-5" />,
              },
              {
                title: 'Simple HTTP APIs',
                description:
                  'Serve configuration and schemas over clean HTTP endpoints that are easy to consume from any client.',
                icon: <Link2 className="w-5 h-5" />,
              },
              {
                title: 'Dark, focused UI',
                description:
                  'A minimal, keyboard-friendly interface that gets out of the way so you can ship configuration changes faster.',
                icon: <Moon className="w-5 h-5" />,
              },
              {
                title: 'Fast for power users',
                description:
                  'Keyboard-first flows, clear focus states, and carefully chosen defaults.',
                icon: <Keyboard className="w-5 h-5" />,
              },
              {
                title: 'OSS & extensible',
                description:
                  'Open source and self-hosted by default so you can fork, extend, and integrate with your own stack.',
                icon: <Wrench className="w-5 h-5" />,
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">{feature.icon}</div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-10 md:mt-12 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              <Link href="/dashboard">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  View Platforms
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
