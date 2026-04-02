import { Effect } from 'effect'
import { NextResponse } from 'next/server'

type ApiResponseInit = {
  status?: number
  headers?: Record<string, string>
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const

function createErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage
  console.error(message, error)
  return Effect.succeed(
    NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? message
            : 'Internal Server Error',
      },
      { status: 500 }
    )
  )
}

/**
 * Runs an Effect pipeline and converts the result to a NextResponse.
 * Replaces the repetitive try/catch + conditional error message pattern
 * across all API routes.
 */
export function handleApi<A>(
  effect: Effect.Effect<A, unknown>,
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
      Effect.catchAllDefect((error) => createErrorResponse(error, 'Unknown error')),
      Effect.catchAll((error) => createErrorResponse(error, String(error)))
    )
  )
}

const VALID_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/
const MAX_NAME_LENGTH = 128

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
 * Creates an Effect that fails with a JSON error response.
 * Use for validation errors, not-found, etc.
 */
export const failWith = (
  error: string,
  status: number
): Effect.Effect<never, NextResponse> =>
  Effect.fail(NextResponse.json({ error }, { status }))

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
          : Effect.succeed(
              NextResponse.json(
                {
                  error:
                    process.env.NODE_ENV === 'development'
                      ? String(response)
                      : 'Internal Server Error',
                },
                { status: 500 }
              )
            )
      ),
      Effect.catchAllDefect((error) => createErrorResponse(error, 'Unknown error'))
    )
  )
}
