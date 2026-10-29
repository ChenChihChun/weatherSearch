//取得指定位置的未來一小時與未來六天天氣 (資料來源：Open-Meteo)
const needle = require("needle");
const path = require('path');
const commonModule = require(path.resolve('custom_modules', 'common.js'));

const timezone = process.env.WEATHER_TIMEZONE || "Asia/Taipei";

const describe = (code) => commonModule.weatherCodeDesc[code] || `代碼${code}`;

//取得天氣預報
const getForecast = async (location) => {
	const query = [
		`latitude=${location.latitude}`,
		`longitude=${location.longitude}`,
		"hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m",
		"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
		`timezone=${encodeURIComponent(timezone)}`,
		"forecast_days=7"
	].join("&");
	const response = await needle("get", "https://api.open-meteo.com/v1/forecast?" + query, null, { json: true, open_timeout: 10000, response_timeout: 10000 });
	if (response.statusCode != 200 || !response.body || !response.body.hourly || !response.body.daily) {
		throw new Error(`取得天氣預報失敗：HTTP ${response.statusCode}`);
	}
	return buildReport(location, response.body, new Date());
}

//目前時間在指定時區的 "YYYY-MM-DDTHH:00" 字串 (與 Open-Meteo hourly.time 格式相同)
const localHourKey = (date) => {
	const parts = {};
	new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
		.formatToParts(date).forEach((p) => { parts[p.type] = p.value; });
	return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:00`;
}

//整理成報告物件
const buildReport = (location, body, now) => {
	const hourly = body.hourly;
	const daily = body.daily;

	//未來一小時：下一個整點
	const nextHourKey = localHourKey(new Date(now.getTime() + 60 * 60 * 1000));
	let h = hourly.time.indexOf(nextHourKey);
	if (h < 0) h = 0;
	const nextHour = {
		time: hourly.time[h],
		weather: describe(hourly.weather_code[h]),
		temperature: hourly.temperature_2m[h],
		apparentTemperature: hourly.apparent_temperature[h],
		humidity: hourly.relative_humidity_2m[h],
		precipitationProbability: hourly.precipitation_probability[h],
		windSpeed: hourly.wind_speed_10m[h]
	};

	//未來六天：從明天開始
	const today = localHourKey(now).substring(0, 10);
	let start = daily.time.indexOf(today) + 1;
	if (start <= 0) start = 1;
	let days = [];
	for (let d = start; d < daily.time.length && days.length < 6; d++) {
		days.push({
			date: daily.time[d],
			weather: describe(daily.weather_code[d]),
			maxTemperature: daily.temperature_2m_max[d],
			minTemperature: daily.temperature_2m_min[d],
			precipitationProbability: daily.precipitation_probability_max[d]
		});
	}

	return {
		location: location.name,
		latitude: location.latitude,
		longitude: location.longitude,
		generatedAt: localHourKey(now).substring(0, 11) + new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now),
		nextHour: nextHour,
		days: days
	};
}

//轉成發布用文字
const formatReport = (report) => {
	const weekday = ["日", "一", "二", "三", "四", "五", "六"];
	const n = report.nextHour;
	let lines = [];
	lines.push(`📍 ${report.location} 天氣預報 (${report.generatedAt.replace("T", " ")})`);
	lines.push("");
	lines.push(`【未來一小時 ${n.time.substring(11)}】`);
	lines.push(`${n.weather}，${n.temperature}°C (體感 ${n.apparentTemperature}°C)，降雨機率 ${n.precipitationProbability}%，濕度 ${n.humidity}%，風速 ${n.windSpeed} km/h`);
	lines.push("");
	lines.push("【未來六天】");
	for (let d of report.days) {
		const day = weekday[new Date(d.date + "T00:00:00Z").getUTCDay()];
		lines.push(`${d.date.substring(5)} (${day}) ${d.weather}，${d.minTemperature}~${d.maxTemperature}°C，降雨機率 ${d.precipitationProbability}%`);
	}
	return lines.join("\n");
}

exports.timezone = timezone;
exports.getForecast = getForecast;
exports.buildReport = buildReport;
exports.formatReport = formatReport;
