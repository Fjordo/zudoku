# Zudoku

Sudoku as a progressive web app: solo puzzles with a timer, hints and a three-mistake limit, plus
challenge rooms where everyone races on the same grid and the first to finish wins.

Interface available in English and Italian; the code, comments and commit history are English.

## Features

**Solo**

- Easy / medium / hard, graded by the solving techniques a puzzle actually requires.
- Timer with pause, three mistakes allowed, notes (pencil marks), undo, erase.
- Tapping a digit lights every cell holding it and the rows and columns those cells sit on.
- Hints explain the technique behind the next move instead of just revealing a digit.
- Games are saved locally, so a reload or an offline session resumes where it left off.

**Challenge**

- Create a room, share the six-character code or the invite link.
- The host picks the difficulty and starts; the same puzzle begins for everyone at once.
- Live standings (filled cells, mistakes, finishing time), server-side validation of the winner,
  reconnect after a dropped connection, and a rematch button.

**Everywhere**

- Installable PWA, offline-capable for solo play, mobile-first layout with a landscape mode.
- Keyboard support: `1`-`9`, arrows, `Backspace`, `N` for notes, `H` for a hint.

## Repository layout

```
packages/
  shared/    Sudoku engine and wire protocol, used by both client and server
    src/sudoku/     grid, solver, candidates, techniques, logical solver, generator
    src/protocol.ts WebSocket messages shared with the client
  server/    Express + ws: serves the built client and hosts the challenge rooms
    src/rooms/      Room domain (players, race lifecycle, solution validation)
    src/ws/         Message parsing and the WebSocket gateway
    src/http/       Health check and static hosting
  client/    React + Vite single-page app
    src/features/sudoku/     board state, hints, board UI
    src/features/challenge/  room connection, lobby, standings
    src/features/techniques/ the rules and techniques reference
    src/i18n/                dictionaries (en, it) and the translation hook
scripts/     dev runner and PWA icon generation
```

## Sudoku engine

Puzzles are carved from a complete grid and kept only while the solution stays unique. Each
candidate is then graded by a solver that applies human techniques in order of difficulty:

| Band         | Techniques                                                                    |
| ------------ | ----------------------------------------------------------------------------- |
| Basic        | naked single, hidden single                                                    |
| Intermediate | naked pair, hidden pair, pointing pair, box/line reduction, naked triple       |
| Advanced     | X-Wing, XY-Wing, Swordfish                                                     |

A puzzle ships as *medium* only if singles alone cannot finish it, and as *hard* only if the
intermediate set cannot either. The same solver drives the in-game hints, which is why a hint can
name the technique and the cells that justify it.

## Development

```bash
npm install
npm run dev        # shared watch + API on :8080 + Vite on :5173 (proxies /ws)
npm test           # engine, room domain, gateway integration, UI and i18n tests
npm run typecheck
npm run build      # shared -> client -> server
npm start          # serves the built client and the WebSocket API on :8080
npm run icons      # regenerates the PWA icons
```

## Deploy to Fly.io

```bash
fly launch --no-deploy   # first time only, keeps the provided fly.toml
fly deploy
```

The server keeps rooms in memory, so run a single machine (`min_machines_running = 1`) or move the
room registry to a shared store before scaling out. `PORT`, `HOST`, `CLIENT_DIR` and `ROOM_TTL_MS`
are the available environment variables; `/healthz` reports status, room count and uptime.
