import semver from 'semver'

/**
 * Sort version strings in descending order (newest first)
 * Uses the semver package for proper semantic version sorting
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort(semver.rcompare)
}

/**
 * Checks whether a string is a valid semantic version.
 *
 * Version names must be valid semver: they're sorted with `semver.rcompare`
 * (via sortVersionsDescending) and matched against semver ranges like "^1.0.0"
 * during `@extends` dependency resolution. A non-semver version string (e.g.
 * "latest", "v1", "1.2") slipping into a platform's version list makes those
 * calls throw at read time, well after the invalid version was created.
 */
export function isValidVersion(version: string): boolean {
  return semver.valid(version) !== null
}

/**
 * Checks whether a value is an array of valid semantic version strings.
 * Used to validate the "versions" field of a platform payload before it's
 * persisted, since a malformed value (e.g. a non-array or an entry that
 * isn't valid semver) breaks sortVersionsDescending and @extends resolution
 * the same way a single invalid version does.
 */
export function isValidVersionsList(versions: unknown): versions is string[] {
  return (
    Array.isArray(versions) &&
    versions.every((v) => typeof v === 'string' && isValidVersion(v))
  )
}
