import { describe, it, expect } from 'vitest'
import { highlightJsonLine } from '../src/components/JsonEditable/utils/optimizedSyntaxHighlighter'

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
