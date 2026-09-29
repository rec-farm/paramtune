import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import NavHeader from '@/components/NavHeader'
import Footer from '@/components/Footer'

const MockDashboard = dynamic(() => import('@/components/MockDashboard'), {
  loading: () => <div className="min-h-[480px] pt-skeleton" />,
})

const QuickStart = dynamic(() => import('@/components/QuickStart'), {
  loading: () => <div className="min-h-[256px]" />,
})

const REPO_URL = 'https://github.com/RodrigoEspinosa/paramtune'

const AUDIENCES = [
  {
    title: 'Mobile teams',
    description:
      'Manage feature flags and remote configs across iOS and Android releases with schema validation.',
  },
  {
    title: 'Platform engineering',
    description:
      'Centralize service configuration with version history and rollback support.',
  },
  {
    title: 'Multi-tenant products',
    description:
      'Give each customer their own config namespace with clear separation.',
  },
]

const FEATURES = [
  {
    label: 'History',
    title: 'Versioned configs',
    description:
      'Track every change to your configuration with immutable history and easy rollbacks per platform or environment.',
  },
  {
    label: 'Safety',
    title: 'Schema first',
    description:
      'Back your configs with JSON schemas, get instant validation, and catch breaking changes before they reach production.',
  },
  {
    label: 'Platforms',
    title: 'Multi-platform',
    description:
      'Model iOS, Android, Web, backends, and more in one place with clear versions and environments for each.',
  },
]

const COMPARISONS = [
  {
    label: 'vs SaaS',
    title: 'No per-seat pricing.',
    description:
      'Unlike LaunchDarkly or ConfigCat, Paramtune has no usage limits or monthly fees.',
  },
  {
    label: 'vs Git',
    title: 'Visual editor, instant validation, change history.',
    description: 'Get a real UI instead of editing JSON files in pull requests.',
  },
  {
    label: 'vs vendor',
    title: 'No lock-in.',
    description:
      'Unlike Firebase Remote Config, you control where your data lives.',
  },
]

const STAGGER = ['stagger-1', 'stagger-2', 'stagger-3']

function SectionHeading({
  id,
  title,
  subtitle,
}: {
  id: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-8 space-y-2">
      <h2 id={id} className="pt-display text-xl">
        {title}
      </h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <NavHeader />
      <main>
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-12 md:pt-24">
          <ul className="flex flex-wrap gap-2 mb-8" aria-label="Highlights">
            {['Open source', 'Self-hosted', 'API-first'].map((tag) => (
              <li
                key={tag}
                className="pt-label border border-border-strong px-2 py-1 text-muted-foreground"
              >
                {tag}
              </li>
            ))}
          </ul>

          <h1 className="pt-display text-2xl sm:text-3xl md:text-4xl leading-none mb-8 break-words">
            Paramtune
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-[68ch] mb-8">
            Stop scattering configs across repos and services. Paramtune gives
            your team one place to manage, version, and validate JSON schemas
            for every platform, fully self-hosted so you own your data.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#quickstart" className="pt-btn pt-btn-primary h-12 px-6">
              Get started
            </a>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="pt-btn pt-btn-secondary h-12 px-6"
            >
              View on GitHub
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Product preview */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
          <figure className="border border-border bg-surface overflow-hidden">
            <div className="flex items-center h-10 px-4 border-b border-border">
              <span className="text-xs text-meta truncate">
                localhost:3000/dashboard/ios-app
              </span>
            </div>
            <MockDashboard />
            <figcaption className="sr-only">
              Preview of the Paramtune dashboard editing the ios-app platform
              configuration.
            </figcaption>
          </figure>
        </section>

        <div className="border-t border-border">
          <QuickStart />
        </div>

        {/* Who it's for */}
        <section
          aria-labelledby="audience-title"
          className="max-w-7xl mx-auto px-4 md:px-6 py-16 border-t border-border"
        >
          <SectionHeading
            id="audience-title"
            title="Who it's for"
            subtitle="Built for teams who need control."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUDIENCES.map((item, index) => (
              <li
                key={item.title}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section
          aria-labelledby="features-title"
          className="max-w-7xl mx-auto px-4 md:px-6 py-16 border-t border-border"
        >
          <SectionHeading
            id="features-title"
            title="Core features"
            subtitle="Everything you need to safely evolve configs."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <span className="pt-label text-meta">{feature.label}</span>
                <h3 className="text-base font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Why self-host */}
        <section
          aria-labelledby="selfhost-title"
          className="max-w-7xl mx-auto px-4 md:px-6 py-16 border-t border-border"
        >
          <SectionHeading
            id="selfhost-title"
            title="Why self-host"
            subtitle="Keep your data under your control."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPARISONS.map((item, index) => (
              <li
                key={item.label}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <span className="pt-label text-meta">{item.label}</span>
                <h3 className="text-base font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 border-t border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="pt-display text-xl">Ready to start</h2>
              <p className="text-muted-foreground">
                Take control of your configuration management today.
              </p>
            </div>
            <Link href="/dashboard" className="pt-btn pt-btn-secondary h-12 px-6 self-start md:self-auto">
              Open dashboard
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
