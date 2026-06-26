// 🛡️ 战时紧急版本：正确的 ES Module 语法
// api/package.json 设置了 "type": "module"

const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  console.log("[wealth-oracle] === REQUEST STARTED ===");
  
  // ⚠️ 硬编码配置（紧急测试）
  const SUPABASE_URL = "https://wfkxqhlcgrikxoofjvas.supabase.co";
  const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw";
  const DEEPSEEK_API_KEY = "sk-9307f02599b44612b6767996a7839ab5";
  
  try {
    // 动态 import（ESM）
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log("[wealth-oracle] Env check: HARDCODED (for testing)");
    
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
    
    const { birthDate, lang = 'zh' } = body || {};
    
    if (!birthDate) {
      return res.status(200).json({ 
        status: 'success',
        message: 'API 正常运行！请提供 birthDate 参数',
        test: true
      });
    }
    
    // 八字计算
    const [year, month, day] = birthDate.split('-').map(Number);
    const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    
    const yTG = TIANGAN[(year - 4) % 10];
    const yDZ = DIZHI[(year - 4) % 12];
    const mDZ = DIZHI[(month + 1) % 12];
    const signs = ['摩羯座', '水瓶座', '双鱼座', '白羊座', '金牛座', '双子座', 
                   '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座'];
    const zodiacIdx = Math.floor((month + 9) % 12);
    
    const result = {
      status: 'success',
      message: '🎉 宇宙大闸通车！ESM 版本成功！',
      data: {
        bazi: {
          year: `${yTG}${yDZ}`,
          month: `${TIANGAN[0]}${mDZ}`,
          day: `${TIANGAN[0]}${DIZHI[0]}`,
          dayMaster: TIANGAN[0]
        },
        zodiac: { sign: signs[zodiacIdx] },
        birthDate,
        lang
      },
      debug: {
        timestamp: new Date().toISOString(),
        env: 'HARDCODED'
      }
    };
    
    console.log("[wealth-oracle] === SUCCESS ===");
    return res.status(200).json(result);
    
  } catch (err) {
    console.error("[wealth-oracle] ERROR:", err);
    return res.status(200).json({
      error: "Internal Error",
      message: err.message,
      stack: err.stack
    });
  }
}
