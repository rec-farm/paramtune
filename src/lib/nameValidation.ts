export const VALID_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/
export const VALID_VERSION_REGEX = /^[a-zA-Z0-9.+-]+$/
export const MAX_NAME_LENGTH = 128

/**
 * Checks whether a platform name matches the format API routes enforce via
 * validateName in apiHandler.ts: 1-MAX_NAME_LENGTH characters, alphanumeric
 * plus underscores/hyphens/dots. Kept free of server-only dependencies
 * (unlike apiHandler.ts, which pulls in response handling and lib/auth) so client
 * components can import it directly.
 */
export function isValidName(name: string): boolean {
  return name.length > 0 && name.length <= MAX_NAME_LENGTH && VALID_NAME_REGEX.test(name)
}

/**
 * Checks whether a version name is safe to use as a Redis key component and a
 * URL path segment. Versions need their own charset because `+` is legal in a
 * semver build-metadata suffix ("1.2.3+build.5") but is rejected by
 * VALID_NAME_REGEX, so a version that isValidVersion accepts could not be
 * read back through routes that validated it as a generic name.
 *
 * Deliberately weaker than isValidVersion (which additionally requires valid
 * semver): read paths use this one so that a version already stored by an
 * earlier, more permissive version of the app stays retrievable rather than
 * 400ing, while still refusing whitespace, slashes and oversized keys.
 */
export function isValidVersionName(version: string): boolean {
  return (
    version.length > 0 &&
    version.length <= MAX_NAME_LENGTH &&
    VALID_VERSION_REGEX.test(version)
  )
}
