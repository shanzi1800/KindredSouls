// VERCEL_REDEPLOY_TRIGGER_$(date +%s)
// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

// 🛡️ 防弹金钟罩：所有错误强行吐出
export default async function handler(req, res) {
  console.log("[wealth-oracle] Request received");
  
  try {
    // 动态引入，避免顶层 import 崩塌
    const { createClient } = require('@supabase/supabase-js');
    
    // 环境变量检查
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        error: "Missing Supabase Config",
        debug: {
          SUPABASE_URL: supabaseUrl ? "OK" : "MISSING",
          SUPABASE_SERVICE_KEY: supabaseKey ? "OK" : "MISSING"
        }
      });
    }
    
    if (!deepseekKey) {
      return res.status(200).json({
        error: "Missing DEEPSEEK_API_KEY",
        hint: "Please add DEEPSEEK_API_KEY to Vercel environment variables"
      });
    }
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    // 解析请求体
    let body;
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    }
    
    const { birthDate, lang = 'zh', referrer = 'standalone', reportType, includeInsight = true } = body;
    
    if (!birthDate) {
      return res.status(400).json({ error: 'Missing birthDate (format: YYYY-MM-DD)' });
    }
    
    console.log("[wealth-oracle] Processing:", { birthDate, lang, reportType });
    
    // 初始化 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 解析生日
    const [year, month, day] = birthDate.split('-').map(Number);
    const birthInfo = { year, month, day, hour: 12, minute: 0 };
    
    // ========== 八字算法 ==========
    const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const TG_WUXING = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
    const DZ_WUXING = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
    
    function yearTianGan(y) {
      const idx = (y - 4) % 10;
      return TIANGAN[(idx + 10) % 10];
    }
    function yearDiZhi(y) {
      const idx = (y - 4) % 12;
      return DIZHI[(idx + 12) % 12];
    }
    function monthDiZhi(m) {
      return DIZHI[(m + 1) % 12];
    }
    function monthTianGan(yTG, mDZ) {
      const startMap = { '甲': 0, '己': 0, '乙': 2, '庚': 2, '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8 };
      const mIdx = DIZHI.indexOf(mDZ);
      const startIdx = startMap[yTG] ?? 0;
      return TIANGAN[(startIdx + mIdx) % 10];
    }
    function dayStemBranch(y, m, d) {
      const base = new Date(1900, 0, 1);
      const target = new Date(y, m - 1, d);
      const diffDays = Math.floor((target - base) / (1e3 * 60 * 60 * 24));
      return [TIANGAN[(diffDays % 10 + 10) % 10], DIZHI[(diffDays % 12 + 12) % 12]];
    }
    
    const yTG = yearTianGan(year);
    const yDZ = yearDiZhi(year);
    const mDZ = monthDiZhi(month);
    const mTG = monthTianGan(yTG, mDZ);
    const [dTG, dDZ] = dayStemBranch(year, month, day);
    
    const bazi = {
      year: `${yTG}${yDZ}`,
      month: `${mTG}${mDZ}`,
      day: `${dTG}${dDZ}`,
      dayMaster: dTG,
      dayPillar: `${dTG}${dDZ}`
    };
    
    // ========== 星座计算 ==========
    const zodiacSigns = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    const zodiacCutoffs = [[1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 22], [7, 23], [8, 23], [9, 23], [10, 24], [11, 23], [12, 22]];
    
    let zodiacIdx = 0;
    for (let i = 0; i < 12; i++) {
      const [m, d] = zodiacCutoffs[i];
      if (month > m || (month === m && day >= d)) zodiacIdx = (i + 1) % 12;
    }
    
    const zodiac = {
      sign: zodiacSigns[zodiacIdx],
      element: ['土', '风', '水', '火'][Math.floor(zodiacIdx / 3)] || '土'
    };
    
    // ========== 返回基础数据 ==========
    const result = {
      status: 'success',
      data: {
        bazi,
        zodiac,
        birthDate,
        lang
      },
      debug: {
        timestamp: new Date().toISOString(),
        env: {
          SUPABASE_URL: supabaseUrl ? 'OK' : 'MISSING',
          DEEPSEEK_API_KEY: deepseekKey ? 'OK' : 'MISSING'
        }
      }
    };
    
    console.log("[wealth-oracle] Success:", JSON.stringify(result.debug));
    return res.status(200).json(result);
    
  } catch (globalError) {
    console.error("[CRITICAL SYSTEM ERROR]", globalError);
    return res.status(200).json({
      error: "Wrapped Internal Error",
      message: globalError.message || String(globalError),
      stack: globalError.stack || "",
      timestamp: new Date().toISOString()
    });
  }
}
