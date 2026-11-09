/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E129-刀三（军令 2026-11-09）：主动伴生智能体前端客户端
 * ═══════════════════════════════════════════════════════════════════════════
 * 职责（全部 fail-soft fire-and-forget——未登录/网络失败一律静默，绝不阻断交互）：
 *   ① logMoodSilently —— 罗盘情绪确认 ⇒ 静默 POST /api/familiar/mood-log
 *      （user_mood_logs 时间序列蓄水；未登录不入库——表须真实身份可归责）；
 *   ② postUnresolvedLoop / resolveUnresolvedLoop —— 未决事件挂账/了结
 *      （军令 DoD 断言 2 检定通道＋未来对话舱递卡挂账入口）。
 * 鉴权沿袭 SandboxCashier 先例：supabase.auth.getSession() ⇒ Bearer access_token。
 */
import { supabase } from './supabase';

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

/** 用户本地日期（YYYY-MM-DD——情绪发生日语义按本地日切，不取 UTC） */
function localDateISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** E129：罗盘情绪静默入库（白名单五原型由服务端复检——前端只传原型键） */
export function logMoodSilently(moodKey: string): void {
  void (async () => {
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      await fetch('/api/familiar/mood-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ moodKey, logDate: localDateISO() }),
      });
    } catch { /* fail-soft：绝不阻断罗盘交互 */ }
  })();
}

/** E129：未决事件挂账（≤48h pending ⇒ 伴侣下次开舱首句主动回溯关心） */
export async function postUnresolvedLoop(input: {
  eventSummary: string;
  targetPersonName?: string;
  checkInAfter?: string;
}): Promise<{ ok: boolean; code?: string }> {
  try {
    const headers = await authHeaders();
    if (!headers.Authorization) return { ok: false, code: 'NO_TOKEN' };
    const res = await fetch('/api/familiar/loops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        eventSummary: String(input.eventSummary || '').slice(0, 200),
        ...(input.targetPersonName ? { targetPersonName: String(input.targetPersonName).slice(0, 40) } : {}),
        ...(input.checkInAfter ? { checkInAfter: input.checkInAfter } : {}),
      }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { code?: string };
    return { ok: false, code: data.code || `HTTP_${res.status}` };
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
}

/** E129：未决事件了结（pending → resolved——伴侣不再主动追问） */
export async function resolveUnresolvedLoop(id: string): Promise<{ ok: boolean; code?: string }> {
  try {
    const headers = await authHeaders();
    if (!headers.Authorization) return { ok: false, code: 'NO_TOKEN' };
    const res = await fetch('/api/familiar/loops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ id, status: 'resolved' }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => ({}))) as { code?: string };
    return { ok: false, code: data.code || `HTTP_${res.status}` };
  } catch {
    return { ok: false, code: 'NETWORK' };
  }
}
