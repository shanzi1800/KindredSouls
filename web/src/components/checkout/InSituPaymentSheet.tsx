/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E129-刀四（军令 2026-11-09）：InSituPaymentSheet —— 首页内嵌暗金支付托盘
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（零跳出闭环）：点击长卷「解锁/升级 VIP」⇒ 长卷下方平滑滑出暗金微光
 * 支付托盘（z-141 底部抽屉），就地完成支付 ⇒ 托盘收起 ⇒ 长卷暗金流转、模糊锁
 * 全量解密——用户全程不离开 Milo/Sophia 的视野半步（绝不跳转结算页）。
 *   · 选项卡布局（军师定价体系对齐）：
 *       主推卡 A：$99.99/年 All-Access VIP（★ BEST VALUE 暗金微光标牌，省 $80）
 *       主推卡 B：$9.99/月 All-Access Monthly（随时可取消）
 *       次级折叠：$2.99（仅解锁本月单份月报）/ $29.99（单模块年报买断）
 *   · 🔴 PAYMENT_MODE=sandbox 现行态：走 /api/sandbox/complete 模拟支付
 *     （SandboxCashier 同源先例＋E99 匿名绿道兼容；沙盘水印军规在身）；
 *     Stripe Elements / Apple Pay live 接线挂账 P0 商业破局（密钥未办）。
 *   · 零 i18n 新键（自容六语字典）；零 CSS 文件改动（inline style）。
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Lang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

export interface InSituPaymentSheetProps {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  /** 支付成功（沙盒模拟）⇒ 上抛 plan（父级翻面解锁长卷——状态机即刻生效） */
  onGranted: (plan: string) => void;
}

/** 自容六语字典（零 i18n 键——分支隔离铁律） */
const PAY_UI: Record<Lang, {
  title: string; close: string; sandbox: string; sandboxHint: string;
  vipName: string; vipPer: string; vipSave: string; vipDesc: string;
  monName: string; monPer: string; monDesc: string;
  moreLabel: string; onceName: string; onceDesc: string; yearlyName: string; yearlyDesc: string;
  payBtn: string; paying: string; grantedLine: string; failLine: string; livePending: string;
}> = {
  zh: {
    title: '✦ 就地解锁 · 暗金托盘 ✦', close: '收起托盘',
    sandbox: '沙盘测试环境', sandboxHint: '模拟支付 · 不产生真实扣款',
    vipName: '年度全通 VIP', vipPer: '$99.99 / 年', vipSave: '★ BEST VALUE · 省 $80', vipDesc: '全年所有报告与推演全量开放',
    monName: '全通月订', monPer: '$9.99 / 月', monDesc: '当月全部报告随心看，随时可取消',
    moreLabel: '单份解锁（折叠）', onceName: '本月月报单份', onceDesc: '仅解锁本月这一份星轨长卷', yearlyName: '单模块年报买断', yearlyDesc: '四季财富演进年度大局一次买断',
    payBtn: '✦ 指纹轻触 · 就地支付', paying: '支付中……', grantedLine: '✅ 支付成功——长卷金芒绽放，全文解密',
    failLine: '⚠️ 支付未完成，可轻触重试', livePending: 'Live 支付通道筹备中（沙盘模拟先行）',
  },
  en: {
    title: '✦ In-Situ Unlock · Gilded Tray ✦', close: 'Close tray',
    sandbox: 'SANDBOX', sandboxHint: 'Simulated payment · no real charge',
    vipName: 'All-Access VIP', vipPer: '$99.99 / year', vipSave: '★ BEST VALUE · save $80', vipDesc: 'Every report & reading, all year long',
    monName: 'All-Access Monthly', monPer: '$9.99 / month', monDesc: 'Full access this month, cancel anytime',
    moreLabel: 'Single unlocks (folded)', onceName: 'This month\'s scroll only', onceDesc: 'Unlock just this monthly scroll', yearlyName: 'Yearly report — one-time', yearlyDesc: 'Four-season wealth grand view, bought once',
    payBtn: '✦ Tap to pay in place', paying: 'Paying…', grantedLine: '✅ Granted — the scroll unfurls in full light',
    failLine: '⚠️ Payment incomplete — tap to retry', livePending: 'Live checkout pending (sandbox simulation for now)',
  },
  fr: {
    title: '✦ Déverrouillage sur place ✦', close: 'Fermer le volet',
    sandbox: 'SANDBOX', sandboxHint: 'Paiement simulé · aucun débit réel',
    vipName: 'VIP Tout-Accès', vipPer: '99,99$ / an', vipSave: '★ MEILLEURE OFFRE · 80$ économisés', vipDesc: 'Tous les rapports de l\'année, sans limite',
    monName: 'Abonnement mensuel', monPer: '9,99$ / mois', monDesc: 'Accès total ce mois-ci, résiliable à tout moment',
    moreLabel: 'Achats unitaires (repliés)', onceName: 'Parchemin du mois seul', onceDesc: 'Déverrouille uniquement ce parchemin', yearlyName: 'Rapport annuel à vie', yearlyDesc: 'La grande vue saison par saison, en un achat',
    payBtn: '✦ Payer ici d\'un toucher', paying: 'Paiement…', grantedLine: '✅ Accordé — le parchemin se dévoile entier',
    failLine: '⚠️ Paiement inachevé — touchez pour réessayer', livePending: 'Paiement live en préparation (simulation sandbox)',
  },
  es: {
    title: '✦ Desbloqueo in situ ✦', close: 'Cerrar bandeja',
    sandbox: 'SANDBOX', sandboxHint: 'Pago simulado · sin cargo real',
    vipName: 'VIP Todo-Acceso', vipPer: '99,99$ / año', vipSave: '★ MEJOR VALOR · ahorras 80$', vipDesc: 'Todos los informes del año, sin límite',
    monName: 'Suscripción mensual', monPer: '9,99$ / mes', monDesc: 'Acceso total este mes, cancela cuando quieras',
    moreLabel: 'Compras únicas (plegadas)', onceName: 'Solo el pergamino de este mes', onceDesc: 'Desbloquea únicamente este pergamino', yearlyName: 'Informe anual — pago único', yearlyDesc: 'La visión de las cuatro estaciones, comprada una vez',
    payBtn: '✦ Pagar aquí con un toque', paying: 'Pagando…', grantedLine: '✅ Concedido — el pergamino se revela completo',
    failLine: '⚠️ Pago incompleto — toca para reintentar', livePending: 'Pago real en preparación (simulación sandbox)',
  },
  th: {
    title: '✦ ปลดล็อกทันทีในหน้านี้ ✦', close: 'ปิดถาด',
    sandbox: 'SANDBOX', sandboxHint: 'การชำระจำลอง · ไม่มีการตัดเงินจริง',
    vipName: 'VIP เข้าถึงทั้งหมด', vipPer: '$99.99 / ปี', vipSave: '★ คุ้มที่สุด · ประหยัด $80', vipDesc: 'รายงานและคำทำนายทั้งปี เปิดครบทุกอย่าง',
    monName: 'รายเดือนเข้าถึงทั้งหมด', monPer: '$9.99 / เดือน', monDesc: 'ดูได้ทุกอย่างในเดือนนี้ ยกเลิกได้ตลอด',
    moreLabel: 'ซื้อรายชิ้น (พับเก็บ)', onceName: 'เฉพาะม้วนเดือนนี้', onceDesc: 'ปลดล็อกเฉพาะม้วนดวงดาวเดือนนี้', yearlyName: 'รายงานรายปี ซื้อครั้งเดียว', yearlyDesc: 'ภาพรวมสี่ฤดูกาล ซื้อครั้งเดียวถือครองตลอด',
    payBtn: '✦ แตะจ่ายทันที', paying: 'กำลังชำระ…', grantedLine: '✅ สำเร็จ — ม้วนดวงดาวเปิดเผยทั้งหมด',
    failLine: '⚠️ ยังไม่สำเร็จ — แตะเพื่อลองอีกครั้ง', livePending: 'ช่องทางชำระจริงอยู่ระหว่างเตรียม (จำลอง sandbox)',
  },
  vi: {
    title: '✦ Mở khóa ngay tại chỗ ✦', close: 'Đóng khay',
    sandbox: 'SANDBOX', sandboxHint: 'Thanh toán mô phỏng · không trừ tiền thật',
    vipName: 'VIP Toàn Quyền', vipPer: '99,99$ / năm', vipSave: '★ GIÁ TRỊ NHẤT · tiết kiệm 80$', vipDesc: 'Mọi báo cáo & lời giải đoán cả năm',
    monName: 'Gói tháng toàn quyền', monPer: '9,99$ / tháng', monDesc: 'Xem trọn tháng này, hủy bất cứ lúc nào',
    moreLabel: 'Mua lẻ (gập lại)', onceName: 'Chỉ cuộn tháng này', onceDesc: 'Mở khóa đúng cuộn thiên kinh tháng này', yearlyName: 'Báo cáo năm — mua một lần', yearlyDesc: 'Toàn cảnh bốn mùa, sở hữu trọn đời',
    payBtn: '✦ Chạm để thanh toán', paying: 'Đang thanh toán…', grantedLine: '✅ Thành công — thiên kinh mở ra trọn vẹn',
    failLine: '⚠️ Chưa hoàn tất — chạm để thử lại', livePending: 'Kênh thanh toán thật đang chuẩn bị (mô phỏng sandbox)',
  },
};

/** 军令钦定四档 SKU（与退款政策面同源——铁律 15 六语价格对齐已同步） */
const PLANS: { plan: string; tier: 'vip' | 'monthly' | 'once' | 'yearly' }[] = [
  { plan: 'all_pass_yearly', tier: 'vip' },
  { plan: 'all_pass_monthly', tier: 'monthly' },
  { plan: 'wealth_monthly_report', tier: 'once' },
  { plan: 'wealth_yearly_report', tier: 'yearly' },
];

export const InSituPaymentSheet: React.FC<InSituPaymentSheetProps> = ({ open, onClose, lang, onGranted }) => {
  const ui = PAY_UI[lang] || PAY_UI.en;
  const [selected, setSelected] = useState<string>('all_pass_yearly');
  const [showMore, setShowMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<'granted' | 'fail' | 'livePending' | null>(null);

  useEffect(() => {
    if (open) { setMsg(null); setBusy(false); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const card = (planId: string, tier: 'vip' | 'monthly' | 'once' | 'yearly') => {
    const active = selected === planId;
    const name = tier === 'vip' ? ui.vipName : tier === 'monthly' ? ui.monName : tier === 'once' ? ui.onceName : ui.yearlyName;
    const per = tier === 'vip' ? ui.vipPer : tier === 'monthly' ? ui.monPer : tier === 'once' ? '$2.99' : '$29.99';
    const desc = tier === 'vip' ? ui.vipDesc : tier === 'monthly' ? ui.monDesc : tier === 'once' ? ui.onceDesc : ui.yearlyDesc;
    return (
      <button
        key={planId}
        type="button"
        data-testid={`insitu-plan-${planId}`}
        data-plan={planId}
        onClick={() => { setSelected(planId); setMsg(null); }}
        aria-pressed={active}
        style={{
          position: 'relative', flex: '1 1 160px', textAlign: 'left',
          padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
          background: active ? 'rgba(212,175,55,0.12)' : 'rgba(20,17,10,0.6)',
          border: `1px solid ${active ? '#D4AF37' : 'rgba(212,175,55,0.28)'}`,
          transition: 'all .18s ease',
        }}
      >
        {tier === 'vip' && (
          <span style={{
            position: 'absolute', top: -9, right: 10, fontSize: 9.5, letterSpacing: 1,
            color: '#14110A', background: 'linear-gradient(135deg,#D4AF37,#E5C158)',
            borderRadius: 999, padding: '2px 9px', fontWeight: 800,
            boxShadow: '0 0 14px rgba(212,175,55,0.45)',
          }}>{ui.vipSave}</span>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F3E5AB', letterSpacing: 0.8 }}>{name}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#F5E1A4', margin: '4px 0 2px' }}>{per}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(232,220,192,0.72)', lineHeight: 1.5 }}>{desc}</div>
      </button>
    );
  };

  const doPay = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      let token: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
      } catch { /* E99 匿名绿道：无 token 亦放行（沙盒权益 per-session） */ }
      const res = await fetch('/api/sandbox/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan: selected }),
      });
      const data = (await res.json().catch(() => ({}))) as { granted?: boolean };
      if (res.ok && data.granted) {
        setMsg('granted');
        onGranted(selected);
        window.setTimeout(() => { onClose(); }, 650); /* 金芒流转片刻后托盘平滑收起 */
      } else if (res.status === 404) {
        setMsg('livePending'); /* live 态沙盘端点 fail-closed ⇒ 如实告知 */
      } else {
        setMsg('fail');
      }
    } catch {
      setMsg('fail');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="insitu-payment-sheet"
      data-plan={selected}
      style={{
        position: 'fixed', inset: 0, zIndex: 141, /* 长卷（z-140）下方叠加层 */
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(6,5,10,0.55)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 底部抽屉滑出动效（自容 keyframes） */}
      <style>{`
        @keyframes ks-insitu-slide {
          from { transform: translateY(100%); opacity: 0.4; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        data-testid="insitu-payment-tray"
        style={{
          width: '100%', maxWidth: '430px',
          animation: 'ks-insitu-slide .38s cubic-bezier(.22,.9,.32,1) both',
          background: 'linear-gradient(175deg, #1a1408 0%, #100c04 60%, #0b0903 100%)',
          borderTop: '1px solid rgba(212,175,55,0.6)',
          borderRadius: '18px 18px 0 0',
          padding: '16px 16px 22px',
          boxShadow: '0 -14px 50px rgba(0,0,0,0.65), 0 0 34px rgba(212,175,55,0.10)',
          fontFamily: '"Noto Serif SC","Songti SC",Georgia,serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, letterSpacing: 2, color: '#F3E5AB', fontWeight: 600 }}>{ui.title}</h3>
          <button type="button" onClick={onClose} data-testid="insitu-payment-close"
            style={{ background: 'none', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, color: 'rgba(232,220,192,0.75)', fontSize: 11, cursor: 'pointer', padding: '4px 10px' }}>
            ✕ {ui.close}
          </button>
        </div>

        {/* 沙盘水印（军规：模拟支付必须清晰可见——SandboxCashier 同款纪律） */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '6px 10px', marginBottom: 12, borderRadius: 10,
          background: 'rgba(129,216,208,0.06)', border: '1px solid rgba(129,216,208,0.26)',
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, color: '#0D0D1A', background: '#81D8D0', borderRadius: 4, padding: '1px 6px' }}>SANDBOX</span>
          <span style={{ fontSize: 11.5, color: '#81D8D0' }}>{ui.sandbox}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{ui.sandboxHint}</span>
        </div>

        {/* 主推双卡 */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {card(PLANS[0].plan, 'vip')}
          {card(PLANS[1].plan, 'monthly')}
        </div>

        {/* 次级折叠入口 */}
        <div>
          <button
            type="button"
            data-testid="insitu-more-toggle"
            onClick={() => setShowMore((v) => !v)}
            style={{
              background: 'none', border: 'none', color: 'rgba(212,188,122,0.85)',
              fontSize: 11.5, letterSpacing: 1, cursor: 'pointer', padding: '4px 0',
              borderBottom: '1px dashed rgba(212,175,55,0.25)',
            }}
          >
            {showMore ? '▾' : '▸'} {ui.moreLabel}
          </button>
          {showMore && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {card(PLANS[2].plan, 'once')}
              {card(PLANS[3].plan, 'yearly')}
            </div>
          )}
        </div>

        {/* 就地支付 CTA */}
        <button
          type="button"
          data-testid="insitu-pay-btn"
          onClick={doPay}
          disabled={busy}
          style={{
            width: '100%', marginTop: 14, padding: '13px 20px', borderRadius: 13, border: 'none',
            minHeight: 48, textAlign: 'center', lineHeight: 1.3,
            background: busy ? '#444' : 'linear-gradient(135deg, #D4AF37 0%, #E5C158 100%)',
            color: '#14110A', fontSize: 14.5, fontWeight: 800, letterSpacing: 1,
            cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : '0 6px 26px rgba(212,175,55,0.35)',
          }}
        >
          {busy ? `⏳ ${ui.paying}` : ui.payBtn}
        </button>

        {msg && (
          <div data-testid="insitu-payment-status" data-granted={msg === 'granted' ? '1' : '0'}
            style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.6, textAlign: 'center', color: msg === 'granted' ? '#A5D6A7' : msg === 'livePending' ? '#81D8D0' : '#FF8A80' }}>
            {msg === 'granted' ? ui.grantedLine : msg === 'livePending' ? ui.livePending : ui.failLine}
          </div>
        )}
      </div>
    </div>
  );
};

export default InSituPaymentSheet;
