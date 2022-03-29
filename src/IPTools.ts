import fetch from 'node-fetch';

export interface IPInfo {
	latitude: number;
	longitude: number;
	country: string;
	city: string;
	organization: string;
}

export default async function getIPInfo(ip: string): Promise<IPInfo> {
	const res = await fetch(`https://iplocation.com/?ip=${ip}`, {
		headers: {
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
			'Accept': 'application/json'
		},
		method: 'POST'
	});
	const text = await res.text();
	const json = JSON.parse(text);
	return {
		latitude: json.lat as number,
		longitude: json.lng as number,
		country: json.country_name as string,
		city: json.city as string,
		organization: json.isp as string
	};
}
