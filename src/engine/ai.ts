import { countFor, opponent, pipCount } from './board'
import { applyMoves, enumerateTurnSequences } from './moves'
import type { CheckerMove, GameState, Player } from './types'

/**
 * Heuristic evaluation from `player`'s perspective (higher = better).
 * Pip race + blot safety + priming + home board + bar pressure.
 */
export function evaluate(state: GameState, player: Player): number {
  const opp = opponent(player)
  let score = 0

  // Pip advantage (lower pips is better)
  score += (pipCount(state, opp) - pipCount(state, player)) * 1.0

  // Checkers borne off
  score += (state.off[player] - state.off[opp]) * 20

  // Opponent on bar is strong
  score += state.bar[opp] * 18
  score -= state.bar[player] * 22

  // Blot / point structure
  for (let p = 1; p <= 24; p++) {
    const mine = countFor(state, p, player)
    const theirs = countFor(state, p, opp)
    if (mine === 1) score -= blotPenalty(p, player)
    if (mine >= 2) score += 3 + Math.min(mine - 2, 3)
    if (theirs === 1) score += 1.5
    if (theirs >= 2) score -= 2
  }

  // Home board primes
  const home = player === 'white' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24]
  let consecutive = 0
  let bestPrime = 0
  for (const p of home) {
    if (countFor(state, p, player) >= 2) {
      consecutive++
      bestPrime = Math.max(bestPrime, consecutive)
    } else {
      consecutive = 0
    }
  }
  score += bestPrime * 8

  if (state.winner === player) score += 10_000
  if (state.winner === opp) score -= 10_000

  return score
}

function blotPenalty(point: number, player: Player): number {
  if (player === 'white') {
    if (point >= 19) return 12
    if (point >= 13) return 8
    if (point >= 7) return 5
    return 3
  }
  if (point <= 6) return 12
  if (point <= 12) return 8
  if (point <= 18) return 5
  return 3
}

/**
 * Choose best full-turn sequence via 1-ply search over enumerated plays,
 * with light random noise for variety.
 */
export function chooseAiTurn(state: GameState): CheckerMove[] {
  if (state.phase !== 'moving' || state.turn !== 'black') return []

  const sequences = enumerateTurnSequences(state).slice(0, 2500)
  if (sequences.length === 0 || (sequences.length === 1 && sequences[0].length === 0)) {
    return []
  }

  const player: Player = 'black'
  let bestScore = -Infinity
  let best: CheckerMove[] = sequences[0]

  for (const seq of sequences) {
    const after = applyMoves(state, seq)
    let score = evaluate(after, player)
    score += Math.random() * 0.5
    const hits = seq.filter((m) => m.hit).length
    score += hits * 2

    if (score > bestScore) {
      bestScore = score
      best = seq
    }
  }

  return best
}

export function chooseAiMove(state: GameState): CheckerMove | null {
  const seq = chooseAiTurn(state)
  return seq[0] ?? null
}
