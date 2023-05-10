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


const db = client.db('Cluster0');

// Asserts argument length is correct
if (process.argv.length != 3) {
	process.stdout.write('Usage summerCamp.js portNumber');
	process.exit(1);
}

const portNumber = process.argv[2];
const games = new Map();

// Adds request handlers
app.get('/', (req, res) => {
	res.render(path.resolve(templates, 'index.ejs'));
});

app.get('/play', (req, res) => {
	res.render(path.resolve(templates, 'play.ejs'));
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