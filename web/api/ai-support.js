// Force Node.js 20 runtime
export const runtime = 'nodejs';

// ── Supabase REST helpers (Vercel serverless compatible) ──
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function sbGet(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: SB_HEADERS });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB GET ${table} ${r.status}: ${t}`); }
  return r.json();
}

async function sbUpsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB_HEADERS, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB UPSERT ${table} ${r.status}: ${t}`); }
  return r.json();
}

async function sbPatch(table, id, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`SB PATCH ${table} ${r.status}: ${t}`); }
}


// ═══════════════════════════════════════════════════
// KindredSouls Phase 2 — AI Support (非 Streaming)
// 客服助理：Tool Calling + 退款挽留
// ═══════════════════════════════════════════════════

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

const SYSTEM_PROMPT = `You are KindredSouls' AI Support Assistant. Your role is to help users with billing, subscription, and technical issues.

RULES:
1. NEVER process refunds directly — always offer retention first (if eligible), then guide to Stripe customer portal
2. You have access to tools: check_subscription, check_payment_status, retry_webhook
3. If a user has an emotional concern, redirect them to the AI Relationship Advisor panel
4. Never make promises about refunds, timelines, or features not confirmed in the system
5. Keep responses concise and action-oriented
6. Do NOT provide psychological or relationship advice — that's the Advisor's job
7. NEVER mention that you are an AI or language model

When a user mentions "refund" or "cancel":
- First, use check_payment_status to verify their purchase
- If this is their first retention offer, offer: 3 free AI Advisor queries as compensation
- If they still want to refund, direct them to: https://billing.stripe.com/p/session_id

LEGAL DISCLAIMER (always include in first response):
"KindredSouls provides astrology-based insights for entertainment and self-exploration purposes only. This is not a substitute for professional psychological or medical advice."`;

// ── Tool Calling 定义 ──

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'check_subscription',
      description: 'Check user subscription status and entitlements',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'User UUID' }
        },
        required: ['user_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_payment_status',
      description: 'Check payment records and delivery status for a user',
      parameters: {
        type: 'object',
        properties: {
          user_id: { type: 'string', description: 'User UUID' }
        },
        required: ['user_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'retry_webhook',
      description: 'Retry a failed Stripe webhook for a payment. Idempotent — same payment_id always yields same result.',
      parameters: {
        type: 'object',
        properties: {
          payment_id: { type: 'string', description: 'Payment record UUID' }
        },
        required: ['payment_id']
      }
    }
  }
];

// ── Tool 执行器 ──

async function executeTool(name, args) {
  switch (name) {
    case 'check_subscription': {
      const rows = await sbGet('user_profiles', `user_id=eq.${args.user_id}&select=paid,user_id&limit=1`);
      return { subscription: rows?.[0] || null, note: 'Full subscription table pending' };
    }

    case 'check_payment_status': {
      // TODO: payments 表建立后接入
      return {
        payments: [],
        note: 'Payment tracking table pending. Currently using Stripe dashboard for payment records.'
      };
    }

    case 'retry_webhook': {
      // TODO: payments 表建立后接入
      return { success: false, message: 'Payment tracking not yet implemented. Please contact support if issue persists.' };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── 退款挽留检测 ──

const REFUND_KEYWORDS = ['refund', 'cancel subscription', 'money back', 'chargeback', 'not worth', 'want my money', 'return', '退'];

function detectRefundIntent(message) {
  const lower = message.toLowerCase();
  return REFUND_KEYWORDS.some(kw => lower.includes(kw));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, message, conversationHistory = [] } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'Missing userId or message' });
  }

  try {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  // ── Rate Limit ──
  const profiles = await sbGet('compatibility_results', `user_id=eq.${userId}&select=ai_support_count,ai_support_date&limit=1`);
  const profile = profiles?.[0] || null;

  const today = new Date().toISOString().slice(0, 10);
  let supportCount = profile?.ai_support_count || 0;
  if (profile?.ai_support_date !== today) supportCount = 0;

  if (supportCount >= 10) {
    return res.status(429).json({ error: 'Daily support limit reached', code: 'RATE_LIMITED' });
  }

  // ── 构建消息 ──
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // 加入历史对话
  for (const msg of conversationHistory.slice(-6)) {
    messages.push(msg);
  }

  messages.push({ role: 'user', content: message });

  // ── 退款挽留检测 ──
  let retentionOffered = false;
  if (detectRefundIntent(message)) {
    const resultRows = await sbGet('compatibility_results', `user_id=eq.${userId}&select=refund_retention_used&limit=1`);
    const resultRow = resultRows?.[0] || null;

    if (resultRow && !resultRow.refund_retention_used) {
      retentionOffered = true;
      messages.push({
        role: 'system',
        content: `RETENTION MODE: This is the user's first refund request. Offer them 3 free AI Advisor queries (value ~$1.50) as compensation. If they accept, mark as retained. If they insist on refunding, direct them to https://billing.stripe.com. Be warm but not pushy.`
      });
    } else {
      messages.push({
        role: 'system',
        content: `REFUND PROCESSED: This user has already used their one-time retention offer. Direct them to Stripe customer portal for self-service refund: https://billing.stripe.com`
      });
    }
  }

  try {
    // 调用 DeepSeek（带 Tool Calling）
    let response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0,
        max_tokens: 500,
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-support] DeepSeek error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;
    let toolCalls = assistantMessage?.tool_calls;

    // 处理 Tool Calling 循环（最多3轮）
    let rounds = 0;
    while (toolCalls && rounds < 3) {
      rounds++;
      messages.push(assistantMessage);

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolResult = await executeTool(toolName, toolArgs);

        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id,
        });
      }

      // 再次调用
      response = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0,
          max_tokens: 500,
          tools: TOOLS,
        }),
      });

      data = await response.json();
      assistantMessage = data.choices?.[0]?.message;
      toolCalls = assistantMessage?.tool_calls;
    }

    // 更新计数
    await fetch(`${SUPABASE_URL}/rest/v1/compatibility_results?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ ai_support_count: supportCount + 1, ai_support_date: today }),
    });

    // 如果提供了挽留且用户接受了，标记 retention
    const finalContent = assistantMessage?.content || '';
    let retentionAccepted = false;
    if (retentionOffered && finalContent.toLowerCase().includes('3 free')) {
      // 简单检测：如果 AI 在回复中提到了 3 free queries 的赠予
      retentionAccepted = true;
    }

    return res.status(200).json({
      reply: finalContent,
      retention_offered: retentionOffered,
      retention_accepted: retentionAccepted,
    });

  } catch (err) {
    console.error('[ai-support] DeepSeek error:', err);
    return res.status(502).json({ error: 'AI service unavailable' });
  }
  } catch (err) {
    console.error('[ai-support] handler error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
