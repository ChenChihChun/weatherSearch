//每小時整點執行排程，00:00 ~ 06:59 不發布天氣報告
const path = require('path');
const locationService = require(path.resolve('service', 'location.js'));
const forecastService = require(path.resolve('service', 'forecast.js'));
const publisher = require(path.resolve('service', 'publisher.js'));

//不發布時段 [開始小時, 結束小時)
const quietStart = 0;
const quietEnd = 7;

//取得指定時區目前的小時 (0~23)
const currentHour = (date) => {
	return parseInt(new Intl.DateTimeFormat("en-US", { timeZone: forecastService.timezone, hour: "numeric", hourCycle: "h23" }).format(date), 10);
}

const isQuietHour = (date) => {
	const hour = currentHour(date);
	return hour >= quietStart && hour < quietEnd;
}

//查詢目前位置天氣並發布
const publishWeatherReport = async () => {
	try {
		const location = await locationService.getLocation();
		const report = await forecastService.getForecast(location);
		await publisher.publish(report, forecastService.formatReport(report));
	} catch (err) {
		console.log(`天氣報告發布失敗：${err.message}`);
	}
}

//每小時要執行的作業
const runHourly = (hourlyJobs) => {
	for (let job of hourlyJobs) {
		try {
			job();
		} catch (err) {
			console.log(err);
		}
	}
	if (isQuietHour(new Date())) {
		console.log("00:00 ~ 07:00 不發布天氣報告");
	} else {
		publishWeatherReport();
	}
}

//距離下一個整點的毫秒數
const msUntilNextHour = (date) => {
	const next = new Date(date.getTime());
	next.setMinutes(60, 0, 0);
	return next.getTime() - date.getTime();
}

//啟動排程：啟動時若不在不發布時段先發布一次，之後每個整點執行
const start = (hourlyJobs = []) => {
	if (!isQuietHour(new Date())) {
		publishWeatherReport();
	}
	const scheduleNext = () => {
		setTimeout(() => {
			runHourly(hourlyJobs);
			scheduleNext();
		}, msUntilNextHour(new Date()));
	};
	scheduleNext();
}

exports.start = start;
exports.isQuietHour = isQuietHour;
exports.msUntilNextHour = msUntilNextHour;
exports.publishWeatherReport = publishWeatherReport;
