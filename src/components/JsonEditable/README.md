# JsonEditable Component

A highly modular, performant JSON editor component built with React and TypeScript. This component provides a rich editing experience with syntax highlighting, auto-completion, validation, and keyboard shortcuts.

## Features

- **Syntax Highlighting**: Real-time JSON syntax highlighting using the Paramtune Console token colors
- **Auto-completion**: Smart auto-completion for braces, brackets, and quotes
- **Validation**: Real-time JSON validation with error reporting
- **Keyboard Shortcuts**: Tab indentation, Enter for new lines, auto-closing brackets
- **Performance Optimized**: Debounced highlighting, throttled validation, memoized components
- **Modular Architecture**: Highly modular design for easy customization and maintenance
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Architecture

The component is organized into several modules:

### Hooks

- `useJsonEditor`: Main state management for JSON editing
- `useTextareaRef`: Textarea reference and cursor management

### Utilities

- `syntaxHighlighter`: JSON syntax highlighting logic
- `keyboardHandlers`: Keyboard event handling and auto-completion
- `performance`: Performance optimization utilities (debouncing, throttling, virtualization)

### Components

- `ValidationStatus`: Shows validation status with icons
- `ActionButtons`: Format, copy, and download buttons
- `ErrorDisplay`: Error message display
- `LineNumbers`: Line number display
- `JsonTextarea`: Main textarea component
- `SyntaxHighlightOverlay`: Syntax highlighting overlay

### Types

- Comprehensive TypeScript interfaces for all components and utilities

## Usage

### Basic Usage

```tsx
import { JsonEditable } from '@/components/JsonEditable'

function MyComponent() {
  return (
    <JsonEditable
      title="Configuration"
      name="config"
      defaultValue='{"key": "value"}'
      onValidationChange={(isValid) => console.log('Valid:', isValid)}
    />
  )
}
```

### Advanced Usage

```tsx
import { JsonEditable } from '@/components/JsonEditable'

function AdvancedEditor() {
  return (
    <JsonEditable
      title="Advanced Configuration"
      name="advancedConfig"
      defaultValue='{"extends": "@config/base"}'
      className="my-custom-class"
      placeholder="Enter your JSON configuration..."
      minHeight={500}
      showLineNumbers={true}
      showActions={true}
      syntaxHighlighting={true}
      onValidationChange={(isValid) => {
        // Handle validation changes
      }}
    />
  )
}
```

## Props

| Prop                 | Type                         | Default                 | Description                |
| -------------------- | ---------------------------- | ----------------------- | -------------------------- |
| `title`              | `string`                     | -                       | Title for the editor       |
| `name`               | `string`                     | -                       | Form field name            |
| `defaultValue`       | `string`                     | -                       | Initial JSON value         |
| `onValidationChange` | `(isValid: boolean) => void` | -                       | Validation change callback |
| `className`          | `string`                     | `''`                    | Additional CSS classes     |
| `placeholder`        | `string`                     | `'Enter valid JSON...'` | Placeholder text           |
| `minHeight`          | `number`                     | `400`                   | Minimum height in pixels   |
| `showLineNumbers`    | `boolean`                    | `true`                  | Show line numbers          |
| `showActions`        | `boolean`                    | `true`                  | Show action buttons        |
| `syntaxHighlighting` | `boolean`                    | `true`                  | Enable syntax highlighting |

## Customization

### Custom Syntax Highlighting Theme

```tsx
import {
  createCustomTheme,
  highlightJson,
} from '@/components/JsonEditable/utils/optimizedSyntaxHighlighter'

// Overrides are merged over the default dark theme (DESIGN.md token colors)
const customTheme = createCustomTheme({
  keys: 'text-muted-foreground',
})

const highlighted = highlightJson(jsonString, {}, customTheme)
```

### Custom Keyboard Handlers

```tsx
import { createKeyboardHandlers } from '@/components/JsonEditable'

const customHandlers = createKeyboardHandlers({
  insertTextAtCursor: (text) => {
    /* custom logic */
  },
  setCursorPosition: (pos) => {
    /* custom logic */
  },
  getCurrentLineInfo: () => {
    /* custom logic */
  },
  onTextChange: (value) => {
    /* custom logic */
  },
})
```

## Performance Features

### Debounced Highlighting

Syntax highlighting is debounced by 150ms to prevent excessive re-renders during typing.

### Throttled Validation

Validation changes are throttled to 100ms to prevent excessive validation calls.

### Memoized Components

All sub-components are memoized to prevent unnecessary re-renders.

### Virtualization Support

Optional virtualization for large JSON files (available in performance utilities).

## Keyboard Shortcuts

| Key     | Action                                   |
| ------- | ---------------------------------------- |
| `Tab`   | Insert 2 spaces                          |
| `Enter` | New line with smart indentation          |
| `{`     | Auto-complete with closing brace         |
| `[`     | Auto-complete with closing bracket       |
| `"`     | Auto-complete quotes                     |
| `}`     | Smart auto-close with proper indentation |
| `]`     | Smart auto-close with proper indentation |

## Error Handling

The component provides comprehensive error handling:

- **Syntax Errors**: Real-time JSON syntax validation
- **Clipboard Errors**: Graceful fallback for clipboard operations
- **File Download Errors**: Error handling for file operations

## Browser Support

- Modern browsers with ES6+ support
- React 18+
- TypeScript 4.5+

## Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm typecheck
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure TypeScript types are comprehensive

## License

MIT License
