import type { GameState, PointId } from '../engine'
import { Checker } from './Checker'
import { Point } from './Point'

interface BoardProps {
  state: GameState
  selected: PointId | null
  highlights: PointId[]
  selectableSources: Set<PointId>
  onSelectPoint: (id: PointId) => void
}

const TOP: number[] = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
const BOTTOM: number[] = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

export function Board({
  state,
  selected,
  highlights,
  selectableSources,
  onSelectPoint,
}: BoardProps) {
  const renderRow = (ids: number[], top: boolean) => (
    <div className={`board__row ${top ? 'board__row--top' : 'board__row--bottom'}`}>
      {ids.slice(0, 6).map((id) => (
        <Point
          key={id}
          id={id}
          state={state}
          top={top}
          selected={selected === id}
          highlighted={highlights.includes(id)}
          selectable={selectableSources.has(id)}
          onClick={onSelectPoint}
        />
      ))}
      <div className="board__bar-gap" />
      {ids.slice(6).map((id) => (
        <Point
          key={id}
          id={id}
          state={state}
          top={top}
          selected={selected === id}
          highlighted={highlights.includes(id)}
          selectable={selectableSources.has(id)}
          onClick={onSelectPoint}
        />
      ))}
    </div>
  )

  return (
    <div className="board glass">
      <div className="board__frame">
        {renderRow(TOP, true)}

        <div className="board__mid">
          <BarOff
            kind="bar"
            white={state.bar.white}
            black={state.bar.black}
            selected={selected === 'bar'}
            selectable={selectableSources.has('bar')}
            highlighted={highlights.includes('bar')}
            onClick={() => onSelectPoint('bar')}
          />
          <div className="board__brand">
            <span>NEON</span>
            <span>BACKGAMMON</span>
          </div>
          <BarOff
            kind="off"
            white={state.off.white}
            black={state.off.black}
            selected={selected === 'off'}
            selectable={false}
            highlighted={highlights.includes('off')}
            onClick={() => {
              if (highlights.includes('off')) onSelectPoint('off')
            }}
          />
        </div>

        {renderRow(BOTTOM, false)}
      </div>
    </div>
  )
}

function BarOff({
  kind,
  white,
  black,
  selected,
  selectable,
  highlighted,
  onClick,
}: {
  kind: 'bar' | 'off'
  white: number
  black: number
  selected: boolean
  selectable: boolean
  highlighted: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={[
        'tray',
        `tray--${kind}`,
        selected ? 'tray--selected' : '',
        selectable ? 'tray--selectable' : '',
        highlighted ? 'tray--target' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={`${kind}: white ${white}, black ${black}`}
    >
      <span className="tray__label">{kind === 'bar' ? 'BAR' : 'OFF'}</span>
      <div className="tray__stack tray__stack--black">
        {Array.from({ length: Math.min(black, 5) }, (_, i) => (
          <Checker key={`b${i}`} player="black" index={i} />
        ))}
        {black > 5 && <span className="tray__count">{black}</span>}
        {black > 0 && black <= 5 && black > 0 && (
          <span className="tray__count tray__count--sm">{black}</span>
        )}
      </div>
      <div className="tray__stack tray__stack--white">
        {Array.from({ length: Math.min(white, 5) }, (_, i) => (
          <Checker key={`w${i}`} player="white" index={i} selected={selected && kind === 'bar'} />
        ))}
        {white > 0 && <span className="tray__count tray__count--sm">{white}</span>}
      </div>
    </button>
  )
}
