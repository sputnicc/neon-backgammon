import type { GameState, PipCounts, Player } from '../engine'
import { Dice } from './Dice'

interface HudProps {
  state: GameState
  pips: PipCounts
  rolling: boolean
  message: string
  canUndo: boolean
  onRoll: () => void
  onNewGame: () => void
  onUndo: () => void
}

export function Hud({
  state,
  pips,
  rolling,
  message,
  canUndo,
  onRoll,
  onNewGame,
  onUndo,
}: HudProps) {
  const canRoll =
    !rolling &&
    state.phase === 'rolling' &&
    state.winner === null &&
    (state.opening || state.turn === 'white')

  return (
    <aside className="hud glass">
      <header className="hud__header">
        <h1 className="hud__title">
          <span className="neon-text">Neon</span> Backgammon
        </h1>
        <p className="hud__tag">Human · White vs AI · Black</p>
      </header>

      <div className="hud__turn">
        <TurnBadge player="white" active={state.turn === 'white' && state.phase !== 'ended'} label="You" />
        <TurnBadge player="black" active={state.turn === 'black' && state.phase !== 'ended'} label="AI" />
      </div>

      <p className="hud__message" role="status">
        {state.winner
          ? state.winner === 'white'
            ? 'Victory — you borne all fifteen.'
            : 'Defeat — the AI borne all fifteen.'
          : message}
      </p>

      <div className="hud__dice-panel">
        <Dice values={state.dice} rolling={rolling} muted={state.phase === 'rolling' && !rolling} />
        <button
          type="button"
          className="btn btn--primary"
          onClick={onRoll}
          disabled={!canRoll}
        >
          {state.opening ? 'Roll Opening' : 'Roll Dice'}
        </button>
      </div>

      <div className="hud__stats">
        <Stat label="White pips" value={pips.white} accent="white" />
        <Stat label="Black pips" value={pips.black} accent="black" />
        <Stat label="Off" value={`${state.off.white} / ${state.off.black}`} />
      </div>

      <div className="hud__actions">
        <button type="button" className="btn" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn btn--ghost" onClick={onNewGame}>
          New Game
        </button>
      </div>

      <footer className="hud__footer">
        <p>Standard rules · No doubling cube</p>
        <p>Select a glowing checker, then a highlighted point.</p>
      </footer>
    </aside>
  )
}

function TurnBadge({
  player,
  active,
  label,
}: {
  player: Player
  active: boolean
  label: string
}) {
  return (
    <div className={`turn-badge turn-badge--${player} ${active ? 'turn-badge--active' : ''}`}>
      <span className="turn-badge__dot" />
      <span>{label}</span>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: 'white' | 'black'
}) {
  return (
    <div className={`stat ${accent ? `stat--${accent}` : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  )
}
