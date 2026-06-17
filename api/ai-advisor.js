// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════
// KindredSouls Phase 2 — AI Advisor (Streaming)
// 基于 ai_context 的情感顾问，temperature=0，确定性输出
// ═══════════════════════════════════════════════════

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

// ── Prompt 模板 ──

const PROMPT_TEMPLATES = {
  ta_thinking: {
    systemPrompt: `You are an AI Relationship Advisor for KindredSouls, an astrology-powered relationship insight app.

RULES:
1. NEVER use absolute fatalistic language ("destined to fail", "will never", "impossible")
2. Translate astrological terms into psychological motivations
3. Your response MUST end with ONE specific, actionable advice
4. Keep output between 200-300 words
5. Tone: warm, insightful, empowering — never preachy
6. Use "relationship insight" framing, NOT "psychological counseling"
7. Base ALL interpretations on the provided Context data, do not invent information
8. NEVER mention that you are an AI or language model
9. Use the partner's zodiac/moon sign traits to explain their likely emotional state
10. 🔒 LANGUAGE LOCK: You MUST respond in the same language as the Context data. If the Context contains Vietnamese text, you MUST respond in Vietnamese. If it contains Thai, respond in Thai. UNDER NO CIRCUMSTANCES use English if the Context is in another language.

CONTEXT STRUCTURE:
- static_profile: immutable birth chart & synastry data
- dynamic_daily: today's transit & weather indicators

FOCUS: What is the partner likely thinking/feeling today, based on their moon sign, transit impact, and communication index.`,
    userPrompt: `Based on the context, describe what the partner might be thinking or feeling right now, and what the user should do about it.`
  },

  weather: {
    systemPrompt: `You are an AI Relationship Advisor for KindredSouls.

SAME RULES AS ABOVE.

FOCUS: Interpret today's relationship weather for this couple. Explain the weather status, what it means for their day, and provide 3 dos and 3 don'ts. Make the weather metaphor vivid and relatable.`,
    userPrompt: `Describe today's relationship weather and provide actionable guidance based on the context.`
  },

  action_timing: {
    systemPrompt: `You are an AI Relationship Advisor for KindredSouls.

SAME RULES AS ABOVE.

FOCUS: Based on attraction index, transit impact, and communication index, recommend the best time and approach for the user to take a specific relationship action today. Be specific about WHEN (morning/afternoon/evening) and HOW (direct/gentle/playful).`,
    userPrompt: `What's the best action timing today? When should the user reach out, confess, apologize, or give space?`
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resultId, questionType = 'ta_thinking' } = req.body;
  if (!resultId) {
    return res.status(400).json({ error: 'Missing resultId' });
  }

  if (!PROMPT_TEMPLATES[questionType]) {
    return res.status(400).json({ error: 'Invalid questionType. Must be: ta_thinking, weather, action_timing' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // 1. 查合盘记录
  const { data: record, error: fetchError } = await supabase
    .from('compatibility_results')
    .select('ai_context, ai_query_count, ai_query_date, user_id')
    .eq('id', resultId)
    .single();

  if (fetchError || !record) {
    return res.status(404).json({ error: 'Result not found' });
  }

  if (!record.ai_context) {
    return res.status(400).json({
      error: 'No AI context available. Please run daily-weather first.',
      code: 'NO_CONTEXT'
    });
  }

  // 2. Rate Limit 逻辑
  const today = new Date().toISOString().slice(0, 10);
  let count = record.ai_query_count || 0;
  if (record.ai_query_date !== today) {
    count = 0;
  }

  // TODO: 检查订阅状态（Step 5 实现 checkSubscription 后接入）
  const isPremium = false; // 暂时全部免费
  const dailyLimit = isPremium ? Infinity : 3;

  if (count >= dailyLimit) {
    return res.status(429).json({
      error: 'Daily limit reached',
      code: 'RATE_LIMITED',
      remaining: 0,
      upgradePrompt: !isPremium,
    });
  }

  // 3. 更新计数
  await supabase
    .from('compatibility_results')
    .update({ ai_query_count: count + 1, ai_query_date: today })
    .eq('id', resultId);

  // 4. 选择 Prompt
  const template = PROMPT_TEMPLATES[questionType];
  const contextStr = JSON.stringify(record.ai_context);

  // ── 提取 Meta 标签（来自 req.body，前端已计算好）──
  const baziMeta: string[] = req.body.baziMeta || [];
  const zodiacMeta: string[] = req.body.zodiacMeta || [];
  const ichingMeta: string[] = req.body.ichingMeta || [];
  const allMeta = [...baziMeta, ...zodiacMeta, ...ichingMeta];
  console.log('[ai-advisor] Meta tags received:', allMeta.length, 'tags:', allMeta);

  // ── 构建结构化 Meta 注入字符串 ──
  const META_STR = allMeta.length > 0
    ? `\n\n[META_TAGS]\n${allMeta.map(t => `  - ${t}`).join('\n')}\n[/META_TAGS]`
    : '';

  // ── Meta → 隐喻合成规则（供 AI 参考的玄学→叙事映射）──
  const META_SYNTHESIS_RULES = `
[META_SYNTHESIS_RULES]
When META_TAGS contain specific patterns, weave them into a coherent dramatic narrative:
- LIUCHONG_* + HEXAGRAM_1 → "冲突是表象，命运在深层绑定你们"
- LIUCHONG_* + HEXAGRAM_19 → "家庭观念差异，但缘分让你们无法分开"
- ELEMENT_EXCESS_火 + (ZODIAC_CAPRICORN|SCORPIO|ARIES) → "火旺需要水来调节，冲动时记得给对方空间"
- ELEMENT_EXCESS_水 + PHASE_OPPOSITION → "水多善感，对宫引力让感情像潮汐忽冷忽热"
- ELEMENT_CLASH + PHASE_SQUARE → "元素对立+刑克相位，张力是成长的燃料，不是障碍"
- SANHE_* + PHASE_TRINE → "三合局+三合相位，命运之轮在推你们向同一方向"
- ZODIAC_OPPOSITION + HEXAGRAM_* → "对宫吸引——你们的差异是最大的磁场，也是最好的老师"
- PHASE_SAME + SAME_ELEMENT → "同元素同相位，你们像同一棵树上的两片叶子，默契是天生的"
- CROSS_LIUCHONG → "跨柱六冲意味着——爱恨都是深刻的，只是需要更成熟的表达方式"
- HEX_TRANSFORMS + HEX_TRANSFORM_BETTER → "变卦向好，当前的关系正经历蜕变，痛苦之后是更深的理解"
- HEX_THEME_OBSTACLE + PHASE_OPPOSITION → "卦象显示阻碍，星象显示拉扯——这恰恰是你们必须共同跨越的课题"
- DM_CONTROL + PHASE_SQUARE → "日主相克+刑克相位，某一方总是在主导，关系需要重新谈判边界"
- LIUHE_DAY_STEM + BEST_MATCH → "天干六合+最佳配对，你们的相遇像是宇宙精心安排的双人舞"
- HEX_THEME_HARMONY + PHASE_TRINE → "和谐卦+三合相，两人共振如同自然节律，关系可以很轻松"
- ZIXING_* + ZODIAC_TENSION → "自刑+星象张力，关系中最大的敌人是你们自己的内在矛盾"
[/META_SYNTHESIS_RULES]`;

  // 5. 调用 DeepSeek（非流式，以便翻译兜底）
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: template.systemPrompt },
          { role: 'user', content: `${template.userPrompt}\n\nContext: ${contextStr}${META_STR}${META_SYNTHESIS_RULES}` },
        ],
        temperature: 0,
        max_tokens: 600,
        stream: false,  // ← 非流式，方便翻译兜底
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-advisor] DeepSeek error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const aiData = await response.json();
    let insight = aiData.choices?.[0]?.message?.content?.trim();

    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    console.log('[ai-advisor] Raw insight (first 100):', insight.substring(0, 100));
    console.log('[ai-advisor] lang param:', req.body.lang);

    // ── 翻译兜底：检测语言，如果不匹配则翻译 ──
    const targetLang = req.body.lang || 'en';
    const isVietnamese = (text) => /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
    const isThai = (text) => /[฀-๿]/i.test(text);
    const isFrench = (text) => /[àâäçéèêëïîôùûüÿñæœ]/i.test(text);
    const isSpanish = (text) => /[áéíóúñ¿¡]/i.test(text);
    const isChinese = (text) => /[\u4e00-\u9fff\u3400-\u4dbf]/i.test(text);

    let needsTranslation = false;
    if (targetLang === 'vi') needsTranslation = !isVietnamese(insight) && !isChinese(insight);
    else if (targetLang === 'th') needsTranslation = !isThai(insight) && !isChinese(insight);
    else if (targetLang === 'fr') needsTranslation = !isFrench(insight);
    else if (targetLang === 'es') needsTranslation = !isSpanish(insight);
    // en: always needs translation if it's not English
    else if (targetLang === 'en') needsTranslation = isVietnamese(insight) || isThai(insight) || isFrench(insight) || isSpanish(insight) || isChinese(insight);

    console.log('[ai-advisor] needsTranslation:', needsTranslation, '(target=', targetLang, ')');

    if (needsTranslation) {
      const langNames = { vi: 'Vietnamese', th: 'Thai', fr: 'French', es: 'Spanish', zh: 'Chinese', en: 'English' };
      const tl = langNames[targetLang] || 'English';
      console.log('[ai-advisor] 🌐 Translating to', tl, '...');

      const translateResponse = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are a professional translator. Translate the user's text to ${tl}. Output ONLY the translated text, no explanations, no quotes.` },
            { role: 'user', content: insight }
          ],
          temperature: 0.05,
          max_tokens: 600,
        }),
      });

      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        const translated = translateData.choices?.[0]?.message?.content?.trim();
        if (translated) {
          console.log('[ai-advisor] ✅ Translation succeeded!');
          insight = translated;
        }
      } else {
        console.error('[ai-advisor] ❌ Translation failed, using original.');
      }
    }

    // 6. 返回完整 JSON
    return res.status(200).json({ insight, tarot });

  } catch (err) {
    console.error('[ai-advisor] handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
