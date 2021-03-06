
const http = require('http');
const url = require('url');
//same as request
const needle = require("needle");
//爬蟲
const cheerio = require("cheerio");
const dbModule = require('./custom_modules/db/sqlLiteDB');
const uuid = require('uuid-random');

var express = require('express');
var app = express();

const hostname = '127.0.0.1';
const port = 3000;

var requestURL = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-08C22948-5CBE-4FFA-9193-AFD9723861A4&format=JSON&locationName=";


app.get('/', (req, res) => {
  var html = "<h1>NodeJs 服務測試，取得臺灣天氣資料</h1>";
  html += "<h2>資料來源：https://opendata.cwb.gov.tw</h2>";
  html += "<p>請使用Http GET本站台後方網址加上 /query?city={city}&id={id}  來取得天氣資料</p>";
  html += "<p>city 限於：臺北市、新北市、桃園市</p>";
  html += "<p>id 限於：admin、userTest</p>";
  res.send(html);
});

app.get('/query', (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  let q_ciry = queryObject.city;
  let id = queryObject.id;
		
		//判斷使用者是否有資格查詢
		getUserPermission([id]).then(function(list){
			var isAllow = list[0].ISALLOW;
			if (isAllow > 0) {

				//撈取資料
				getCityWeather([q_ciry]).then(function(list) {
					var returnData = [];
					if (list.length > 0) {
						returnData.push({'city' : q_ciry, 'element' : list, 'msg':"" });	
					} else {
						returnData.push({'city' : q_ciry, 'element' : list, 'msg' : "NOT FONUND!!" });	
					}
					res.writeHead('200', {'Content-Type': 'application/json'});
					res.end(JSON.stringify(returnData));
					
				}).catch(function(err) { //handle error here
					res.status(500);
					res.end(err);	
				});
				
			} else {
				var returnData = [];
				returnData.push({'city' : q_ciry, 'element' : [], 'msg':"您沒有權限查閱資料!!" });
				res.writeHead('200', {'Content-Type': 'application/json'});
				res.end(JSON.stringify(returnData));				
			}
		}).catch(function(err) { //handle error here
			res.status(500);
			res.end(err);	
		});
});

app.get('*', function(req, res){
  //輸入其他網址自動導回首頁
   res.redirect('/');
});

app.listen(port, hostname,() => {
 console.log(`Server running at http://${hostname}:${port}/`);
  //一小時
  var interval = 1000*60*60; 
  
  //interval = 5000*60; //for test
  
  setInterval(insertData,interval);
})

//取得使用者資料判斷是否有資格查詢資料
const getUserPermission = (parameter) => {
	console.log("取得使用者資料判斷是否有資格查詢資料");
	let element = []; //資料儲存
	return new Promise (function(resolve,reject) {
		var db = dbModule.db();
		db.get("SELECT ISALLOW FROM USERDATA where ID = ?",parameter,(err, row) => {
			if (err) {
			 console.log(err);
			 reject(err);
		   }
		   
		   if (row != null) {
			   element.push({"ISALLOW":row.ISALLOW});
		   } else {
			    element.push({"ISALLOW":0});
		   }
		   resolve(element);
		});
		dbModule.closeDb(db);
	});
}

//取得天氣資料
const getCityWeather = (parameter) => {
  console.log("取得天氣資料");
  let element = []; //資料儲存
  return new Promise (function(resolve,reject) {
	var db = dbModule.db();
    db.all("SELECT CITY_NAME, weatherElementColumn, weatherElementValue, startTime, endTime,MAX(IMPORT_TIME) FROM WEATHERDATA where CITY_NAME= ? and startTime<=  datetime('now','localtime') and  endTime >= datetime('now','localtime') group by CITY_NAME,weatherElementColumn,startTime,endTime",parameter, (err, rows) => {
      if (err) {
		 console.log(err);
         reject(err);
       }
	   
	  for (var rowId in rows){
		  for (var q in weatherElementColumn) {
				if (weatherElementColumn[q].nameE == rows[rowId].weatherElementColumn) {
					element.push ({ "elementCode": rows[rowId].weatherElementColumn,
									"elementName":weatherElementColumn[q].nameC,
									"elementValue": rows[rowId].weatherElementValue});
				}
		}
	  }
      resolve(element);
     });
	 dbModule.closeDb(db);
  })
};

//塞入天氣資料
function insertData() {
	console.log("塞入天氣資料");
	//臺北市  
	var city1 = encodeURIComponent("臺北市");//"%E8%87%BA%E5%8C%97%E5%B8%82";
	//新北市  
	var city2 = encodeURIComponent("新北市");//"%E6%96%B0%E5%8C%97%E5%B8%82";
	//桃園市  
	var city3 = encodeURIComponent("桃園市");//"%E6%A1%83%E5%9C%92%E5%B8%82";
	// var cityArray = [city1,city2,city3];
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
	var db = dbModule.db();
	for (var city in body.records.location) {
		var weatherElement = body.records.location[city].weatherElement;
		//console.log(body.records.location[city].locationName);
		var locationName = body.records.location[city].locationName;
		for (var i in weatherElement) {
			var elementName = "";
			//elementName: Wx(天氣現象)、MaxT(最高溫度)、MinT(最低溫度)、CI(舒適度)、PoP(降雨機率)
			for (var q in weatherElementColumn) {
				if (weatherElementColumn[q].nameE == weatherElement[i].elementName) {
					//console.log(weatherElementColumn[q].nameC);
					elementName = weatherElementColumn[q].nameE;
				}
			}
			var startTime = "";
			var endTime = "";
			var value = "";
			for (var j in weatherElement[i].time) {
				//console.log(weatherElement[i].time[j].startTime);
				//console.log(weatherElement[i].time[j].endTime);
				//console.log(weatherElement[i].time[j].parameter.parameterName);
				//console.log(weatherElement[i].time[j].parameter.parameterValue);
				startTime = weatherElement[i].time[j].startTime;
				endTime = weatherElement[i].time[j].endTime;
				value = weatherElement[i].time[j].parameter.parameterName;
				//get uuid
				var myUUID = uuid();

				//insert data
				db.run("INSERT INTO WEATHERDATA(ID,CITY_NAME,weatherElementColumn,weatherElementValue,startTime,endTime,IMPORT_TIME) VALUES(?,?,?,?,?,?,datetime('now','localtime'))", [myUUID, locationName, elementName, value, startTime, endTime], function (err) {
					if (err) {
						return console.log(err.message);
					}
				});
			}
		}
	}
	//close db connection
	dbModule.closeDb(db);
}

var weatherElementColumn = [
	{
		nameE: "Wx",
		nameC: "天氣現象"
	},
	{
		nameE: "MaxT",
		nameC: "最高溫度"
	},
	{
		nameE: "MinT",
		nameC: "最低溫度"
	},
	{
		nameE: "CI",
		nameC: "舒適度"
	},
	{
		nameE: "PoP",
		nameC: "降雨機率"
	}
]