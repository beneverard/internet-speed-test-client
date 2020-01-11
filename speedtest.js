const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fetch = require("node-fetch");

async function testConnection() {

	const { stdout } = await exec('speedtest-cli --json');
	const result = JSON.parse(stdout);

	const download = parseInt(result.download);
	const upload = parseInt(result.upload);

	fetch('https://internet-speed-test.glitch.me/results', {
		method: 'post',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"download": download,
			"upload": upload
		})
	});

}

testConnection();
