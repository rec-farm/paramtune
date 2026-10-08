# Paramtune Console

> Category: Developer Tools
> The Paramtune dashboard on the REC Design System v1.4.1: warm ink and paper neutrals, REC purple for action, a mint product accent for place, pastel status tiles, near-square corners and hard offset shadows.

Origin: the Paramtune configuration dashboard (Vite, React, Tailwind v4, shadcn new-york). Two themes: Dark (default) and Paper, plus a System option that follows the OS.

Source of truth is the code; this document summarizes it:

- `src/client/tokens.css`: primitives, the semantic layer per theme, the product accent and shadcn aliases.
- `src/client/globals.css`: Tailwind `@theme` mapping (fonts, radii, type scale, shadows, color utilities) and base styles.
- `src/client/components.css`: `pt-` component classes.
- `src/lib/theme.ts` and `src/components/ThemeSwitcher.tsx`: theme choice and persistence.

## 1. Visual Theme & Atmosphere

A developer console for people who read keys, versions and diffs all day. Surfaces are flat with 1px lines; emphasis comes from a few hard, blur-free offset shadows rather than glow, blur or gradients.

- **Action vs place:** REC purple (`--primary-bg`) marks the primary action, links and the focus ring. The Paramtune mint accent (`--accent-bg`, set by `html[data-product='paramtune']`) marks where you are, such as the active navigation item. It never marks an action.
- **Status:** pastel signals (mint, sun, rose, lilac) mean status and always come with an icon or a word.
- **Density:** 36px controls, 14px body text.

## 2. Themes

`index.html` renders `<html data-theme="dark" data-product="paramtune">`. An inline script in its `<head>` reads the stored choice before paint, so Paper users never see a dark flash.

- **Dark** (default): `:root` and `[data-theme='dark']`.
- **Paper**: `[data-theme='light']`.
- **System**: resolved to Dark or Paper from `prefers-color-scheme`, and followed live while selected.

The choice is stored in `localStorage` under `paramtune-theme` (`src/lib/theme.ts`). `ThemeSwitcher` is a Dark / Paper / System segmented control in the user menu. Tailwind gets `dark:` and `paper:` custom variants for theme-specific styles. Logo files come in `-cream` (dark) and `-ink` (Paper) versions, switched with `.pt-on-dark` / `.pt-on-paper`.

## 3. Color

Components use the semantic layer only, never the primitives. The shadcn variables (`--background`, `--primary`, `--muted-foreground`, …) alias the semantic layer, so Tailwind utilities like `bg-primary` resolve per theme.

| Role          | Token                     | Tailwind                          | Dark                | Paper                 |
| ------------- | ------------------------- | --------------------------------- | ------------------- | --------------------- |
| Page          | `--canvas`                | `bg-background`                   | ink-950 `#0A0B0C`   | paper-100 `#F7F1E3`   |
| Surface 1     | `--surface-1`             | `bg-surface`                      | ink-900 `#101214`   | paper-50 `#FFFCF5`    |
| Surface 2     | `--surface-2`             | `bg-surface-2`                    | ink-850 `#16191C`   | paper-200 `#EFE8D8`   |
| Surface 3     | `--surface-3`             | `bg-surface-3`                    | ink-800 `#1D2125`   | paper-300 `#E5DDCB`   |
| Sidebar       | `--sidebar-bg`            | `bg-sidebar`                      | ink-900 `#101214`   | deep-900 `#14262E`    |
| Text          | `--fg`                    | `text-foreground`                 | cream `#F4EFE3`     | deep-900 `#14262E`    |
| Text muted    | `--fg-muted`              | `text-muted-foreground`           | stone-400 `#A8A396` | slate-600 `#4B5B61`   |
| Text meta     | `--fg-subtle`             | `text-meta`                       | stone-500 `#8A867E` | slate-500 `#5F6B67`   |
| Line          | `--line`                  | `border-border`                   | ink-700 `#23272B`   | paper-400 `#DDD3BF`   |
| Line strong   | `--line-strong`           | `border-border-strong`            | ink-600 `#3A4046`   | deep-900 `#14262E`    |
| Primary       | `--primary-bg`            | `bg-primary`                      | purple-500 `#7638FA`| purple-600 `#6524E8`  |
| Link / focus  | `--link`, `--focus-ring`  | `text-link`, `ring-ring`          | purple-300 `#AC8BFF`| purple-600 `#6524E8`  |
| Product accent| `--accent-bg`             | `bg-accent`                       | mint-400 `#4CC79A`  | mint-300 `#A8D8C2`    |
| Danger fill   | `--danger-solid`          | `bg-danger-fill`                  | `#D23758`           | rose-600 `#C42F52`    |

Status colors each have a text, icon, tile and soft token (`text-success`, `text-success-icon`, `bg-success-tile`, `bg-success-soft`; likewise `warn`, `danger`, `info`): mint for success, sun for warning, rose for danger, lilac for info. In Dark, tiles and soft tints are the `-950` shades; in Paper, tiles are `-300` and soft tints `-100`. Schema diffs use `diff-add`, `diff-del` and `diff-chg`, built from the success, danger and warning soft and text tokens.

JSON syntax colors are `--syntax-key` (purple), `--syntax-string` (mint), `--syntax-number` (sun), `--syntax-literal` (rose), `--syntax-punct` (stone/slate) and `--syntax-extends` (lilac).

## 4. Typography

Fonts are self-hosted through Fontsource packages imported in `src/client/main.tsx`: `@fontsource-variable/archivo` (with the `wdth` axis), `@fontsource-variable/figtree` and `@fontsource-variable/geist-mono`. `globals.css` maps them to Tailwind font families:

- **Display** (`font-display`): Archivo Expanded (`wdth` 125), 700–800. For stamps, labels and stat numbers (`.pt-display`, `.pt-stat`, `.pt-label`, `.pt-eyebrow`). Never for sentences.
- **Sans** (`font-sans`): Figtree. Body, titles and buttons.
- **Mono** (`font-mono`): Geist Mono. Code, JSON, tags and anything a developer might copy.

Scale (`--text-*`): caption 12 · body-sm 13 · body 14 · body-lg 16 · heading 20 · title-2 28 · stat 40 · title-1 56 · stat-xl 64 · display-hero 72. Body is 14px with line-height 1.5.

- `.pt-title-1`: Figtree 800, 56px (40px below 768px), tracking -0.035em.
- `.pt-title-2`: Figtree 800, 28px. `.pt-heading`: Figtree 700, 20px.
- `.pt-label`: Archivo Expanded 700, 11px, uppercase, tracking 0.1em. `.pt-eyebrow` is the same in muted text at 0.14em.
- `.pt-period`: the purple period after H1 and hero lines only.
- `.pt-stat`: tabular numbers.

## 5. Shape, Shadow & Spacing

- **Radius:** nearly square. 2px badges (`rounded-xs`), 4px controls and cards (`rounded-sm`), 6px overlays. Nothing above 6px.
- **Borders:** 1px lines; 1.5px `--line-strong` on the primary button, the active nav item and the stat tile group.
- **Hard offset shadows:** `shadow-hard-sm` (2px), `shadow-hard` (3px) and `shadow-hard-lg` (5px) in `--shadow-hard-color`, no blur. Used on the primary button, the active nav item and the stat tile group. Cards stay flat. Popovers use the soft `shadow-pop`.
- **Controls:** buttons and inputs are 36px tall.
- **Focus:** 2px solid `--focus-ring` outline with a 2px offset; inputs also get a purple ring on focus.

## 6. Components

Class names are in `src/client/components.css` (prefix `pt-`); React components live in `src/components`.

- **Button** (`.pt-btn` + `-primary | -secondary | -ghost | -outline | -destructive`): Figtree 600, 14px, sentence case. Primary is purple with a strong border and a hard shadow and presses like a key; one per view. Outline uses the label style. Destructive (danger fill) appears only inside a confirmation step. Disabled is 40% opacity.
- **Tertiary link** (`.pt-link-tertiary`): label style with an arrow, underlined on hover.
- **Card** (`.pt-card`): surface-1, 1px line, 4px radius, no shadow. `.pt-card-elevated` uses surface-2; `.pt-card-interactive` strengthens the border on hover.
- **Field** (`.pt-input`, `.pt-select`): 36px, field surface, input border, 4px radius.
- **Code** (`.pt-code`): surface-2, 13px mono, line-height 1.6. `.pt-kbd` is a 12px mono chip.
- **Badge** (`ui/Badge`): 22px mono tag, 2px radius, soft status tint with status text.
- **Tabs** (`SchemaTabs`): active tab gets a 2px primary underline on `primary-soft` with link-colored text.
- **Navigation** (`NavigationPlatforms/navItem.ts`): the active item is the product accent block with a strong border and a hard shadow; one per viewport.
- **Stat tiles** (`StatTiles`): a bento grid with 1px dividers, a 1.5px strong outline and `shadow-hard-lg`. Status tiles use the tile color and always carry an icon.
- **States:** loading uses `.pt-skeleton` shaped like the result; empty states use `EmptyState`.

## 7. Motion

- Durations: `--duration-instant` 80ms, `--duration-fast` 140ms, `--duration-base` 200ms, `--duration-slow` 320ms.
- Easing: `--ease-out`, `--ease-in`, and `--ease-snap` for key presses.
- List entrance (`.animate-in`, `.stagger-1..3`) animates opacity and transform only, 40ms stagger.
- `prefers-reduced-motion` removes the entrance animation, the stagger and the button press translate, and disables smooth scrolling.
- Hover styles live under `@media (hover: hover)`.

## 8. Accessibility

- Status is never color alone: pair it with an icon, a symbol (+ − ~) or a word.
- Every icon-only button has an `aria-label`; decorative icons and illustrations are `aria-hidden`.
- Tabs support arrow keys and expose `aria-selected`.

## 9. Iconography

Lucide outline icons, 1.5px stroke, `currentColor`.

## 10. Illustration

Spot illustrations live in `src/components/illustrations` as React SVG components: line art in the theme's ink, built from the product's own objects (a tuning dial, version cards, `@extends`, `+ − ~` diff marks), with tone from a halftone dot ramp. Current exports are `CompareArt`, `NoMatchArt` (404) and `PeggedDialArt` (errors). Page headers and empty states use the generated files in `public/brand`. `.pt-dot-grid` is a dot texture for behind illustrations and empty states, never behind text.
