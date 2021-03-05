const sqlite3 = require('sqlite3').verbose();

const path = require('path');
const dbPath = path.resolve('custom_modules/db', 'weather.db');


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



exports.db = db;
exports.closeDb = closeDb;