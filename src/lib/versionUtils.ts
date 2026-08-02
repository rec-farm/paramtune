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

/**
 * Appends a version to an existing version list, deduplicating it.
 * Without dedup, resubmitting an already-existing version persists a
 * duplicate string, which then renders as a duplicate React list key and
 * a duplicate entry for every downstream sortVersionsDescending/semver-range
 * consumer.
 */
export function addVersion(versions: string[] | undefined, version: string): string[] {
  return Array.from(new Set([...(versions || []), version]))
}

/**
 * Deduplicates a version list, preserving first-occurrence order.
 * POST /api/[platform] (documented in docs/API.md) lets an external caller
 * submit the full "versions" array directly, unlike POST /api/[platform]/versions
 * which already dedupes via addVersion. Without this, a caller resubmitting
 * an existing version persists a duplicate string, hitting the same
 * duplicate-React-key / duplicate-sortVersionsDescending-entry bug addVersion
 * was written to prevent.
 */
export function dedupeVersions(versions: string[]): string[] {
  return Array.from(new Set(versions))
}
