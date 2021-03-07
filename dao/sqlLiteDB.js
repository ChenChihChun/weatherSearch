const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('', 'weather.db');
//引用物件
const commonModule = require(path.resolve('custom_modules', 'common.js'));

//建立DB連線
const db = () => {
  return new sqlite3.Database(dbPath, (err) => {
	  if (err) {
		console.error(err.message);
  } else {
	   console.log('Connected to the weather database.');
  }
  });
};

//關閉DB連線
const closeDb = (db) => {
  db.close((err) => {
		  if (err) {
			console.error(err.message);
		  } else {
			  console.log('Close the database connection.');
		  }
		});
};

//取得使用者資料判斷是否有資格查詢資料
const getUserPermission = async (db,parameter) => {
	console.log("取得使用者資料判斷是否有資格查詢資料");
	let element = []; //資料儲存
	try {
		await new Promise (function(resolve,reject) {
			
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
		});
	} catch (err) {
		console.log(err);
	}
	return element;
}

//取得天氣資料
const getCityWeather = async (db,parameter) => {
  console.log("取得天氣資料");
  let element = []; //資料儲存
  try {
	  await new Promise (function(resolve,reject) {
		
		db.all("SELECT CITY_NAME, weatherElementColumn, weatherElementValue, startTime, endTime,MAX(IMPORT_TIME) FROM WEATHERDATA where CITY_NAME= ? and startTime<=  datetime('now','localtime') and  endTime >= datetime('now','localtime') group by CITY_NAME,weatherElementColumn,startTime,endTime",parameter, (err, rows) => {
		  if (err) {
			 console.log(err);
			 reject(err);
		   }
		   
		  for (let rowId in rows){
			  for (let q in commonModule.weatherElementColumn) {
					if (commonModule.weatherElementColumn[q].nameE == rows[rowId].weatherElementColumn) {
						element.push ({ "elementCode": rows[rowId].weatherElementColumn,
										"elementName":commonModule.weatherElementColumn[q].nameC,
										"elementValue": rows[rowId].weatherElementValue});
					}
			}
		  }
		  resolve(element);
		 });
	  });
  } catch (err) {
	  console.log(err);
  }
  return element;
};

//資料Insert
const insertWeatherData = (db,parameter) => {
	db.run("INSERT INTO WEATHERDATA(ID,CITY_NAME,weatherElementColumn,weatherElementValue,startTime,endTime,IMPORT_TIME) VALUES(?,?,?,?,?,?,datetime('now','localtime'))", parameter, function (err) {
		if (err) {
			return console.log(err.message);
		}
	});	
}


exports.db = db;
exports.closeDb = closeDb;
exports.getUserPermission = getUserPermission;
exports.getCityWeather = getCityWeather;
exports.insertWeatherData = insertWeatherData;