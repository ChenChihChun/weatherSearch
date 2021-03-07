//專門處理背景作業

const needle = require("needle");
//爬蟲
const cheerio = require("cheerio");
const uuid = require('uuid-random');
const path = require('path');
const dbModule = require(path.resolve('dao', 'sqlLiteDB.js'));

//塞入天氣資料
const doBackgroundInsertData = () =>{
	console.log("塞入天氣資料");
	//臺北市  
	const city1 = encodeURIComponent("臺北市");//"%E8%87%BA%E5%8C%97%E5%B8%82";
	//新北市  
	const city2 = encodeURIComponent("新北市");//"%E6%96%B0%E5%8C%97%E5%B8%82";
	//桃園市  
	const city3 = encodeURIComponent("桃園市");//"%E6%A1%83%E5%9C%92%E5%B8%82";

	const requestURL = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-08C22948-5CBE-4FFA-9193-AFD9723861A4&format=JSON&locationName=";

	try {
		needle.get(requestURL + city1 + "," + city2 + "," + city3, doRequest);
	} catch (err){
		console.log(err);
	}
}

//執行爬蟲
function doRequest(error, response, body) {
	if (error) throw error;

	//body.records.location.locationName  ex: 臺北市
	const db = dbModule.db();
	for (let city in body.records.location) {
		const weatherElement = body.records.location[city].weatherElement;
		//console.log(body.records.location[city].locationName);
		const locationName = body.records.location[city].locationName;
		for (let i in weatherElement) {
			
			let startTime = "";
			let endTime = "";
			let value = "";
			for (let j in weatherElement[i].time) {
				//console.log(weatherElement[i].time[j].startTime);
				//console.log(weatherElement[i].time[j].endTime);
				//console.log(weatherElement[i].time[j].parameter.parameterName);
				//console.log(weatherElement[i].time[j].parameter.parameterValue);
				startTime = weatherElement[i].time[j].startTime;
				endTime = weatherElement[i].time[j].endTime;
				value = weatherElement[i].time[j].parameter.parameterName;
				//get uuid
				const myUUID = uuid();

				//insert data
				dbModule.insertWeatherData(db,[myUUID, locationName, weatherElement[i].elementName, value, startTime, endTime]);
			}
		}
	}
	//close db connection
	dbModule.closeDb(db);
}

exports.doBackgroundInsertData = doBackgroundInsertData;