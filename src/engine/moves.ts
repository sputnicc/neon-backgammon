import {
  allInHomeOrOff,
  barCount,
  cloneState,
  countFor,
  direction,
  distanceToOff,
  hasWon,
  opponent,
} from './board'
import type { CheckerMove, GameState, Player, PointId } from './types'

function canLand(state: GameState, point: number, player: Player): boolean {
  if (point < 1 || point > 24) return false
  const opp = opponent(player)
  return countFor(state, point, opp) < 2
}

function isHit(state: GameState, point: number, player: Player): boolean {
  return countFor(state, point, opponent(player)) === 1
}

/** Destination after moving `die` from `from` (board point). */
function destFromPoint(from: number, die: number, player: Player): number {
  return from + direction(player) * die
}

/**
 * Generate all legal single-die moves from the current position
 * (one die value at a time — caller iterates dice).
 */
export function legalMovesForDie(state: GameState, die: number, player: Player): CheckerMove[] {
  const moves: CheckerMove[] = []

  // Must enter from bar first
  if (barCount(state, player) > 0) {
    const entry = player === 'white' ? 25 - die : die
    if (canLand(state, entry, player)) {
      moves.push({
        from: 'bar',
        to: entry,
        die,
        hit: isHit(state, entry, player),
      })
    }
    return moves
  }

  const bearingOff = allInHomeOrOff(state, player)

  for (let from = 1; from <= 24; from++) {
    if (countFor(state, from, player) === 0) continue

    const dest = destFromPoint(from, die, player)

    if (dest >= 1 && dest <= 24) {
      if (canLand(state, dest, player)) {
        moves.push({
          from,
          to: dest,
          die,
          hit: isHit(state, dest, player),
        })
      }
      continue
    }

    // Past the board — bearing off
    if (!bearingOff) continue

    const dist = distanceToOff(from, player)
    if (die === dist) {
      moves.push({ from, to: 'off', die })
    } else if (die > dist) {
      // May bear off with higher die only if no checkers farther from off
      if (!hasCheckerFarther(state, from, player)) {
        moves.push({ from, to: 'off', die })
      }
    }
  }

  return moves
}

function hasCheckerFarther(state: GameState, from: number, player: Player): boolean {
  if (player === 'white') {
    for (let p = from + 1; p <= 6; p++) {
      if (countFor(state, p, player) > 0) return true
    }
  } else {
    for (let p = from - 1; p >= 19; p--) {
      if (countFor(state, p, player) > 0) return true
    }
  }
  return false
}

/** All legal moves for any of the remaining dice (unique by from/to/die). */
export function getLegalMoves(state: GameState): CheckerMove[] {
  if (state.phase !== 'moving' || state.dice.length === 0) return []
  const player = state.turn
  const uniqueDice = [...new Set(state.dice)]
  const moves: CheckerMove[] = []
  const seen = new Set<string>()

  for (const die of uniqueDice) {
    for (const m of legalMovesForDie(state, die, player)) {
      const key = `${m.from}->${m.to}:${m.die}`
      if (!seen.has(key)) {
        seen.add(key)
        moves.push(m)
      }
    }
  }

  // Backgammon rule: if you can play a higher die when only one can be used, you must.
  return filterMaximalDieUsage(state, moves)
}

/**
 * If only one die can be played (not both), and both values have moves,
 * only the higher die's moves are legal. When both can eventually be used
 * in some order, keep all. We approximate by keeping moves that leave at
 * least one subsequent legal play when two distinct dice remain, else prefer higher.
 */
function filterMaximalDieUsage(state: GameState, moves: CheckerMove[]): CheckerMove[] {
  if (moves.length === 0) return moves
  const dice = state.dice
  if (dice.length !== 2 || dice[0] === dice[1]) return moves

  const [d1, d2] = dice
  const canPlay = (die: number) => moves.some((m) => m.die === die)
  if (!canPlay(d1) || !canPlay(d2)) return moves

  // Check whether both dice can be used in some order
  let bothUsable = false
  for (const first of moves) {
    const next = applyMove(state, first)
    const remaining = next.dice
    if (remaining.length === 0) continue
    const follow = legalMovesForDie(next, remaining[0], state.turn)
    if (follow.length > 0) {
      bothUsable = true
      break
    }
  }

  if (bothUsable) return moves

  // Only one die can actually be consumed — must play the higher
  const higher = Math.max(d1, d2)
  return moves.filter((m) => m.die === higher)
}

export function applyMove(state: GameState, move: CheckerMove): GameState {
  const next = cloneState(state)
  const player = next.turn
  const sign = player === 'white' ? 1 : -1

  // Remove from source
  if (move.from === 'bar') {
    next.bar[player] -= 1
  } else if (typeof move.from === 'number') {
    next.points[move.from] -= sign
  }

  // Place / hit / bear off
  if (move.to === 'off') {
    next.off[player] += 1
  } else if (typeof move.to === 'number') {
    if (move.hit) {
      const opp = opponent(player)
      next.points[move.to] = 0
      next.bar[opp] += 1
    }
    next.points[move.to] += sign
  }

  // Consume die
  const idx = next.dice.indexOf(move.die)
  if (idx >= 0) next.dice.splice(idx, 1)

  if (hasWon(next, player)) {
    next.phase = 'ended'
    next.winner = player
    next.dice = []
  }

  return next
}

/** Apply a full sequence of moves (for AI playout). */
export function applyMoves(state: GameState, moves: CheckerMove[]): GameState {
  let s = state
  for (const m of moves) s = applyMove(s, m)
  return s
}

/**
 * Enumerate complete turn play sequences given remaining dice.
 * Returns lists of moves that consume as many dice as possible.
 */
export function enumerateTurnSequences(state: GameState): CheckerMove[][] {
  const results: CheckerMove[][] = []

  function dfs(s: GameState, path: CheckerMove[]) {
    const moves = getLegalMoves(s)
    if (moves.length === 0) {
      results.push(path)
      return
    }
    for (const m of moves) {
      dfs(applyMove(s, m), [...path, m])
    }
  }

  dfs(state, [])

  if (results.length === 0) return [[]]

  // Prefer sequences that use the most dice
  const maxLen = Math.max(...results.map((r) => r.length))
  return results.filter((r) => r.length === maxLen)
}

export function movesFromPoint(
  state: GameState,
  from: PointId,
): CheckerMove[] {
  return getLegalMoves(state).filter((m) => m.from === from)
}

export function destinationsFrom(
  state: GameState,
  from: PointId,
): PointId[] {
  const set = new Set<PointId>()
  for (const m of movesFromPoint(state, from)) set.add(m.to)
  return [...set]
}
