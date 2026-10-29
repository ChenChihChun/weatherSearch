
const url = require('url');
const express = require('express');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

const dbModule = require('./dao/sqlLiteDB');
const backgroundService = require('./service/background');
const queryService = require('./service/query');
const scheduler = require('./service/scheduler');
const publisher = require('./service/publisher');

app.get('/', (req, res) => {
  let html = "<h1>NodeJs 服務測試，取得臺灣天氣資料</h1>";
  html += "<h2>資料來源：https://opendata.cwb.gov.tw</h2>";
  html += "<p>請使用Http GET本站台後方網址加上 /query?city={city}&id={id}  來取得天氣資料</p>";
  html += "<p>city 限於：臺北市、新北市、桃園市</p>";
  html += "<p>id 限於：admin、userTest</p>";
  html += "<p>目前所在位置的未來一小時與未來六天天氣，每小時整點自動發布 (00:00 ~ 07:00 不發布)，最新一則請看 <a href=\"/report\">/report</a></p>";
  res.send(html);
});

app.get('/report', (req, res) => {
	//最近一次發布的天氣報告
	const latest = publisher.getLatest();
	if (latest == null) {
		res.status(404).json({ 'msg': "尚未發布天氣報告" });
	} else {
		res.json(latest);
	}
});

app.get('/query', (req, res) => {
	const queryObject = url.parse(req.url,true).query;
	const q_ciry = queryObject.city;
	const id = queryObject.id;
	
	//執行查詢並回傳結果
	queryService.doQuery(q_ciry,id,res);
});

app.get('*', function(req, res){
  //輸入其他網址自動導回首頁
   res.redirect('/');
});

app.listen(port, hostname,() => {
 console.log(`Server running at http://${hostname}:${port}/`);
  //每小時整點：抓取中央氣象局資料，並發布目前位置天氣 (00:00 ~ 07:00 不發布)
  scheduler.start([backgroundService.doBackgroundInsertData]);
})
