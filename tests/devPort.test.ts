import { createServer, type Server } from 'node:net'
import { afterEach, expect, it } from 'vitest'
import { selectApiPort } from '../scripts/dev-port'

const servers: Server[] = []
afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
})

it('allocates a free API port while other services keep their ports', async () => {
  const occupied = createServer()
  servers.push(occupied)
  await new Promise<void>((resolve) => occupied.listen(0, '127.0.0.1', resolve))
  const address = occupied.address()
  if (!address || typeof address === 'string') throw new Error('Missing test port')
  const port = await selectApiPort()
  expect(port).toBeGreaterThan(0)
  expect(port).not.toBe(address.port)
  await expect(selectApiPort(String(address.port))).rejects.toThrow('unset API_PORT')
  expect(occupied.listening).toBe(true)
  await expect(selectApiPort(String(port))).resolves.toBe(port)
})

it.each(['abc', '-1', '65536', '1.5'])('rejects invalid API_PORT=%s', async (value) => {
  await expect(selectApiPort(value)).rejects.toThrow('API_PORT must be an integer')
})
