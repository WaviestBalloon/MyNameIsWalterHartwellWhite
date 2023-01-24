import express from "express";
import { exec } from "node:child_process";
import { mkdir, writeFile, unlink, rm } from "node:fs/promises";
import getIPInfo from "./IPTools.js";
import { existsSync } from "node:fs";

const app = express();
const fuckYouDiscord = new Set();

const deletionTimeout = 35000;
const portNumber = 8080; // P.S. Change this to port 80 if you want to use a web server, I have my port set to 8080 for my Nginx instance. (so you probably will have to change it!!!)

if (existsSync("./bin")) await rm("./bin", { recursive: true });
await mkdir("./bin/logs", { recursive: true });
await mkdir("./bin/videos", { recursive: true });

function removeIPFromRateLimit(ip: string) {
	fuckYouDiscord.delete(ip);
}

async function renderVideo(ip: string, res: express.Response) {
	let data;
	try {
		data = await getIPInfo(ip);
		if (data.organization.includes("Google")) {
			throw new Error("Google detected");
		}
	} catch (e) {
		res.status(500).send("Something went wrong, please try again later.");
		throw e;
	}
	const ipFileSafe = ip.replace(/[\W]+/g, "_");
	console.log(`ID info for: ${ip}\nLatitude, Longitude: ${data.latitude}, ${data.longitude}\nCountry: ${data.country}\nCity: ${data.city}\nOrganization: ${data.organization}`);
	try {
		await writeFile(`./bin/logs/${ipFileSafe}.txt`, `${ip}\n${data.latitude}, ${data.longitude}\n${data.country}\n${data.city}\n${data.organization}`);
	} catch (e) {
		res.status(500).send("Something went wrong, please try again later.");
		throw e;
	}

	const command = `ffmpeg -i ./assets/funny.mp4 -vf "drawtext=fontfile=./assets/impact.ttf:textfile=./bin/logs/${ipFileSafe}.txt:fontcolor=white:fontsize=65:x=(w-text_w)/12:y=(h-text_h)/2" -c:a copy -c:v libx264 -preset veryfast -crf 18 ./bin/videos/${ipFileSafe}_out.mp4`;
	await new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				console.log(`Video ${ip} rendered successfully!`);
				try {
					unlink(`./bin/logs/${ipFileSafe}.txt`).then(resolve);
				} catch (e) {
					reject(e);
				}
			}
		});
	});
}

async function handleRequest(req: express.Request, res: express.Response) {
	const ip = (req.headers["x-forwarded-for"] as string),
		startedAt = Date.now();

	const ipFileSafe = ip.replace(/[\W]+/g, "_");
	if (existsSync(`./bin/videos/${ipFileSafe}_out.mp4`)) {
		console.log(`Video ${ip} already exists, serving!`);
		res.sendFile(`./bin/videos/${ipFileSafe}_out.mp4`, { root: "." });
		return;
	}

	console.log(req.headers);
	if (req.headers["user-agent"] && req.headers["user-agent"].includes("Discord")) {
		console.log("Discord detected for", ip);
		res.sendFile(`./assets/theberg.html`, { root: "." });
		return;
	}
	if (fuckYouDiscord.has(ip)) {
		console.log("Rate limit hit for", ip);
		res.status(429).header("Content-Type", "text/html").send(`You are being ratelimited, please wait a bit (You should automatically be removed from being ratelimited after ${deletionTimeout / 1000} seconds)<br><iframe width="560" height="315" src="https://www.youtube.com/embed/jeg_TJvkSjg?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`);
		return;
	} else {
		console.log("new request from", ip);
		fuckYouDiscord.add(ip);
		setTimeout(() => removeIPFromRateLimit(ip), deletionTimeout);
		try {
			await renderVideo(ip, res);
		} catch (e) {
			if (e.message === "Google detected") res.sendFile(`./assets/theberg.html`, { root: "." });
			else {
				res.status(500).send("Something went wrong, please try again later.");
				console.error(e);
			}
			return;
		}
		res.setHeader("Content-Type", "video/mp4");
		res.setHeader("X-Completed-In", `${Date.now() - startedAt}`);
		res.sendFile(`./bin/videos/${ipFileSafe}_out.mp4`, { root: "." });

		setTimeout(async () => {
			try {
				console.log("Deleting video", ip);
				await unlink(`./bin/videos/${ipFileSafe}_out.mp4`);
			} catch (e) {
				console.error(e);
			}
		}, deletionTimeout);
	}
}

app.get("/theberg.gif", (req, res) => res.sendFile("./assets/theberg.gif", { root: "." }));
app.get("/theberg", (req, res) => res.sendFile("./assets/theberg.html", { root: "." }));
app.get("*", handleRequest);

app.listen(portNumber, () => console.log(`walter is confessing on port ${portNumber}`));
