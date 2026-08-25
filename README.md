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

## Theme

The board is a dark plate lit by the digit in play, and colour carries meaning rather than
decoration:

| Token | Colour | Meaning |
| --- | --- | --- |
| `--bone` | `#f2ecdf` | clues the puzzle came with |
| `--lamp` | `#ffb43f` | digits you entered, and the notes toggle |
| `--beam` | `#5fe3d0` | light: highlighted digit, hints, solo mode |
| `--flare` | `#ff5d8f` | mistakes, eliminations, challenge mode |

Type: Bricolage Grotesque for display, JetBrains Mono for grid digits, timers and room codes,
system sans for body copy. Both webfonts are bundled, so the installed app keeps its typography
offline and makes no third-party request.

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

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests: it builds the
workspaces and runs the whole test suite on Node 22 and 24, and builds the deployment image so a
broken Dockerfile fails in CI rather than during a deploy.

## Deploy to Fly.io

```bash
fly launch --no-deploy   # first time only, keeps the provided fly.toml
fly deploy
```

The server keeps rooms in memory, so run a single machine (`min_machines_running = 1`) or move the
room registry to a shared store before scaling out. `/healthz` reports status, room count and uptime.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` / `HOST` | `8080` / `0.0.0.0` | Listen address. |
| `CLIENT_DIR` | `packages/client/dist` | Built client to serve. |
| `ROOM_TTL_MS` | `1800000` | How long an empty room survives before the sweeper drops it. |
| `MAX_ROOMS` | `2000` | Ceiling on live rooms; past it `create_room` answers `server_busy`. |
| `ALLOWED_ORIGINS` | same host | Comma-separated origins allowed to open a room socket, when the client is served from elsewhere. |
| `MAX_SOCKETS_PER_ADDRESS` | `12` | Concurrent room sockets one address may hold open. |
| `TRUST_PROXY` | off | Set to `1` behind a proxy that overwrites `Fly-Client-IP` / `X-Forwarded-For`, so the per-address limits see the real client. Leave it off otherwise: a client would pick its own identity. |
| `PUZZLE_POOL_SIZE` | `8` | Warm puzzles kept ready per difficulty. |

## Limits

Untrusted input reaches the server only through the room socket, so that is where the limits sit.
Frames are capped at 16 KB and every connection gets 30 messages a second. The actions that allocate
a room or a seat in one get a tighter budget of their own: 6 per 10 seconds per connection, 20 per 10
seconds per address, and 60 a second across the server. The budgets are layered that way on purpose —
a per-connection limit alone is bypassed by opening more connections, and a server-wide limit low
enough for one client to exhaust turns the limiter into the outage, because everyone else then gets
`rate_limited`. For the same reason a refused action is not charged to any of the three, and an
address may hold only 12 sockets open at once.

Puzzle generation is synchronous and costs tens of milliseconds, so it never runs on the path of an
inbound message: a pool generates puzzles on a timer and a race takes one that is already waiting. An
empty pool answers `server_busy` instead of generating inline, which is what keeps the event loop out
of reach of a `start_game` flood.

Room codes come from the CSPRNG, the handshake checks the Origin, and finishing a race is validated
server-side against the puzzle rather than trusted from the client. Progress and mistake counts are
still self-reported, so the standings are only as honest as the players.
