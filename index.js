// Necessary imports
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Chess } = require('chess.js');
const { WebSocketServer } = require('ws');
require('dotenv').config();

// Defines an express application and adds the body parser middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Defines a new web socket server on the same port
// TODO: Implement more robust session system (express-session) + UUID
const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });
// Map of ongoing games: ID -> Game: { w: player, b: player, chess: Chess() }
// Map of color id pairs: ws -> { color: (b|w), id: id }
const games = new Map();
const info = new Map();
const portNumber = 5000;

wss.on('connection', (ws, req) => {
	/* WS Message Structure:
	 * { type: start | move
     *   id: id
	 *   color: b | w
	 *   data: datum
	 * }
	*/ 
	const socket = ws;

	ws.on('message', (message) => {
		const obj = JSON.parse(message);
		const { type, id, color, data } = obj;

		if (id == null || !games.has(id)) {
			ws.send('Game does not exist.');
			return;
		}

		if (type === 'start') {
			const game = games.get(id);
			game[color] = ws;
			info.set(ws, { color: color, id: id });
			
			if (game['w'] && game['b']) {
				const readyMessage = JSON.stringify({ type: 'ready' });
				game['w'].send(readyMessage);
				game['b'].send(readyMessage);
			}
		} else if (obj.type === 'move') {
			// TODO
		} else {
			// Unrecognized sequence
		}
	});

	ws.on('close', () => {
		const id = (info.get(socket)).id;
		const game = games.get((info.get(socket)).id);
		const otherColor = (info.get(socket)).color == 'w' ? 'b' : 'w';
		info.delete(socket);
		info.delete(game[otherColor]);
		games.delete(id);
	});
});

// Defines static files
app.use(express.static(path.join(__dirname, 'sources')));

// Defines a MongoDB client
const uri = `mongodb+srv://${process.env.MONGO_UN}:${process.env.MONGO_PASS}@cluster0.wvflvd2.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

process.stdin.setEncoding('utf8');
const templates = path.resolve(__dirname, 'templates');

// Attempts to connect to Atlas
async () => {
	try {
		await client.connect();
		await client.db("admin").command({ ping: 1 });
		console.log('Connected to DB');
	} catch (err) {
		console.log('Could not connect. Closing.');
		console.dir(err);
		process.exit(1);
	}
};

const collection = client.db('Cluster0').collection('Games');

// Adds request handlers
app.get('/', (req, res) => {
	res.render(path.resolve(templates, 'index.ejs'));
});

app.get('/play', (req, res) => {
	res.render(path.resolve(templates, 'play.ejs'));
});

app.post('/playRequest/:type', async (req, res) => {
	const type = req.params.type;
	
	if (type === 'create') {
		let { color } = req.body;

		// Generates a random color if the user selected it.
		if (color === 'random') {
			color = Math.random() < 0.5 ? 'black' : 'white';
		}

		// If the request has a bad color, error.
		if (color !== 'black' && color !== 'white') {
			return res.send('Oops! Something went terribly wrong (invalid color)!');
		}

		// Generate a new ID and then create a new game.
		const id = await genID();
		games.set(id, { w: undefined, b: undefined, chess: new Chess() });
		return res.redirect(`/game/${id}/${color === 'black' ? 'b' : 'w'}`);
	} else if (type === 'join') {
		const { id } = req.body;
		const res = games.get(id);

		// Check if the game exists.
		if (res) {
			// Assign the joiner the correct piece color based on the creator's color.
			if (res.w == null) {
				return res.redirect(`/game/${id}/w`);
			} else if (res.b == null) {
				return res.redirect(`/game/${id}/b`);
			} else {
				return res.send(`Oops! The lobby you're trying to join seems to be full! Try creating your own game!`);
			}
		} else {
			return res.send(`Oops! Couldn't find the lobby! Try double-checking your ID or creating a game!`);
		}
	} else {
		return res.send('Oops! Something went terribly wrong (invalid type)!');
	}
});

app.get('/game/:id/:color', (req, res) => {
	const { id, color } = req.params;
	if (games.has(id)) {
		res.render(path.resolve(templates, 'game.ejs'));
	} else {
		res.send('Oops! Something went terribly wrong (cannot find game)!')
	}
});

app.get('/review', (req, res) => {
	res.render(path.resolve(templates, 'review.ejs'));
});

app.get('/about', (req, res) => {
	res.render(path.resolve(templates, 'about.ejs'));
});

app.get('/test', (req, res) => {
	res.render(path.resolve(templates, 'test.ejs'));
});

// Implements command line interpreter

process.stdin.on("readable", function () {
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === 'stop') {
			process.exit(0);
		} else {
			process.stdout.write(`Command not recognized: ${command}\n`);
		}
		process.stdout.write('> ');
		process.stdin.resume();
	}
});

server.listen(portNumber, () => {
	console.log(`Web server is running at http://localhost:${portNumber}`);
	process.stdout.write('> ');
});

// Makes sure application logs out in case of what we call an "oopsie"
process.on('uncaughtException', (error) => {
	console.error(error);
	process.exit(1);
});

process.on('SIGINT', () => {
	process.exit(1);
});

process.on('exit', async () => {
	console.log('Shutting down the server');
	await client.close();
});

// Generates a unique game ID
// TODO: Bloom filter mayhaps?
async function genID() {
	const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let id = '';
	for (let i = 0; i < 8; i++) {
		id += validChars[Math.random() * validChars.length << 0];
	}

	const res = await collection.findOne({ id: id });
	if (res != null || Array.from(games.keys()).some(e => e.id === id)) {
		return genID();
	}

	return id;
}