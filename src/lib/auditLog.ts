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

  await redis
    .pipeline()
    .lpush(AUDIT_LOG_KEY, JSON.stringify(auditEntry))
    .ltrim(AUDIT_LOG_KEY, 0, MAX_AUDIT_ENTRIES - 1)
    .exec()
}

export async function getAuditLog(limit = 50): Promise<AuditEntry[]> {
  const entries = await redis.lrange(AUDIT_LOG_KEY, 0, limit - 1)
  return entries.map((e) => JSON.parse(e) as AuditEntry)
}
