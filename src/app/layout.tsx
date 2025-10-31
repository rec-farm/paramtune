import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <div className="relative">{children}</div>
      </body>
    </html>
  )
}
