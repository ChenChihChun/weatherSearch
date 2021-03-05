# NodeJs 服務測試，取得臺灣天氣資料
資料來源：https://opendata.cwb.gov.tw

**實際內容：**
- 每一個小時去中央氣象局開放資料平臺抓取臺北市,新北市,桃園市即時天氣資訊, 並且存到DB (使用SQLlite)
- 提供一個API,  讓合法使用者可以查詢天氣資訊, 此天氣資訊直接從DB讀取

## **安裝方式**

```shell
#安裝相關module：needle、cheerio、sqlite3、uuid-random、express
npm install
#啟動Server
node app.js

```
> 授權碼部分，中央氣象局開放資料平臺提供透過Url下載檔案以及 Restful Api 資料擷取方法取用資料，中央氣象局開放資料平臺採用會員服務機制，需帶入資料項目代碼以及有效會員之授權碼，方可取得各式開放資料

> 內含測試用資料庫weather.db

## **相關TABLE**

```sql
CREATE TABLE USERDATA(
   ID varchar(10) PRIMARY KEY	NOT NULL,
   NAME	TEXT	NOT NULL,
   ISALLOW	INT(1)  DEFAULT 0
);

INSERT INTO USERDATA (ID, NAME, ISALLOW)  VALUES ('admin', '管理者', 1);
IINSERT INTO USERDATA (ID, NAME, ISALLOW) VALUES ('userTest', '測試人員', 0);

CREATE TABLE WEATHERDATA(
   ID	CHAR(36)	PRIMARY KEY	NOT NULL,
   CITY_NAME	VARCHAR(3)	NOT NULL,
   weatherElementColumn	VARCHAR(4)	NOT NULL,
   weatherElementValue	VARCHAR(50)	NOT NULL,
   startTime	CHAR(19)	NOT NULL,
   endTime	CHAR(19)	NOT NULL,
   IMPORT_TIME	CHAR(19)	NOT NULL,
);

CREATE INDEX WD_INDEX1 ON WEATHERDATA (
    CITY_NAME,
    startTime,
    endTime
);

```

## **使用說明**
- 請使用Http GET本站台後方網址加上 /query?city={city}&id={id}  來取得天氣資料
- city 限於：臺北市、新北市、桃園市
- id 限於：admin、userTest
