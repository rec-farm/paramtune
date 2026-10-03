import { Effect } from 'effect'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  VALID_NAME_REGEX,
  VALID_VERSION_REGEX,
  MAX_NAME_LENGTH,
  isValidName,
  isValidVersionName,
} from '@/lib/nameValidation'

export {
  VALID_NAME_REGEX,
  VALID_VERSION_REGEX,
  MAX_NAME_LENGTH,
  isValidName,
  isValidVersionName,
}

type ApiResponseInit = {
  status?: number
  headers?: Record<string, string>
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const

/**
 * Builds the 500 response for unexpected failures. The real message is only
 * exposed in development; production clients get a generic body.
 */
function internalErrorResponse(message: string) {
  return NextResponse.json(
    {
      error:
        process.env.NODE_ENV === 'development'
          ? message
          : 'Internal Server Error',
    },
    { status: 500 }
  )
}

function createErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage
  console.error(message, error)
  return Effect.succeed(internalErrorResponse(message))
}

/**
 * Percent-decodes a URL path parameter, failing with 400 on malformed escapes
 * (e.g. "%E0%A4%A"). A bare decodeURIComponent throws a URIError there, which
 * surfaces as a 500 for what is a client mistake.
 */
export function decodeParam(value: string, label: string) {
  return Effect.try({
    try: () => decodeURIComponent(value),
    catch: () =>
      NextResponse.json(
        { error: `Invalid ${label}: malformed percent-encoding` },
        { status: 400 },
      ),
  })
}

/**
 * Validates a platform or version name from URL parameters.
 */
export function validateName(name: string, label: string) {
  return Effect.gen(function* () {
    if (!name || name.length > MAX_NAME_LENGTH) {
      return yield* failWith(`Invalid ${label}: must be 1-${MAX_NAME_LENGTH} characters`, 400)
    }
    if (!VALID_NAME_REGEX.test(name)) {
      return yield* failWith(
        `Invalid ${label}: only alphanumeric characters, underscores, hyphens, and dots are allowed`,
        400,
      )
    }
    return name
  })
}

/**
 * Validates a version name from URL parameters.
 *
 * Separate from validateName because versions may carry a semver build-metadata
 * suffix ("1.2.3+build.5"), and `+` is not in VALID_NAME_REGEX — validating a
 * version as a generic name rejects versions the write paths accept, leaving
 * them stored but unreadable. This checks only that the value is a safe key/URL
 * component, not that it is semver: write paths enforce semver via
 * isValidVersion, while lookups stay permissive so versions stored before that
 * rule existed still resolve (to a 404 if absent, rather than a 400).
 */
export function validateVersionName(version: string) {
  return Effect.gen(function* () {
    if (!version || version.length > MAX_NAME_LENGTH) {
      return yield* failWith(`Invalid version name: must be 1-${MAX_NAME_LENGTH} characters`, 400)
    }
    if (!isValidVersionName(version)) {
      return yield* failWith(
        'Invalid version name: only alphanumeric characters, dots, hyphens, and plus signs are allowed',
        400,
      )
    }
    return version
  })
}

/**
 * Parses a request's JSON body, resolving to null if parsing fails.
 */
export function parseJsonBody(request: Request) {
  return Effect.tryPromise({
    try: () => request.json(),
    catch: () => 'parse-error' as const,
  }).pipe(Effect.catchAll(() => Effect.succeed(null)))
}

/**
 * Creates an Effect that fails with a JSON error response.
 * Use for validation errors, not-found, etc.
 */
export const failWith = (
  error: string,
  status: number
): Effect.Effect<never, NextResponse> =>
  Effect.fail(NextResponse.json({ error }, { status }))

/**
 * Validates the user session and returns it, or fails with 401.
 */
export function requireSession(request: Request) {
  return Effect.gen(function* () {
    const session = yield* Effect.promise(() =>
      auth.api.getSession({ headers: request.headers })
    )
    if (!session) {
      return yield* failWith('Unauthorized', 401)
    }
    return session
  })
}

/**
 * Runs an API handler that may short-circuit with a NextResponse error.
 * Handles both expected failures (validation, not-found) and unexpected defects.
 */
export function handleApiWithFailures<A>(
  effect: Effect.Effect<A, NextResponse>,
  init?: ApiResponseInit
): Promise<NextResponse> {
  return Effect.runPromise(
    effect.pipe(
      Effect.map((data) =>
        NextResponse.json(data, {
          status: init?.status ?? 200,
          headers: { ...NO_STORE, ...init?.headers },
        })
      ),
      Effect.catchAll((response) =>
        response instanceof NextResponse
          ? Effect.succeed(response)
          : Effect.succeed(internalErrorResponse(String(response)))
      ),
      Effect.catchAllDefect((error) => createErrorResponse(error, 'Unknown error'))
    )
  )
}
