// 🛡️ 战时最高防弹规格：双保险导出，干碎 Vercel 模块识别 Bug

const runtime = 'nodejs20.x';

async function mainHandler(req, res) {
  console.log("[wealth-oracle] === REQUEST STARTED ===");
  
  try {
    // 🔮 所有依赖在函数内部动态加载
    const { createClient } = require('@supabase/supabase-js');
    
    // 环境变量检查
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    
    console.log("[wealth-oracle] Env check:", {
      SUPABASE_URL: supabaseUrl ? 'OK' : 'MISSING',
      SUPABASE_SERVICE_KEY: supabaseKey ? 'OK' : 'MISSING', 
      DEEPSEEK_API_KEY: deepseekKey ? 'OK' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        error: "DEBUG_MODE_ACTIVE",
        message: "环境变量未成功注入！",
        debug: {
          SUPABASE_URL: supabaseUrl ? 'OK' : 'MISSING',
          SUPABASE_SERVICE_KEY: supabaseKey ? 'OK' : 'MISSING'
        }
      });
    }
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      console.log("[wealth-oracle] OPTIONS request, returning 200");
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
        const rawBody = Buffer.concat(chunks).toString('utf-8');
        console.log("[wealth-oracle] Raw body:", rawBody.substring(0, 200));
        body = JSON.parse(rawBody);
      }
    } catch (parseErr) {
      console.error("[wealth-oracle] Parse error:", parseErr.message);
      return res.status(200).json({ 
        error: "JSON_PARSE_ERROR", 
        message: parseErr.message 
      });
    }
    
    console.log("[wealth-oracle] Parsed body:", body);
    
    const { birthDate, lang = 'zh' } = body || {};
    
    if (!birthDate) {
      return res.status(200).json({ 
        error: "MISSING_BIRTHDATE",
        message: "请提供出生日期 (YYYY-MM-DD)"
      });
    }
    
    // 简化的八字计算
    const [year, month, day] = birthDate.split('-').map(Number);
    
    const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const yTG = TIANGAN[(year - 4) % 10];
    const yDZ = DIZHI[(year - 4) % 12];
    const mDZ = DIZHI[(month + 1) % 12];
    const dTG = TIANGAN[0];
    const dDZ = DIZHI[0];
    
    const bazi = {
      year: `${yTG}${yDZ}`,
      month: `${TIANGAN[0]}${mDZ}`,
      day: `${dTG}${dDZ}`,
      dayMaster: dTG
    };
    
    // 星座
    const signs = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', 
                   '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    const zodiacIdx = Math.floor((month + 9) % 12);
    
    const result = {
      status: 'success',
      message: '🎉 宇宙大闸顺利通车！',
      data: {
        bazi,
        zodiac: { sign: signs[zodiacIdx] },
        birthDate,
        lang
      },
      debug: {
        timestamp: new Date().toISOString(),
        env: {
          SUPABASE_URL: 'OK',
          SUPABASE_SERVICE_KEY: 'OK',
          DEEPSEEK_API_KEY: deepseekKey ? 'OK' : 'MISSING'
        }
      }
    };
    
    console.log("[wealth-oracle] === SUCCESS ===");
    return res.status(200).json(result);
    
  } catch (globalError) {
    console.error("[wealth-oracle] CRITICAL ERROR:", globalError);
    return res.status(200).json({
      error: "SYSTEM_TRY_CATCH_CRASH",
      message: globalError.message || String(globalError),
      stack: globalError.stack || "",
      timestamp: new Date().toISOString()
    });
  }
}

// ✨ 史诗级双保险导出（兼容 ESM 和 CommonJS）
module.exports = mainHandler;
module.exports.default = mainHandler;

// 同时支持 ESM export（如果 Vercel 当作 ESM 加载）
if (typeof exports !== 'undefined') {
  exports.default = mainHandler;
  exports.runtime = runtime;
}
