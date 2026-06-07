const game = new Chess();
const boardElement = document.getElementById('board');
const gameStatusElement = document.getElementById('game-status');
const moveHistoryElement = document.getElementById('move-history');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');
const flipBtn = document.getElementById('flip-btn');

const evalBarFill = document.getElementById('eval-bar-fill');
const evalScoreWhite = document.getElementById('eval-score-white');
const evalScoreBlack = document.getElementById('eval-score-black');
const evalBarWrapper = document.getElementById('eval-bar');

const gameOverOverlay = document.getElementById('game-over-overlay');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverReason = document.getElementById('game-over-reason');
const overlayReviewBtn = document.getElementById('overlay-review-btn');
const reviewBtn = document.getElementById('review-btn');
const closeOverlayBtn = document.getElementById('close-overlay-btn');

const archiveBtn = document.getElementById('archive-btn');
const archiveOverlay = document.getElementById('archive-overlay');
const closeArchiveBtn = document.getElementById('close-archive-btn');
const archiveList = document.getElementById('archive-list');

const themeSelect = document.getElementById('theme-select');
const newGameModal = document.getElementById('new-game-modal');
const closeNewGameBtn = document.getElementById('close-new-game-btn');
const playWhiteBtn = document.getElementById('play-white-btn');
const playBlackBtn = document.getElementById('play-black-btn');

const prevBtn = document.getElementById('prev-btn');
const playBtn = document.getElementById('play-btn');
const nextBtn = document.getElementById('next-btn');
const firstBtn = document.getElementById('first-btn');
const lastBtn = document.getElementById('last-btn');

let isFlipped = false;
let selectedSquare = null;
let validMoves = [];
let lastMove = null;

let fullMoveList = [];
let currentMoveIndex = 0;
let isPlayingReview = false;
let reviewInterval = null;
let overlayDismissed = false;
let gameSaved = false;
let moveEvaluations = [];

// Player color: 'w' = human plays white, 'b' = human plays black
let humanColor = 'w';
let aiThinking = false;
let vsComputer = false; // false = pass and play with friend

// Sound Effects
const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
const captureSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3');
const checkSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-check.mp3');
const gameStartSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-start.mp3');

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PIECE_IMAGES = {
    'p': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
    'n': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
    'b': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
    'r': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
    'q': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
    'k': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png',
    'P': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
    'N': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
    'B': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
    'R': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
    'Q': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
    'K': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png'
};

// ─── AI ENGINE ───────────────────────────────────────────────────────────────

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables (from White's perspective; mirrored for Black)
const PST = {
    p: [
        0, 0, 0, 0, 0, 0, 0, 0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
        5, 5, 10, 25, 25, 10, 5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, -5, -10, 0, 0, -10, -5, 5,
        5, 10, 10, -20, -20, 10, 10, 5,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    n: [
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50
    ],
    b: [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20
    ],
    r: [
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, 10, 10, 10, 10, 5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        0, 0, 0, 5, 5, 0, 0, 0
    ],
    q: [
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5,
        -10, 5, 5, 5, 5, 5, 0, -10,
        -10, 0, 5, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20
    ],
    k: [
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20, 20, 0, 0, 0, 0, 20, 20,
        20, 30, 10, 0, 0, 10, 30, 20
    ]
};

function getPSTIndex(square, color) {
    const file = square.charCodeAt(0) - 97; // 'a'=0 .. 'h'=7
    const rank = 8 - parseInt(square[1]);    // '8'=0 .. '1'=7
    if (color === 'w') {
        return rank * 8 + file;
    } else {
        return (7 - rank) * 8 + file;
    }
}

function evaluateBoard(g) {
    if (g.in_checkmate()) return g.turn() === 'w' ? -99999 : 99999;
    if (g.in_draw()) return 0;

    let score = 0;
    const board = g.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = board[r][f];
            if (!piece) continue;
            const sq = FILES[f] + (8 - r);
            const pstIdx = getPSTIndex(sq, piece.color);
            const val = PIECE_VALUES[piece.type] + (PST[piece.type] ? PST[piece.type][pstIdx] : 0);
            score += piece.color === 'w' ? val : -val;
        }
    }
    return score;
}

function minimax(g, depth, alpha, beta, maximizing) {
    if (depth === 0 || g.game_over()) return evaluateBoard(g);

    const moves = g.moves();
    if (maximizing) {
        let best = -Infinity;
        for (const move of moves) {
            g.move(move);
            best = Math.max(best, minimax(g, depth - 1, alpha, beta, false));
            g.undo();
            alpha = Math.max(alpha, best);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (const move of moves) {
            g.move(move);
            best = Math.min(best, minimax(g, depth - 1, alpha, beta, true));
            g.undo();
            beta = Math.min(beta, best);
            if (beta <= alpha) break;
        }
        return best;
    }
}

function getBestMove(g) {
    const depth = 3; // Increase for harder AI (4+ is slow)
    const aiColor = humanColor === 'w' ? 'b' : 'w';
    const maximizing = aiColor === 'w';
    const moves = g.moves();
    let bestMove = null;
    let bestVal = maximizing ? -Infinity : Infinity;

    // Shuffle moves for variety at equal eval
    moves.sort(() => Math.random() - 0.5);

    for (const move of moves) {
        g.move(move);
        const val = minimax(g, depth - 1, -Infinity, Infinity, !maximizing);
        g.undo();
        if (maximizing ? val > bestVal : val < bestVal) {
            bestVal = val;
            bestMove = move;
        }
    }
    return bestMove;
}

function triggerAIMove() {
    if (!vsComputer) return; // Pass and play mode
    if (game.game_over() || aiThinking) return;
    if (game.turn() === humanColor) return; // Not AI's turn

    aiThinking = true;
    gameStatusElement.textContent = 'AI is thinking...';

    // Use setTimeout so UI renders before minimax blocks the thread
    setTimeout(() => {
        const bestMove = getBestMove(game);
        if (bestMove) {
            const moveObj = game.move(bestMove);
            if (moveObj) {
                try {
                    if (game.in_check() || game.in_checkmate()) {
                        checkSound.currentTime = 0; checkSound.play();
                    } else if (moveObj.captured) {
                        captureSound.currentTime = 0; captureSound.play();
                    } else {
                        moveSound.currentTime = 0; moveSound.play();
                    }
                } catch (e) { }

                const evalQuality = evaluateMoveQuality(moveObj, game);
                moveEvaluations.push(evalQuality);
                fullMoveList.push(moveObj.san);
                currentMoveIndex++;
                lastMove = { from: moveObj.from, to: moveObj.to };
            }
        }
        aiThinking = false;
        updateUI();
    }, 200);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

function init() {
    renderBoard();
    updateUI();

    newGameBtn.addEventListener('click', () => {
        newGameModal.style.display = 'flex';
    });

    closeNewGameBtn.addEventListener('click', () => {
        newGameModal.style.display = 'none';
    });

    // VS Computer: show color picker first
    document.getElementById('vs-computer-btn').addEventListener('click', () => {
        document.getElementById('mode-picker').style.display = 'none';
        document.getElementById('color-picker').style.display = 'flex';
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('color-picker').style.display = 'none';
        document.getElementById('mode-picker').style.display = 'flex';
    });

    playWhiteBtn.addEventListener('click', () => { vsComputer = true; startFreshGame(false); });
    playBlackBtn.addEventListener('click', () => { vsComputer = true; startFreshGame(true); });

    // VS Computer: show color picker
    document.getElementById('vs-computer-btn').addEventListener('click', () => {
        document.getElementById('mode-picker').style.display = 'none';
        document.getElementById('color-picker').style.display = 'flex';
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        document.getElementById('color-picker').style.display = 'none';
        document.getElementById('mode-picker').style.display = 'flex';
    });

    // Play with Friends (pass and play, no AI)
    document.getElementById('play-friends-btn').addEventListener('click', () => {
        vsComputer = false;
        humanColor = 'w';
        isFlipped = false;
        newGameModal.style.display = 'none';
        game.reset();
        lastMove = null; selectedSquare = null; validMoves = [];
        fullMoveList = []; moveEvaluations = []; currentMoveIndex = 0;
        overlayDismissed = false; gameSaved = false; aiThinking = false;
        pauseReview();
        gameOverOverlay.style.display = 'none';
        reviewBtn.style.display = 'none';
        updateUI();
        gameStartSound.currentTime = 0;
        gameStartSound.play().catch(e => { });
    });

    // Play with Friends (pass and play, no AI)
    document.getElementById('play-friends-btn').addEventListener('click', () => {
        vsComputer = false;
        humanColor = 'w';
        isFlipped = false;
        newGameModal.style.display = 'none';
        game.reset();
        lastMove = null; selectedSquare = null; validMoves = [];
        fullMoveList = []; moveEvaluations = []; currentMoveIndex = 0;
        overlayDismissed = false; gameSaved = false; aiThinking = false;
        pauseReview();
        gameOverOverlay.style.display = 'none';
        reviewBtn.style.display = 'none';
        updateUI();
        gameStartSound.currentTime = 0;
        gameStartSound.play().catch(e => { });
    });

    themeSelect.addEventListener('change', (e) => {
        document.body.className = e.target.value === 'classic' ? '' : `theme-${e.target.value}`;
    });

    undoBtn.addEventListener('click', () => {
        if (aiThinking) return;
        pauseReview();
        // Undo two moves in vs computer, one in pass-and-play
        game.undo();
        if (vsComputer) game.undo();
        const hist = game.history({ verbose: true });
        lastMove = hist.length > 0 ? { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to } : null;
        selectedSquare = null;
        validMoves = [];
        fullMoveList = game.history();
        currentMoveIndex = fullMoveList.length;
        moveEvaluations = moveEvaluations.slice(0, currentMoveIndex);
        gameOverOverlay.style.display = 'none';
        reviewBtn.style.display = 'none';
        updateUI();
    });

    flipBtn.addEventListener('click', () => {
        isFlipped = !isFlipped;
        renderBoard();
    });

    firstBtn.addEventListener('click', goFirstMove);
    prevBtn.addEventListener('click', goPreviousMove);
    nextBtn.addEventListener('click', goNextMove);
    lastBtn.addEventListener('click', goLastMove);
    playBtn.addEventListener('click', togglePlayReview);

    overlayReviewBtn.addEventListener('click', startReviewMode);
    reviewBtn.addEventListener('click', startReviewMode);

    closeOverlayBtn.addEventListener('click', () => {
        overlayDismissed = true;
        gameOverOverlay.style.display = 'none';
    });

    archiveBtn.addEventListener('click', openArchive);
    closeArchiveBtn.addEventListener('click', () => archiveOverlay.style.display = 'none');
}

function startFreshGame(startAsBlack) {
    newGameModal.style.display = 'none';
    game.reset();
    lastMove = null;
    selectedSquare = null;
    validMoves = [];
    fullMoveList = [];
    moveEvaluations = [];
    currentMoveIndex = 0;
    overlayDismissed = false;
    gameSaved = false;
    aiThinking = false;
    pauseReview();
    gameOverOverlay.style.display = 'none';
    reviewBtn.style.display = 'none';
    isFlipped = startAsBlack;
    humanColor = startAsBlack ? 'b' : 'w';
    updateUI();
    gameStartSound.currentTime = 0;
    gameStartSound.play().catch(e => { });

    // If human plays black, AI (white) moves first — delay so board renders first
    if (startAsBlack) {
        aiThinking = true;
        gameStatusElement.textContent = 'AI is thinking...';
        setTimeout(() => {
            aiThinking = false;
            triggerAIMove();
        }, 300);
    }
}

function startReviewMode() {
    overlayDismissed = true;
    gameOverOverlay.style.display = 'none';
    goFirstMove();
}

function getPieceKey(piece) {
    if (!piece) return null;
    return piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
}

function renderBoard() {
    boardElement.innerHTML = '';
    const ranks = isFlipped ? [...RANKS].reverse() : RANKS;
    const files = isFlipped ? [...FILES].reverse() : FILES;

    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const file = files[f];
            const rank = ranks[r];
            const squareId = file + rank;

            const squareEl = document.createElement('div');
            squareEl.className = `square ${(r + f) % 2 === 0 ? 'light' : 'dark'}`;
            squareEl.dataset.square = squareId;

            if (f === 0) {
                const rankCoord = document.createElement('div');
                rankCoord.className = 'square-coord coord-rank';
                rankCoord.textContent = rank;
                squareEl.appendChild(rankCoord);
            }
            if (r === 7) {
                const fileCoord = document.createElement('div');
                fileCoord.className = 'square-coord coord-file';
                fileCoord.textContent = file;
                squareEl.appendChild(fileCoord);
            }

            if (lastMove && (lastMove.from === squareId || lastMove.to === squareId)) {
                const hl = document.createElement('div');
                hl.className = 'highlight-last';
                squareEl.appendChild(hl);

                if (lastMove.to === squareId) {
                    const quality = moveEvaluations[currentMoveIndex - 1];
                    if (quality && quality !== 'good') {
                        const badge = document.createElement('div');
                        badge.className = `move-badge badge-${quality}`;
                        badge.textContent = getBadgeSymbol(quality);
                        squareEl.appendChild(badge);
                    }
                }
            }

            const isCheckSquare = game.in_check() && game.get(squareId)?.type === 'k' && game.get(squareId)?.color === game.turn();
            if (isCheckSquare) {
                const checkHl = document.createElement('div');
                checkHl.className = 'highlight-check';
                squareEl.appendChild(checkHl);
            }

            const move = validMoves.find(m => m.to === squareId);
            if (move) {
                const hl = document.createElement('div');
                hl.className = game.get(squareId) ? 'highlight-capture' : 'highlight-valid';
                squareEl.appendChild(hl);
            }

            const piece = game.get(squareId);
            if (piece) {
                const pieceKey = getPieceKey(piece);
                const pieceEl = document.createElement('div');
                pieceEl.className = 'piece';
                pieceEl.style.backgroundImage = `url(${PIECE_IMAGES[pieceKey]})`;
                pieceEl.dataset.piece = pieceKey;

                setupDragAndDrop(pieceEl, squareId);
                squareEl.appendChild(pieceEl);
            }

            squareEl.addEventListener('click', (e) => {
                // Block interaction during AI turn or review
                if (aiThinking) return;
                if (vsComputer && game.turn() !== humanColor) return;
                if (game.game_over()) return;
                if (currentMoveIndex < fullMoveList.length) return;

                if (validMoves.some(m => m.to === squareId)) {
                    makeMove(squareId);
                } else if (piece && game.turn() === piece.color) {
                    selectedSquare = squareId;
                    validMoves = game.moves({ square: squareId, verbose: true });
                    renderBoard();
                } else {
                    selectedSquare = null;
                    validMoves = [];
                    renderBoard();
                }
            });

            boardElement.appendChild(squareEl);
        }
    }
}

let activePiece = null;
let activeSquare = null;

function setupDragAndDrop(pieceEl, squareId) {
    pieceEl.addEventListener('mousedown', startDrag);
    pieceEl.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        if (e.type === 'touchstart') e.preventDefault();
        // Block drag during AI turn or review
        if (aiThinking) return;
        if (vsComputer && game.turn() !== humanColor) return;
        if (game.game_over()) return;
        if (currentMoveIndex < fullMoveList.length) return;

        const piece = game.get(squareId);
        if (!piece || piece.color !== game.turn()) return;

        selectedSquare = squareId;
        validMoves = game.moves({ square: squareId, verbose: true });
        renderBoard();

        activeSquare = squareId;
        const currentSquareEl = document.querySelector(`[data-square="${squareId}"]`);
        activePiece = currentSquareEl.querySelector('.piece');
        if (!activePiece) return;

        activePiece.classList.add('dragging');

        let clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const movePiece = (moveEvent) => {
            if (moveEvent.type === 'touchmove') moveEvent.preventDefault();
            let x = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
            let y = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
            activePiece.style.transform = `translate(${x - clientX}px, ${y - clientY}px) scale(1.1)`;
        };

        const stopDrag = (upEvent) => {
            document.removeEventListener('mousemove', movePiece);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', movePiece);
            document.removeEventListener('touchend', stopDrag);

            if (!activePiece) return;
            activePiece.classList.remove('dragging');
            activePiece.style.transform = '';

            let x = upEvent.type === 'touchend' ? upEvent.changedTouches[0].clientX : upEvent.clientX;
            let y = upEvent.type === 'touchend' ? upEvent.changedTouches[0].clientY : upEvent.clientY;

            activePiece.style.display = 'none';
            const elemBelow = document.elementFromPoint(x, y);
            activePiece.style.display = 'block';

            const targetSquareEl = elemBelow ? elemBelow.closest('.square') : null;
            if (targetSquareEl) {
                const targetSquareId = targetSquareEl.dataset.square;
                if (validMoves.some(m => m.to === targetSquareId)) {
                    makeMove(targetSquareId);
                    return;
                }
            }
            renderBoard();
        };

        document.addEventListener('mousemove', movePiece);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', movePiece, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }
}

function makeMove(targetSquareId) {
    const move = validMoves.find(m => m.to === targetSquareId);
    if (!move) return;

    let promotion = 'q';
    const moveObj = game.move({
        from: selectedSquare,
        to: targetSquareId,
        promotion: promotion
    });

    if (moveObj) {
        try {
            if (game.in_check() || game.in_checkmate()) {
                checkSound.currentTime = 0; checkSound.play();
            } else if (moveObj.captured) {
                captureSound.currentTime = 0; captureSound.play();
            } else {
                moveSound.currentTime = 0; moveSound.play();
            }
        } catch (e) { }

        if (currentMoveIndex < fullMoveList.length) {
            fullMoveList = fullMoveList.slice(0, currentMoveIndex);
            moveEvaluations = moveEvaluations.slice(0, currentMoveIndex);
        }

        const evalQuality = evaluateMoveQuality(moveObj, game);
        moveEvaluations.push(evalQuality);
        fullMoveList.push(moveObj.san);
        currentMoveIndex++;

        overlayDismissed = false;
        lastMove = { from: selectedSquare, to: targetSquareId };
        selectedSquare = null;
        validMoves = [];
        updateUI();

        // Trigger AI response after human move (only in vs computer mode)
        if (vsComputer && !game.game_over()) {
            triggerAIMove();
        }
    }
}

function updateUI() {
    renderBoard();
    updateStatus();
    updateHistory();
    updateCapturedPieces();
    updateEvaluation();
}

function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'w' ? 'White' : 'Black';

    if (currentMoveIndex < fullMoveList.length) {
        gameOverOverlay.style.display = 'none';
    }

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
        if (!overlayDismissed && currentMoveIndex === fullMoveList.length) {
            showGameOver(game.turn() === 'w' ? 'Black Won' : 'White Won', 'by Checkmate');
        }
        saveGameIfNew(game.turn() === 'w' ? 'Black Won by Checkmate' : 'White Won by Checkmate');
    } else if (game.in_draw()) {
        status = 'Game drawn';
        if (!overlayDismissed && currentMoveIndex === fullMoveList.length) {
            showGameOver('Draw', 'by Repetition/Stalemate');
        }
        saveGameIfNew('Draw');
    } else {
        if (aiThinking) {
            status = 'AI is thinking...';
        } else {
            status = `${moveColor} to move`;
            if (game.in_check()) status += `, ${moveColor} is in check`;
        }
        gameOverOverlay.style.display = 'none';
    }
    gameStatusElement.textContent = status;
}

function showGameOver(title, reason) {
    gameOverTitle.textContent = title;
    gameOverReason.textContent = reason;
    gameOverOverlay.style.display = 'flex';
    reviewBtn.style.display = 'block';
}

function updateHistory() {
    moveHistoryElement.innerHTML = '';

    for (let i = 0; i < fullMoveList.length; i += 2) {
        const moveNum = (i / 2) + 1;
        const whiteMove = fullMoveList[i];
        const blackMove = fullMoveList[i + 1] || '';

        const rowEl = document.createElement('div');
        rowEl.className = 'move-row';

        const moveNumEl = document.createElement('div');
        moveNumEl.className = 'move-number';
        moveNumEl.textContent = `${moveNum}.`;

        const whiteMoveEl = document.createElement('div');
        whiteMoveEl.className = `move-text ${i === currentMoveIndex - 1 ? 'active' : ''}`;
        whiteMoveEl.textContent = whiteMove;
        whiteMoveEl.onclick = () => goToMoveIndex(i + 1);

        const blackMoveEl = document.createElement('div');
        blackMoveEl.className = `move-text ${i + 1 === currentMoveIndex - 1 ? 'active' : ''}`;
        blackMoveEl.textContent = blackMove;
        if (blackMove) blackMoveEl.onclick = () => goToMoveIndex(i + 2);

        rowEl.appendChild(moveNumEl);
        rowEl.appendChild(whiteMoveEl);
        rowEl.appendChild(blackMoveEl);
        moveHistoryElement.appendChild(rowEl);
    }

    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
}

function updateCapturedPieces() {
    const initialCounts = { p: 8, n: 2, b: 2, r: 2, q: 1, P: 8, N: 2, B: 2, R: 2, Q: 1 };
    const currentCounts = { p: 0, n: 0, b: 0, r: 0, q: 0, P: 0, N: 0, B: 0, R: 0, Q: 0 };

    const board = game.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = board[r][f];
            if (piece) {
                const key = getPieceKey(piece);
                if (currentCounts[key] !== undefined) currentCounts[key]++;
            }
        }
    }

    const capturedByWhiteEl = document.getElementById('captured-by-white');
    const capturedByBlackEl = document.getElementById('captured-by-black');
    capturedByWhiteEl.innerHTML = '';
    capturedByBlackEl.innerHTML = '';

    ['q', 'r', 'b', 'n', 'p'].forEach(type => {
        const diff = initialCounts[type] - currentCounts[type];
        for (let i = 0; i < diff; i++) {
            const img = document.createElement('img');
            img.src = PIECE_IMAGES[type];
            capturedByWhiteEl.appendChild(img);
        }
    });

    ['Q', 'R', 'B', 'N', 'P'].forEach(type => {
        const diff = initialCounts[type] - currentCounts[type];
        for (let i = 0; i < diff; i++) {
            const img = document.createElement('img');
            img.src = PIECE_IMAGES[type];
            capturedByBlackEl.appendChild(img);
        }
    });
}

function updateEvaluation() {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let whiteScore = 0;
    let blackScore = 0;

    const board = game.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = board[r][f];
            if (piece && piece.type !== 'k') {
                if (piece.color === 'w') whiteScore += pieceValues[piece.type];
                else blackScore += pieceValues[piece.type];
            }
        }
    }

    let evalScore = whiteScore - blackScore;
    if (game.in_checkmate()) evalScore = game.turn() === 'w' ? -100 : 100;
    else if (game.in_draw()) evalScore = 0;

    let percentage = 50 + (evalScore * 5);
    percentage = Math.max(0, Math.min(100, percentage));

    evalBarFill.style.height = `${percentage}%`;

    if (isFlipped) {
        evalBarWrapper.style.transform = 'rotate(180deg)';
        evalScoreWhite.style.transform = 'rotate(180deg)';
        evalScoreBlack.style.transform = 'rotate(180deg)';
    } else {
        evalBarWrapper.style.transform = 'none';
        evalScoreWhite.style.transform = 'none';
        evalScoreBlack.style.transform = 'none';
    }

    const absEval = Math.abs(evalScore);
    const scoreText = game.in_checkmate() ? 'M' : absEval.toFixed(1);

    if (evalScore >= 0) {
        evalScoreWhite.textContent = scoreText;
        evalScoreWhite.style.display = 'block';
        evalScoreBlack.style.display = 'none';
    } else {
        evalScoreBlack.textContent = scoreText;
        evalScoreBlack.style.display = 'block';
        evalScoreWhite.style.display = 'none';
    }
}

function goToMoveIndex(targetIndex) {
    if (isPlayingReview) return;
    overlayDismissed = true;
    while (currentMoveIndex > targetIndex) {
        game.undo();
        currentMoveIndex--;
    }
    while (currentMoveIndex < targetIndex) {
        game.move(fullMoveList[currentMoveIndex]);
        currentMoveIndex++;
    }

    const hist = game.history({ verbose: true });
    lastMove = hist.length > 0 ? { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to } : null;
    updateUI();
}

function goPreviousMove() {
    pauseReview();
    if (currentMoveIndex > 0) goToMoveIndex(currentMoveIndex - 1);
}

function goNextMove() {
    pauseReview();
    if (currentMoveIndex < fullMoveList.length) goToMoveIndex(currentMoveIndex + 1);
}

function goFirstMove() {
    pauseReview();
    if (currentMoveIndex > 0) goToMoveIndex(0);
}

function goLastMove() {
    pauseReview();
    if (currentMoveIndex < fullMoveList.length) goToMoveIndex(fullMoveList.length);
}

function togglePlayReview() {
    overlayDismissed = true;
    if (isPlayingReview) {
        pauseReview();
    } else {
        if (currentMoveIndex === fullMoveList.length) {
            while (currentMoveIndex > 0) { game.undo(); currentMoveIndex--; }
            updateUI();
        }
        isPlayingReview = true;
        playBtn.textContent = 'Pause';
        reviewInterval = setInterval(() => {
            if (currentMoveIndex < fullMoveList.length) {
                game.move(fullMoveList[currentMoveIndex]);
                currentMoveIndex++;
                const hist = game.history({ verbose: true });
                lastMove = { from: hist[hist.length - 1].from, to: hist[hist.length - 1].to };

                try {
                    const lm = hist[hist.length - 1];
                    if (game.in_check() || game.in_checkmate()) {
                        checkSound.currentTime = 0; checkSound.play();
                    } else if (lm.captured) {
                        captureSound.currentTime = 0; captureSound.play();
                    } else {
                        moveSound.currentTime = 0; moveSound.play();
                    }
                } catch (e) { }

                updateUI();
            } else {
                pauseReview();
            }
        }, 1000);
    }
}

function pauseReview() {
    isPlayingReview = false;
    playBtn.textContent = 'Play';
    clearInterval(reviewInterval);
}

function saveGameIfNew(resultText) {
    if (gameSaved) return;
    if (fullMoveList.length === 0) return;

    const gameData = {
        date: new Date().toLocaleString(),
        moves: [...fullMoveList],
        result: resultText,
        moveCount: Math.ceil(fullMoveList.length / 2)
    };

    let saved = JSON.parse(localStorage.getItem('premiumChessGames')) || [];
    saved.unshift(gameData);
    localStorage.setItem('premiumChessGames', JSON.stringify(saved));
    gameSaved = true;
}

function openArchive() {
    archiveList.innerHTML = '';
    let saved = JSON.parse(localStorage.getItem('premiumChessGames')) || [];

    if (saved.length === 0) {
        archiveList.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No past games found.</div>';
    } else {
        saved.forEach((g) => {
            const item = document.createElement('div');
            item.className = 'archive-item';

            const info = document.createElement('div');
            info.innerHTML = `<strong>${g.result}</strong> <span style="opacity:0.8">(${g.moveCount} moves)</span>`;

            const date = document.createElement('div');
            date.className = 'archive-date';
            date.textContent = g.date;

            item.appendChild(info);
            item.appendChild(date);
            item.addEventListener('click', () => loadArchivedGame(g.moves));
            archiveList.appendChild(item);
        });
    }

    archiveOverlay.style.display = 'flex';
}

function loadArchivedGame(moves) {
    archiveOverlay.style.display = 'none';
    game.reset();
    fullMoveList = [];
    moveEvaluations = [];
    currentMoveIndex = 0;
    gameSaved = true;

    for (let move of moves) {
        const moveObj = game.move(move);
        const evalQuality = evaluateMoveQuality(moveObj, game);
        fullMoveList.push(move);
        moveEvaluations.push(evalQuality);
        currentMoveIndex++;
    }

    overlayDismissed = true;
    gameOverOverlay.style.display = 'none';
    updateUI();
    goFirstMove();
}

function getBadgeSymbol(quality) {
    switch (quality) {
        case 'book': return '📖';
        case 'brilliant': return '!!';
        case 'great': return '!';
        case 'best': return '★';
        case 'excellent': return '✓';
        case 'inaccuracy': return '?!';
        case 'mistake': return '?';
        case 'miss': return '∅';
        case 'blunder': return '??';
        case 'forced': return '□';
        default: return '';
    }
}

function isBlunder(gameInstance) {
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    const oppMoves = gameInstance.moves({ verbose: true });
    let maxMaterialWin = 0;

    for (let move of oppMoves) {
        if (move.captured) {
            let tempGame = new Chess(gameInstance.fen());
            tempGame.move(move.san);
            let ourMoves = tempGame.moves({ verbose: true });
            let canRecapture = ourMoves.some(m => m.to === move.to);
            let materialWin = pieceValues[move.captured];
            if (canRecapture) materialWin -= pieceValues[move.piece];
            if (materialWin > maxMaterialWin) maxMaterialWin = materialWin;
        }
    }
    return maxMaterialWin;
}

function evaluateMoveQuality(moveObj, gameInstance) {
    if (gameInstance.in_checkmate()) return 'brilliant';

    let tempGame = new Chess();
    for (let i = 0; i < currentMoveIndex; i++) {
        if (fullMoveList[i]) tempGame.move(fullMoveList[i]);
    }

    if (tempGame.moves().length === 1) return 'forced';

    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

    let ourMaxPotentialWin = isBlunder(tempGame);
    let actualWin = moveObj.captured ? pieceValues[moveObj.captured.toLowerCase()] : 0;
    if (ourMaxPotentialWin >= 5 && actualWin < ourMaxPotentialWin) return 'miss';

    let materialLoss = isBlunder(gameInstance);
    if (materialLoss >= 5) return 'blunder';
    if (materialLoss >= 3) return 'mistake';

    if (fullMoveList.length <= 10) return 'book';
    if (materialLoss > 0 && materialLoss < 3) return 'inaccuracy';

    if (moveObj.captured && pieceValues[moveObj.captured.toLowerCase()] > pieceValues[moveObj.piece.toLowerCase()]) return 'great';
    if (moveObj.san === 'O-O' || moveObj.san === 'O-O-O') return 'best';
    if (gameInstance.in_check()) return 'excellent';

    const rand = Math.random();
    if (rand > 0.85) return 'best';
    if (rand > 0.5) return 'excellent';
    return 'good';
}

init();