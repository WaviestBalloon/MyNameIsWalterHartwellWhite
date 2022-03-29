const express = require('express');
const { exec } = require('child_process')
const { stdout, stderr } = require('process')
const fs = require('fs');
const fetch = require('node-fetch');
const iplookup = require('./ip.js');

const app = express();
let fuckyoudiscord = new Set();

function removeipfromratelimit(ip) {
	fuckyoudiscord.forEach((point) => {
		if (point == ip) {
			fuckyoudiscord.delete(point);
		}
	});
}

async function rendervideo(ip, id, callback) {
	await iplookup.getinfo(ip, (err, data) => {
		if (err) {
			return console.error(`Something went wrong\nNerd stuff: ${err}`);
		} else {
			let latlon = `${data[0]},${data[1]}`;
			let country = data[2];
			let city = data[3];
			let org = data[4];

			console.log(`id info for: ${id}\n${latlon}\n${country}\n${city}\n${org}`);
			fs.writeFile(`./bin/log/${id}-${ip}.txt`, `${ip}\n${latlon}\n${country}\n${city}\n${org}`, (err) => {
				if (err) {
					return console.error(`Something went wrong\nNerd stuff: ${err}`);
				} else {
					console.log(`${id} saved to ./bin/log/${id}-${ip}.text!`);
				}
			});
		}

		exec(`ffmpeg -i ${`./assets/funny.mp4`} -vf "drawtext=fontfile=./assets/impact.ttf:textfile=./bin/log/${id}-${ip}.txt:fontcolor=white:fontsize=85:x=(w-text_w)/12:y=(h-text_h)/2" -codec:a copy ./bin/${id}.mp4`, (err, stdout, stderr) => { // pain, fix later
			try {
				fs.unlinkSync(`./bin/log/${id}-${ip}.txt`);
			} catch (err) {
				console.error(`Something went wrong\nNerd stuff: ${err}`);
			}
			if (err) {
				return console.error(`Something went wrong, failed at the ffmpeg instance\nNerd stuff: ${err}`);
			}
			callback(stdout);
		});
	});
}

app.get('/walt.mp4', function (req, res) {
	res.redirect('/');
});

app.get('/', async function (req, res) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	const id = Date.now();
	const headers = req.headers;
	console.log(headers);

	ip = ip.split(':').slice(-1)[0];

	if (fuckyoudiscord.has(ip)) {
		console.log(`${ip} attempted to send a request but they are ratelimited: You are being ratelimited, please wait a bit (You should automatically be removed from being ratelimited after a minute)`);
		return res.send("You are being ratelimited, please wait a bit (You should automatically be removed from being ratelimited after a minute)");
	} else if (req.headers['user-agent'].includes('Discordbot') || req.headers['user-agent'].includes('DiscordWebhooks') || req.headers['user-agent'].includes('Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0')) {
		console.log(`discord preview/embed preview blocked, ${ip}: (Blacklisted from server)`);
		return res.sendFile(__dirname + `/clickit.png`);
	} else {
		console.log(`new request, from ${ip}, assigned a video id to serve of ${id}`);
		fuckyoudiscord.add(ip);
		setTimeout(() => removeipfromratelimit(ip), 25000);

		try {
			console.log(`rendering video for ${ip}`);
			await rendervideo(ip, id, function (returned) {
				console.log(`finished rendering video for ${id}`);
				res.setHeader('Content-Type', 'video/mp4');
				res.setHeader('X-COMPLETEDIN', `${Date.now() - id}ms`);
				res.sendFile(__dirname + `/bin/${id}.mp4`);

				removeipfromratelimit(ip);
				setTimeout(() => {
					try {
						fs.unlinkSync(`./bin/${id}.mp4`);
					} catch (err) {
						return console.warn(`Unable to clean file from bin storage\nNerd stuff: ${err}`);
					}
				}, 35000)
			});
		} catch(err) {
			console.warn(err);
			removeipfromratelimit(ip);
			res.send("Something went wrong, retry again");
		}
	}
});

app.listen(8080, function () {
	console.log('walter is confessing on port 8080');
});
