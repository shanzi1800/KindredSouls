// 🤝 E155：结算统一入口（三场景页 / 受邀页共用；整页重定向，🔴 严禁 window.open）
// @ts-ignore —— 纯 JS 逻辑核
import { openSandboxCashier } from '../../lib/sandboxCheckout.mjs';
// @ts-ignore —— 纯 JS 逻辑核
import { resonanceSuccessPath, RESONANCE_PLAN } from '../../lib/resonanceClient.mjs';
// @ts-ignore —— 六语字典单源
import { resT } from '../../lib/resonanceI18n.mjs';

type Api = { checkout: (b: Record<string, unknown>) => Promise<{ ok: boolean; status: number; data: unknown }> };

/** 返回 'redirect'（已整页跳转）/ 'sandbox'（收银台已唤起）/ 'error' */
export async function runResonanceCheckout(api: Api, token: string, lang: string): Promise<'redirect' | 'sandbox' | 'error'> {
  const co = await api.checkout({
    plan: RESONANCE_PLAN,
    resonance_token: token,
    cancelUrl: window.location.origin + '/invite/' + token,
    successUrl: window.location.origin + resonanceSuccessPath(token),
  });
  const d = (co.data && typeof co.data === 'object' ? co.data : {}) as Record<string, unknown>;
  if (d.already_paid === true) { window.location.href = resonanceSuccessPath(token); return 'redirect'; }
  if (d.sandbox === true && typeof d.url === 'string') {
    openSandboxCashier({
      plan: RESONANCE_PLAN, sessionId: typeof d.sessionId === 'string' ? d.sessionId : '', url: d.url, lang,
      label: resT(lang, 'res_title'),
      onGranted: () => { window.location.href = resonanceSuccessPath(token); },
    });
    return 'sandbox';
  }
  if (typeof d.url === 'string' && d.url !== '') { window.location.href = d.url; return 'redirect'; }
  return 'error';
}
