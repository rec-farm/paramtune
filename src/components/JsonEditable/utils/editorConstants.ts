// Constants for consistent editor styling
export const EDITOR_CONSTANTS = {
  LINE_HEIGHT: 24, // pixels
  FONT_SIZE: 14, // pixels
  FONT_FAMILY: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  PADDING_TOP: 16, // pixels
  PADDING_LEFT: 48, // pixels - space for line numbers
  PADDING_RIGHT: 16, // pixels
  PADDING_BOTTOM: 16, // pixels
  MIN_HEIGHT: 400, // pixels
} as const

// Helper function to calculate line number width based on line count
export function calculateLineNumberWidth(lineCount: number): number {
  const digits = Math.max(1, Math.floor(Math.log10(lineCount)) + 1)
  return Math.max(32, digits * 8 + 16) // 8px per digit + 16px padding
}

// Helper function to get consistent editor styles
export function getEditorStyles() {
  return {
    lineHeight: `${EDITOR_CONSTANTS.LINE_HEIGHT}px`,
    fontSize: `${EDITOR_CONSTANTS.FONT_SIZE}px`,
    fontFamily: EDITOR_CONSTANTS.FONT_FAMILY,
    paddingTop: `${EDITOR_CONSTANTS.PADDING_TOP}px`,
    paddingLeft: `${EDITOR_CONSTANTS.PADDING_LEFT}px`,
    paddingRight: `${EDITOR_CONSTANTS.PADDING_RIGHT}px`,
    paddingBottom: `${EDITOR_CONSTANTS.PADDING_BOTTOM}px`,
    minHeight: `${EDITOR_CONSTANTS.MIN_HEIGHT}px`,
  }
}

// Helper function to get line number styles
export function getLineNumberStyles() {
  return {
    lineHeight: `${EDITOR_CONSTANTS.LINE_HEIGHT}px`,
    fontSize: '12px',
    fontFamily: EDITOR_CONSTANTS.FONT_FAMILY,
    height: `${EDITOR_CONSTANTS.LINE_HEIGHT}px`,
  }
}
