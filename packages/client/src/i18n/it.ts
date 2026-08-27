import type { Dictionary } from './en';

/** Italian dictionary. Keys mirror `en`; the parity test guards against drift. */
export const it: Dictionary = {
  'common.back': '← Indietro',
  'common.home': 'Home',
  'common.close': 'Chiudi',
  'common.retry': 'Riprova',
  'common.you': 'tu',
  'common.language': 'Lingua',

  'about.open': 'Informazioni su Zudoku',
  'about.maker': 'Creato da Fjordo',
  'about.version': 'Versione {version}',
  'about.fineprint': '© 2026 Fjordo · Solo per divertimento',

  'home.tagline': 'Puzzle in solitaria, o una gara con gli amici sulla stessa griglia.',
  'home.solo': 'Solitario',
  'home.difficulty': 'Difficoltà',
  'home.soloMeta': '{hints} aiuti · {mistakes} errori consentiti · a tempo',
  'home.play': 'Gioca',
  'home.resume': 'Riprendi partita',
  'home.challenge': 'Sfida',
  'home.challengeDesc':
    'Crea una stanza, condividi il codice: la stessa partita parte per tutti insieme. Vince chi finisce per primo.',
  'home.challengeCta': 'Crea o entra in una stanza',
  'home.techniques': 'Regole e tecniche avanzate',

  'difficulty.easy': 'Facile',
  'difficulty.medium': 'Medio',
  'difficulty.hard': 'Difficile',
  'difficulty.expert': 'Esperto',

  'game.solo': 'Solitario',
  'game.room': 'Stanza {code}',
  'game.badgeNotes': 'Note',
  'game.badgeDigits': 'Numeri',
  'game.statDifficulty': 'Difficoltà',
  'game.statTime': 'Tempo',
  'game.statMistakes': 'Errori',
  'game.statFilled': 'Riempite',
  'game.undo': 'Annulla',
  'game.erase': 'Cancella',
  'game.notesOn': 'Note attive',
  'game.notesOff': 'Note spente',
  'game.hint': 'Aiuto · {count}',
  'game.pause': 'Pausa',
  'game.resume': 'Riprendi',
  'game.paused': 'In pausa',
  'game.newGame': 'Avvia nuova partita',
  'game.keyboardHelp':
    'Tastiera: 1-9 per inserire, N per le note, H per un aiuto, frecce per muoverti, backspace per cancellare le note.',
  'game.solved': 'Risolto!',
  'game.solvedDetail': 'Completato in {time} con {mistakes} errori.',
  'game.lost': 'Vite esaurite',
  'game.lostDetail': 'Tre errori chiudono la partita. Prova un altro schema.',
  'game.loading': 'Sto creando uno schema di livello {difficulty}…',
  'game.loadingDetail':
    'Ogni schema viene verificato a soluzione unica e classificato in base alle tecniche necessarie per risolverlo.',
  'game.generateError': 'Non è stato possibile creare lo schema. Riprova.',
  'game.boardLabel': 'Griglia del sudoku',
  'game.digitsLabel': 'Numeri',
  'game.actionsLabel': 'Azioni sulla griglia',
  'game.digitLabel': 'Numero {digit}',
  'game.cellLabel': 'Riga {row} colonna {column}, {value}',
  'game.cellEmpty': 'vuota',
  'game.hintLearn': 'Approfondisci',
  'game.hintDismiss': 'Chiudi il suggerimento',

  'unit.row': 'riga {position}',
  'unit.column': 'colonna {position}',
  'unit.box': 'riquadro {position}',

  'hint.none': 'Nessun altro passaggio logico disponibile.',
  'hint.naked_single': 'In {cell} resta un solo candidato: {digit}.',
  'hint.hidden_single': 'Il {digit} può stare solo in {cell} nella {unit}.',
  'hint.naked_pair': '{cells} nella {unit} contengono solo {digits}: quei numeri escono dal resto dell’unità.',
  'hint.naked_triple': '{cells} nella {unit} contengono solo {digits}: quei numeri escono dal resto dell’unità.',
  'hint.hidden_pair': '{digits} stanno solo in {cells} della {unit}: lì non può esserci altro.',
  'hint.pointing_pair': 'Nel {unit} il {digit} sta solo su {cells}: esce dal resto di quella linea.',
  'hint.box_line_reduction': 'Nella {unit} il {digit} sta solo in {cells}: esce dal resto di quel riquadro.',
  'hint.x_wing': 'Il {digit} forma un X-Wing su {cells}: esce dalle linee incrociate.',
  'hint.swordfish': 'Il {digit} forma uno Swordfish su {cells}: esce dalle linee incrociate.',
  'hint.xy_wing': 'XY-Wing su {cells}: il {digit} esce da ogni cella vista da entrambe le pinze.',

  'technique.naked_single': 'Singolo nudo',
  'technique.hidden_single': 'Singolo nascosto',
  'technique.naked_pair': 'Coppia nuda',
  'technique.hidden_pair': 'Coppia nascosta',
  'technique.naked_triple': 'Tripla nuda',
  'technique.pointing_pair': 'Coppia puntata',
  'technique.box_line_reduction': 'Riduzione riquadro/linea',
  'technique.x_wing': 'X-Wing',
  'technique.xy_wing': 'XY-Wing',
  'technique.swordfish': 'Swordfish',

  'challenge.title': 'Sfida',
  'challenge.linkConnecting': 'Connessione…',
  'challenge.linkLost': 'Connessione persa · riconnessione',
  'challenge.dropTitle': 'Connessione persa',
  'challenge.dropBody': 'Si riconnette da solo e le tue mosse arrivano nella stanza appena il collegamento torna.',
  'challenge.dropClock': 'Il cronometro non si ferma, e nemmeno gli altri.',
  'challenge.dropStay': 'Continua a giocare',
  'challenge.dropLeave': 'Esci dalla gara',
  'challenge.dropBack': 'Sei di nuovo in gara',
  'challenge.yourName': 'Il tuo nome',
  'challenge.namePlaceholder': 'Ada',
  'challenge.createTitle': 'Crea una stanza',
  'challenge.createCta': 'Crea stanza',
  'challenge.joinTitle': 'Entra con un codice',
  'challenge.inviteCode': 'Codice d’invito',
  'challenge.joinCta': 'Entra nella stanza',
  'challenge.players': 'Giocatori ({count})',
  'challenge.host': 'host',
  'challenge.disconnected': 'disconnesso',
  'challenge.ready': 'pronto',
  'challenge.waiting': 'in attesa',
  'challenge.imReady': 'Sono pronto',
  'challenge.imNotReady': 'Non sono pronto',
  'challenge.start': 'Avvia la gara',
  'challenge.shareHint': 'Condividi il codice: la gara parte per tutti nello stesso momento.',
  'challenge.someNotReady': 'Alcuni giocatori non sono ancora pronti.',
  'challenge.hostStarts': 'Difficoltà: {difficulty}. L’host avvia la gara.',
  'challenge.leave': 'Esci dalla stanza',
  'challenge.copyCode': 'Copia codice',
  'challenge.copyLink': 'Copia link',
  'challenge.copied': 'Copiato',
  'challenge.share': 'Condividi',
  'challenge.shareTitle': 'Sfida Zudoku',
  'challenge.shareText': 'Unisciti alla mia gara di sudoku: {code}',
  'challenge.standings': 'Classifica',
  'challenge.winner': 'vincitore',
  'challenge.out': 'fuori',
  'challenge.progress': '{filled}/81 · {mistakes} ✗',
  'challenge.rank': '#{rank} · {time}',
  'challenge.resultWin': 'Hai vinto!',
  'challenge.resultOut': 'Vite esaurite',
  'challenge.resultFinished': 'Completato',
  'challenge.resultTime': 'Il tuo tempo: {time} (#{rank}).',
  'challenge.resultEliminated': 'Tre errori hanno chiuso la tua gara.',
  'challenge.resultWinner': 'Ha vinto {name}.',
  'challenge.resultWaiting': 'In attesa degli altri giocatori…',
  'challenge.rematch': 'Rivincita',
  'challenge.rematchHost': 'L’host può avviare la rivincita.',

  'error.room_not_found': 'Questo codice stanza non esiste.',
  'error.room_full': 'La stanza è piena.',
  'error.room_in_progress': 'La partita è già iniziata.',
  'error.not_host': 'Solo l’host può farlo.',
  'error.invalid_message': 'Il server ha rifiutato la richiesta.',
  'error.invalid_name': 'Scegli un nome.',
  'error.not_in_room': 'Entra prima in una stanza.',
  'error.invalid_solution': 'Questa griglia non è una soluzione valida.',
  'error.rate_limited': 'Troppe azioni, rallenta un attimo.',
  'error.server_busy': 'Il server è al limite, riprova tra un attimo.',

  'techniques.title': 'Regole e tecniche avanzate',

  'techniques.lede':
    'Un riferimento a cui tornare: prima le regole, poi tutte le tecniche che il solutore degli aiuti conosce, ognuna con un esempio svolto leggibile anche al telefono.',
  'techniques.rulesTitle': 'Le regole',
  'techniques.rulesLead':
    'Il Sudoku ha una regola sola, applicata in tre modi. La griglia si divide in righe, colonne e riquadri 3x3 — nove celle ciascuno — e nessun gruppo può ripetere un numero.',
  'techniques.unitRow': 'Riga',
  'techniques.unitCol': 'Colonna',
  'techniques.unitBox': 'Riquadro',
  'techniques.unitsNote':
    'Nove celle, nove numeri, nessuna ripetizione. Ogni tecnica di questa pagina è un ragionamento su uno di questi tre gruppi. Si chiamano unità, e così li chiama anche il resto della guida.',
  'techniques.ruleTitles': [
    'Riempi la griglia',
    'Mai tirare a indovinare',
    'Le note fanno il lavoro',
    'Gli errori si pagano',
  ],
  'techniques.rules': [
    'Ogni riga, ogni colonna e ogni riquadro 3x3 deve contenere i numeri da 1 a 9 una volta sola. Riempi così tutte le 81 celle e lo schema è risolto.',
    'Uno schema valido ha una sola soluzione e si raggiunge sempre ragionando. Se ti ritrovi a scegliere a caso tra due numeri, c’è una deduzione che non hai ancora visto: le tecniche qui sotto servono a questo.',
    'Una nota, o matita, registra i numeri che una cella può ancora ospitare. Le tecniche leggono le note, non la griglia, quindi tenerle aggiornate è quasi tutta l’abilità. Attiva la modalità note per scriverle toccando; quando piazzi un numero l’app lo toglie dalle note di ogni cella che lo vede.',
    'Un numero corretto si blocca sulla griglia nell’istante in cui lo inserisci. Uno sbagliato viene respinto e costa una vita, e al terzo errore la partita si chiude. L’annulla recupera solo le note, quindi ogni inserimento è definitivo.',
  ],

  'techniques.howToRead': 'Come leggere gli schemi',
  'techniques.intro':
    'Ogni tecnica arriva con un esempio svolto. Lo schema mostra solo la porzione di griglia che serve al ragionamento — un singolo riquadro, una fascia di tre righe o tutta la griglia — così le celle restano abbastanza grandi da leggersi al telefono. I numeri sul bordo superiore e sinistro sono la riga e la colonna reali del ritaglio: se una didascalia dice R5C5, quella cella la trovi.',
  'techniques.notesNote':
    'Il solutore degli aiuti usa esattamente queste tecniche, in questo ordine, e la difficoltà di uno schema è la più complessa che richiede.',
  'techniques.stepsLabel': 'Come riconoscerla',
  'techniques.exampleLabel': 'Esempio svolto',
  'techniques.readNotes': 'Sono disegnati tutti i candidati; i numeri in gioco sono accesi.',
  'techniques.readScan': 'Un numero alla volta: la cella lo mostra solo se ci può ancora stare.',
  'techniques.legendPattern': 'Lo schema trovato',
  'techniques.legendTarget': 'Perde candidati',
  'techniques.legendFits': 'Il numero ci sta ancora',
  'techniques.legendGone': 'Il numero è escluso',
  'techniques.legendCause': 'Fa l’esclusione',
  'techniques.legendFocus': 'I numeri in gioco',
  'techniques.legendCut': 'Tolto dalla tecnica',

  'level.basic': 'Base',
  'level.intermediate': 'Intermedio',
  'level.advanced': 'Avanzato',
  'level.basic.blurb':
    'Queste due mettono numeri sulla griglia direttamente. Risolvono uno schema facile dall’inizio alla fine, e non smetti mai di usarle.',
  'level.intermediate.blurb':
    'Qui non si piazza niente: si tolgono candidati. Imparare ad apprezzarlo è il punto — note più corte sono ciò che rende visibile la mossa successiva.',
  'level.advanced.blurb':
    'Un numero alla volta, su tutta la griglia. Sono queste che uno schema difficile o esperto sta aspettando.',

  'guide.naked_single.summary':
    'Una cella con un solo candidato. La sua riga, la sua colonna e il suo riquadro hanno già usato gli altri otto numeri, quindi lì non può andarci altro.',
  'guide.naked_single.steps': [
    'Scegli una cella vuota ed elenca i numeri che la sua riga, la sua colonna e il suo riquadro hanno già usato.',
    'Cancellali da 1 a 9. Quello che sopravvive è la lista dei candidati della cella, cioè le sue note.',
    'Se ne resta esattamente uno, ci va quello. Non c’è nessuna scelta da fare.',
    'Scrivilo, poi togli quel numero dalle note di ogni cella che ora lo vede. Spesso questo scopre subito il singolo successivo.',
  ],
  'guide.naked_single.caption':
    'Il riquadro 5 ha già piazzato 1, 8, 5, 6 e 2, quindi restano in gioco solo 3, 4, 7 e 9. La riga e la colonna che incrociano R5C5 hanno già usato 3, 4 e 9: in quella cella rimane il solo 7, e va scritto.',
  'guide.naked_single.gain':
    'Un numero sulla griglia a costo zero. Ogni singolo che piazzi accorcia le note di altre venti celle, quindi rileggile dopo ognuno.',

  'guide.hidden_single.summary':
    'Un numero che entra in una sola cella di riga, colonna o riquadro. Quella cella può avere ancora parecchi candidati: il numero è nascosto tra loro, ed è per questo che sfugge.',
  'guide.hidden_single.steps': [
    'Prendi un’unità — una riga, una colonna o un riquadro — e un numero che le manca ancora.',
    'Scorri le sue nove celle ed escludi tutte quelle che vedono già quel numero nella propria riga, colonna o riquadro.',
    'Se ne sopravvive una sola, il numero va lì, qualunque cosa dicano le sue altre note.',
    'Prova tutti e nove i numeri su un’unità prima di passare oltre. I singoli nascosti sono il motivo per cui uno schema raramente si blocca presto.',
  ],
  'guide.hidden_single.caption':
    'Inseguiamo il 7 lungo la riga 1. Il 7 nel riquadro 1 esclude R1C2, il 7 nel riquadro 3 esclude sia R1C8 sia R1C9, e il resto della riga è già pieno. R1C5 è l’unico spazio che il 7 può raggiungere, quindi ci va lì.',
  'guide.hidden_single.gain':
    'Un numero piazzato in una cella che sembrava ancora indecisa. Questa tecnica trova gran parte della griglia negli schemi facili e medi.',

  'guide.naked_pair.summary':
    'Due celle della stessa unità con gli stessi due candidati. Tra loro useranno entrambi i numeri, quindi nessun’altra cella dell’unità può averne uno.',
  'guide.naked_pair.steps': [
    'Cerca nell’unità due celle con note identiche: esattamente due candidati ciascuna, e gli stessi due.',
    'Non sai quale cella prende quale numero, e non ti serve: la coppia li consuma entrambi.',
    'Cancella tutti e due i numeri dalle note di ogni altra cella dell’unità.',
    'Poi guarda cosa resta. Una cella ridotta a un solo candidato è un singolo nudo da piazzare subito.',
  ],
  'guide.naked_pair.caption':
    'R1C1 e R1C2 leggono entrambe 4/5: il 4 e il 5 del riquadro 1 sono già assegnati. Toglierli dagli altri tre spazi lascia in R1C3 solo il 6, in R2C1 solo il 9 e in R2C2 solo l’8 — tre inserimenti da una sola osservazione.',
  'guide.naked_pair.gain':
    'Note più corte, e di solito un singolo nudo subito dietro. La coppia funziona in riga, colonna o riquadro, e lo stesso ragionamento vale per terne e quaterne.',

  'guide.hidden_pair.summary':
    'Due numeri che entrano solo in due celle di un’unità. Quelle celle appartengono a loro, quindi tutto il resto delle loro note se ne va.',
  'guide.hidden_pair.steps': [
    'In un’unità, segna dove può ancora andare ciascuno dei numeri che le mancano.',
    'Cerca due numeri le cui celle candidate siano le stesse due celle.',
    'Quelle celle devono ospitare quei due numeri, in un ordine o nell’altro.',
    'Cancella ogni altro candidato dalle due celle. Qui l’eliminazione avviene dentro lo schema trovato, non intorno.',
  ],
  'guide.hidden_pair.caption':
    'Nel riquadro 7 l’1 e il 2 non entrano da nessuna parte tranne R7C1 e R7C2. Quelle due celle se li dividono, quindi il 6 e il 7 escono da R7C1 e l’8 esce da R7C2: entrambe restano a leggere 1/2.',
  'guide.hidden_pair.gain':
    'Due celle affollate ridotte a due candidati ciascuna. La coppia nascosta è lo schema base più difficile da vedere, perché niente sembra strano finché non conti dove può andare ogni numero.',

  'guide.naked_triple.summary':
    'Tre celle di un’unità che si dividono tre candidati. Nessuna cella deve averli tutti e tre: due su tre bastano.',
  'guide.naked_triple.steps': [
    'Trova tre celle di un’unità le cui note, messe insieme, danno esattamente tre numeri.',
    'Una cella può mostrarne due o tutti e tre; la combinazione consuma comunque tutti e tre.',
    'Togli quei tre numeri da ogni altra cella dell’unità.',
    'Lo stesso test vale per quattro celle su quattro numeri — la quaterna nuda — anche se capita molto più di rado.',
  ],
  'guide.naked_triple.caption':
    'Nel riquadro 3, R1C7 legge 2/6, R1C8 legge 6/9 e R2C7 legge 2/9: tre celle, e tra loro solo 2, 6 e 9. Toglierli dal resto del riquadro lascia il 4 in R2C8 e il 7 in R3C9.',
  'guide.naked_triple.gain':
    'Qui due inserimenti, ma il valore vero è altrove: le terne sono ciò che riapre uno schema quando le coppie hanno smesso di produrre.',

  'guide.pointing_pair.summary':
    'Dentro un riquadro, un numero le cui celle residue stanno tutte su una riga o su una colonna. Ovunque finisca, finisce su quella linea, quindi non può comparire su quella linea fuori dal riquadro.',
  'guide.pointing_pair.steps': [
    'Prendi un riquadro e un numero che gli manca ancora.',
    'Segna ogni cella del riquadro in cui quel numero potrebbe ancora andare.',
    'Se condividono tutte la stessa riga, o tutte la stessa colonna, il numero è agganciato a quella linea.',
    'Togli il numero dal resto di quella riga o colonna, fuori dal riquadro.',
  ],
  'guide.pointing_pair.caption':
    'Al riquadro 1 restano due spazi, R1C1 e R1C2, ed entrambi stanno sulla riga 1: il 7 del riquadro 1 deve quindi stare sulla riga 1. Questo esclude il 7 da R1C6 e R1C9, gli altri spazi della riga.',
  'guide.pointing_pair.gain':
    'Eliminazioni in un’unità che non stavi nemmeno guardando. La coppia puntata è la prima tecnica che ragiona su due unità insieme, ed è da qui che cominciano gli schemi medi.',

  'guide.box_line_reduction.summary':
    'Lo specchio della coppia puntata. Un numero le cui celle residue su una riga o colonna cadono tutte dentro un riquadro deve atterrare lì, quindi esce dalle altre celle del riquadro.',
  'guide.box_line_reduction.steps': [
    'Prendi una riga o una colonna e un numero che le manca ancora.',
    'Segna ogni cella di quella linea in cui il numero potrebbe ancora andare.',
    'Se stanno tutte dentro un solo riquadro, il numero è agganciato a quel riquadro.',
    'Togli il numero dalle celle di quel riquadro che stanno fuori dalla linea.',
  ],
  'guide.box_line_reduction.caption':
    'La riga 1 è piena da C4 in poi, quindi il suo 4 deve andare in R1C1, R1C2 o R1C3 — tutte dentro il riquadro 1. Il 4 del riquadro 1 sta perciò sulla riga 1, e le sei celle del riquadro sotto perdono il 4.',
  'guide.box_line_reduction.gain':
    'Sei candidati fuori da un solo riquadro. Coppia puntata e riduzione riquadro/linea sono lo stesso fatto letto dai due capi, quindi conviene controllare entrambe le direzioni su ogni numero.',

  'guide.x_wing.summary':
    'Un numero, due righe, due colonne. Se il numero ha esattamente due celle possibili in ciascuna di due righe e quelle celle stanno nella stessa coppia di colonne, i quattro angoli si prendono entrambe le colonne.',
  'guide.x_wing.steps': [
    'Scegli un numero e segna ogni cella in cui può ancora andare, su tutta la griglia: un numero alla volta.',
    'Trova due righe in cui ha esattamente due segni.',
    'Verifica che entrambe usino la stessa coppia di colonne. I quattro segni sono gli angoli di un rettangolo.',
    'Esistono solo due riempimenti, ed entrambi mettono il numero una volta per colonna: toglilo dal resto delle due colonne. Scambia righe e colonne per l’altro orientamento.',
  ],
  'guide.x_wing.caption':
    'Il 4 ha due sedi nella riga 2 e due nella riga 7, tutte nelle colonne 3 e 7. O lo prendono i due angoli di una diagonale o quelli dell’altra; in ogni caso entrambe le colonne sono servite, quindi gli altri quattro 4 di quelle colonne escono.',
  'guide.x_wing.gain':
    'Quattro candidati eliminati senza piazzare nulla. L’X-Wing è la prima tecnica che ha bisogno di tutta la griglia sott’occhio: per questo lo schema qui lascia perdere le note e segue un solo numero.',

  'guide.xy_wing.summary':
    'Tre celle con due candidati ciascuna: un perno che legge XY e due pinze che il perno vede, che leggono XZ e YZ. Comunque si risolva il perno, una pinza diventa Z.',
  'guide.xy_wing.steps': [
    'Trova una cella con esattamente due candidati — chiamali X e Y. È il perno.',
    'Trova altre due celle a due candidati che il perno vede, una che legge XZ e una che legge YZ, con lo stesso terzo numero Z.',
    'Se il perno è X la prima pinza è Z; se è Y lo è la seconda. In ogni caso Z atterra in una pinza.',
    'Togli Z da ogni cella vista da entrambe le pinze.',
  ],
  'guide.xy_wing.caption':
    'Il perno R2C2 legge 1/2. R2C6 legge 1/3 e R6C2 legge 2/3, quindi il numero condiviso è il 3. Se R2C2 è 1 allora R2C6 è 3; se è 2 allora R6C2 è 3. R6C6 vede entrambe le pinze, quindi non potrà mai essere il 3 — e le resta il 9.',
  'guide.xy_wing.gain':
    'Un candidato eliminato, e qui risolve la cella di netto. L’XY-Wing è il ragionamento a catena nella sua forma minima: non si trova niente contando, solo seguendo le conseguenze.',

  'guide.swordfish.summary':
    'Un X-Wing di taglia superiore: un numero confinato in tre colonne su tre righe. Una riga può contribuire con due segni invece di tre — quello che conta è che non venga usata una quarta colonna.',
  'guide.swordfish.steps': [
    'Scegli un numero e segna dove può ancora andare su tutta la griglia.',
    'Trova tre righe in cui ha due o tre segni ciascuna.',
    'Verifica che tutti quei segni cadano nelle stesse tre colonne.',
    'Tre righe hanno bisogno di tre colonne, quindi quelle colonne sono impegnate: togli il numero da lì, fuori dalle tre righe. La versione a colonne funziona identica.',
  ],
  'guide.swordfish.caption':
    'Le righe 1, 4 e 7 tengono i loro 5 solo nelle colonne 1, 2 e 3 — sei segni, mai una quarta colonna. Quelle tre colonne sono impegnate da quelle tre righe, quindi i 5 in R3C1, R6C3 e R9C2 escono.',
  'guide.swordfish.gain':
    'L’ultima tecnica che il solutore degli aiuti conosce, e quella che fa classificare uno schema come esperto. Se riesci a trovare uno swordfish, tutto quello che c’è sopra è già alla tua portata.',
};
