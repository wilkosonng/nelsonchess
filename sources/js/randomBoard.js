let board;
let game = new Chess();
const nelsonRandom2 = new Audio('/aud/nelson_random2.mp3');

// Creates a new chess board.
board = Chessboard('board', {
	position: 'start',
	pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
});

makeRandomMoves();

function makeRandomMoves() {
	var possibleMoves = game.moves();

	if (game.game_over()) {
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

	setTimeout(makeRandomMoves, 800);
}