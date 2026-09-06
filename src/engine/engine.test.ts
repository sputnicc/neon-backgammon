import { describe, expect, it } from 'vitest'
import { createInitialState, countFor, pipCount, cloneState } from './board'
import { applyMove, getLegalMoves, legalMovesForDie } from './moves'
import { newGame, rollForTurn, tryMove } from './game'
import type { GameState } from './types'

function emptyBoard(): GameState {
  const s = createInitialState()
  s.points = new Array(25).fill(0)
  s.bar = { white: 0, black: 0 }
  s.off = { white: 0, black: 0 }
  s.opening = false
  s.phase = 'moving'
  s.turn = 'white'
  s.dice = []
  s.winner = null
  return s
}

describe('opening position', () => {
  it('places the standard 15+15 checkers', () => {
    const s = createInitialState()
    expect(countFor(s, 24, 'white')).toBe(2)
    expect(countFor(s, 13, 'white')).toBe(5)
    expect(countFor(s, 8, 'white')).toBe(3)
    expect(countFor(s, 6, 'white')).toBe(5)
    expect(countFor(s, 1, 'black')).toBe(2)
    expect(countFor(s, 12, 'black')).toBe(5)
    expect(countFor(s, 17, 'black')).toBe(3)
    expect(countFor(s, 19, 'black')).toBe(5)
  })

  it('has equal pip counts of 167', () => {
    const s = createInitialState()
    expect(pipCount(s, 'white')).toBe(167)
    expect(pipCount(s, 'black')).toBe(167)
  })

  it('starts in opening rolling phase', () => {
    const s = newGame()
    expect(s.opening).toBe(true)
    expect(s.phase).toBe('rolling')
  })

  it('allows legal opening moves after a roll', () => {
    const s = createInitialState()
    s.opening = false
    s.phase = 'moving'
    s.turn = 'white'
    s.dice = [3, 1]
    const moves = getLegalMoves(s)
    expect(moves.length).toBeGreaterThan(0)
    expect(moves.some((m) => m.from === 24 && m.to === 23 && m.die === 1)).toBe(true)
  })
})

describe('hit blot', () => {
  it('sends a lone opponent checker to the bar', () => {
    const s = emptyBoard()
    s.points[10] = 2
    s.points[7] = -1
    s.turn = 'white'
    s.dice = [3]
    s.phase = 'moving'

    const moves = legalMovesForDie(s, 3, 'white')
    const hit = moves.find((m) => m.from === 10 && m.to === 7)
    expect(hit).toBeDefined()
    expect(hit!.hit).toBe(true)

    const next = applyMove(s, hit!)
    expect(countFor(next, 7, 'white')).toBe(1)
    expect(next.bar.black).toBe(1)
    expect(countFor(next, 7, 'black')).toBe(0)
  })

  it('cannot land on a point with two or more opponents', () => {
    const s = emptyBoard()
    s.points[10] = 2
    s.points[7] = -2
    s.turn = 'white'
    s.dice = [3]
    const moves = legalMovesForDie(s, 3, 'white')
    expect(moves.some((m) => m.from === 10 && m.to === 7)).toBe(false)
  })
})

describe('enter from bar', () => {
  it('must enter before moving other checkers', () => {
    const s = emptyBoard()
    s.bar.white = 1
    s.points[13] = 2
    s.turn = 'white'
    s.dice = [4]
    s.phase = 'moving'

    const moves = getLegalMoves(s)
    expect(moves.every((m) => m.from === 'bar')).toBe(true)
    expect(moves.some((m) => m.to === 21)).toBe(true)
  })

  it('cannot enter on an opponent-made point', () => {
    const s = emptyBoard()
    s.bar.white = 1
    s.points[21] = -2
    s.turn = 'white'
    s.dice = [4]
    const moves = legalMovesForDie(s, 4, 'white')
    expect(moves.length).toBe(0)
  })

  it('hits opponent blot when entering', () => {
    const s = emptyBoard()
    s.bar.white = 1
    s.points[22] = -1
    s.turn = 'white'
    s.dice = [3]
    const moves = legalMovesForDie(s, 3, 'white')
    const hit = moves.find((m) => m.from === 'bar' && m.to === 22)
    expect(hit?.hit).toBe(true)
    const next = applyMove(s, hit!)
    expect(next.bar.black).toBe(1)
    expect(countFor(next, 22, 'white')).toBe(1)
  })
})

describe('bear off', () => {
  it('bears off with exact die', () => {
    const s = emptyBoard()
    s.points[3] = 2
    s.points[1] = 1
    s.turn = 'white'
    s.dice = [3]
    s.phase = 'moving'

    const moves = legalMovesForDie(s, 3, 'white')
    expect(moves.some((m) => m.from === 3 && m.to === 'off')).toBe(true)

    const next = applyMove(s, moves.find((m) => m.to === 'off')!)
    expect(next.off.white).toBe(1)
    expect(countFor(next, 3, 'white')).toBe(1)
  })

  it('bears off with higher die only when no farther checkers', () => {
    const s = emptyBoard()
    s.points[2] = 1
    s.turn = 'white'
    s.dice = [5]
    const moves = legalMovesForDie(s, 5, 'white')
    expect(moves.some((m) => m.from === 2 && m.to === 'off')).toBe(true)
  })

  it('cannot bear off with higher die if a farther checker exists', () => {
    const s = emptyBoard()
    s.points[5] = 1
    s.points[2] = 1
    s.turn = 'white'
    s.dice = [3]
    const moves = legalMovesForDie(s, 3, 'white')
    expect(moves.some((m) => m.from === 2 && m.to === 'off')).toBe(false)
    expect(moves.some((m) => m.from === 5 && m.to === 2)).toBe(true)
  })

  it('cannot bear off while checkers are outside home', () => {
    const s = emptyBoard()
    s.points[8] = 1
    s.points[3] = 1
    s.turn = 'white'
    s.dice = [3]
    const moves = legalMovesForDie(s, 3, 'white')
    expect(moves.some((m) => m.to === 'off')).toBe(false)
  })
})

describe('tryMove integration', () => {
  it('ends turn when dice are exhausted', () => {
    const s = emptyBoard()
    s.points[24] = 2
    s.turn = 'white'
    s.dice = [1]
    s.phase = 'moving'
    const next = tryMove(s, { from: 24, to: 23, die: 1 })
    expect(next).not.toBeNull()
    expect(next!.phase).toBe('rolling')
    expect(next!.turn).toBe('black')
  })

  it('clones independently', () => {
    const a = createInitialState()
    const b = cloneState(a)
    b.points[24] = 0
    expect(a.points[24]).toBe(2)
  })
})

describe('rollForTurn', () => {
  it('produces four dice on doubles', () => {
    let sawDoubles = false
    for (let i = 0; i < 80; i++) {
      let s = createInitialState()
      s.opening = false
      s.phase = 'rolling'
      s = rollForTurn(s)
      if (s.dice.length === 4) {
        sawDoubles = true
        expect(s.dice.every((d) => d === s.dice[0])).toBe(true)
        break
      }
    }
    expect(sawDoubles).toBe(true)
  })
})
