export const OIDC_PROVIDER_ID = 'oidc'

// Placeholder addresses identify the account but aren't worth showing anyone
export function displayEmail(email: string | null | undefined) {
  return email && !email.endsWith('.invalid') ? email : null
}

export interface LoginProviders {
  oidc: { label: string } | null
  development: boolean
}
