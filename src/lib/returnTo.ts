// Resolve against this origin instead of string checks: browsers drop tabs and
// newlines while parsing, so '/\t/evil.example' would become '//evil.example'.
export function safeReturnTo(raw: string | null, origin = window.location.origin): string {
  const unsafe = [...(raw ?? '')].some((char) => char === '\\' || char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x7f)
  if (!raw || !raw.startsWith('/') || unsafe) return '/dashboard'
  try {
    const url = new URL(raw, origin)
    if (url.origin !== origin || url.pathname.startsWith('/api/')) return '/dashboard'
    return url.pathname + url.search + url.hash
  } catch {
    return '/dashboard'
  }
}
