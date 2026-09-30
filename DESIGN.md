# Paramtune Console

> Category: Developer Tools
> A sharp, terminal-style console system: pure black ground, one lime signal color, monospace data, flat bordered surfaces, square corners, and monotone halftone illustrations.

Origin: extracted from the Paramtune configuration dashboard (Next.js, Tailwind v4, shadcn new-york). Version 1.1.0. Dark only.

## 1. Visual Theme & Atmosphere

A developer console for people who read keys, versions and diffs all day. The page is pure black; depth comes from lighter surface steps and 1px lines, never from glow, blur or gradients. Lime `#D9F99D` is the only signal color. Everything else is neutral grey so that status colors and the accent carry meaning.

- **Personality:** precise, technical, quiet, confident. One off-beat moment per product, never more.
- **Density:** standard — 16–64px spacing, 40px controls.
- **Signature moves:** Syncopate wordmark and page titles in wide-tracked uppercase; uppercase 12px labels with 0.08em tracking; 2px lime underline for the active tab; 2px lime inset edge for the selected row; halftone-toned line illustrations built from the product's own objects.

## 2. Color

All values are in `src/app/tokens.css`, prefixed `--pt-`. The shadcn variables (`--background`, `--primary`, `--muted-foreground`, …) are aliases of these, so Tailwind utilities like `bg-primary` and `text-muted-foreground` resolve to the palette. Contrast is measured on `--pt-bg` (#000).

| Role         | Token                | Tailwind                   | Value     | Use                                         |
| ------------ | -------------------- | -------------------------- | --------- | ------------------------------------------- |
| Page         | `--pt-bg`            | `bg-background`            | `#000000` | Page ground                                 |
| Surface 1    | `--pt-surface`       | `bg-surface`               | `#0A0A0A` | Cards, inputs, table headers                |
| Surface 2    | `--pt-surface-2`     | `bg-surface-2`             | `#111111` | Secondary buttons, hover rows, popovers     |
| Surface 3    | `--pt-surface-3`     | `bg-surface-3`             | `#1A1A1A` | Pressed / nested                            |
| Line         | `--pt-border`        | `border-border`            | `#262626` | Dividers, card edges                        |
| Line strong  | `--pt-border-strong` | `border-border-strong`     | `#404040` | Chips, secondary buttons, illustration tone |
| Control edge | `--pt-input`         | `border-input`             | `#5C5C5C` | Inputs, checkboxes (3.1:1)                  |
| Text         | `--pt-fg`            | `text-foreground`          | `#F5F5F5` | Body (19.3:1)                               |
| Text muted   | `--pt-muted`         | `text-muted-foreground`    | `#A3A3A3` | Helper text (8.3:1)                         |
| Text meta    | `--pt-meta`          | `text-meta`                | `#7A7A7A` | Timestamps, line numbers only (4.9:1)       |
| Signal       | `--pt-accent`        | `text-primary`             | `#D9F99D` | Primary action, selection, focus            |
| Signal ink   | `--pt-accent-on`     | `text-primary-foreground`  | `#0A0F02` | Text on lime                                |
| Signal dim   | `--pt-accent-dim`    | `bg-accent-dim`            | 8% lime   | Background of the selected nav item or row  |
| Success      | `--pt-success`       | `text-success`             | `#4ADE80` | Valid, live, added                          |
| Warning      | `--pt-warn`          | `text-warn`                | `#FACC15` | Draft, unpublished, changed                 |
| Danger       | `--pt-danger`        | `text-danger`              | `#F87171` | Error text and icons                        |
| Danger fill  | `--pt-danger-fill`   | `bg-danger-fill`           | `#DC2626` | Destructive button fill, white text (4.8:1) |
| Info         | `--pt-info`          | `text-info`                | `#7DD3FC` | Inherited, informational                    |

Rules:

- Lime appears in exactly three places: the one primary button per view, the current selection, and the keyboard focus ring. Never in illustrations.
- Status colors are text/icon colors on dark surfaces, used with a 10% tint background (`--pt-*-bg`). They are never large fills. A tint over a translucent gutter must be layered on an opaque surface, or the gutter color bleeds through.
- `#DC2626` is never used as text on black (4.4:1 fails AA).

## 3. Typography

- **Display:** Syncopate 700, uppercase, tracking 0.12em (`.pt-display`). Only for the wordmark, page titles and section titles. Never for body, buttons or data.
- **UI and data:** Space Mono 400/700 for everything else — body, labels, buttons, tables, code, and the JSON editor.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64, mapped to Tailwind `text-xs` … `text-4xl` (`text-lg` is 20px, `text-xl` 24px, `text-2xl` 32px). Page titles use `text-xl`, the Overview title `text-2xl`.
- **Body:** 16px, line-height 1.6, prose capped at 68ch.
- **Label:** 12px, 700, uppercase, tracking 0.08em (`.pt-label`) — field labels, table headers, badges, eyebrows; buttons use the same treatment at 14px.
- **Numbers:** `font-variant-numeric: tabular-nums`, right-aligned in tables.
- Fonts load through `next/font/google`: Space Mono 400/700 as `--font-fragmented`, Syncopate 700 as `--font-display`.

## 4. Spacing, Shape & Elevation

- **Spacing:** 4px base — 4, 8, 12, 16, 24, 32, 48, 64. No other values.
- **Controls:** 32 (sm) / 40 (md) / 48 (lg) px tall.
- **Radius:** 0 everywhere. `--radius-pill` exists only for radio dots and status dots.
- **Borders:** 1px. `--pt-border` for structure, `--pt-border-strong` for interactive chrome, `--pt-input` for form controls.
- **Elevation:** flat. Only dialogs, toasts and tooltips cast `--elev-raised`. No glows.
- **Signature offset:** one hard, blur-free offset edge (6px, `--pt-border-strong`) with one panel overhanging its frame, allowed in exactly one place: the Overview hero illustration (`<PanelsArt signature />`). Not on buttons, cards, tiles or other illustrations.
- **Focus:** 2px solid lime outline with a 2px offset on every interactive element.

## 5. Components

Class names are in `src/app/components.css` (prefix `pt-`); React components live in `src/components`.

- **Button** (`.pt-btn` + `.pt-btn-primary | -secondary | -ghost | -destructive`): primary (lime, one per view), secondary (surface-2 + strong border), ghost, danger-ghost (red text, used at the entry point of a destructive action), destructive (red fill, only inside a confirmation step). Labels are uppercase verbs. States: hover, focus, active, disabled (40% opacity), loading (spinner + `aria-busy`).
- **Field** (`.pt-input`, `.pt-select`): visible uppercase label, required marker in lime, helper text under the input, error below it with an icon and a fix instruction. Validate on blur. Multiple errors get an error summary that links to each field.
- **Checkbox / radio / switch**: square 20px boxes; checked = lime fill with dark ink; switch shows an ON/OFF word beside it.
- **Badge** (`ui/Badge`): status badges always include an icon or symbol. Version badges keep semver in normal case: latest = lime line, deprecated = strikethrough, draft = dashed.
- **Tabs**: uppercase labels; active tab gets a 2px lime underline; arrow keys, Home and End move between tabs.
- **Card** (`.pt-card`): 1px border on surface-1, no shadow. Interactive cards (`.pt-card-interactive`) step up on hover; selected = lime border on `--pt-accent-dim`.
- **Table**: label-style headers, tabular numbers, hover row = surface-2, selected row = lime inset edge.
- **Breadcrumbs** (`Breadcrumbs`): `Overview / platform / vX.Y.Z` above every page title below the Overview; 14px, muted links, current page in `--pt-fg`, `/` separators in meta grey.
- **Dialog / toast / tooltip**: popover surface, strong border, `--elev-raised`. Destructive dialogs list consequences and require typing the resource name.

## 6. Paramtune Patterns

- **Sidebar navigation**: icon + name + count; the current item has a 2px lime left edge and `--pt-accent-dim` background. Opening a version expands its platform.
- **@extends chip**: `@extends | ref | resolved-version`; a broken reference turns the border red and says "No match".
- **Page header**: 12px meta eyebrow ("Your configs, at a glance"), Syncopate title, one muted sentence. The Overview header carries the signature hero illustration on the right from 768px.
- **Stat grid** (`StatTiles`): bento, not equal columns. The headline count (Versions) takes a tall 2fr cell with a 64px number; two tiles sit beside it; the last spans the bottom row. 1px gutters, no gaps. Status tiles (Configured, Empty) use a 10% tint layered on the surface and always carry an icon. Only real counts; no invented metrics.
- **JSON code** (`JsonOutput`, editor overlay): keys in `--pt-fg`, strings in info blue, numbers in yellow, literals in pink, punctuation in meta grey, `@`-keys in lime.
- **Schema diff**: split view from 768px, a single merged column below it. Every changed line carries a symbol as well as a tint: `+` added, `−` removed, `~` changed (old value struck through in the merged view). A is the source, B the target.
- **Audit log**: time · action icon + verb · target in mono · actor in muted · optional status badge.
- **States**: every data region designs empty (illustration + why + next action, via `EmptyState`), loading (static skeleton shaped like the result, `.pt-skeleton`), and error (what failed + retry).

## 7. Motion & Interaction

- Durations: 150ms (hover, color), 200ms (switches, tabs, dialogs), 300ms (toasts, list entrance) — `--pt-dur-fast | base | slow`.
- Enter with `--pt-ease-out`; exit with `--pt-ease-in` at 65% of the enter duration (`--pt-dur-*-exit`). Stagger list items by 40ms (`--pt-stagger`).
- Animate only opacity and transform. No floating, pulsing, shimmer-on-hover, or glitch effects. Illustrations never animate.
- `prefers-reduced-motion` zeroes every duration token.
- Hover styles live under `@media (hover: hover)`; hover never lightens or greys out text.

## 8. Accessibility

- Body text ≥ 4.5:1; control edges and icons ≥ 3:1. `--pt-meta` is only for short metadata.
- Status is never color alone: pair with an icon, a symbol (+ − ~) or a word.
- Every icon-only button has an `aria-label`. Tooltips open on focus as well as hover and close with Esc.
- Illustrations are decorative: `aria-hidden`, and the text beside them says everything they show.
- Minimum interactive size 32px on desktop, 44px on touch layouts.

## 9. Iconography

Lucide outline icons only, 1.5px stroke, 16px inline and 20px in navigation, `currentColor`. No filled icons, no emoji, no icon next to every heading.

## 10. Illustration

Illustrations live in `src/components/illustrations` as React SVG components. They give empty, error and entry pages a moment of character without breaking the console's restraint.

- **Monotone:** greys only — `--pt-fg` for primary strokes and marks, `--pt-muted` for secondary strokes, `--pt-meta` for small text, `--pt-border-strong` / `--pt-border` for tone, surfaces for fills. No lime, no status colors.
- **Line + halftone:** 1.5px strokes with square caps and miter joins, matching Lucide. Tone comes from a halftone ramp (dots shrinking along a diagonal), never from gradients or opacity washes. Halftone needs about 200px of width to read; below that, use line only.
- **Built from the product:** a tuning dial, `{ }` braces, a version branch with a dashed draft node, version cards, the `@extends` arrow, `+ − ~` diff marks. Never generic scenes, people or mascots.
- **Composition:** panel grids with unequal cells (2:1 splits). Square corners, 1.5px `--pt-border-strong` frames.
- **Where:** the Overview hero (`PanelsArt signature`), login (`PanelsArt`), empty states (`PlatformsArt`, `ExtendsArt`, `CompareArt`), 404 (`NoMatchArt`) and error pages (`PeggedDialArt`). Never inside data regions: tables, the editor, diffs or history lists.
- **Sizes:** 320px in the hero, 200–300px elsewhere; always `h-auto` so they scale down.

## 11. Do and Don't

**Do:** one lime primary per view · uppercase labels · mono for anything a developer might copy · square corners · flat surfaces with 1px borders · tinted status badges with icons · monotone halftone illustrations built from product objects · one bento stat grid on the Overview.

**Don't:** glassmorphism or backdrop blur · glows, neon or text-shadow · gradient text or gradient backgrounds · rounded cards · warm or tinted page grounds · Inter/Roboto as display type · lime used decoratively or in illustrations · saturated status fills (`bg-green-500`) · invented metrics in sample data · offset edges or tilted elements anywhere but the Overview hero.
