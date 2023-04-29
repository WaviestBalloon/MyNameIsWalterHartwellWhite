import axios from "axios";

export interface IPInfo {
	latitude: number;
	longitude: number;
	country: string;
	city: string;
	organization: string;
}
export interface IPInfoResponse {
	data: {
		lat: number;
		lng: number;
		country_name: string;
		city: string;
		isp: string;
	}
}

export default async function getIPInfo(ip: string): Promise<IPInfo> {
	const res: IPInfoResponse = await axios.post(`https://iplocation.com/?ip=${ip}`, null, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36",
			"Accept": "application/json"
		}
	});
	/* This is no longer needed because of sexy axios doing JSON parsing for us!!!
	const text = await res.text();
	const json = JSON.parse(res.data);*/
	return {
		latitude: res.data.lat,
		longitude: res.data.lng,
		country: res.data.country_name,
		city: res.data.city,
		organization: res.data.isp
	};
}
