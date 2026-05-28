import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";

// ── Supabase Client ──
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// ── CORS: allow Vercel prod + local dev ──
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://kindredsouls.vercel.app",
  "https://kindredsouls.com.au",
];

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// ── In-memory cache for AI insights ──
const insightCache = new Map();
const MAX_CACHE = 200;

function cacheKey(d1, d2, overall, dims, lang) {
  return crypto.createHash("sha256")
    .update(`${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`).digest("hex").slice(0, 16);
}

// ── Build prompt for DeepSeek ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = "en") {
  const isZh = lang === "zh";
  const isFr = lang === "fr";
  const isEs = lang === "es";

  const systemPrompt = isZh
    ? "你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖、专业、积极的语气，给出 3–5 句话的关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。"
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données de compatibilité d'un couple, donne 3–5 phrases d'insight chaleureux, professionnel et positif. Réponds uniquement en français. Ne prédis jamais de rupture. Donne toujours de l'espoir et des conseils pratiques."
    : isEs
    ? "Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3–5 frases de insight cálido, profesional y positivo. Responde solo en español. Nunca predigas ruptura. Siempre da esperanza y consejos prácticos."
    : "You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight. Only respond in English. Never predict breakups or negative outcomes. Always give hope and specific actionable advice.";

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}`
    : isFr
    ? `Anniversaire: ${d1}, Partenaire: ${d2}\nScore global: ${overall}/100\nDimensions: Amour ${dims.love} | Communication ${dims.communication} | Chimie ${dims.chemistry} | Stabilité ${dims.stability}\nAstrologie chinoise: ${bazi}\nZodiac occidental: ${zodiac}\nI Ching: ${iching}`
    : isEs
    ? `Cumpleaños: ${d1}, Pareja: ${d2}\nPuntuación global: ${overall}/100\nDimensiones: Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability}\nAstrología china: ${bazi}\nZodiaco occidental: ${zodiac}\nI Ching: ${iching}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}`;

  return { systemPrompt, userPrompt };
}

// ══════════════════════════════════════
// POST /api/ai-insight — AI 情感洞察
// ══════════════════════════════════════
app.post("/api/ai-insight", async (req, res) => {
  const { d1, d2, overall, dims, bazi, zodiac, iching, lang = "en" } = req.body;

  if (!d1 || !d2 || !dims) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const key = cacheKey(d1, d2, overall, dims, lang);
  if (insightCache.has(key)) {
    const cached = insightCache.get(key);
    return res.json({ insight: cached, cached: true });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: "DeepSeek API key not configured" });
  }

  const { systemPrompt, userPrompt } = buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang);

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      return res.status(502).json({ error: "AI service unavailable" });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) return res.status(502).json({ error: "Empty response from AI" });

    const clean = insight.replace(/[\u2640-\u26FF]/g, "").replace(/[\u2700-\u27BF]/g, "");

    if (insightCache.size >= MAX_CACHE) { insightCache.delete(insightCache.keys().next().value); }
    insightCache.set(key, clean);

    res.json({ insight: clean, cached: false });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════
// POST /api/save-result — 保存测算结果到 Supabase
// ══════════════════════════════════════
app.post("/api/save-result", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });

  const { dob1, dob2, overall_score, dimensions, engines, ai_insight, language } = req.body;
  if (!dob1 || !dob2 || overall_score === undefined) {
    return res.status(400).json({ error: "Missing required fields: dob1, dob2, overall_score" });
  }

  try {
    const uid = req.body.user_id || crypto.randomUUID();

    const { data, error } = await supabase.from("compatibility_results").insert({
      user_id: uid, dob1, dob2, overall_score,
      love_score: dimensions?.love,
      communication_score: dimensions?.communication,
      chemistry_score: dimensions?.chemistry,
      stability_score: dimensions?.stability,
      bazi_detail: engines?.bazi?.detail,
      zodiac_detail: engines?.zodiac?.detail,
      iching_detail: engines?.iching?.detail,
      ai_insight, language: language || "en",
    }).select().single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save result", detail: error.message });
    }

    res.json({ success: true, id: data.id, user_id: uid });
  } catch (err) {
    console.error("Save result error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════
// GET /api/history?user_id=xxx — 获取历史记录
// ══════════════════════════════════════
app.get("/api/history", async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Database not configured" });

  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "Missing user_id parameter" });

  try {
    const { data, error } = await supabase
      .from("compatibility_results")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: "Failed to fetch history", detail: error.message });
    }

    res.json({ results: data || [] });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════
// Health check
// ══════════════════════════════════════
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    supabase: !!supabase,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`KindredSouls API server running on http://localhost:${PORT}`);
  console.log(`Supabase: ${supabase ? "connected" : "NOT configured"}`);
});
