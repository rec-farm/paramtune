import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import TopNav from '@/components/TopNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Remote Config',
  description: 'Manage platform schemas and versions with a clean, modern UI.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased min-h-dvh text-neutral-200 bg-neutral-950`}>
        <TopNav />
        <div className="relative">
          {children}
        </div>
      </body>
    </html>
  )
}
