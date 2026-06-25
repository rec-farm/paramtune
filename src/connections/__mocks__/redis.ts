import { vi } from 'vitest'

export const zrevrangebyscore = vi.fn()
export const zadd = vi.fn()
export const sadd = vi.fn()
export const smembers = vi.fn()
export const scan = vi.fn()

export const pipeline = vi.fn(function () {
  const pipelineCommands: { command: string; args: unknown[] }[] = []
  return {
    zrevrangebyscore: function (...args: unknown[]) {
      pipelineCommands.push({ command: 'zrevrangebyscore', args })
      return this
    },
    exec: async function () {
      const results = await Promise.all(
        pipelineCommands.map(async (cmd) => {
          if (cmd.command === 'zrevrangebyscore') {
            try {
              const res = await zrevrangebyscore(...cmd.args)
              return [null, res]
            } catch (err) {
              return [err, null]
            }
          }
          return [new Error('Command not mocked in pipeline'), null]
        })
      )
      pipelineCommands.length = 0
      return results
    },
  }
})

const mockRedis = { zrevrangebyscore, zadd, sadd, smembers, scan, pipeline }
export default mockRedis
