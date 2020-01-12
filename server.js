// server.js
// where your node app starts

// init project
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
require('dotenv').config();

const cron = require('node-cron');
const prettyBytes = require('pretty-bytes');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

const args = require('minimist')(process.argv.slice(2));

// set the listening port either from the args or 8080
const port = typeof args[0] !== 'undefined' ? args[0] : 8080;

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
	response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the dreams in the database
app.get("/results", (request, response) => {
	db.all("SELECT * from Results", (err, rows) => {
		response.send(JSON.stringify(rows));
	});
});

// endpoint to clear dreams from the database
app.get("/reset", (request, response) => {

	if ( process.env.ALLOW_RESET === "true" ) {

		// remove the results table
		db.run('DROP TABLE IF EXISTS Results;');

		// …and create a new one, we do it like this to reset the schema
		db.run(
			"CREATE TABLE Results (id INTEGER PRIMARY KEY AUTOINCREMENT, download INTEGER, upload INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
		);

		response.send('Reset completed');

	} else {
		response.send('Not allowed to reset the database');
	}

});

async function testConnection() {

	console.log('Testing connection...');

	const { stdout } = await exec('speedtest-cli --json');
	const result = JSON.parse(stdout);

	const download = parseInt(result.download);
	const upload = parseInt(result.upload);

	console.table({
		"Download": prettyBytes(download),
		"Upload": prettyBytes(upload)
	});

	db.run(`INSERT INTO Results (download, upload) VALUES (?, ?)`, download, upload, error => {
		if (error) {
			console.log(error);
			console.error('Error saving results');
		}
	});

}

cron.schedule('*/5 * * * *', () => {
	testConnection();
});

// listen for requests :)
var listener = app.listen(port, () => {
	console.log(`Your app is listening on port ${port}`);
});
