import { Link } from 'react-router'
import { CircleCheck } from 'lucide-react'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Platform', description: 'A group of configuration for one app or service, such as iOS, web, or an API.' },
  { title: 'Version', description: 'A release identifier, such as 1.0.0, with its own configuration.' },
  { title: 'Configuration', description: 'The JSON settings your application reads, such as feature flags and limits.' },
]

export default function SetupGuide({ step, href, action }: { step: 0 | 1 | 2; href?: string; action?: string }) {
  return (
    <Card title="Create your first configuration" subtitle="Three steps to a saved configuration. You can leave and continue later.">
      <ol aria-label="Setup progress" className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((item, index) => (
          <li key={item.title} aria-current={index === step ? 'step' : undefined} className={cn('space-y-2 border-t-2 pt-3', index === step ? 'border-primary' : 'border-border')}>
            <p className="flex items-center gap-2 font-semibold">
              {index < step ? <CircleCheck className="h-5 w-5 text-success" aria-hidden="true" /> : <span className="font-mono text-muted-foreground">{index + 1}.</span>}
              {item.title}
              {index === step && <span className="text-xs text-accent-text">Current</span>}
              <span className="sr-only">{index < step ? 'Complete' : index === step ? 'Current step' : 'Next step'}</span>
            </p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ol>
      {href && action && <div className="mt-5">{href.startsWith('#') ? <a href={href} className="pt-btn pt-btn-primary">{action}</a> : <Link to={href} className="pt-btn pt-btn-primary">{action}</Link>}</div>}
    </Card>
  )
}
