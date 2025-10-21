import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Link from 'next/link'
import { Rocket, Edit, Eye, Link2, Moon, Keyboard, Wrench } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-6 animate-in">
            <Badge variant="secondary" className="mb-4 gap-2">
              <Rocket className="w-4 h-4" />
              Powerful Configuration Management
            </Badge>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter">
              <span className="gradient-text">ParamTune</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Manage platform schemas and versions with a fast, elegant
              interface. Built for modern teams who need reliable configuration
              management.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
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
            <Button variant="ghost" size="lg" className="gap-2">
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to streamline your configuration
            management workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              title: 'Version Control',
              description:
                'Track and manage different versions of your configurations with comprehensive history and rollback capabilities.',
              badge: 'Core Feature',
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
              title: 'Schema Validation',
              description:
                'Ensure your configurations follow the correct schema structure with real-time validation and helpful error messages.',
              badge: 'Reliability',
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
              title: 'Multi-Platform',
              description:
                'Native support for iOS, Android, Web, and other platforms with unified configuration management.',
              badge: 'Universal',
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
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Schema Editing',
              description:
                'Edit JSON schemas with live preview and safe updates.',
              icon: <Edit className="w-5 h-5" />,
            },
            {
              title: 'Live Preview',
              description: 'Track and manage platform versions with badges.',
              icon: <Eye className="w-5 h-5" />,
            },
            {
              title: 'API Routes',
              description: 'Access schemas via streamlined API routes.',
              icon: <Link2 className="w-5 h-5" />,
            },
            {
              title: 'Dark UI',
              description: 'Minimal, accessible, Vercel-inspired interface.',
              icon: <Moon className="w-5 h-5" />,
            },
            {
              title: 'Keyboard First',
              description: 'Fast flows, clear focus states and shortcuts.',
              icon: <Keyboard className="w-5 h-5" />,
            },
            {
              title: 'Extensible',
              description: 'Composable components for rapid customization.',
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

        <div className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
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
  )
}
