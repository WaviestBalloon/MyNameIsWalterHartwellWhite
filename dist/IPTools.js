import fetch from 'node-fetch';
export default async function getIPInfo(ip) {
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
        latitude: json.lat,
        longitude: json.lng,
        country: json.country_name,
        city: json.city,
        organization: json.isp
    };
}
//# sourceMappingURL=IPTools.js.map