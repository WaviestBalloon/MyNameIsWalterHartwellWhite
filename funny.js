const express = require('express');
const { exec } = require('child_process')
const { stdout, stderr } = require('process')
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
let fuckyoudiscord = new Set();

async function rendervideo(ip, id, callback) {
	await fetch(`http://ip-api.com/json/${ip}`)
		.then(response => response.json())
		.then(data => {
			let latlon = data.lat + "," + data.lon;
			let country = data.country;
			let city = data.city;
			let org = data.isp;

			console.log(`id info for: ${id}\n${data}`);
			fs.writeFile(`./bin/log/${id}-${ip}.txt`, `${ip}\n${latlon}\n${country}\n${city}\n${org}`, (err) => {
				if (err) {
					console.error(`Something went wrong\nNerd stuff: ${err}`);
				} else {
					console.log(`${id} saved to ./bin/log/${id}-${ip}.text!`);
				}
			});
		});

	exec(`ffmpeg -i ${`./funny.mp4`} -vf "drawtext=fontfile=./impact.ttf:textfile=./bin/log/${id}-${ip}.txt:fontcolor=white:fontsize=85:x=(w-text_w)/1.5:y=(h-text_h)/2" -codec:a copy ./bin/${id}.mp4`, (err, stdout, stderr) => { // pain, fix later
		if (err) {
			return console.error(`Something went wrong, failed at the ffmpeg instance\nNerd stuff: ${err}`);
		}
		callback(stdout);
	});
}

app.get('/walt.mp4', function (req, res) {
	res.redirect('/');
});

app.get('/', async function (req, res) {
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	const id = Date.now();
	const headers = req.headers;

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
		setTimeout(() => {
			fuckyoudiscord.forEach((point) => {
				if (point == ip) {
					fuckyoudiscord.delete(point);
				}
			});
		}, 50000);
	}

	try {
		console.log(`rendering video for ${ip}`);
		await rendervideo(ip, id, function (returned) {
			console.log(`finished rendering video for ${id}`);
			res.setHeader('Content-Type', 'video/mp4');
			res.setHeader('X-COMPLETEDIN', `${Date.now() - id}ms`);
			res.sendFile(__dirname + `/bin/${id}.mp4`);
			fuckyoudiscord.forEach((point) => {
				if (point == ip) {
					fuckyoudiscord.delete(point);
				}
			});
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
		res.send("Something went wrong, retry later");
	}
});

app.listen(8080, function () {
	console.log('web app listening on port 8080');
});
