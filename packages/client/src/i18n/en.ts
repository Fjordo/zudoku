/** English dictionary. It is the source of truth: every other locale must match its keys. */
export const en = {
  'common.back': '← Back',
  'common.home': 'Home',
  'common.close': 'Close',
  'common.retry': 'Retry',
  'common.you': 'you',
  'common.language': 'Language',

  'about.open': 'About Zudoku',
  'about.maker': 'Made by Fjordo',
  'about.version': 'Version {version}',
  'about.fineprint': '© 2026 Fjordo · Fun use only',

  'home.tagline': 'Solo puzzles, or a race against your friends on the very same grid.',
  'home.solo': 'Solo',
  'home.difficulty': 'Difficulty',
  'home.soloMeta': '{hints} hints · {mistakes} mistakes allowed · timed',
  'home.play': 'Play',
  'home.resume': 'Resume game',
  'home.challenge': 'Challenge',
  'home.challengeDesc':
    'Create a room, share the code, and everyone starts the same puzzle at once. First to finish wins.',
  'home.challengeCta': 'Create or join a room',
  'home.techniques': 'Rules and advanced techniques',

  'difficulty.easy': 'Easy',
  'difficulty.medium': 'Medium',
  'difficulty.hard': 'Hard',
  'difficulty.expert': 'Expert',

  'game.solo': 'Solo',
  'game.room': 'Room {code}',
  'game.badgeNotes': 'Notes',
  'game.badgeDigits': 'Digits',
  'game.statDifficulty': 'Difficulty',
  'game.statTime': 'Time',
  'game.statMistakes': 'Mistakes',
  'game.statFilled': 'Filled',
  'game.undo': 'Undo',
  'game.erase': 'Erase',
  'game.notesOn': 'Notes on',
  'game.notesOff': 'Notes off',
  'game.hint': 'Hint · {count}',
  'game.pause': 'Pause',
  'game.resume': 'Resume',
  'game.paused': 'Paused',
  'game.newGame': 'Start a new game',
  'game.keyboardHelp': 'Keyboard: 1-9 to fill, N for notes, H for a hint, arrows to move, backspace to clear notes.',
  'game.solved': 'Solved!',
  'game.solvedDetail': 'Finished in {time} with {mistakes} mistakes.',
  'game.lost': 'Out of lives',
  'game.lostDetail': 'Three mistakes ends the run. Try another puzzle.',
  'game.loading': 'Building your puzzle at {difficulty} level…',
  'game.loadingDetail':
    'Each puzzle is checked for a single solution and graded by the techniques needed to crack it.',
  'game.generateError': 'Could not create a puzzle. Please retry.',
  'game.boardLabel': 'Sudoku board',
  'game.digitsLabel': 'Digits',
  'game.actionsLabel': 'Board actions',
  'game.digitLabel': 'Digit {digit}',
  'game.cellLabel': 'Row {row} column {column}, {value}',
  'game.cellEmpty': 'empty',
  'game.hintLearn': 'Learn',
  'game.hintDismiss': 'Dismiss hint',

  'unit.row': 'row {position}',
  'unit.column': 'column {position}',
  'unit.box': 'box {position}',

  'hint.none': 'No further logical step found.',
  'hint.naked_single': '{cell} has only one candidate left: {digit}.',
  'hint.hidden_single': '{digit} fits only in {cell} within {unit}.',
  'hint.naked_pair': '{cells} in {unit} hold only {digits}, so those digits leave the rest of the unit.',
  'hint.naked_triple': '{cells} in {unit} hold only {digits}, so those digits leave the rest of the unit.',
  'hint.hidden_pair': '{digits} fit only in {cells} of {unit}, so nothing else fits there.',
  'hint.pointing_pair': 'In {unit}, {digit} sits only on {cells}: it leaves the rest of that line.',
  'hint.box_line_reduction': 'On {unit}, {digit} fits only in {cells}: it leaves the rest of that box.',
  'hint.x_wing': '{digit} forms an X-Wing on {cells}: it leaves the crossing lines.',
  'hint.swordfish': '{digit} forms a Swordfish on {cells}: it leaves the crossing lines.',
  'hint.xy_wing': 'XY-Wing on {cells}: {digit} leaves every cell both wings see.',

  'technique.naked_single': 'Naked single',
  'technique.hidden_single': 'Hidden single',
  'technique.naked_pair': 'Naked pair',
  'technique.hidden_pair': 'Hidden pair',
  'technique.naked_triple': 'Naked triple',
  'technique.pointing_pair': 'Pointing pair',
  'technique.box_line_reduction': 'Box/line reduction',
  'technique.x_wing': 'X-Wing',
  'technique.xy_wing': 'XY-Wing',
  'technique.swordfish': 'Swordfish',

  'challenge.title': 'Challenge',
  'challenge.linkConnecting': 'Connecting…',
  'challenge.linkLost': 'Connection lost · reconnecting',
  'challenge.dropTitle': 'Connection lost',
  'challenge.dropBody': 'It reconnects on its own, and your moves reach the room as soon as the link is back.',
  'challenge.dropClock': 'The clock keeps running, and so does everyone else.',
  'challenge.dropStay': 'Keep playing',
  'challenge.dropLeave': 'Leave the race',
  'challenge.dropBack': "You're back in the race",
  'challenge.yourName': 'Your name',
  'challenge.namePlaceholder': 'Ada',
  'challenge.createTitle': 'Create a room',
  'challenge.createCta': 'Create room',
  'challenge.joinTitle': 'Join with a code',
  'challenge.inviteCode': 'Invite code',
  'challenge.joinCta': 'Join room',
  'challenge.players': 'Players ({count})',
  'challenge.host': 'host',
  'challenge.disconnected': 'disconnected',
  'challenge.ready': 'ready',
  'challenge.waiting': 'waiting',
  'challenge.imReady': "I'm ready",
  'challenge.imNotReady': "I'm not ready",
  'challenge.start': 'Start the race',
  'challenge.shareHint': 'Share the code: the race starts for everyone at once.',
  'challenge.someNotReady': 'Some players are not ready yet.',
  'challenge.hostStarts': 'Difficulty: {difficulty}. The host starts the race.',
  'challenge.leave': 'Leave room',
  'challenge.copyCode': 'Copy code',
  'challenge.copyLink': 'Copy link',
  'challenge.copied': 'Copied',
  'challenge.share': 'Share',
  'challenge.shareTitle': 'Zudoku challenge',
  'challenge.shareText': 'Join my sudoku race: {code}',
  'challenge.standings': 'Standings',
  'challenge.winner': 'winner',
  'challenge.out': 'out',
  'challenge.progress': '{filled}/81 · {mistakes} ✗',
  'challenge.rank': '#{rank} · {time}',
  'challenge.resultWin': 'You win!',
  'challenge.resultOut': 'Out of lives',
  'challenge.resultFinished': 'Finished',
  'challenge.resultTime': 'Your time: {time} (#{rank}).',
  'challenge.resultEliminated': 'Three mistakes ended your race.',
  'challenge.resultWinner': '{name} took the win.',
  'challenge.resultWaiting': 'Waiting for the other players…',
  'challenge.rematch': 'Rematch',
  'challenge.rematchHost': 'The host can start a rematch.',

  'error.room_not_found': 'This room code does not exist.',
  'error.room_full': 'This room is full.',
  'error.room_in_progress': 'This game has already started.',
  'error.not_host': 'Only the host can do that.',
  'error.invalid_message': 'The server rejected that request.',
  'error.invalid_name': 'Please pick a name.',
  'error.not_in_room': 'Join a room first.',
  'error.invalid_solution': 'That grid is not a valid solution.',
  'error.rate_limited': 'Too many actions, slow down a little.',
  'error.server_busy': 'The server is at capacity, try again in a moment.',

  'techniques.title': 'Rules and advanced techniques',

  'techniques.lede':
    'A reference you can come back to: the rules first, then every technique the hint solver knows, each with a worked example you can read on a phone.',
  'techniques.rulesTitle': 'The rules',
  'techniques.rulesLead':
    'Sudoku has one rule, applied three ways. The grid splits into rows, columns and 3x3 boxes — nine cells each — and no group may repeat a digit.',
  'techniques.unitRow': 'Row',
  'techniques.unitCol': 'Column',
  'techniques.unitBox': 'Box',
  'techniques.unitsNote':
    'Nine cells, nine digits, no repeats. Every technique on this page is an argument about one of these three groups. Solvers call them units, and so does the rest of this guide.',
  'techniques.ruleTitles': ['Fill the grid', 'Never guess', 'Notes carry the work', 'Mistakes cost'],
  'techniques.rules': [
    'Every row, every column and every 3x3 box has to end up holding each digit from 1 to 9 exactly once. Fill all 81 cells that way and the puzzle is solved.',
    'A valid puzzle has exactly one solution, and it can always be reached by reasoning. If you find yourself choosing at random between two digits, there is a deduction you have not spotted yet — that is what the techniques below are for.',
    'A note, or pencil mark, records which digits a cell can still take. The techniques read the notes, not the board, so keeping them current is most of the skill. Turn on notes mode to write them by tapping; when you place a digit the app clears it from the notes of every cell that sees it.',
    'A correct digit locks onto the grid the moment you enter it. A wrong one is refused and costs a life, and the third mistake ends the run. Undo only takes back notes, so a placement is a commitment.',
  ],

  'techniques.howToRead': 'Reading the diagrams',
  'techniques.intro':
    'Each technique comes with a worked example. The diagram shows only the part of the board the argument needs — a single box, a band of three rows, or the whole grid — so cells stay big enough to read on a phone. The numbers along the top and left edges are the real row and column of the crop, so a caption that names R5C5 points at a cell you can find.',
  'techniques.notesNote':
    'The hint solver uses exactly these techniques, in this order, and a puzzle is graded by the hardest one it requires.',
  'techniques.stepsLabel': 'How to spot it',
  'techniques.exampleLabel': 'Worked example',
  'techniques.readNotes': 'Every candidate is drawn; the digits in play are lit.',
  'techniques.readScan': 'One digit at a time: a cell shows it only if it still fits there.',
  'techniques.legendPattern': 'The pattern',
  'techniques.legendTarget': 'Loses candidates',
  'techniques.legendFits': 'The digit still fits',
  'techniques.legendGone': 'The digit is ruled out',
  'techniques.legendCause': 'Does the ruling out',
  'techniques.legendFocus': 'The digits in play',
  'techniques.legendCut': 'Removed by the technique',

  'level.basic': 'Basic',
  'level.intermediate': 'Intermediate',
  'level.advanced': 'Advanced',
  'level.basic.blurb':
    'These two put digits on the board directly. They solve an easy puzzle end to end, and you never stop using them.',
  'level.intermediate.blurb':
    'Nothing gets placed here — candidates get removed. Learn to enjoy that: shorter notes are what make the next placement visible.',
  'level.advanced.blurb':
    'One digit at a time, across the whole board. These are what a hard or expert puzzle is holding out for.',

  'guide.naked_single.summary':
    'A cell with one candidate left. Its row, column and box have used the other eight digits between them, so nothing else can go there.',
  'guide.naked_single.steps': [
    'Pick an empty cell and list the digits its row, its column and its box have already used.',
    'Cross those off 1 to 9. What survives is the cell’s candidate list — its notes.',
    'If exactly one digit survives, it goes in. There is no choice left to make.',
    'Write it, then strike that digit from the notes of every cell it now sees. That often uncovers the next single straight away.',
  ],
  'guide.naked_single.caption':
    'Box 5 has placed 1, 8, 5, 6 and 2, so only 3, 4, 7 and 9 are still going somewhere. The row and column crossing R5C5 have already used 3, 4 and 9, which leaves that cell holding a single 7 — write it in.',
  'guide.naked_single.gain':
    'A digit on the board for free. Every single you place shortens the notes of twenty other cells, so look again after each one.',

  'guide.hidden_single.summary':
    'A digit that fits in only one cell of a row, column or box. That cell can still carry several candidates — the digit is hidden among them, which is why these get missed.',
  'guide.hidden_single.steps': [
    'Take one unit — a row, a column or a box — and one digit it still needs.',
    'Walk its nine cells and rule out every one that already sees that digit somewhere in its own row, column or box.',
    'If a single cell survives, the digit belongs there, whatever else its notes say.',
    'Run all nine digits against a unit before moving on. Hidden singles are the reason a puzzle rarely stalls early.',
  ],
  'guide.hidden_single.caption':
    'Chasing the 7 along row 1. The 7 sitting in box 1 rules out R1C2, the 7 in box 3 rules out both R1C8 and R1C9, and the rest of the row is already filled. R1C5 is the only gap the 7 can reach, so it goes there.',
  'guide.hidden_single.gain':
    'A digit placed in a cell that still looked undecided. This technique finds most of the board on easy and medium puzzles.',

  'guide.naked_pair.summary':
    'Two cells of one unit carrying the same two candidates. Between them they use both digits, so no other cell of that unit can have either.',
  'guide.naked_pair.steps': [
    'Scan a unit for two cells whose notes are an identical pair — exactly two candidates each, the same two.',
    'You do not know which cell takes which digit, and you do not need to: the pair consumes both.',
    'Delete both digits from the notes of every other cell in that unit.',
    'Then look at what is left. A cell stripped to one candidate is a naked single you can place immediately.',
  ],
  'guide.naked_pair.caption':
    'R1C1 and R1C2 both read 4/5, so box 1’s 4 and its 5 are spoken for. Striking them from the other three gaps leaves R1C3 holding only 6, R2C1 only 9 and R2C2 only 8 — three placements out of one observation.',
  'guide.naked_pair.gain':
    'Shorter notes, and usually a naked single right behind. The pair works in a row, a column or a box, and the same argument scales to triples and quads.',

  'guide.hidden_pair.summary':
    'Two digits that fit in only two cells of a unit. Those cells belong to them, so everything else in their notes goes.',
  'guide.hidden_pair.steps': [
    'For one unit, note where each of its missing digits can still go.',
    'Look for two digits whose candidate cells are the same two cells.',
    'Those cells must take those two digits, in one order or the other.',
    'Erase every other candidate from the two cells. The elimination happens inside the pattern here, not around it.',
  ],
  'guide.hidden_pair.caption':
    'In box 7 the 1 and the 2 fit nowhere but R7C1 and R7C2. Those two cells hold them between them, so the 6 and 7 leave R7C1 and the 8 leaves R7C2 — both cells come out reading 1/2.',
  'guide.hidden_pair.gain':
    'Two crowded cells cut down to two candidates each. Hidden pairs are the hardest basic pattern to see, because nothing looks unusual until you count where each digit can go.',

  'guide.naked_triple.summary':
    'Three cells of a unit sharing three candidates between them. No cell needs all three — two of the three is enough.',
  'guide.naked_triple.steps': [
    'Find three cells in a unit whose notes, pooled together, come to exactly three digits.',
    'A cell may show two of them or all three; the combination still uses up all three.',
    'Remove those three digits from every other cell of the unit.',
    'The same test works for four cells over four digits — a naked quad — though it turns up far less often.',
  ],
  'guide.naked_triple.caption':
    'In box 3, R1C7 reads 2/6, R1C8 reads 6/9 and R2C7 reads 2/9 — three cells, and only 2, 6 and 9 between them. Striking those from the rest of the box leaves R2C8 with 4 and R3C9 with 7.',
  'guide.naked_triple.gain':
    'Two placements here, but the real value is elsewhere: triples are what open a puzzle up once pairs have stopped producing.',

  'guide.pointing_pair.summary':
    'Inside a box, a digit whose remaining cells all sit on one row or one column. Wherever it lands it lands on that line, so it cannot appear on that line outside the box.',
  'guide.pointing_pair.steps': [
    'Take a box and a digit it still needs.',
    'Mark every cell of the box where that digit could still go.',
    'If they all share a row, or all share a column, the digit is locked onto that line.',
    'Remove the digit from the rest of that row or column, outside the box.',
  ],
  'guide.pointing_pair.caption':
    'Box 1 has two gaps left, R1C1 and R1C2, and both sit on row 1 — so box 1’s 7 has to be on row 1. That rules the 7 out of R1C6 and R1C9, the row’s other gaps.',
  'guide.pointing_pair.gain':
    'Eliminations in a unit you were not even looking at. Pointing is the first technique that reasons across two units at once, and it is where medium puzzles begin.',

  'guide.box_line_reduction.summary':
    'The mirror of pointing. A digit whose remaining cells in a row or column all fall inside one box must land in that box, so it leaves the box’s other cells.',
  'guide.box_line_reduction.steps': [
    'Take a row or column and a digit it still needs.',
    'Mark every cell of that line where the digit could still go.',
    'If all of them sit inside a single box, the digit is locked into that box.',
    'Remove the digit from the cells of that box which are off the line.',
  ],
  'guide.box_line_reduction.caption':
    'Row 1 is filled from C4 across, so its 4 has to go in R1C1, R1C2 or R1C3 — all inside box 1. Box 1’s 4 is therefore on row 1, and the six cells of the box below it all lose the 4.',
  'guide.box_line_reduction.gain':
    'Six candidates gone from one box. Pointing and box/line are the same fact read from opposite ends, so it pays to check both directions on every digit.',

  'guide.x_wing.summary':
    'One digit, two rows, two columns. If the digit has exactly two possible cells in each of two rows and those cells stand in the same pair of columns, the four corners own both columns.',
  'guide.x_wing.steps': [
    'Pick a digit and mark every cell it can still go in, across the whole board — one digit at a time.',
    'Find two rows where it has exactly two marks.',
    'Check that both rows use the same pair of columns. The four marks are the corners of a rectangle.',
    'Only two fillings exist, and both put the digit once in each column, so remove it from the rest of both columns. Swap rows and columns for the other orientation.',
  ],
  'guide.x_wing.caption':
    'The 4 has two homes in row 2 and two in row 7, all of them in columns 3 and 7. Either the two corners of one diagonal take it or the other pair does; either way both columns are served, so the four remaining 4s in those columns come off.',
  'guide.x_wing.gain':
    'Four candidates gone with nothing placed. X-Wing is the first technique that needs the whole board in view, which is why this diagram drops the notes and follows a single digit.',

  'guide.xy_wing.summary':
    'Three cells with two candidates each: a pivot reading XY, and two pincers it sees reading XZ and YZ. Whatever the pivot turns out to be, one pincer becomes Z.',
  'guide.xy_wing.steps': [
    'Find a cell with exactly two candidates — call them X and Y. That is the pivot.',
    'Find two more two-candidate cells the pivot sees, one reading XZ and one reading YZ, sharing the third digit Z.',
    'If the pivot is X the first pincer is Z; if it is Y the second one is. Z lands in a pincer either way.',
    'Remove Z from every cell that both pincers can see.',
  ],
  'guide.xy_wing.caption':
    'Pivot R2C2 reads 1/2. R2C6 reads 1/3 and R6C2 reads 2/3, so the shared digit is 3. If R2C2 is 1 then R2C6 is 3; if it is 2 then R6C2 is 3. R6C6 sees both pincers, so it can never be the 3 — and is left holding the 9.',
  'guide.xy_wing.gain':
    'One candidate removed, and here it settles a cell outright. XY-Wing is chain reasoning at its smallest: nothing is found by counting, only by following consequences.',

  'guide.swordfish.summary':
    'An X-Wing one size up: a digit confined to three columns across three rows. A row may contribute two marks instead of three — what matters is that no fourth column is used.',
  'guide.swordfish.steps': [
    'Pick a digit and mark where it can still go across the board.',
    'Find three rows where it has two or three marks each.',
    'Check that all of those marks fall inside the same three columns.',
    'Three rows need three columns, so those columns are spent — remove the digit from them outside the three rows. The column version works identically.',
  ],
  'guide.swordfish.caption':
    'Rows 1, 4 and 7 keep their 5s in columns 1, 2 and 3 only — six marks, never a fourth column. Those three columns are spoken for by those three rows, so the 5s at R3C1, R6C3 and R9C2 come off.',
  'guide.swordfish.gain':
    'The last technique the hint solver knows, and the one that grades a puzzle expert. If you can find a swordfish, everything above it is already within reach.',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Record<MessageKey, string | readonly string[]>;
