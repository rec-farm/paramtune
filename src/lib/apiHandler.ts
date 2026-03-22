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
