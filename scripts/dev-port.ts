import { createServer } from 'node:net'

/** Let the OS allocate a port unless the developer explicitly pins one. */
export async function selectApiPort(configured?: string): Promise<number> {
  const port = configured ? Number(configured) : 0
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('API_PORT must be an integer between 0 and 65535')
  }
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', (error) => reject(new Error(
      `Cannot bind API_PORT=${port}. Choose a free port or unset API_PORT for automatic allocation.`,
      { cause: error },
    )))
    probe.listen(port, '127.0.0.1', () => {
      const address = probe.address()
      if (!address || typeof address === 'string') {
        probe.close()
        reject(new Error('Could not determine the API port'))
        return
      }
      probe.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}
