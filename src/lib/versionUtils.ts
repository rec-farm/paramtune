import semver from 'semver'

/**
 * Sort version strings in descending order (newest first)
 * Uses the semver package for proper semantic version sorting
 */
export function sortVersionsDescending(versions: string[]): string[] {
  return [...versions].sort(semver.rcompare)
}
