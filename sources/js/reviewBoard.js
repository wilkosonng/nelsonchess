let board;
let game = new Chess();
const $board = $('#board');
const squareClass = 'square-55d63';
const pieceClass = 'piece-417db';
const whiteSquareGray = '#a9a9a9';
const blackSquareGray = '#696969';
const bwSquareBlue = '#6b6b99';
const bwSquareLightBlue = '#9797d8';
const pieceMove = new Audio('/aud/piece_move.mp3');

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