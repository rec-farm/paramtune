export function freePort(): Promise<number>
export function compileRust(): Promise<void>
export function startBackend(options?: {
  env?: NodeJS.ProcessEnv
  development?: boolean
  onExit?: (code: number) => void
}): Promise<{ close(): Promise<void> }>
