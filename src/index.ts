import fastify, { FastifyReply, FastifyRequest } from "fastify";

import getIPInfo from "./IPTools.js";
import { createReadStream, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { exec } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";

const server = fastify({ logger: false });
const fuckYouDiscord = new Set();

const ratelimitTimeout = 5000;
// Rendering videos is costly, I would recommend you'd keep this to a five second cooldown per IP
const deletionTimeout = 185000;
// The rendered video will be cached for 185 seconds
const portNumber = 8080;
// Change `portNumber` to 80 if you are not using a reverse proxy like Nginx

if (existsSync("./bin")) await rm("./bin", { recursive: true });
await mkdir("./bin/logs", { recursive: true });
await mkdir("./bin/videos", { recursive: true });

function removeIPFromRateLimit(ip: string) {
	fuckYouDiscord.delete(ip);
}

async function renderVideo(ip: string, ipFileSafe: string, reply: FastifyReply) {
	let data;

	if (ip === "127.0.0.1") {
		console.log(`Localhost detected, using a fake IP!`);
		ip = "1.1.1.1";
	}

	try {
		data = await getIPInfo(ip);
		if (data.organization.includes("Google")) reply.code(403).send({ error: "No." });
	} catch (err) {
		console.warn(err);
		reply.code(500).send({ error: "Couldn't resolve your IP address, try again later." });
	}

	console.log(data)
	console.log(`Info for: ${ip}\nLatitude, Longitude: ${data.latitude}, ${data.longitude}\nCountry: ${data.country}\nCity: ${data.city}\nOrganization: ${data.organization}`);
	try {
		writeFileSync(`./bin/logs/${ipFileSafe}.txt`, `${ip}\n${data.latitude}, ${data.longitude}\n${data.country}\n${data.city}\n${data.organization}`);
	} catch (err) {
		console.warn(err);
		reply.code(500).send({ error: "Couldn't write information to bin directory, try again later." });
	}

	const command = `ffmpeg -i ./assets/funny.mp4 -vf "drawtext=fontfile=./assets/impact.ttf:textfile=./bin/logs/${ipFileSafe}.txt:fontcolor=white:fontsize=65:x=(w-text_w)/12:y=(h-text_h)/2" -c:a copy -c:v libx264 -preset veryfast -crf 18 ./bin/videos/${ipFileSafe}_out.mp4`;
	await new Promise((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				console.log(`Video ${ip} rendered successfully!`);
				try {
					unlinkSync(`./bin/logs/${ipFileSafe}.txt`);
					resolve(true);
				} catch (e) {
					reject(e);
				}
			}
		});
	});
}

async function handleRequest(request: FastifyRequest, reply: FastifyReply) {
	const ip = request.headers["x-forwarded-for"] as string || request.ip as string,
		startedAt = Date.now();

	console.log(`New request from ${ip}`);
	console.log(request.headers)

	const ipFileSafe = ip.replace(/[\W]+/g, "_");
	if (existsSync(`./bin/videos/${ipFileSafe}_out.mp4`)) {
		console.log(`Video ${ip} already exists, serving!`);
		reply.send(readFileSync(`./bin/videos/${ipFileSafe}_out.mp4`));
		return;
	}

	if (request.headers["user-agent"] && request.headers["user-agent"].includes("Discord")) {
		console.log(`Discord detected for ${ip}`);
		reply.type("text/html").send(readFileSync(`./assets/theberg.html`));
		return;
	}
	if (fuckYouDiscord.has(ip)) {
		console.log(`Ratelimit hit for ${ip}`);
		reply.code(429).send({ error: `You are sending too many requests, try again after ${deletionTimeout / 1000} seconds (You know I can't cook meth that fast!)` });
		return;
	}

	fuckYouDiscord.add(ip);
	setTimeout(() => removeIPFromRateLimit(ip), ratelimitTimeout);

	try {
		await renderVideo(ip, ipFileSafe, reply);
	} catch (err) {
		reply.code(500).send({ error: "Something went wrong, Jesse Pinkman broke it." });
		throw err;
	}

	reply.header("Content-Type", "video/mp4");
	reply.header("X-Completed-In", `${Date.now() - startedAt}`);
	reply.send(readFileSync(`./bin/videos/${ipFileSafe}_out.mp4`));

	setTimeout(async () => {
		try {
			console.log(`Deleting cached video for ${ip}`);
			unlinkSync(`./bin/videos/${ipFileSafe}_out.mp4`);
		} catch (err) {
			throw err;
		}
	}, deletionTimeout);
}

server.get("/theberg.gif", (request: FastifyRequest, reply: FastifyReply) => reply.send(readFileSync(`./assets/theberg.gif`)));
server.get("/theberg", (request: FastifyRequest, reply: FastifyReply) => reply.type("text/html").send(readFileSync(`./assets/theberg.html`)));
server.get("*", handleRequest);

server.listen({ port: portNumber, host: "0.0.0.0" }, (err: Error, address: string) => {
	if (err) throw err;
	console.log(`walter heisenburger is confessing on port ${address}`);
});
