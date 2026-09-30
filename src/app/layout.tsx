import type { Metadata } from 'next'
import { Syncopate, Space_Mono } from 'next/font/google'
import './globals.css'

const syncopate = Syncopate({
  weight: ['700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-fragmented',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ParamTune - Configuration Management',
  description:
    'Manage platform schemas and versions with a fast, elegant interface. Built for modern teams.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${syncopate.variable} ${spaceMono.variable}`}>
      <body className="font-fragmented antialiased min-h-screen bg-background text-foreground">
        <div className="relative">{children}</div>
      </body>
    </html>
  )
}
