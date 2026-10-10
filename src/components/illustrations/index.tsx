import type { ReactNode, SVGProps } from 'react'

// Spot illustrations (BRAND.md §11): instrument motifs drawn from the product's
// own objects, line art in the theme's ink on its surfaces. Page headers and
// empty states use the generated files in public/brand instead.

const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const META = 'var(--fg-subtle)'
const EDGE = 'var(--border-strong)'
const LINE = 'var(--border)'
const SURFACE = 'var(--surface-1)'
const SURFACE_2 = 'var(--surface-2)'
const SURFACE_3 = 'var(--surface-3)'
const MONO = 'var(--font-geist-mono), ui-monospace, monospace'

const stroke = {
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

type ArtProps = Omit<SVGProps<SVGSVGElement>, 'children'>

function Art({
  viewBox,
  children,
  className,
  ...props
}: ArtProps & { viewBox: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  )
}

// Printed tone ramp: dots shrink along the diagonal. Dots stay inside the box
// (radius < step / 2), so no clip path is needed.
function Halftone({
  x,
  y,
  w,
  h,
  step = 7,
  max = 2.1,
  color = EDGE,
  reverse = false,
}: {
  x: number
  y: number
  w: number
  h: number
  step?: number
  max?: number
  color?: string
  reverse?: boolean
}) {
  const dots: ReactNode[] = []
  for (let py = y + step / 2; py < y + h; py += step) {
    for (let px = x + step / 2; px < x + w; px += step) {
      let t = ((px - x) / w + (py - y) / h) / 2
      if (reverse) t = 1 - t
      const r = max * (1 - t)
      if (r > 0.35) {
        dots.push(
          <circle
            key={`${px}-${py}`}
            cx={px.toFixed(1)}
            cy={py.toFixed(1)}
            r={r.toFixed(2)}
            fill={color}
          />
        )
      }
    }
  }
  return <g>{dots}</g>
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const
}

// Tuning dial: a gauge that opens at the bottom (135° → 405°)
function Dial({
  cx,
  cy,
  needle = 300,
}: {
  cx: number
  cy: number
  needle?: number
}) {
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const deg = 135 + (270 / 12) * i
    const long = i % 3 === 0
    const [x1, y1] = polar(cx, cy, 50, deg)
    const [x2, y2] = polar(cx, cy, long ? 60 : 55, deg)
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={long ? INK : MUTED}
        {...stroke}
      />
    )
  })
  const [nx, ny] = polar(cx, cy, 34, needle)
  return (
    <g>
      <circle cx={cx} cy={cy} r={44} fill={SURFACE_2} stroke={INK} {...stroke} />
      {ticks}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinecap="square"
      />
      <circle cx={cx} cy={cy} r={7} fill={INK} />
    </g>
  )
}

// A version as a small document card; dashed = draft 
function VersionCard({
  x,
  y,
  label,
  draft = false,
  missing = false,
  tone = false,
}: {
  x: number
  y: number
  label: string
  draft?: boolean
  missing?: boolean
  tone?: boolean
}) {
  const dashed = draft || missing
  const edge = dashed ? MUTED : INK
  return (
    <g>
      <rect x={x} y={y} width={104} height={72} fill={SURFACE} />
      {tone && <Halftone x={x} y={y} w={104} h={72} step={6} max={1.5} color={LINE} />}
      <rect
        x={x}
        y={y}
        width={104}
        height={72}
        fill="none"
        stroke={edge}
        strokeDasharray={dashed ? '4 3' : undefined}
        {...stroke}
      />
      <text x={x + 12} y={y + 20} fontFamily={MONO} fontSize={12} fill={edge}>
        {label}
      </text>
      {!missing &&
        [
          [16, 56],
          [16, 40],
          [28, 48],
        ].map(([dx, w], i) => (
          <rect
            key={i}
            x={x + dx}
            y={y + 34 + i * 10}
            width={w}
            height={3}
            fill={draft ? EDGE : MUTED}
          />
        ))}
    </g>
  )
}

function ExtendsArrow({
  from,
  to,
  y,
  broken = false,
}: {
  from: number
  to: number
  y: number
  broken?: boolean
}) {
  const mid = (from + to) / 2
  return (
    <g>
      {broken ? (
        <>
          <line x1={from} y1={y} x2={mid + 8} y2={y} stroke={INK} {...stroke} />
          <line x1={mid - 8} y1={y} x2={to} y2={y} stroke={MUTED} strokeDasharray="3 3" {...stroke} />
          <line x1={mid + 2} y1={y - 6} x2={mid - 4} y2={y + 6} stroke={INK} {...stroke} />
          <line x1={mid + 7} y1={y - 6} x2={mid + 1} y2={y + 6} stroke={INK} {...stroke} />
        </>
      ) : (
        <line x1={from} y1={y} x2={to} y2={y} stroke={INK} {...stroke} />
      )}
      <polyline
        points={`${to + 6},${y - 6} ${to},${y} ${to + 6},${y + 6}`}
        fill="none"
        stroke={broken ? MUTED : INK}
        {...stroke}
      />
      <text
        x={mid}
        y={y - 10}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize={10}
        fill={META}
      >
        @extends
      </text>
    </g>
  )
}

// Compare, nothing picked: two schemas with + − ~ marks
export function CompareArt(props: ArtProps) {
  const panel = (x: number, name: string, rows: [string, number][], tone: boolean) => (
    <g>
      <rect x={x} y={8} width={120} height={96} fill={SURFACE} />
      {tone && <Halftone x={x} y={8} w={120} h={96} step={6} max={1.4} color={LINE} />}
      <rect x={x} y={8} width={120} height={96} fill="none" stroke={INK} {...stroke} />
      <rect x={x + 10} y={18} width={16} height={16} fill={SURFACE} stroke={EDGE} {...stroke} />
      <text x={x + 18} y={26} textAnchor="middle" dominantBaseline="central" fontFamily={MONO} fontSize={10} fill={INK}>
        {name}
      </text>
      {rows.map(([mark, w], i) => (
        <g key={i}>
          <text x={x + 12} y={56 + i * 16} dominantBaseline="central" fontFamily={MONO} fontSize={12} fill={mark === ' ' ? META : INK}>
            {mark}
          </text>
          <rect x={x + 26} y={55 + i * 16} width={w} height={3} fill={mark === ' ' ? EDGE : MUTED} />
        </g>
      ))}
    </g>
  )
  return (
    <Art viewBox="0 0 280 112" {...props}>
      {panel(8, 'A', [[' ', 60], ['−', 48], ['~', 70]], true)}
      {panel(152, 'B', [[' ', 60], ['~', 70], ['+', 52]], false)}
    </Art>
  )
}

// 404: an @extends that resolves to nothing ("No match")
export function NoMatchArt(props: ArtProps) {
  return (
    <Art viewBox="-12 0 340 112" {...props}>
      <VersionCard x={16} y={24} label="v?.?.?" missing />
      <text x={68} y={72} textAnchor="middle" fontFamily={MONO} fontSize={12} fill={META}>
        No match
      </text>
      <ExtendsArrow from={192} to={126} y={60} broken />
      <VersionCard x={196} y={24} label="ios" tone />
    </Art>
  )
}

// Error: the dial pegged past the end of its scale
export function PeggedDialArt(props: ArtProps) {
  return (
    <Art viewBox="0 0 200 136" {...props}>
      <rect x={0} y={0} width={200} height={136} fill={SURFACE} />
      <Halftone x={0} y={0} w={200} h={136} reverse />
      <rect x={0.75} y={0.75} width={198.5} height={134.5} fill="none" stroke={EDGE} strokeWidth={1.5} />
      <Dial cx={100} cy={72} needle={58} />
    </Art>
  )
}
