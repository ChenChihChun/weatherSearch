//宣告常態化物件
const weatherElementColumn = [
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

exports.weatherElementColumn = weatherElementColumn;

//WMO 天氣代碼對照 (Open-Meteo weather_code)
const weatherCodeDesc = {
	0: "晴天",
	1: "大致晴朗",
	2: "多雲時晴",
	3: "陰天",
	45: "有霧",
	48: "霧淞",
	51: "毛毛雨(小)",
	53: "毛毛雨(中)",
	55: "毛毛雨(大)",
	56: "凍毛毛雨(小)",
	57: "凍毛毛雨(大)",
	61: "小雨",
	63: "中雨",
	65: "大雨",
	66: "凍雨(小)",
	67: "凍雨(大)",
	71: "小雪",
	73: "中雪",
	75: "大雪",
	77: "霰",
	80: "短暫陣雨",
	81: "陣雨",
	82: "強陣雨",
	85: "陣雪",
	86: "強陣雪",
	95: "雷雨",
	96: "雷雨伴隨冰雹",
	99: "強雷雨伴隨冰雹"
}

exports.weatherCodeDesc = weatherCodeDesc;
