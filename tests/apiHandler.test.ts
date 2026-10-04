import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Effect } from 'effect'
import { failWith, handleApiWithFailures, validateName, validateVersionName, parseJsonBody } from '@/lib/apiHandler'


describe('apiHandler', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    consoleErrorSpy.mockRestore()
  })

  describe('failWith', () => {
    it('creates an Effect that fails with a Response', async () => {
      const effect = failWith('Validation failed', 400)

      const result = await Effect.runPromise(Effect.either(effect))

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect((await response.json())).toEqual({ error: 'Validation failed' })
        expect(response.status).toBe(400)
      }
    })
  })

  describe('validateName', () => {
    it('accepts a simple alphanumeric name', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('myplatform', 'platform')))
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right).toBe('myplatform')
      }
    })

    it('accepts names with underscores, hyphens, and dots', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('my_platform-1.0', 'version')))
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right).toBe('my_platform-1.0')
      }
    })

    it('accepts a name of exactly 128 characters', async () => {
      const name = 'a'.repeat(128)
      const result = await Effect.runPromise(Effect.either(validateName(name, 'platform')))
      expect(result._tag).toBe('Right')
    })

    it('rejects an empty string with 400', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('', 'platform')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
        expect((await response.clone().json()).error).toContain('platform')
        expect((await response.json()).error).toContain('characters')
      }
    })

    it('rejects a name of 129 characters with 400', async () => {
      const name = 'a'.repeat(129)
      const result = await Effect.runPromise(Effect.either(validateName(name, 'platform')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
        expect((await response.json()).error).toContain('characters')
      }
    })

    it('rejects names containing spaces with 400', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('my platform', 'platform')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
        expect((await response.json()).error).toContain('alphanumeric')
      }
    })

    it('rejects names containing slashes (path traversal)', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('../secret', 'platform')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
      }
    })

    it('rejects names containing angle brackets', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('<script>', 'platform')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
      }
    })

    it('includes the label in error messages', async () => {
      const result = await Effect.runPromise(Effect.either(validateName('', 'version name')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect((await response.json()).error).toContain('version name')
      }
    })
  })

  describe('validateVersionName', () => {
    it('accepts a plain semver version', async () => {
      const result = await Effect.runPromise(Effect.either(validateVersionName('1.2.3')))
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right).toBe('1.2.3')
      }
    })

    it('accepts a version with build metadata that validateName would reject', async () => {
      const version = '1.2.3+build.5'
      const rejectedAsName = await Effect.runPromise(
        Effect.either(validateName(version, 'version name'))
      )
      expect(rejectedAsName._tag).toBe('Left')

      const result = await Effect.runPromise(Effect.either(validateVersionName(version)))
      expect(result._tag).toBe('Right')
      if (result._tag === 'Right') {
        expect(result.right).toBe(version)
      }
    })

    it('rejects an empty string with 400', async () => {
      const result = await Effect.runPromise(Effect.either(validateVersionName('')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
        expect((await response.json()).error).toContain('characters')
      }
    })

    it('rejects a version of 129 characters with 400', async () => {
      const result = await Effect.runPromise(Effect.either(validateVersionName('a'.repeat(129))))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
      }
    })

    it('rejects versions containing spaces with 400', async () => {
      const result = await Effect.runPromise(Effect.either(validateVersionName(' 1.2.3 ')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
      }
    })

    it('rejects versions containing slashes (path traversal)', async () => {
      const result = await Effect.runPromise(Effect.either(validateVersionName('../secret')))
      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        const response = result.left as any
        expect(response.status).toBe(400)
      }
    })
  })

  describe('parseJsonBody', () => {
    it('resolves the parsed body on valid JSON', async () => {
      const request = { json: async () => ({ version: '1.0.0' }) } as unknown as Request
      const result = await Effect.runPromise(parseJsonBody(request))
      expect(result).toEqual({ version: '1.0.0' })
    })

    it('resolves to null when the body is not valid JSON', async () => {
      const request = {
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      } as unknown as Request
      const result = await Effect.runPromise(parseJsonBody(request))
      expect(result).toBeNull()
    })
  })

  describe('handleApiWithFailures', () => {
    it('returns successful response', async () => {
      const effect = Effect.succeed({ data: 'success' })
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ data: 'success' })
      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
    })

    it('handles expected Response failure', async () => {
      const effect = failWith('Validation error', 422)
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ error: 'Validation error' })
      expect(response.status).toBe(422)
    })

    it('handles unexpected string failure in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.fail('Unexpected string failure' as any)
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ error: 'Unexpected string failure' })
      expect(response.status).toBe(500)
    })

    it('handles unexpected string failure in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.fail('Unexpected string failure' as any)
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ error: 'Internal Server Error' })
      expect(response.status).toBe(500)
    })

    it('handles die(Error) in development', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      const effect = Effect.die(new Error('Fatal error'))
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ error: 'Fatal error' })
      expect(response.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Fatal error', expect.any(Error))
    })

    it('handles die(Error) in production', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const effect = Effect.die(new Error('Fatal error'))
      const response = await handleApiWithFailures(effect) as any

      expect((await response.json())).toEqual({ error: 'Internal Server Error' })
      expect(response.status).toBe(500)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Fatal error', expect.any(Error))
    })
  })
})
