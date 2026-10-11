import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import NavHeader from '@/components/NavHeader'
import Footer from '@/components/Footer'

import MockDashboard from '@/components/MockDashboard'

import QuickStart from '@/components/QuickStart'

const REPO_URL = 'https://github.com/rec-farm/paramtune'

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
    <div className="mb-8">
      <h2 id={id} className="pt-title-2">
        {title}
      </h2>
      <p className="mt-3 max-w-[45ch] text-lg text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <NavHeader />
      {/* Marketing uses the 16px base (§4) */}
      <main className="text-lg">
        {/* Hero: display-hero with the purple period over a dot grid (§9) */}
        <section className="pt-dot-grid border-b border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-16 md:pt-24 md:pb-24">
            <p className="pt-eyebrow">Open source · Self-hosted · API-first</p>

            <h1 className="mt-4 max-w-[14ch] font-sans text-[44px] sm:text-[56px] md:text-[72px] font-extrabold leading-[0.95] tracking-[-0.04em] break-words">
              Every config, finely tuned<span className="pt-period">.</span>
            </h1>

            <p className="mt-6 max-w-[60ch] text-lg text-muted-foreground">
              One calm place to manage, version and validate the JSON schemas
              behind every platform you ship. Self-hosted, so your data stays
              yours.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#quickstart" className="pt-btn pt-btn-primary h-11 px-[18px] text-[15px]">
                Get started
              </a>
              <Link
                to={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pt-btn pt-btn-secondary h-11 px-[18px] text-[15px]"
              >
                View on GitHub
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Product preview */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <figure className="rounded-sm border border-border bg-surface overflow-hidden">
            <div className="flex items-center h-10 px-4 border-b border-border">
              <span className="font-mono text-xs text-meta truncate">
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
            subtitle="Teams who want their configs calm and accounted for."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUDIENCES.map((item, index) => (
              <li
                key={item.title}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <h3 className="text-lg font-bold tracking-[-0.005em]">{item.title}</h3>
                <p className="text-base text-muted-foreground">
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
            subtitle="Everything you need to change configs with confidence."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <span className="pt-label text-meta">{feature.label}</span>
                <h3 className="text-lg font-bold tracking-[-0.005em]">{feature.title}</h3>
                <p className="text-base text-muted-foreground">
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
            subtitle="Your configs, on your servers, under your rules."
          />
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPARISONS.map((item, index) => (
              <li
                key={item.label}
                className={`pt-card p-6 space-y-2 animate-in ${STAGGER[index]}`}
              >
                <span className="pt-label text-meta">{item.label}</span>
                <h3 className="text-lg font-bold tracking-[-0.005em]">{item.title}</h3>
                <p className="text-base text-muted-foreground">
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
              <h2 className="pt-title-2">Ready when you are</h2>
              <p className="text-lg text-muted-foreground">
                Spin it up in a minute. We&apos;ll keep an eye on the rest.
              </p>
            </div>
            <Link to="/dashboard" className="pt-link-tertiary self-start md:self-auto">
              Open dashboard <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
