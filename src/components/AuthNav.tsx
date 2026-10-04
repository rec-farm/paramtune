import UserMenu from './UserMenu'

// Auth-aware navigation component for header
// Session state loads in the browser; public pages can be prerendered without a database.
export default function AuthNav() {
  return <UserMenu />
}
