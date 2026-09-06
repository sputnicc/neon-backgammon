# Neon Backgammon

A premium browser backgammon experience — dark neon glassmorphism, full standard rules, and a heuristic AI opponent.

**Human (White) vs AI (Black)** on one device. Built with Vite, React, and TypeScript.

> **Note:** The doubling cube is intentionally omitted for this demo.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

```bash
npm test
npm run build
```

## Features

- Full standard backgammon rules: points 1-24, bar, hitting blots, entering from the bar, bearing off
- Legal-move highlighting and click-to-move UX
- Dice roll animation, turn indicator, pip counts
- New game + undo
- Desktop-first layout, usable on tablets
- Rules engine isolated from UI (src/engine)
- AI: heuristics + shallow (1-ply) search over legal turn sequences — no external APIs

## How to play

1. Click **Roll Opening** — highest single die starts (ties re-roll).
2. On your turn, **Roll Dice**, then select a glowing checker / bar, then a highlighted destination.
3. Bear all 15 checkers off to win.

## Project layout

- `src/engine` — rules, moves, AI (framework-agnostic)
- `src/components` — Board, Hud, Dice, Point, Checker
- `src/hooks` — useGame UI state machine

## License

MIT
