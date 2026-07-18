export const VALID_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/
export const MAX_NAME_LENGTH = 128

/**
 * Checks whether a platform or version name matches the format API routes
 * enforce via validateName in apiHandler.ts: 1-MAX_NAME_LENGTH characters,
 * alphanumeric plus underscores/hyphens/dots. Kept free of server-only
 * dependencies (unlike apiHandler.ts, which pulls in next/server and
 * lib/auth) so client components can import it directly.
 */
export function isValidName(name: string): boolean {
  return name.length > 0 && name.length <= MAX_NAME_LENGTH && VALID_NAME_REGEX.test(name)
}
