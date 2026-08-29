import handler from './web/api/wealth-oracle.verify.mjs';
import fs from 'fs';

// 12 星座 × 多语言压测数据集（来自主公指令）
const cases = [
  { no: 1,  sign: '白羊/Aries',        birthDate: '1988-03-21', birthTime: '00:01', lat: 39.9042,  lon: 116.4074, tz: 'Asia/Shanghai',        lang: 'zh' },
  { no: 2,  sign: '金牛/Taurus',      birthDate: '1996-05-01', birthTime: '12:00', lat: 51.5074,  lon: -0.1278,  tz: 'Europe/London',        lang: 'en' },
  { no: 3,  sign: '双子/Gemini',      birthDate: '2000-05-21', birthTime: '23:59', lat: 48.8566,  lon: 2.3522,   tz: 'Europe/Paris',         lang: 'fr' },
  { no: 4,  sign: '巨蟹/Cancer',      birthDate: '1992-06-21', birthTime: '06:00', lat: 40.4168,  lon: -3.7038,  tz: 'Europe/Madrid',        lang: 'es' },
  { no: 5,  sign: '狮子/Leo',         birthDate: '1984-08-08', birthTime: '08:08', lat: 13.7563,  lon: 100.5018, tz: 'Asia/Bangkok',         lang: 'th' },
  { no: 6,  sign: '处女/Virgo',       birthDate: '1993-09-09', birthTime: '09:09', lat: 10.8231,  lon: 106.6297, tz: 'Asia/Ho_Chi_Minh',     lang: 'vi' },
  { no: 7,  sign: '天秤/Libra',       birthDate: '1985-09-23', birthTime: '18:30', lat: 25.0330,  lon: 121.5654, tz: 'Asia/Taipei',          lang: 'zh' },
  { no: 8,  sign: '天蝎/Scorpio',     birthDate: '1999-10-31', birthTime: '23:45', lat: 40.7128,  lon: -74.0060, tz: 'America/New_York',     lang: 'en' },
  { no: 9,  sign: '射手/Sagittarius', birthDate: '1990-12-12', birthTime: '12:12', lat: 45.5019,  lon: -73.5674, tz: 'America/Montreal',     lang: 'fr' },
  { no: 10, sign: '摩羯/Capricorn',   birthDate: '2000-01-01', birthTime: '00:00', lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires', lang: 'es' },
  { no: 11, sign: '水瓶/Aquarius',    birthDate: '2004-02-29', birthTime: '15:30', lat: 18.7883,  lon: 98.9853,  tz: 'Asia/Bangkok',         lang: 'th' },
  { no: 12, sign: '双鱼/Pisces',      birthDate: '1995-02-19', birthTime: '04:15', lat: 21.0278,  lon: 105.8342, tz: 'Asia/Ho_Chi_Minh',     lang: 'vi' },
];

// 语言特征字符（粗略检测返回文本是否匹配目标语言）
const langMark = {
  zh: /[一-鿿]/,
  en: /[a-zA-Z]/,
  fr: /[àâäéèêëïîôöùûüç]/i,
  es: /[áéíóúñ¿¡]/i,
  th: /[ก-๛]/,
  vi: /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i,
};

const results = [];
for (const c of cases) {
  const req = {
    method: 'POST',
    body: {
      birthDate: c.birthDate,
      birthTime: c.birthTime,
      lat: c.lat, lon: c.lon, tz: c.tz,
      lang: c.lang,
      reportType: 'monthly',
      free_access: 1,
    },
    headers: {},
  };
  const res = {
    _status: 200, _json: null, _body: '',
    setHeader() {}, writeHead(code) { this._status = code; return this; },
    status(code) { this._status = code; return this; },
    json(o) { this._json = o; return this; },
    end(b) { if (b != null) this._body = (typeof b === 'string') ? b : String(b); return this; },
  };
  const t0 = Date.now();
  try {
    await handler(req, res);
  } catch (e) {
    console.log(`#${c.no} ${c.sign} EXCEPTION: ${e.message}`);
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  let out = res._json;
  if (!out && res._body) { try { out = JSON.parse(res._body); } catch { out = { raw: res._body }; } }
  const report = (out && (out.report || out.insight)) || (out && out.raw) || '';
  const garble = report.includes('�');
  const langOk = langMark[c.lang] ? langMark[c.lang].test(report) : true;
  const zodiacRaw = out?.data?.zodiac ? JSON.stringify(out.data.zodiac) : null;
  results.push({ ...c, status: res._status, elapsed, len: report.length, garble, langOk, zodiacRaw, reportHead: report.slice(0, 150) });
  console.log(`#${c.no} ${c.sign.padEnd(16)} lang=${c.lang} → HTTP ${res._status} | ${elapsed}s | ${String(report.length).padStart(4)}字 | 乱码:${garble ? '❌' : '✅'} | 星座:${zodiacRaw ? zodiacRaw.slice(0, 48) : 'N/A'}`);
}

fs.writeFileSync('/tmp/wealth_pressure_results.json', JSON.stringify(results, null, 2));
console.log(`\n✅ 压测完成 12 条，结果存 /tmp/wealth_pressure_results.json`);
console.log(`汇总: HTTP200=${results.filter(r => r.status === 200).length}/12 | 乱码=${results.filter(r => r.garble).length} | 语言不匹配=${results.filter(r => !r.langOk).length}`);
