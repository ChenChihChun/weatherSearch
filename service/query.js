const path = require('path');
const dbModule = require(path.resolve('dao', 'sqlLiteDB.js'));

const doQuery = (q_ciry,id,res) =>{
	//判斷使用者是否有資格查詢
	const db = dbModule.db();
	dbModule.getUserPermission(db,[id]).then(function(list){
		const isAllow = list[0].ISALLOW;
		if (isAllow > 0) {
			//撈取資料
			dbModule.getCityWeather(db,[q_ciry]).then(function(list) {
				let returnData = [];
				if (list.length > 0) {
					returnData.push({'city' : q_ciry, 'element' : list, 'msg':"" });	
				} else {
					returnData.push({'city' : q_ciry, 'element' : list, 'msg' : "NOT FONUND!!" });	
				}
				res.writeHead('200', {'Content-Type': 'application/json'});
				res.end(JSON.stringify(returnData));
			});
		} else {
			let returnData = [];
			returnData.push({'city' : q_ciry, 'element' : [], 'msg':"您沒有權限查閱資料!!" });
			res.writeHead('200', {'Content-Type': 'application/json'});
			res.end(JSON.stringify(returnData));
		}
		dbModule.closeDb(db);
	});
}


exports.doQuery = doQuery;