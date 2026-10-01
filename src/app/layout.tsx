import type { Metadata, Viewport } from 'next'
import { Archivo, Figtree, Geist_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Paramtune · Configuration management',
  description:
    'Self-hosted, API-first configuration management for every platform you ship.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0b0c' },
    { media: '(prefers-color-scheme: light)', color: '#f7f1e3' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-product="paramtune"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${figtree.variable} ${geistMono.variable}`}
      // The init script swaps data-theme before hydration
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <div className="relative">{children}</div>
      </body>
    </html>
  )
}
