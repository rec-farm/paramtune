export function freePort(configured?: string): Promise<number>
export function compileRust(release?: boolean): Promise<void>
export function startBackend(options?: {
  env?: NodeJS.ProcessEnv
  watch?: boolean
  onExit?: (code: number) => void
}): Promise<{ close(): Promise<void> }>
