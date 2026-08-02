import redis from '@/connections/redis'

export type AuditAction = 'create' | 'update' | 'delete'

interface AuditEntry {
  timestamp: string
  action: AuditAction
  platform: string
  version?: string
  userEmail: string
  userId: string
}

const AUDIT_LOG_KEY = 'audit:log'
const MAX_AUDIT_ENTRIES = 1000

export async function logAudit(entry: Omit<AuditEntry, 'timestamp'>) {
  const auditEntry: AuditEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  try {
    await redis
      .pipeline()
      .lpush(AUDIT_LOG_KEY, JSON.stringify(auditEntry))
      .ltrim(AUDIT_LOG_KEY, 0, MAX_AUDIT_ENTRIES - 1)
      .exec()
  } catch (error) {
    // Audit logging is best-effort: the platform/version write it follows has
    // already succeeded, so a Redis blip here must not fail the caller's request.
    console.error('Failed to write audit log entry', error)
  }
}
