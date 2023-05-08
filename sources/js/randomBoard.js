let board;
let game = new Chess();

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
			makeRandomMoves();
		}, 2000);

		return;
	}

	game.move(possibleMoves[Math.floor(Math.random() * possibleMoves.length)]);
	board.position(game.fen());

	setTimeout(makeRandomMoves, 800);
}