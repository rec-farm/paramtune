import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Effect } from 'effect'
import { NextResponse } from 'next/server'
import { handleApi, failWith, handleApiWithFailures } from '@/lib/apiHandler'

vi.mock('next/server', () => {
  class MockNextResponse {
    _body: any
    _init: any

    constructor(body?: any, init?: any) {
      this._body = body
      this._init = init
    }

    static json(body: any, init?: any) {
      const response = new MockNextResponse(body, init)
      ;(response as any).json = async () => body
      return response
    }
  }
  return { NextResponse: MockNextResponse }
})

describe('apiHandler', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    consoleErrorSpy.mockRestore()
  })

  describe('handleApi', () => {
    it('returns successful response', async () => {
      const effect = Effect.succeed({ data: 'success' })
      const response = await handleApi(effect, { status: 201, headers: { 'X-Custom': '1' } }) as any

      expect(response._body).toEqual({ data: 'success' })
      expect(response._init.status).toBe(201)
      expect(response._init.headers).toEqual({ 'Cache-Control': 'no-store', 'X-Custom': '1' })
    })

    it('handles fail(Error) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.fail(new Error('Dev error message'))
      const response = await handleApi(effect) as any

      expect(response._body).toEqual({ error: 'Dev error message' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Dev error message', expect.any(Error))
    })

    it('handles fail(Error) in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.fail(new Error('Secret error message'))
      const response = await handleApi(effect) as any

      expect(response._body).toEqual({ error: 'Internal Server Error' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Secret error message', expect.any(Error))
    })

    it('handles fail(string) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.fail('String error')
      const response = await handleApi(effect) as any

      expect(response._body).toEqual({ error: 'String error' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('String error', 'String error')
    })

    it('handles die(Error) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.die(new Error('Unexpected defect'))
      const response = await handleApi(effect) as any

      expect(response._body).toEqual({ error: 'Unexpected defect' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected defect', expect.any(Error))
    })

    it('handles die(Error) in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.die(new Error('Unexpected defect'))
      const response = await handleApi(effect) as any

      expect(response._body).toEqual({ error: 'Internal Server Error' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected defect', expect.any(Error))
    })
  })

  describe('failWith', () => {
    it('creates an Effect that fails with a NextResponse', async () => {
      const effect = failWith('Validation failed', 400)

      const result = await Effect.runPromise(Effect.either(effect))

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response._body).toEqual({ error: 'Validation failed' })
        expect(response._init.status).toBe(400)
      }
    })
  })

  describe('handleApiWithFailures', () => {
    it('returns successful response', async () => {
      const effect = Effect.succeed({ data: 'success' })
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ data: 'success' })
      expect(response._init.status).toBe(200)
      expect(response._init.headers).toEqual({ 'Cache-Control': 'no-store' })
    })

    it('handles expected NextResponse failure', async () => {
      const effect = failWith('Validation error', 422)
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ error: 'Validation error' })
      expect(response._init.status).toBe(422)
    })

    it('handles unexpected string failure in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.fail('Unexpected string failure' as any)
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ error: 'Unexpected string failure' })
      expect(response._init.status).toBe(500)
    })

    it('handles unexpected string failure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.fail('Unexpected string failure' as any)
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ error: 'Internal Server Error' })
      expect(response._init.status).toBe(500)
    })

    it('handles die(Error) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.die(new Error('Fatal error'))
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ error: 'Fatal error' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Fatal error', expect.any(Error))
    })

    it('handles die(Error) in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.die(new Error('Fatal error'))
      const response = await handleApiWithFailures(effect) as any

      expect(response._body).toEqual({ error: 'Internal Server Error' })
      expect(response._init.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Fatal error', expect.any(Error))
    })
  })
})
