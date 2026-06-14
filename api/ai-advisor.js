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

  // 5. 调用 DeepSeek Streaming
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
          { role: 'user', content: `${template.userPrompt}\n\nContext: ${contextStr}` },
        ],
        temperature: 0,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-advisor] DeepSeek error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    // 6. SSE Streaming 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // 解析 DeepSeek SSE 格式并转发
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                // 转发为标准 SSE
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      res.end();
    }

  } catch (err) {
    console.error('[ai-advisor] handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.end();
  }
}
