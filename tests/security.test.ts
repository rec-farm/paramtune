import { describe, it, expect } from 'vitest'
import { highlightJsonLine } from '../src/components/JsonEditable/utils/optimizedSyntaxHighlighter'
import { sanitizeHtml } from '../src/lib/sanitize'

describe('Security: Syntax Highlighter XSS', () => {
  it('should escape HTML tags in JSON values', () => {
    const maliciousLine = '  "key": "<img src=x onerror=alert(1)>"'
    const highlighted = highlightJsonLine(maliciousLine)

    expect(highlighted).not.toContain('<img')
    expect(highlighted).toContain('&lt;img')
  })

  it('should escape HTML tags in JSON keys', () => {
    const maliciousLine = '  "<img src=x onerror=alert(1)>": "value"'
    const highlighted = highlightJsonLine(maliciousLine)

    expect(highlighted).not.toContain('<img')
    expect(highlighted).toContain('&lt;img')
  })

  it('should handle ampersands correctly', () => {
    const line = '  "key": "value & more"'
    const highlighted = highlightJsonLine(line)

    expect(highlighted).toContain('value &amp; more')
  })
})

describe('Security: sanitizeHtml function', () => {
  it('should allow safe span tags from highlighter', () => {
    const safeHtml = '<span class="text-purple-400 font-medium">"key"</span>'
    const sanitized = sanitizeHtml(safeHtml)
    expect(sanitized).toBe(safeHtml)
  })

  it('should allow multiple safe span tags', () => {
    const safeHtml = '<span class="text-purple-400">"key"</span>: <span class="text-green-400">"value"</span>'
    const sanitized = sanitizeHtml(safeHtml)
    expect(sanitized).toBe(safeHtml)
  })

  it('should strip script tags', () => {
    const malicious = '<script>alert(1)</script>Hello'
    const sanitized = sanitizeHtml(malicious)
    expect(sanitized).toBe('alert(1)Hello')
  })

  it('should strip malicious attributes from spans', () => {
    const malicious = '<span class="key" onerror="alert(1)">"value"</span>'
    const sanitized = sanitizeHtml(malicious)
    expect(sanitized).not.toContain('onerror')
    // It should strip the entire tag because it doesn't match our strict pattern
    expect(sanitized).toBe('"value"</span>')
  })

  it('should strip img tags with handlers', () => {
    const malicious = '<img src=x onerror=alert(1)>'
    const sanitized = sanitizeHtml(malicious)
    expect(sanitized).toBe('')
  })

  it('should handle nested malicious tags', () => {
    const malicious = '<span class="key">"val <img src=x onerror=alert(1)> u"</span>'
    const sanitized = sanitizeHtml(malicious)
    expect(sanitized).toBe('<span class="key">"val  u"</span>')
  })

  it('should allow colons and slashes in class names (Tailwind classes)', () => {
    const tailwindHtml = '<span class="bg-cyan-400/10 px-1 rounded">"@extends"</span>'
    const sanitized = sanitizeHtml(tailwindHtml)
    expect(sanitized).toBe(tailwindHtml)
  })

  it('should not be bypassed by case variations', () => {
    const malicious = '<SCRIPT>alert(1)</SCRIPT>'
    const sanitized = sanitizeHtml(malicious)
    expect(sanitized).toBe('alert(1)')
  })
})
