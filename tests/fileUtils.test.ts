import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { downloadAsJson, copyToClipboard } from '@/lib/fileUtils'

describe('copyToClipboard', () => {
  let mockWriteText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockWriteText = vi.fn().mockResolvedValue(undefined)

    // Mock global navigator
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-ignore
    delete navigator.clipboard
  })

  it('copies text to clipboard', async () => {
    const text = 'test text'

    await copyToClipboard(text)

    expect(mockWriteText).toHaveBeenCalledWith(text)
  })

  it('logs and re-throws errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Clipboard write failed')

    mockWriteText.mockRejectedValue(error)

    await expect(copyToClipboard('text')).rejects.toThrow(error)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', error)
  })
})

describe('downloadAsJson', () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>
  let mockCreateElement: ReturnType<typeof vi.fn>
  let mockAppendChild: ReturnType<typeof vi.fn>
  let mockAnchor: any
  let mockBlob: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue('mock-url')
    mockRevokeObjectURL = vi.fn()

    // Mock global URL
    globalThis.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    } as any

    mockBlob = vi.fn()
    globalThis.Blob = mockBlob as any

    mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    }

    mockAppendChild = vi.fn()
    mockCreateElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor
      return {}
    })

    // Mock global document
    globalThis.document = {
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
      },
    } as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-ignore
    delete globalThis.URL
    // @ts-ignore
    delete globalThis.Blob
    // @ts-ignore
    delete globalThis.document
  })

  it('creates and downloads a JSON file with provided filename', () => {
    const content = '{"test":"data"}'
    const filename = 'test.json'

    downloadAsJson(content, filename)

    // Check Blob creation
    expect(mockBlob).toHaveBeenCalledWith([content], {
      type: 'application/json',
    })

    // Check URL operations
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url')

    // Check DOM operations
    expect(mockCreateElement).toHaveBeenCalledWith('a')
    expect(mockAnchor.href).toBe('mock-url')
    expect(mockAnchor.download).toBe(filename)
    expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor)
    expect(mockAnchor.click).toHaveBeenCalled()
    expect(mockAnchor.remove).toHaveBeenCalled()
  })

  it('uses default filename when none is provided', () => {
    const content = '{"test":"data"}'

    downloadAsJson(content)

    expect(mockAnchor.download).toBe('data.json')
  })

  it('logs and re-throws errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Blob creation failed')

    // Create a constructor that throws
    globalThis.Blob = vi.fn().mockImplementation(function() {
      throw error
    }) as any

    expect(() => downloadAsJson('content')).toThrow(error)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Download failed:', error)
  })
})
