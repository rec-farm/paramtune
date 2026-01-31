'use client'

import UserMenu from './UserMenu'

// Auth-aware navigation component for header
// Dynamically imported with ssr: false to avoid React context issues during static generation
export default function AuthNav() {
  return <UserMenu />
}
