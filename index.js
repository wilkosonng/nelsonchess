// Necessary imports
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Defines an express application and adds the body parser middleware
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Defines a MongoDB client
const uri = `mongodb + srv://${process.env.MONGO_UN}:${process.env.MONGO_PASS}@cluster0.wvflvd2.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

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

// Gets a reference to the collection.
const applicants = client.db('Cluster0').collection('applicants');

// Resolves template folder path
const templates = path.resolve(__dirname, 'templates');

// Sets standard input stream encoding
process.stdin.setEncoding('utf8');

// Asserts argument length is correct
if (process.argv.length != 3) {
	process.stdout.write('Usage summerCamp.js portNumber');
	process.exit(1);
}

// Loads the argument as port number
const portNumber = process.argv[2];

// Adds request handlers
app.get('/', (req, res) => {
	res.render(path.resolve(templates, 'index.ejs'));
});

app.get('/apply', (req, res) => {
	res.render(path.resolve(templates, 'apply.ejs'));
});

app.post('/processApplication', async (req, res) => {
	const { name, email, gpa, backgroundInfo } = req.body;
	const document = {
		name: name,
		email: email,
		gpa: parseFloat(gpa),
		backgroundInfo: backgroundInfo
	};

	const mongoRes = await applicants.insertOne(document);
	if (mongoRes.acknowledged) {
		res.render(path.resolve(templates, 'processApplication.ejs'), { ...document, timestamp: new Date() });
		return;
	}

	res.send('Oops. Something went wrong on our end. Try again!')
});

app.get('/reviewApplication', (req, res) => {
	res.render(path.resolve(templates, 'reviewApplication.ejs'));
});

app.post('/processReviewApplication', async (req, res) => {
	const email = req.body.email;
	const document = await applicants.findOne({ email: email });

	if (document) {
		res.render(path.resolve(templates, 'processApplication.ejs'), { ...document, timestamp: new Date() });
		return;
	}

	res.send(`Oops! Could not find the requested email address in our database! Please <a href="/apply">apply!</a>`);
});

app.get('/selectByGPA', (req, res) => {
	res.render(path.resolve(templates, 'selectByGPA.ejs'));
});

app.post('/processGPA', async (req, res) => {
	const gpa = parseFloat(req.body.gpa);
	const matches = (await (await applicants.find({ gpa: { $gte: gpa } })).toArray());

	res.render(path.resolve(templates, 'processGPA.ejs'), { rows: matches.reduce((a, e) => a += `<tr><td>${e.name}</td><td>${e.gpa}</td></tr>`, '') });
});

app.get('/removeAllApplications', (req, res) => {
	res.render(path.resolve(templates, 'removeAllApplications.ejs'));
});

app.post('/processRemove', async (req, res) => {
	const numRemoved = (await applicants.deleteMany({})).deletedCount;

	res.render(path.resolve(templates, 'processRemove.ejs'), { numRemoved: numRemoved });
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