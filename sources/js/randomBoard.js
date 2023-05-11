let board;
const $board = $('#board');
let game = new Chess();
const squareClass = 'square-55d63';
const pieceClass = 'piece-417db';
const nelsonRandom2 = new Audio('/aud/nelson_random2.mp3');

// Creates a new chess board.
board = Chessboard('board', {
	position: 'start',
	pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
});

makeRandomMoves();

function makeRandomMoves() {
	const possibleMoves = game.moves();

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
	$(`.${squareClass}`).removeClass('highlight-check');
}

// Checks if the king is in check. If it is, then highlights the square in red.
function highlightCheck() {
	clearChecks();
	if (game.in_check()) {
		if (game.turn() === 'w') {
			$('#board')
				.find(`.${squareClass} > img[data-piece = "wK"]`)
				.parent()
				.addClass('highlight-check');
		} else {
			$('#board')
				.find(`.${squareClass} > img[data-piece = "bK"]`)
				.parent()
				.addClass('highlight-check');
		}
	}
}