/** White moves toward point 1; Black toward point 24. */
export type Player = 'white' | 'black'

/** Point index 1–24, or 'bar' / 'off'. */
export type PointId = number | 'bar' | 'off'

export interface CheckerMove {
  from: PointId
  to: PointId
  die: number
  hit?: boolean
}

export interface GameState {
  /** Index 0 unused; 1–24 hold signed counts: +white, -black. */
  points: number[]
  bar: { white: number; black: number }
  off: { white: number; black: number }
  /** Remaining dice values for the current turn (may include duplicates). */
  dice: number[]
  turn: Player
  /** Phase of the turn. */
  phase: 'rolling' | 'moving' | 'ended'
  winner: Player | null
  /** Opening roll: both players roll one die; higher starts (re-roll ties). */
  opening: boolean
}

export interface PipCounts {
  white: number
  black: number
}
