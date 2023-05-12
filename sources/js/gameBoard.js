let board;
let ready = false;
let game = new Chess();
const $board = $('#board');
const squareClass = 'square-55d63';
const pieceClass = 'piece-417db';
const whiteSquareGray = '#a9a9a9';
const blackSquareGray = '#696969';
const bwSquareBlue = '#6b6b99';
const bwSquareLightBlue = '#9797d8';
const nelsonWin = new Audio('/aud/nelson_win.mp3');
const nelsonLose = new Audio('/aud/nelson_lose.mp3');
const nelsonPanic = new Audio('/aud/nelson_panic.mp3');
const pieceMove = new Audio('/aud/piece_move.mp3');
const nelsonCheck = new Audio('/aud/nelson_panic.mp3');

const match = (window.location.pathname).match(/\/(?<id>[a-zA-Z0-9]{8})\/(?<color>[bw])/);
const id = match?.groups?.id;
const color = match?.groups?.color;


// Creates a new chess board.
board = Chessboard('board', {
	position: 'start',
	draggable: true,
	onDragStart: onDragStart,
	onDrop: onDrop,
	onMouseoutSquare: onMouseoutSquare,
	onMouseoverSquare: onMouseoverSquare,
	onSnapEnd: onSnapEnd,
	pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
});

const ws = new WebSocket('ws://localhost:5000');

ws.onopen = () => {
	console.log('Open websocket');
	ws.send(JSON.stringify(
		{
			type: 'start',
			id: id,
			color: color,
			data: null
		}));
};

ws.onmessage = (data) => {
	const msg = JSON.parse(data);

	if (msg.type === 'ready') {
		ready = true;
	} else if (msg.type === 'move') {
		// TODO: Implement move
	}
};

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
		if (!game.game_over()) {
			nelsonPanic.play();
		}

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
	if (!ready) {
		return false;
	}

	if (game.game_over()) {
		return false;
	}

	if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
		(game.turn() === 'b' && piece.search(/^w/) !== -1)) {
		return false;
	}
}

function onDrop(source, target) {
	removeBackgrounds()

	const move = game.move({
		from: source,
		to: target,
		promotion: 'q' // TODO: Implement Promotion UI
	});

	if (move == null) {
		return 'snapback';
	}

	removeHighlights();
	$board.find('.square-' + source).addClass('highlight-move');
	$board.find('.square-' + target).addClass('highlight-move');
}

function onMouseoverSquare(square, piece) {
	if (!ready) {
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

function onMouseoutSquare(square, piece) {
	removeBackgrounds();
}

function onSnapEnd() {
	updatePosition(game.fen());
};

function updatePosition(fen) {
	pieceMove.play();
	board.position(fen);
	highlightCheck();
}