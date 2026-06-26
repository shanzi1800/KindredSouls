// VERCEL_REDEPLOY_TRIGGER
// 纯 CommonJS 写法，避免 ESM 模块加载崩溃

module.exports = async function handler(req, res) {
  console.log("[wealth-oracle] Request received");
  
  try {
    // 动态引入
    const { createClient } = require('@supabase/supabase-js');
    
    // 环境变量检查
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    
    console.log("[wealth-oracle] Env check:", {
      SUPABASE_URL: supabaseUrl ? 'OK' : 'MISSING',
      SUPABASE_SERVICE_KEY: supabaseKey ? 'OK' : 'MISSING',
      DEEPSEEK_API_KEY: deepseekKey ? 'OK' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        error: "Missing Supabase Config",
        debug: {
          SUPABASE_URL: supabaseUrl ? "OK" : "MISSING",
          SUPABASE_SERVICE_KEY: supabaseKey ? "OK" : "MISSING"
        }
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
    try {
      if (req.body && typeof req.body === 'object') {
        body = req.body;
      } else {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      }
    } catch (parseErr) {
      return res.status(200).json({ error: "JSON parse error", message: parseErr.message });
    }
    
    const { birthDate, lang = 'zh' } = body;
    
    if (!birthDate) {
      return res.status(400).json({ error: 'Missing birthDate' });
    }
    
    console.log("[wealth-oracle] Processing:", birthDate);
    
    // 简化的八字计算
    const [year, month, day] = birthDate.split('-').map(Number);
    
    const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const yTG = TIANGAN[(year - 4) % 10];
    const yDZ = DIZHI[(year - 4) % 12];
    const mDZ = DIZHI[(month + 1) % 12];
    const [dTG, dDZ] = [TIANGAN[0], DIZHI[0]]; // 简化
    
    const bazi = {
      year: `${yTG}${yDZ}`,
      month: `${TIANGAN[0]}${mDZ}`,
      day: `${dTG}${dDZ}`,
      dayMaster: dTG
    };
    
    // 星座
    const signs = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    let zodiacIdx = Math.floor((month + 9) % 12);
    
    const result = {
      status: 'success',
      data: {
        bazi,
        zodiac: { sign: signs[zodiacIdx] },
        birthDate,
        lang
      },
      debug: {
        timestamp: new Date().toISOString(),
        env: 'OK'
      }
    };
    
    console.log("[wealth-oracle] Success");
    return res.status(200).json(result);
    
  } catch (err) {
    console.error("[CRITICAL ERROR]", err);
    return res.status(200).json({
      error: "Internal Error",
      message: err.message,
      stack: err.stack
    });
  }
};
