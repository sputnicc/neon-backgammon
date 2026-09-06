import type { Player } from '../engine'

interface CheckerProps {
  player: Player
  index: number
  selected?: boolean
  dimmed?: boolean
}

export function Checker({ player, index, selected, dimmed }: CheckerProps) {
  return (
    <div
      className={[
        'checker',
        `checker--${player}`,
        selected ? 'checker--selected' : '',
        dimmed ? 'checker--dimmed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ zIndex: index + 1 }}
      aria-hidden
    />
  )
}
