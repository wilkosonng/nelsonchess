// Necessary imports
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Chess } = require('chess.js');
const { WebSocketServer } = require('ws');
require('dotenv').config();

// Defines an express application and adds the body parser middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Defines a new web socket server on the same port
// TODO: handle WSS handlers
const socketServer = new WebSocketServer({ server: app });

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

// Asserts argument length is correct
if (process.argv.length != 3) {
	process.stdout.write('Usage summerCamp.js portNumber');
	process.exit(1);
}

const portNumber = process.argv[2];
const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// Map of ongoing games: ID -> Game: { w: player, b: player, obj: Chess() }
const games = new Map();

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

		if (color === 'random') {
			color = Math.random() < 0.5 ? 'black' : 'white';
		}

		if (color !== 'black' && color !== 'white') {
			return res.send('Oops! Something went terribly wrong (invalid color)!');
		}

		const id = await genID();
		games.set(id, { w: undefined, b: undefined, game: new Chess() })
		return res.redirect(`/game/${id}/${color === 'black' ? 'b' : 'w'}`);
	} else if (type === 'join') {
		const { id } = req.body;
		const res = games.get(id);
		if (res != null) {
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
		console.log('Create not defined.')
		return res.send('Oops! Something went terribly wrong (invalid type)!');
	}
});

app.get('/game/:id/:color', (req, res) => {
	const { id, color } = req.params;
	res.send(`Request receieved from ${id} ${color}`)
});

app.get('/review', (req, res) => {
	res.render(path.resolve(templates, 'review.ejs'));
});

app.get('/about', (req, res) => {
	res.render(path.resolve(templates, 'about.ejs'));
});

app.listen(portNumber);
console.log(`Web server is running at http://localhost:${portNumber}`);

// Implements command line interpreter
const prompt = "Stop to shut down the server: ";

process.stdout.write(prompt);
process.stdin.on("readable", function () {
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === 'stop') {
			process.exit(0);
		} else {
			process.stdout.write(`Invalid command: ${command}\n`);
		}
		process.stdout.write(prompt);
		process.stdin.resume();
	}
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