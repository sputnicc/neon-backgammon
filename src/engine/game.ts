import { cloneState, createInitialState, hasWon, opponent } from './board'
import { applyMove, getLegalMoves } from './moves'
import type { CheckerMove, GameState, Player } from './types'

export function newGame(): GameState {
  return createInitialState()
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function rollDice(): [number, number] {
  return [rollDie(), rollDie()]
}

/**
 * Opening: each side rolls one die. Higher goes first with those two dice.
 * On tie, keep opening true and re-roll.
 */
export function rollOpening(state: GameState): GameState {
  const next = cloneState(state)
  const whiteDie = rollDie()
  const blackDie = rollDie()

  if (whiteDie === blackDie) {
    next.dice = [whiteDie, blackDie]
    next.phase = 'rolling'
    next.opening = true
    return next
  }

  next.opening = false
  next.turn = whiteDie > blackDie ? 'white' : 'black'
  next.dice = [whiteDie, blackDie]
  next.phase = 'moving'
  return next
}

export function rollForTurn(state: GameState): GameState {
  if (state.phase === 'ended') return state
  if (state.opening) return rollOpening(state)

  const next = cloneState(state)
  const [a, b] = rollDice()
  next.dice = a === b ? [a, a, a, a] : [a, b]
  next.phase = 'moving'

  // If no legal moves, turn ends immediately after roll
  if (getLegalMoves(next).length === 0) {
    return endTurn(next)
  }
  return next
}

export function endTurn(state: GameState): GameState {
  if (state.phase === 'ended') return state
  const next = cloneState(state)
  next.dice = []
  next.turn = opponent(next.turn)
  next.phase = 'rolling'
  return next
}

export function tryMove(state: GameState, move: CheckerMove): GameState | null {
  const legal = getLegalMoves(state)
  const match = legal.find(
    (m) => m.from === move.from && m.to === move.to && m.die === move.die,
  )
  if (!match) return null

  let next = applyMove(state, match)

  if (next.phase === 'ended') return next

  if (next.dice.length === 0) {
    return endTurn(next)
  }

  if (getLegalMoves(next).length === 0) {
    return endTurn(next)
  }

  return next
}

/** Pick a matching legal move for from→to (chooses die automatically). */
export function tryMoveFromTo(
  state: GameState,
  from: CheckerMove['from'],
  to: CheckerMove['to'],
): GameState | null {
  const candidates = getLegalMoves(state).filter((m) => m.from === from && m.to === to)
  if (candidates.length === 0) return null
  // Prefer exact distance die when multiple
  candidates.sort((a, b) => b.die - a.die)
  return tryMove(state, candidates[0])
}

export function canUndo(_history: GameState[]): boolean {
  return _history.length > 1
}

export { getLegalMoves, applyMove, hasWon }
export type { GameState, Player, CheckerMove }
