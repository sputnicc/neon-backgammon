import { useMemo, type CSSProperties } from 'react'

interface DiceProps {
  values: number[]
  rolling?: boolean
  muted?: boolean
}

const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [28, 72], [72, 28], [72, 72]],
  5: [[28, 28], [28, 72], [50, 50], [72, 28], [72, 72]],
  6: [[28, 28], [28, 50], [28, 72], [72, 28], [72, 50], [72, 72]],
}

function Die({ value, rolling, index }: { value: number; rolling?: boolean; index: number }) {
  const pips = PIP_LAYOUTS[value] ?? PIP_LAYOUTS[1]
  const style = {
    ['--spin-delay' as string]: `${index * 0.08}s`,
  } as CSSProperties

  return (
    <div
      className={`die ${rolling ? 'die--rolling' : ''}`}
      style={style}
      aria-label={`Die showing ${value}`}
    >
      {pips.map(([x, y], i) => (
        <span
          key={i}
          className="die__pip"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      ))}
    </div>
  )
}

export function Dice({ values, rolling, muted }: DiceProps) {
  const display = useMemo(() => {
    if (rolling) {
      const n = Math.max(2, Math.min(values.length || 2, 4))
      return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6))
    }
    if (values.length === 0) return [1, 2]
    return values.slice(0, 4)
  }, [values, rolling])

  const ghost = values.length === 0 && !rolling

  return (
    <div className={`dice ${muted || ghost ? 'dice--muted' : ''}`}>
      {display.map((v, i) => (
        <Die key={`${i}-${rolling ? 'r' : v}`} value={v} rolling={rolling} index={i} />
      ))}
    </div>
  )
}
