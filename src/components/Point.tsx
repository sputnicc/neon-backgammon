import { countFor, ownerOf, type GameState, type Player, type PointId } from '../engine'
import { Checker } from './Checker'

interface PointProps {
  id: number
  state: GameState
  top: boolean
  selected: boolean
  highlighted: boolean
  selectable: boolean
  onClick: (id: PointId) => void
}

const MAX_VISIBLE = 5

export function Point({
  id,
  state,
  top,
  selected,
  highlighted,
  selectable,
  onClick,
}: PointProps) {
  const owner: Player | null = ownerOf(state, id)
  const count = owner ? countFor(state, id, owner) : 0
  const visible = Math.min(count, MAX_VISIBLE)
  const overflow = count > MAX_VISIBLE ? count : null

  return (
    <button
      type="button"
      className={[
        'point',
        top ? 'point--top' : 'point--bottom',
        id % 2 === 0 ? 'point--even' : 'point--odd',
        selected ? 'point--selected' : '',
        highlighted ? 'point--target' : '',
        selectable ? 'point--selectable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onClick(id)}
      aria-label={`Point ${id}${owner ? `, ${count} ${owner}` : ''}`}
    >
      <span className="point__triangle" />
      <span className="point__stack">
        {owner &&
          Array.from({ length: visible }, (_, i) => (
            <Checker
              key={i}
              player={owner}
              index={i}
              selected={selected && i === visible - 1}
            />
          ))}
        {overflow !== null && (
          <span className={`point__count point__count--${owner}`}>{overflow}</span>
        )}
      </span>
      <span className="point__label">{id}</span>
    </button>
  )
}
