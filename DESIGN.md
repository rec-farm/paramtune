# Paramtune Console

> Category: Developer Tools
> A sharp, terminal-style console system: pure black ground, one lime signal color, monospace data, flat bordered surfaces, square corners.

Origin: extracted from the Paramtune configuration dashboard (Next.js, Tailwind v4, shadcn new-york). Version 1.0.0. Dark only.

## 1. Visual Theme & Atmosphere

A developer console for people who read keys, versions and diffs all day. The page is pure black; depth comes from lighter surface steps and 1px lines, never from glow, blur or gradients. Lime `#D9F99D` is the only signal color. Everything else is neutral grey so that status colors and the accent carry meaning.

- **Personality:** precise, technical, quiet, confident.
- **Density:** standard — 16–64px spacing, 40px controls.
- **Signature moves:** Syncopate wordmark and page titles in wide-tracked uppercase; uppercase 12px labels with 0.08em tracking; 2px lime underline for the active tab; 2px lime inset edge for the selected row.

## 2. Color

All values are in `tokens.css`. Contrast is measured on `--bg` (#000).

| Role         | Token                | Value     | Use                                         |
| ------------ | -------------------- | --------- | ------------------------------------------- |
| Page         | `--bg`               | `#000000` | Page ground                                 |
| Surface 1    | `--surface`          | `#0A0A0A` | Cards, inputs, table headers                |
| Surface 2    | `--surface-warm`     | `#111111` | Secondary buttons, hover rows               |
| Surface 3    | `--pt-surface-3`     | `#1A1A1A` | Pressed / nested                            |
| Line         | `--border`           | `#262626` | Dividers, card edges                        |
| Line strong  | `--pt-border-strong` | `#404040` | Chips, secondary buttons                    |
| Control edge | `--pt-input`         | `#5C5C5C` | Inputs, checkboxes (3.1:1)                  |
| Text         | `--fg`               | `#F5F5F5` | Body (19.3:1)                               |
| Text muted   | `--muted`            | `#A3A3A3` | Helper text (8.3:1)                         |
| Text meta    | `--meta`             | `#7A7A7A` | Timestamps, line numbers only (4.9:1)       |
| Signal       | `--accent`           | `#D9F99D` | Primary action, selection, focus            |
| Signal ink   | `--accent-on`        | `#0A0F02` | Text on lime                                |
| Success      | `--success`          | `#4ADE80` | Valid, live, added                          |
| Warning      | `--warn`             | `#FACC15` | Draft, unpublished, changed                 |
| Danger       | `--danger`           | `#F87171` | Error text and icons                        |
| Danger fill  | `--pt-danger-fill`   | `#DC2626` | Destructive button fill, white text (4.8:1) |
| Info         | `--pt-info`          | `#7DD3FC` | Inherited, informational                    |

Rules:

- Lime appears in exactly three places: the one primary button per view, the current selection, and the keyboard focus ring.
- Status colors are text/icon colors on dark surfaces, used with a 10% tint background (`--pt-*-bg`). They are never large fills.
- `#DC2626` is never used as text on black (4.4:1 fails AA).

## 3. Typography

- **Display:** Syncopate 700, uppercase, tracking 0.12em. Only for the wordmark, page titles and section titles. Never for body, buttons or data.
- **UI and data:** Space Mono 400/700 for everything else — body, labels, buttons, tables, code.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64 (`--text-xs` … `--text-4xl`).
- **Body:** 16px, line-height 1.6, prose capped at 68ch.
- **Label:** 12px, 700, uppercase, tracking 0.08em — field labels, table headers, badges, buttons (14px).
- **Numbers:** `font-variant-numeric: tabular-nums`, right-aligned in tables.
- Load fonts from Google Fonts: `family=Space+Mono:wght@400;700&family=Syncopate:wght@700`.

## 4. Spacing, Shape & Elevation

- **Spacing:** 4px base — 4, 8, 12, 16, 24, 32, 48, 64. No other values.
- **Controls:** 32 (sm) / 40 (md) / 48 (lg) px tall.
- **Radius:** 0 everywhere. `--radius-pill` exists only for radio dots.
- **Borders:** 1px. `--border` for structure, `--pt-border-strong` for interactive chrome, `--pt-input` for form controls.
- **Elevation:** flat. Only dialogs, toasts and tooltips cast `--elev-raised`. No glows.
- **Focus:** 2px solid lime outline with a 2px offset on every interactive element.

## 5. Components

Class names are in `components.css` (prefix `pt-`). Reference fixture: `components.html`.

- **Button** (`.pt-btn`): primary (lime, one per view), secondary (surface-2 + strong border), ghost, danger-ghost (red text, used at the entry point of a destructive action), danger (red fill, only inside a confirmation step). Labels are uppercase verbs. States: hover, focus, active, disabled (40% opacity), loading (spinner + `aria-busy`).
- **Field** (`.pt-field`): visible uppercase label, required marker in lime, helper text under the input, error below it with an icon and a fix instruction. Validate on blur. Multiple errors get an error summary that links to each field.
- **Checkbox / radio / switch**: square 20px boxes; checked = lime fill with dark ink; switch shows an ON/OFF word beside it.
- **Badge** (`.pt-badge`): status badges always include an icon. Version badges keep semver in normal case: latest = lime line, deprecated = strikethrough, draft = dashed.
- **Tabs**: uppercase labels; active tab gets a 2px lime underline; arrow keys, Home and End move between tabs.
- **Card**: 1px border on surface-1, no shadow. Interactive cards step up on hover; selected = lime border on `--pt-accent-dim`.
- **Table**: label-style headers, tabular numbers, hover row = surface-2, selected row = lime inset edge.
- **Dialog / toast / tooltip**: popover surface, strong border, `--elev-raised`. Destructive dialogs list consequences and require typing the resource name.

## 6. Paramtune Patterns

- **Sidebar navigation** (`.pt-nav-item`): icon + name + count; the current item has a lime left edge and `--pt-accent-dim` background. **@extends chip** (`.pt-extends`): `@extends | ref | resolved-version`; a broken reference turns the border red and says "No match".
- **JSON code** (`.pt-code`, `.pt-tok-*`): keys in `--fg`, strings in info blue, numbers in yellow, literals in pink, punctuation in meta grey, `@`-keys in lime.
- **Schema diff** (`.pt-diff`): split view on desktop, unified below 768px. Every changed line carries a symbol as well as a tint: `+` added, `−` removed, `~` changed.
- **Audit log**: time · action icon + verb · target in mono · actor in muted · optional status badge.
- **States**: every data region designs empty (why + next action), loading (skeleton shaped like the result), and error (what failed + retry).

## 7. Motion & Interaction

- Durations: 150ms (hover, color), 200ms (switches, tabs, dialogs), 300ms (toasts, list entrance).
- Enter with `--pt-ease-out`; exit with `--pt-ease-in` at 65% of the enter duration. Stagger list items by 40ms.
- Animate only opacity and transform. No floating, pulsing, shimmer-on-hover, or glitch effects.
- `prefers-reduced-motion` zeroes every duration token.
- Hover styles live under `@media (hover: hover)`; hover never lightens or greys out text.

## 8. Accessibility

- Body text ≥ 4.5:1; control edges and icons ≥ 3:1. `--meta` is only for short metadata.
- Status is never color alone: pair with an icon, a symbol (+ − ~) or a word.
- Every icon-only button has an `aria-label`. Tooltips open on focus as well as hover and close with Esc.
- Minimum interactive size 32px on desktop, 44px on touch layouts.

## 9. Iconography

Lucide outline icons only, 1.5px stroke, 16px inline and 20px in navigation, `currentColor`. No filled icons, no emoji, no icon next to every heading.

## 10. Do and Don't

**Do:** one lime primary per view · uppercase labels · mono for anything a developer might copy · square corners · flat surfaces with 1px borders · tinted status badges with icons.

**Don't:** glassmorphism or backdrop blur · glows, neon or text-shadow · gradient text or gradient backgrounds · rounded cards · warm or tinted page grounds · Inter/Roboto as display type · lime used decoratively · saturated status fills (`bg-green-500`) · invented metrics in sample data.
