import { Board } from './components/Board'
import { Hud } from './components/Hud'
import { useGame } from './hooks/useGame'
import './App.css'

export default function App() {
  const game = useGame()

  return (
    <div className="app">
      <div className="app__glow app__glow--a" />
      <div className="app__glow app__glow--b" />
      <main className="app__layout">
        <Board
          state={game.state}
          selected={game.selected}
          highlights={game.highlights}
          selectableSources={game.selectableSources}
          onSelectPoint={game.onSelectPoint}
        />
        <Hud
          state={game.state}
          pips={game.pips}
          rolling={game.rolling}
          message={game.message}
          canUndo={game.canUndo}
          onRoll={game.onRoll}
          onNewGame={game.onNewGame}
          onUndo={game.onUndo}
        />
      </main>
    </div>
  )
}
