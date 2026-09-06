import type { GameState, Player, PipCounts } from './types'

/** Standard opening position. */
export function createInitialState(): GameState {
  const points = new Array(25).fill(0)
  // White (+)
  points[24] = 2
  points[13] = 5
  points[8] = 3
  points[6] = 5
  // Black (-)
  points[1] = -2
  points[12] = -5
  points[17] = -3
  points[19] = -5

  return {
    points,
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
    dice: [],
    turn: 'white',
    phase: 'rolling',
    winner: null,
    opening: true,
  }
}

export function cloneState(state: GameState): GameState {
  return {
    points: [...state.points],
    bar: { ...state.bar },
    off: { ...state.off },
    dice: [...state.dice],
    turn: state.turn,
    phase: state.phase,
    winner: state.winner,
    opening: state.opening,
  }
}

export function countFor(state: GameState, point: number, player: Player): number {
  const v = state.points[point]
  if (player === 'white') return v > 0 ? v : 0
  return v < 0 ? -v : 0
}

export function ownerOf(state: GameState, point: number): Player | null {
  const v = state.points[point]
  if (v > 0) return 'white'
  if (v < 0) return 'black'
  return null
}

export function opponent(player: Player): Player {
  return player === 'white' ? 'black' : 'white'
}

export function direction(player: Player): number {
  return player === 'white' ? -1 : 1
}

export function homeRange(player: Player): [number, number] {
  return player === 'white' ? [1, 6] : [19, 24]
}

export function isInHome(point: number, player: Player): boolean {
  const [lo, hi] = homeRange(player)
  return point >= lo && point <= hi
}

/** Distance from point to bear-off for this player. */
export function distanceToOff(point: number, player: Player): number {
  if (player === 'white') return point
  return 25 - point
}

export function barCount(state: GameState, player: Player): number {
  return state.bar[player]
}

export function allInHomeOrOff(state: GameState, player: Player): boolean {
  if (barCount(state, player) > 0) return false
  for (let p = 1; p <= 24; p++) {
    if (countFor(state, p, player) > 0 && !isInHome(p, player)) return false
  }
  return true
}

export function pipCount(state: GameState, player: Player): number {
  let pips = 0
  if (player === 'white') {
    pips += state.bar.white * 25
    for (let p = 1; p <= 24; p++) {
      const n = countFor(state, p, 'white')
      if (n) pips += n * p
    }
  } else {
    pips += state.bar.black * 25
    for (let p = 1; p <= 24; p++) {
      const n = countFor(state, p, 'black')
      if (n) pips += n * (25 - p)
    }
  }
  return pips
}

export function pipCounts(state: GameState): PipCounts {
  return { white: pipCount(state, 'white'), black: pipCount(state, 'black') }
}

export function hasWon(state: GameState, player: Player): boolean {
  return state.off[player] >= 15
}

export function totalCheckers(state: GameState, player: Player): number {
  let n = state.bar[player] + state.off[player]
  for (let p = 1; p <= 24; p++) n += countFor(state, p, player)
  return n
}
