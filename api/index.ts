import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";

// ── Supabase Client ──
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// ── CORS helper ──
function setCors(res: any, req: any) {
  const origin = req.headers.origin || "";
  const allowed = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://kindredsouls.vercel.app",
    "https://kindredsouls.com.au",
  ];
  if (allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ── Cache ──
const insightCache = new Map<string, string>();
const MAX_CACHE = 200;

function cacheKey(d1: string, d2: string, overall: number, dims: any, lang: string) {
  return crypto
    .createHash("sha256")
    .update(`${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`)
    .digest("hex")
    .slice(0, 16);
}

function buildPrompt(
  d1: string, d2: string, overall: number, dims: any,
  bazi: string, zodiac: string, iching: string, lang = "en"
) {
  const isZh = lang === "zh";
  const isFr = lang === "fr";
  const isEs = lang === "es";

  const systemPrompt = isZh
    ? "你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖、专业、积极的语气，给出 3–5 句话的关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。"
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données de compatibilité dun couple, donne 3–5 phrases dinsight chaleureux, professionnel et positif. Réponds uniquement en français. Ne prédis jamais de rupture. Donne toujours de lespoir et des conseils pratiques."
    : isEs
    ? "Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3–5 frases de insight cálido, profesional y positivo. Responde solo en español. Nunca predigas ruptura. Siempre da esperanza y consejos prácticos."
    : "You are the AI relationship advisor for KindredSouls. Based on the users input (a couples compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight. Only respond in English. Never predict breakups or negative outcomes. Always give hope and specific actionable advice.";

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}`
    : isFr
    ? `Anniversaire: ${d1}, Partenaire: ${d2}\nScore global: ${overall}/100\nDimensions: Amour ${dims.love} | Communication ${dims.communication} | Chimie ${dims.chemistry} | Stabilité ${dims.stability}\nAstrologie chinoise: ${bazi}\nZodiaque occidental: ${zodiac}\nI Ching: ${iching}`
    : isEs
    ? `Cumpleaños: ${d1}, Pareja: ${d2}\nPuntuación global: ${overall}/100\nDimensones: Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability}\nAstrología china: ${bazi}\nZodíaco occidental: ${zodiac}\nI Ching: ${iching}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}`;

  return { systemPrompt, userPrompt };
}

// ── Main Handler (Vercel Serverless Function) ──
export default async function handler(req: any, res: any) {
  setCors(res, req);

  if (req.method === "OPTIONS") return res.status(204).end();

  const path = req.url?.split("?")[0] || "";

  try {
    // ── Health ──
    if (path === "/api/health" && req.method === "GET") {
      return res.status(200).json({
        status: "ok",
        supabase: !!supabase,
        deepseek: !!process.env.DEEPSEEK_API_KEY,
        timestamp: new Date().toISOString(),
      });
    }

    // ── AI Insight ──
    if (path === "/api/ai-insight" && req.method === "POST") {
      const { d1, d2, overall, dims, bazi, zodiac, iching, lang = "en" } = req.body;

      if (!d1 || !d2 || !dims) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const key = cacheKey(d1, d2, overall, dims, lang);
      if (insightCache.has(key)) {
        return res.status(200).json({ insight: insightCache.get(key), cached: true });
      }

      if (!process.env.DEEPSEEK_API_KEY) {
        return res.status(500).json({ error: "DeepSeek API key not configured" });
      }

      const { systemPrompt, userPrompt } = buildPrompt(d1, d2, overall, dims, bazi, zodiac, iching, lang);

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
        return res.status(502).json({ error: "AI service unavailable" });
      }

      const data = await response.json();
      const insight = data.choices?.[0]?.message?.content?.trim();
      if (!insight) return res.status(502).json({ error: "Empty response from AI" });

      const clean = insight.replace(/[\u2640-\u26FF]/g, "").replace(/[\u2700-\u27BF]/g, "");
      if (insightCache.size >= MAX_CACHE) insightCache.delete(insightCache.keys().next().value!);
      insightCache.set(key, clean);

      return res.status(200).json({ insight: clean, cached: false });
    }

    // ── Save Result ──
    if (path === "/api/save-result" && req.method === "POST") {
      if (!supabase) return res.status(503).json({ error: "Database not configured" });

      const { dob1, dob2, overall_score, dimensions, engines, ai_insight, language } = req.body;
      if (!dob1 || !dob2 || overall_score === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const uid = req.body.user_id || crypto.randomUUID();

      const { data, error } = await supabase
        .from("compatibility_results")
        .insert({
          user_id: uid,
          dob1,
          dob2,
          overall_score,
          love_score: dimensions?.love,
          communication_score: dimensions?.communication,
          chemistry_score: dimensions?.chemistry,
          stability_score: dimensions?.stability,
          bazi_detail: engines?.bazi?.detail,
          zodiac_detail: engines?.zodiac?.detail,
          iching_detail: engines?.iching?.detail,
          ai_insight,
          language: language || "en",
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: "Failed to save result", detail: error.message });
      return res.status(200).json({ success: true, id: data.id, user_id: uid });
    }

    // ── History ──
    if (path === "/api/history" && req.method === "GET") {
      if (!supabase) return res.status(503).json({ error: "Database not configured" });

      const user_id = req.query.user_id || (new URL(req.url, `http://${req.headers.host}`)).searchParams.get("user_id");
      if (!user_id) return res.status(400).json({ error: "Missing user_id parameter" });

      const { data, error } = await supabase
        .from("compatibility_results")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return res.status(500).json({ error: "Failed to fetch history", detail: error.message });
      return res.status(200).json({ results: data || [] });
    }

    return res.status(404).json({ error: "Not found", path });
  } catch (err: any) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
