/**
 * AdoptFamiliarCTA.tsx —— 报告尾「灵宠认领」CTA（Gate 45-B · E42+ 首战前端线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（45-B）：报告交付**之后**（解锁完成 / 合盘报告落画布后），在报告尾部
 *   挂载全新独立的「灵宠认领」入口 —— 让付费用户顺势完成灵宠 IP 的领养闭环。
 *
 * 🔴 三条纪律（军师特别批示）：
 *   ① **既有漏斗寸步不动**：付费墙上的 FamiliarPicker（!isUnlocked && showPaywall）保持不变，
 *      本组件是**新增的独立承接位**，不替代、不篡改历史逻辑；
 *   ② **E34 D5 铁律**：只携带基础出生真值（birthDate / birthTime / lat / lon / tz + relationMode），
 *      **严禁**透传报告内容、合盘分数、财富评语等任何业务线专有字段 ——
 *      本组件经 buildFamiliarAdoptPayload() **白名单构造**，即便上游误传也被构造层剔除；
 *   ③ **零机翻**：标题/文案一律回查字典（familiar 域 AdoptTitle / AdoptDesc / AdoptCta / AdoptDone），
 *      关系卡四态仍取 FamiliarPicker 的 RELATION_CARDS（单一真源，禁复制）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clampToSlot } from '../lib/reportLayout';
import { ASTRO_TERMS } from '../lib/algos/astroTerms.generated';
import { supabase } from '../lib/supabase';
import { RELATION_CARDS, FAMILIAR_LS_KEY, type FamiliarProfile } from './FamiliarPicker';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { buildFamiliarAdoptPayload, isCleanFamiliarAdoptPayload, dictTerm, FAMILIAR_ADOPT_PATH, ADOPT_CTA_TESTID } from '../lib/sandboxCheckout.mjs';
// @ts-ignore —— familiarHome.mjs 为纯 JS 逻辑核（E49 星盘签名真源）
import { familiarChartSig, recordMatchesChart } from '../lib/familiarHome.mjs';

const GOLD = '#D4AF37';

const SAFE_TEXT: React.CSSProperties = {
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  minWidth: 0,
};

interface AdoptFamiliarCTAProps {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  tz: string;
  lang?: string;
}

const AdoptFamiliarCTA: React.FC<AdoptFamiliarCTAProps> = ({ birthDate, birthTime, lat, lon, tz, lang = 'zh' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [adopted, setAdopted] = useState<string | null>(null);
  const [persisted, setPersisted] = useState(false);

  // 跨刷新留存（灵宠档案是 localStorage 持久化铁律的**唯一例外**，与 FamiliarPicker 同源键）
  // 🔒 E49（主公亲令 2026-10-14）: 星盘绑定校验 —— 签名与当前盘不一致（或旧档无签名）⇒ 即弃即清，
  //   换生日重新生成报告后严禁串出上一张盘的灵宠。
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAMILIAR_LS_KEY);
      if (!raw) return;
      const rec = JSON.parse(raw);
      const name = rec && rec.profile && rec.profile.name;
      if (typeof name === 'string' && name) {
        if (!recordMatchesChart(rec, { birthDate, birthTime, lat, lon, tz })) {
          localStorage.removeItem(FAMILIAR_LS_KEY);
          return;
        }
        setAdopted(name);
        setPersisted(!!rec.persisted);
      }
    } catch (_) { /* 隐私模式忽略 */ }
  }, [birthDate, birthTime, lat, lon, tz]);

  const term = (key: string) => {
    const t = dictTerm(ASTRO_TERMS, 'familiar', key, lang);
    return t ? clampToSlot(t.label, t.slot || 'labelCard') : '';
  };

  const adopt = async (mode: string) => {
    if (pending) return;
    setPending(mode);
    setErr(false);
    try {
      // 🔴 E34 D5：**白名单构造** —— 只出六键，业务线字段在此被物理剔除
      const payload = buildFamiliarAdoptPayload(
        { birthDate, birthTime, lat, lon, tz },
        mode,
      );
      if (!isCleanFamiliarAdoptPayload(payload)) {
        throw new Error('adopt payload not clean'); // 自检失败 ⇒ 宁可不发（fail-closed）
      }
      let authHeader: Record<string, string> = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader.Authorization = `Bearer ${session.access_token}`;
      } catch (_) { /* 未配 Supabase ⇒ 匿名领养（后端只算不存） */ }

      const res = await fetch(FAMILIAR_ADOPT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || !data.success || !data.profile) throw new Error(String(res.status));
      const profile = data.profile as FamiliarProfile;
      try {
        localStorage.setItem(FAMILIAR_LS_KEY, JSON.stringify({
          profile,
          triad: data.triad || null,
          persisted: !!data.persisted,
          adoptedAt: new Date().toISOString(),
          chartSig: familiarChartSig({ birthDate, birthTime, lat, lon, tz }), // 🔒 E49 按盘隔离
        }));
      } catch (_) { /* 隐私模式忽略 */ }
      setAdopted(profile.name);
      setPersisted(!!data.persisted);
      setOpen(false);
    } catch (_) {
      setErr(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      data-testid={ADOPT_CTA_TESTID}
      data-adopted={adopted ? '1' : '0'}
      className="ks-adopt-card"
      style={{
        marginTop: '14px', padding: '14px 14px 12px', borderRadius: '14px',
        background: 'linear-gradient(160deg, rgba(212,175,55,0.10), rgba(129,216,208,0.05))',
        border: '1px solid rgba(212,175,55,0.30)',
        minWidth: 0, ...SAFE_TEXT,
      }}
    >
      {adopted ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '16px' }} aria-hidden="true">🐾</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: GOLD, ...SAFE_TEXT }}>
            {term('AdoptDone')} · {clampToSlot(adopted, 'chip')}
          </span>
          {!persisted && (
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.42)', ...SAFE_TEXT }}>
              ({lang === 'zh' ? '本机留存' : lang === 'en' ? 'local only' : lang === 'es' ? 'solo local' : lang === 'fr' ? 'local seul' : lang === 'th' ? 'เก็บในเครื่อง' : 'chỉ cục bộ'})
            </span>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px', minWidth: 0 }}>
            <span style={{ fontSize: '16px' }} aria-hidden="true">🐾</span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: GOLD, ...SAFE_TEXT }}>{term('AdoptTitle')}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginBottom: '10px', ...SAFE_TEXT }}>
            {term('AdoptDesc')}
          </div>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              style={{
                padding: '9px 18px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 100%)',
                color: '#0D0D1A', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                letterSpacing: '0.3px', ...SAFE_TEXT,
              }}
            >
              {term('AdoptCta')} →
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minWidth: 0 }}>
              {RELATION_CARDS.map((card) => (
                <button
                  key={card.mode}
                  onClick={() => adopt(card.mode)}
                  disabled={!!pending}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    padding: '9px 6px', borderRadius: '10px', border: `1px solid ${card.accent}`,
                    background: `linear-gradient(135deg, ${card.accent}22, ${card.accent2}14)`,
                    cursor: pending ? 'not-allowed' : 'pointer',
                    opacity: pending && pending !== card.mode ? 0.45 : 1,
                    ...SAFE_TEXT,
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: card.accent, ...SAFE_TEXT }}>
                    {/* 🛠️ 主公令 2026-10-12：关系卡标签走 i18n（与 FamiliarPicker 同源 zh.json familiar.*），
                        禁再渲染英文原始键（girlfriend/bestie/…） */}
                    {pending === card.mode ? '⏳' : t(`familiar.${card.mode}`)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {err && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#FF8A80', ...SAFE_TEXT }}>
              ⚠️ {lang === 'zh' ? '认领失败，请重试' : lang === 'en' ? 'Adoption failed, please retry' : lang === 'es' ? 'Adopción fallida, reintenta' : lang === 'fr' ? 'Adoption échouée, réessayez' : lang === 'th' ? 'รับเลี้ยงไม่สำเร็จ ลองใหม่' : 'Nhận nuôi thất bại, thử lại'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdoptFamiliarCTA;
