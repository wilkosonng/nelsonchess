let board;
let game = new Chess();
const squareClass = 'square-55d63';
const nelsonWin = new Audio('/aud/nelson_win.mp3');
const nelsonLose = new Audio('/aud/nelson_lose.mp3');
const pieceMove = new Audio('/aud/piece_move.mp3');
const nelsonCheck = new Audio('/aud/nelson_panic.mp3');

// Creates a new chess board.
board = Chessboard('board', {
	position: 'start',
	pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
});

makeRandomMoves();

function makeRandomMoves() {
	// Cleans up board of highlights
	clearChecks();

	var possibleMoves = game.moves();

	if (game.game_over()) {
		// Game is over? Starts a new game after ~ 2 seconds.
		setTimeout(() => {
			game = new Chess();
			board.position(game.fen());
			nelsonRandom2.play();
			makeRandomMoves();
		}, 2000);

		return;
	}

	game.move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
	board.position(game.fen());
	highlightCheck();

	setTimeout(makeRandomMoves, 800);
}

// Removes all red highlights due to checks.
function clearChecks() {
	$('#board').find('.' + squareClass).removeClass('highlight-check');
}

// Checks if the king is in check. If it is, then highlights the square in red.
function highlightCheck() {
	if (game.in_check()) {
		const color = game.turn();
		if (color === 'w') {
			$('img[data-piece = "wK"]').parent().addClass('highlight-check');
		} else {
			$('img[data-piece = "bK"]').parent().addClass('highlight-check');
		}
	}
}