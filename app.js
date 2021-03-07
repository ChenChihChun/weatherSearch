
const url = require('url');
const express = require('express');
const app = express();
const hostname = '127.0.0.1';
const port = 3000;

const dbModule = require('./dao/sqlLiteDB');
const backgroundService = require('./service/background');
const queryService = require('./service/query');

app.get('/', (req, res) => {
  let html = "<h1>NodeJs 服務測試，取得臺灣天氣資料</h1>";
  html += "<h2>資料來源：https://opendata.cwb.gov.tw</h2>";
  html += "<p>請使用Http GET本站台後方網址加上 /query?city={city}&id={id}  來取得天氣資料</p>";
  html += "<p>city 限於：臺北市、新北市、桃園市</p>";
  html += "<p>id 限於：admin、userTest</p>";
  res.send(html);
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
  //一小時
  let interval = 1000*60*60; 
  
  //interval = 5000//*60; //for test
  //呼叫背景服務
  setInterval(function(){
	  backgroundService.doBackgroundInsertData();
  },interval);
})




