import type { Permissions } from '@/client/router'

/** Whether this user may change `platform`: the general write permission plus its editor group. */
export const canWritePlatform = (permissions: Permissions, platform: string) =>
  permissions.write && !(permissions.restricted ?? []).includes(platform)

export default function PlatformReadOnly({ platform }: { platform: string }) {
  return (
    <p role="status" className="pt-card border-l-4 border-l-accent p-4 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">View only.</span> Only <span className="font-mono">{platform}</span>’s editors can change it. Ask an administrator to add you to its editor group.
    </p>
  )
}
