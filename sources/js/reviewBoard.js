let board;
let game = new Chess();
let loaded = false;
let index = 0;
let fens = [game.fen()];
const $board = $('#board');
const squareClass = 'square-55d63';
const pieceClass = 'piece-417db';
const whiteSquareGray = '#a9a9a9';
const blackSquareGray = '#696969';
const bwSquareBlue = '#6b6b99';
const bwSquareLightBlue = '#9797d8';
const pieceMove = new Audio('/aud/piece_move.mp3');

const startButton = document.querySelector('#startButton');
const previousButton = document.querySelector('#previousButton');
const reverseButton = document.querySelector('#reverseButton');
const nextButton = document.querySelector('#nextButton');
const endButton = document.querySelector('#endButton');
const loadButton = document.querySelector('#loadButton');
const idInput = document.querySelector('#id');
const feedback = document.querySelector('#feedback');

// Creates a new chess board.
board = Chessboard('board', {
	position: 'start',
	orientation: 'white',
	draggable: true,
	onDragStart: onDragStart,
	onDrop: onDrop,
	onMouseoutSquare: onMouseoutSquare,
	onMouseoverSquare: onMouseoverSquare,
	onSnapEnd: onSnapEnd,
	pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
});

/*
 * %%%%%%%%%%%%%%%%
 * Button Listeners
 * %%%%%%%%%%%%%%%%
*/

startButton.addEventListener('click', () => {
	if (fens) {
		index = 0;
		game.load(fens[0]);
		updatePosition(fens[0]);
	}
});

previousButton.addEventListener('click', () => {
	if (fens && index - 1 >= 0) {
		index--;
		game.load(fens[index]);
		updatePosition(fens[index]);
	}
});

reverseButton.addEventListener('click', () => {
	board.flip();
});

nextButton.addEventListener('click', () => {
	if (fens && index + 1 < fens.length) {
		index++;
		game.load(fens[index]);
		updatePosition(fens[index]);
	}
});

endButton.addEventListener('click', () => {
	if (fens) {
		index = fens.length - 1;
		game.load(fens[index]);
		updatePosition(fens[index]);
	}
});

loadButton.addEventListener('click', async () => {
	const id = idInput.value;

	// Fetches the game PGN
	const pgn = await (await fetch(`/api/requestGame?id=${id}`)).text();

	if (pgn) {
		// If the PGN is valid, loads the game.
		const loadedGame = new Chess()
		loadedGame.load_pgn(pgn);
		loaded = true;

		const temp = new Chess();
		fens = [temp.fen()];

		loadedGame.history().forEach((move => {
			temp.move(move);
			fens.push(temp.fen());
		}));

		index = 0;
		board.position(fens[0]);
		game.load(fens[0]);

		feedback.innerHTML = 'Game successfully loaded!';
	} else {
		feedback.innerHTML = 'Game not found!';
	}

	if (feedback.hidden) {
		feedback.hidden = false;
		setTimeout(() => { feedback.hidden = true; }, 2000);
	}
});

/*
 * %%%%%%%%%%%%%%%%%%%%%%
 * Board Helper Functions
 * %%%%%%%%%%%%%%%%%%%%%%
*/

// Removes all red highlights due to checks.
function clearChecks() {
	$(`.${squareClass}`).removeClass('highlight-check');
}

function removeHighlights() {
	$board
		.find('.' + squareClass)
		.removeClass('highlight-move');
}

// Checks if the king is in check. If it is, then highlights the square in red.
function highlightCheck() {
	clearChecks();
	if (game.in_check()) {
		if (game.turn() === 'w') {
			$board
				.find(`.${squareClass} > img[data-piece = "wK"]`)
				.parent()
				.addClass('highlight-check');
		} else {
			$board
				.find(`.${squareClass} > img[data-piece = "bK"]`)
				.parent()
				.addClass('highlight-check');
		}
	}
}

function removeBackgrounds() {
	$(`#board .${squareClass}`).css('background', '');
}

function graySquare(square) {
	const $square = $(`#board .square-${square}`);
	if ($square.children().hasClass(pieceClass)) {
		$square.css('background', bwSquareBlue);
		return;
	}
	$square.css('background', $square.hasClass('black-3c85d') ? blackSquareGray : whiteSquareGray);
}

function blueSquare(square) {
	const $square = $(`#board .square-${square}`);
	$square.css('background', bwSquareLightBlue);
}

/*
 * %%%%%%%%%%%%%%%%%%%%
 * Chessboard Callbacks
 * %%%%%%%%%%%%%%%%%%%%
*/

function onDragStart(source, piece) {
	if (game.game_over()) {
		return false;
	}

	if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
		(game.turn() === 'b' && piece.search(/^w/) !== -1)) {
		return false;
	}
}

function onDrop(source, target) {
	removeBackgrounds();
	const moveObj = {
		from: source,
		to: target,
		promotion: 'q' // TODO: Implement Promotion UI
	};

	const move = game.move(moveObj);

	if (move == null) {
		return 'snapback';
	}
}

function onSnapEnd() {
	updatePosition(game.fen());
};

function onMouseoverSquare(square, piece) {
	if (piece) {
		if (game.game_over()) {
			return;
		}

		if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
			(game.turn() === 'b' && piece.search(/^w/) !== -1)) {
			return;
		}

		const moves = game.moves({
			square: square,
			verbose: true
		});

		if (moves.length === 0) {
			return;
		}

		blueSquare(square);
		moves.forEach(move => graySquare(move.to));
	}
}

function onMouseoutSquare(square, piece) {
	removeBackgrounds();
}

function updatePosition(fen) {
	removeHighlights();
	pieceMove.play();
	board.position(fen);
	highlightCheck();
}
