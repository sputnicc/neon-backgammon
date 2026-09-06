import { useCallback, useEffect, useRef, useState } from 'react'
import {
  chooseAiMove,
  endTurn,
  getLegalMoves,
  newGame,
  pipCounts,
  rollForTurn,
  tryMove,
  tryMoveFromTo,
  type GameState,
  type PointId,
} from '../engine'

export function useGame() {
  const [state, setState] = useState<GameState>(() => newGame())
  const [history, setHistory] = useState<GameState[]>([])
  const [selected, setSelected] = useState<PointId | null>(null)
  const [rolling, setRolling] = useState(false)
  const [message, setMessage] = useState('Roll to open — highest die plays first')
  const stateRef = useRef(state)
  stateRef.current = state

  const push = useCallback((next: GameState, msg?: string) => {
    setHistory((h) => [...h, stateRef.current])
    setState(next)
    setSelected(null)
    if (msg) setMessage(msg)
  }, [])

  const legal =
    state.phase === 'moving' && state.turn === 'white' ? getLegalMoves(state) : []
  const highlights = selected
    ? legal.filter((m) => m.from === selected).map((m) => m.to)
    : []
  const selectableSources = new Set(legal.map((m) => m.from))

  const onRoll = useCallback(() => {
    const cur = stateRef.current
    if (rolling || cur.phase === 'ended') return
    if (cur.phase !== 'rolling') return
    if (cur.turn !== 'white' && !cur.opening) return

    setRolling(true)
    window.setTimeout(() => {
      const latest = stateRef.current
      const next = rollForTurn(latest)
      setHistory((h) => [...h, latest])
      setState(next)
      setRolling(false)
      setSelected(null)

      if (next.opening && next.phase === 'rolling') {
        setMessage(`Tie ${next.dice[0]}-${next.dice[1]} — roll again`)
      } else if (!next.opening && latest.opening) {
        setMessage(
          next.turn === 'white'
            ? `You won the opening ${next.dice.join('-')} — move`
            : `AI won the opening ${next.dice.join('-')}`,
        )
      } else if (next.phase === 'rolling') {
        setMessage('No legal moves — turn passed')
      } else {
        setMessage(next.turn === 'white' ? 'Your move' : 'AI thinking…')
      }
    }, 650)
  }, [rolling])

  const onSelectPoint = useCallback(
    (point: PointId) => {
      const cur = stateRef.current
      if (cur.phase !== 'moving' || cur.turn !== 'white') return
      const curLegal = getLegalMoves(cur)
      const curHighlights = selected
        ? curLegal.filter((m) => m.from === selected).map((m) => m.to)
        : []
      const sources = new Set(curLegal.map((m) => m.from))

      if (selected !== null) {
        if (curHighlights.includes(point)) {
          const next = tryMoveFromTo(cur, selected, point)
          if (next) {
            const hit = curLegal.find((m) => m.from === selected && m.to === point)?.hit
            push(
              next,
              next.winner
                ? 'You win!'
                : hit
                  ? 'Hit! Checker to the bar'
                  : next.turn === 'black'
                    ? 'AI turn'
                    : 'Continue your move',
            )
          }
          return
        }
        if (point === selected) {
          setSelected(null)
          return
        }
      }

      if (sources.has(point)) setSelected(point)
      else setSelected(null)
    },
    [selected, push],
  )

  const onNewGame = useCallback(() => {
    setState(newGame())
    setHistory([])
    setSelected(null)
    setMessage('Roll to open — highest die plays first')
  }, [])

  const onUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setState(prev)
      setSelected(null)
      setMessage('Undone')
      return h.slice(0, -1)
    })
  }, [])

  // AI: one animated step per state change while it is Black's turn
  useEffect(() => {
    if (state.winner || state.phase === 'ended') return
    if (state.turn !== 'black') return

    const delay = state.phase === 'rolling' ? 550 : 480
    const id = window.setTimeout(() => {
      const cur = stateRef.current
      if (cur.turn !== 'black' || cur.winner) return

      if (cur.phase === 'rolling') {
        setMessage('AI rolling…')
        const rolled = rollForTurn(cur)
        setHistory((h) => [...h, cur])
        setState(rolled)
        if (rolled.opening && rolled.phase === 'rolling') {
          setMessage('Opening tie — your roll')
        } else if (rolled.turn === 'white') {
          setMessage(rolled.phase === 'rolling' ? 'Your roll' : 'Your move')
        } else {
          setMessage('AI moving…')
        }
        return
      }

      if (cur.phase === 'moving') {
        setMessage('AI moving…')
        const move = chooseAiMove(cur)
        if (!move) {
          const ended = endTurn(cur)
          setHistory((h) => [...h, cur])
          setState(ended)
          setMessage('Your roll')
          return
        }
        const next = tryMove(cur, move)
        if (!next) return
        setHistory((h) => [...h, cur])
        setState(next)
        if (next.winner) setMessage('AI wins')
        else if (next.turn === 'white') {
          setMessage(next.phase === 'rolling' ? 'Your roll' : 'Your move')
        } else {
          setMessage('AI moving…')
        }
      }
    }, delay)

    return () => window.clearTimeout(id)
  }, [state])

  return {
    state,
    selected,
    rolling,
    message,
    legal,
    highlights,
    selectableSources,
    pips: pipCounts(state),
    onRoll,
    onSelectPoint,
    onNewGame,
    onUndo,
    canUndo: history.length > 0 && state.turn === 'white' && !rolling,
  }
}
