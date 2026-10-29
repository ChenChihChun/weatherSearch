//取得目前所在位置
const needle = require("needle");

//最後一次成功取得的位置 (查詢失敗時沿用)
let lastLocation = null;

//IP 定位服務 (依序嘗試)
const ipLookups = [
	{
		url: "https://ipapi.co/json/",
		parse: (body) => ({ latitude: body.latitude, longitude: body.longitude, name: [body.city, body.region, body.country_name].filter(Boolean).join(", ") })
	},
	{
		url: "https://ipwho.is/",
		parse: (body) => ({ latitude: body.latitude, longitude: body.longitude, name: [body.city, body.region, body.country].filter(Boolean).join(", ") })
	}
];

//取得位置：優先使用環境變數 WEATHER_LAT / WEATHER_LON，否則以 IP 自動定位
const getLocation = async () => {
	const lat = parseFloat(process.env.WEATHER_LAT);
	const lon = parseFloat(process.env.WEATHER_LON);
	if (!isNaN(lat) && !isNaN(lon)) {
		return { latitude: lat, longitude: lon, name: process.env.WEATHER_LOCATION_NAME || `${lat}, ${lon}` };
	}

	for (let lookup of ipLookups) {
		try {
			const response = await needle("get", lookup.url, null, { json: true, open_timeout: 10000, response_timeout: 10000 });
			const location = lookup.parse(response.body || {});
			if (response.statusCode == 200 && typeof location.latitude == "number" && typeof location.longitude == "number") {
				lastLocation = location;
				return location;
			}
			console.log(`IP 定位失敗 (${lookup.url})：HTTP ${response.statusCode}`);
		} catch (err) {
			console.log(`IP 定位失敗 (${lookup.url})：${err.message}`);
		}
	}

	if (lastLocation != null) {
		console.log("沿用上一次取得的位置");
		return lastLocation;
	}
	throw new Error("無法取得目前位置，請設定環境變數 WEATHER_LAT / WEATHER_LON");
}

exports.getLocation = getLocation;
