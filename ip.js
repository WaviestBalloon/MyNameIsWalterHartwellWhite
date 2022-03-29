//Waviest is gay
const fetch = require('node-fetch');

async function getinfo(ip) {
	if (ip && ip.length > 0 && /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/gm.test(ip)) {
		try {
			await fetch(`http://iplocation.com/?ip=${ip}`, {
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
					"Accept": "application/json"
				},
				"method": "POST"
			})
				.then(response => {
					(async function () {
						console.log(await response.text());
					})();
					console.log(response);
					response.json()
				})
				.then(data => {
					if (data && data.length > 0) {
						console.log(data);
						let lat = data.lat;
						let lon = data.lon;
						let country = data.country;
						let city = data.city;
						let org = data.isp;

						return [lat, lon, country, city, org];
					} else {
						console.error(`Unable to fetch IP address data: Data returned null/nil or data.length is zero`);
					}
				});
		} catch (err) {
			console.error(`Unable to fetch IP address data: ${err}`);
			return err;
		}
	} else {
		console.warn(`No/Invalid IP: ${ip}`);
		return "No/Invalid IP provided";
	}
}

module.exports = {
	getinfo
}
