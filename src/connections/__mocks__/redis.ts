import { vi } from 'vitest'

export const zrevrangebyscore = vi.fn()
export const zadd = vi.fn()
export const zcard = vi.fn()
export const zremrangebyrank = vi.fn()
export const sadd = vi.fn()
export const smembers = vi.fn()
export const scan = vi.fn()
export const lpush = vi.fn()
export const ltrim = vi.fn()
export const lrange = vi.fn()

export const pipeline = vi.fn(function () {
  const pipelineCommands: { command: string; args: unknown[] }[] = []
  return {
    zrevrangebyscore: function (...args: unknown[]) {
      pipelineCommands.push({ command: 'zrevrangebyscore', args })
      return this
    },
    lpush: function (...args: unknown[]) {
      pipelineCommands.push({ command: 'lpush', args })
      return this
    },
    ltrim: function (...args: unknown[]) {
      pipelineCommands.push({ command: 'ltrim', args })
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
          if (cmd.command === 'lpush') {
            try {
              const res = await lpush(...cmd.args)
              return [null, res]
            } catch (err) {
              return [err, null]
            }
          }
          if (cmd.command === 'ltrim') {
            try {
              const res = await ltrim(...cmd.args)
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

const mockRedis = {
  zrevrangebyscore,
  zadd,
  zcard,
  zremrangebyrank,
  sadd,
  smembers,
  scan,
  lpush,
  ltrim,
  lrange,
  pipeline,
}
export default mockRedis
