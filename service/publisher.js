//發布天氣報告
const needle = require("needle");

//最近一次發布的報告 (提供 /report 查詢)
let latest = null;

//發布：寫入 log、保存最新報告，並推送到有設定的頻道
const publish = async (report, text) => {
	latest = { report: report, text: text };
	console.log(text);

	//Discord Webhook
	if (process.env.DISCORD_WEBHOOK_URL) {
		try {
			const response = await needle("post", process.env.DISCORD_WEBHOOK_URL, { content: text }, { json: true });
			console.log(`Discord 發布結果：HTTP ${response.statusCode}`);
		} catch (err) {
			console.log(`Discord 發布失敗：${err.message}`);
		}
	}

	//Telegram Bot
	if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
		try {
			const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
			const response = await needle("post", url, { chat_id: process.env.TELEGRAM_CHAT_ID, text: text }, { json: true });
			console.log(`Telegram 發布結果：HTTP ${response.statusCode}`);
		} catch (err) {
			console.log(`Telegram 發布失敗：${err.message}`);
		}
	}
}

const getLatest = () => latest;

exports.publish = publish;
exports.getLatest = getLatest;
