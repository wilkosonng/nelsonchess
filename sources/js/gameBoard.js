let board;
let ws;
let ready = false;
let game = new Chess();
const $board = $('#board');
const sidebar = document.querySelector('#sidebarInfo');
const lobbyCode = document.querySelector('#lobbyCode');
const copyButton = document.querySelector('#copyButton');
const lobbyFeedback = document.querySelector('#lobbyFeedback');
const squareClass = 'square-55d63';
const pieceClass = 'piece-417db';
const whiteSquareGray = '#a9a9a9';
const blackSquareGray = '#696969';
const bwSquareBlue = '#6b6b99';
const bwSquareLightBlue = '#9797d8';
const nelsonWin = new Audio('/aud/nelson_win.mp3');
const nelsonLose = new Audio('/aud/nelson_lose.mp3');
const nelsonDraw = new Audio('/aud/nelson_draw.mp3');
const nelsonPanic = new Audio('/aud/nelson_panic.mp3');
const nelsonInteresting = new Audio('/aud/nelson_interesting.mp3');
const nelsonDepressed = new Audio('/aud/nelson_depress.mp3');
const nelsonBegin = new Audio('/aud/nelson_begin.mp3');
const nelsonDisapprove = new Audio('/aud/nelson_disapprove.mp3');
const nelsonPot = new Audio('/aud/nelson_random1.mp3');
const pieceMove = new Audio('/aud/piece_move.mp3');

const match = (window.location.pathname).match(/\/(?<id>[a-zA-Z0-9]{8})\/(?<color>[bw])/);
const id = match?.groups?.id;
const color = match?.groups?.color;

lobbyCode.innerHTML = `<strong>Code</strong>: ${id}`;
copyButton.addEventListener('click', copyLobbyCode);

try {
	if (id == null || color == null) {
		sidebar.innerHTML = 'Invalid ID or color';
		throw new Error('Invalid ID or color');
	}

	// Creates a new chess board.
	board = Chessboard('board', {
		position: 'start',
		orientation: color === 'b' ? 'black' : 'white',
		draggable: true,
		onDragStart: onDragStart,
		onDrop: onDrop,
		onMouseoutSquare: onMouseoutSquare,
		onMouseoverSquare: onMouseoverSquare,
		onSnapEnd: onSnapEnd,
		pieceTheme: '/img/chesspieces/nelsonchess/{piece}.png'
	});

	ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);

	ws.onopen = () => {
		console.log('OPEN');
		ws.send(JSON.stringify(
			{
				type: 'start',
				id: id,
				color: color,
				data: null
			}));
	};

	ws.onmessage = (data) => {
		const msg = JSON.parse(data.data);

		if (msg.type === 'ready') {
			ready = true;
			document.querySelector('#oppName').innerHTML = 'Opponent';
			nelsonBegin.play();
			console.log('READY!');
		} else if (msg.type === 'move') {
			const moveObj = msg.data;
			game.move(moveObj);
			makeMove(moveObj);
			updatePosition(game.fen());
		}
	};

	ws.onclose = (msg) => {
		ready = false;
		if (!game.game_over()) {
			sidebar.innerHTML = 'Oof. Looks like your opponent bailed on you. Maybe you should re-evaluate your friendships.';
			nelsonDepressed.play();
		}
	}
} catch (err) {
	document.querySelector('.main').innerHTML = err.toString();
}

/*
 * TODO: Modulize Helper Functions
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

	if (game.turn() != color) {
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
		nelsonDisapprove.play();
		return 'snapback';
	}

	makeMove(moveObj);

	ws.send(JSON.stringify(
		{
			type: 'move',
			id: id,
			color: color,
			data: moveObj
		}
	));
}

function onSnapEnd() {
	updatePosition(game.fen());
};

function onMouseoverSquare(square, piece) {
	if (!ready) {
		return;
	}

	if (game.turn() != color) {
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

function updatePosition(fen) {
	pieceMove.play();
	board.position(fen);
	highlightCheck();
}

/*
 * %%%%%%%%%%%%%%%%%%%%
 * Chessboard Functions
 * %%%%%%%%%%%%%%%%%%%%
*/

function makeMove(moveObj) {
	removeHighlights();
	$board.find('.square-' + moveObj.from).addClass('highlight-move');
	$board.find('.square-' + moveObj.to).addClass('highlight-move');
	if (Math.random() < 0.05) {
		if (Math.random() < 0.002) {
			nelsonPot.play();
		} else {
			nelsonInteresting.play();
		}
	}

	if (game.game_over()) {
		endGame();
	}
}

function endGame() {
	ready = false;

	if (game.in_draw()) {
		nelsonDraw.play();
		sidebar.innerHTML = `<p>Result: Game Draw</p><br><p>Review game with code: ${id}</p>`;
	}

	if (game.in_checkmate()) {
		const winner = game.turn();
		if (color === winner) {
			nelsonWin.play();
		} else {
			nelsonLose.play();
		}
		sidebar.innerHTML = `<p>Result: ${winner === 'w' ? 'Black' : 'White'} wins!</p><br><p>Review game with code: ${id}</p>`;
	}
}

/*
 * %%%%%%%%%%%%%
 * Misc. Helpers
 * %%%%%%%%%%%%%
 */

function copyLobbyCode() {
	if (!navigator.clipboard) {
		lobbyFeedback.innerHTML = 'Error copying loby code.';
	} else {
		navigator.clipboard.writeText(id);
		lobbyFeedback.innerHTML = 'Lobby code copied!';
	}

	if (lobbyFeedback.hidden) {
		lobbyFeedback.hidden = false;
		setTimeout(() => { lobbyFeedback.hidden = true; }, 2000);
	}
}