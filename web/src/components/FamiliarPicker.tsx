import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// 🐾 E34-B5 · 灵宠选择器（方案二：免费 4 项 → 选灵宠 → 带路进首页）
//
//   🔴 产品定调（主公 2026-10-09 澄清）：全站只有 **2 个 IP 名**
//      （Sophia / Milo），四象只是「同一 IP 的两种关系人格」——
//        男用户：Sophia=善良女友 · Milo=铁哥们儿
//        女用户：Sophia=闺蜜     · Milo=帅气男友
//      ❗刻意**不采集用户性别**，由用户直接选关系（军师裁决「方案 b」）。
//
//   🔴 关系模式唯一真源在 astro/familiar_engine.py::RELATION_MODES；
//      本组件的 RELATION_CARDS 是 UI 呈现副本，闸门 audit-e34 断言同源。
//
//   🔴 入参只含「出生时空 + 关系模式」——与财富线解耦（军师圣旨），
//      故本组件将来可被合婚流直接复用。
// ═══════════════════════════════════════════════════════════════════════════

export type RelationMode = 'girlfriend' | 'buddy' | 'bestie' | 'boyfriend';

interface RelationCard {
  mode: RelationMode;
  ip: 'Sophia' | 'Milo';
  /** 关系层主色（与 familiar_engine.RELATION_PALETTE 同值） */
  accent: string;
  accent2: string;
  /** 骨架 skinId（与 RELATION_PALETTE 同值；B1 先只用于色彩，B2 接 Spine） */
  skin: string;
}

export const RELATION_CARDS: RelationCard[] = [
  { mode: 'girlfriend', ip: 'Sophia', accent: '#F4B8CE', accent2: '#E8C79A', skin: 'sophia_girlfriend' },
  { mode: 'bestie',     ip: 'Sophia', accent: '#9FE1CB', accent2: '#F4C0D1', skin: 'sophia_bestie' },
  { mode: 'buddy',      ip: 'Milo',   accent: '#D9A441', accent2: '#4FA8E0', skin: 'milo_buddy' },
  { mode: 'boyfriend',  ip: 'Milo',   accent: '#D4AF37', accent2: '#2B2F3A', skin: 'milo_boyfriend' },
];

export const FAMILIAR_LS_KEY = 'ks_familiar';

export interface FamiliarProfile {
  name: string;
  relation_mode: RelationMode;
  body_type: string;
  texture: string;
  crystal_color: string;
  eye_color: string;
  [k: string]: unknown;
}

interface FamiliarPickerProps {
  birthDate: string;
  birthTime: string;
  lat: number;
  lon: number;
  tz: string;
  onAdopted?: (profile: FamiliarProfile, persisted: boolean) => void;
}

const FamiliarPicker: React.FC<FamiliarPickerProps> = ({ birthDate, birthTime, lat, lon, tz, onAdopted }) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<RelationMode | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const adopt = async (card: RelationCard) => {
    if (pending) return;
    setPending(card.mode);
    setErr(null);
    try {
      // 🛡️ 有登录态则带上 token ⇒ 后端正规 upsert 落库；
      //    无登录态后端**只算不存**（fail-closed），前端本地带路。
      let authHeader: Record<string, string> = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader.Authorization = `Bearer ${session.access_token}`;
      } catch (_) { /* 未配 Supabase ⇒ 匿名领养 */ }

      const res = await fetch('/api/familiar/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({
          birthDate,
          birthTime,
          lat,
          lon,
          tz,
          relationMode: card.mode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || !data.success || !data.profile) {
        throw new Error((data && data.code) || `HTTP ${res.status}`);
      }
      const profile = data.profile as FamiliarProfile;
      // 本地持久化（无 localStorage 持久化铁律的**唯一例外**：灵宠档案须跨刷新留存）
      try {
        localStorage.setItem(FAMILIAR_LS_KEY, JSON.stringify({
          profile,
          triad: data.triad || null,
          persisted: !!data.persisted,
          adoptedAt: new Date().toISOString(),
        }));
      } catch (_) { /* 隐私模式忽略 */ }
      setDone(profile.name);
      if (onAdopted) onAdopted(profile, !!data.persisted);
    } catch (e) {
      console.error('[E34-B5] familiar adopt failed:', e);
      setErr(t('familiar.error'));
    } finally {
      setPending(null);
    }
  };

  if (done) {
    return (
      <div style={S.doneBox}>
        <span style={{ fontSize: '20px' }}>🐾</span>
        <span style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 700 }}>
          {t('familiar.adopted')} · {done}
        </span>
      </div>
    );
  }

  const byIp = (ip: 'Sophia' | 'Milo') => RELATION_CARDS.filter((c) => c.ip === ip);

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.title}>🐾 {t('familiar.title')}</div>
        <div style={S.sub}>{t('familiar.subtitle')}</div>
      </div>

      <div style={S.grid}>
        {(['Sophia', 'Milo'] as const).map((ip) => (
          <div key={ip} style={S.ipCol}>
            <div style={{ ...S.ipName, color: ip === 'Sophia' ? '#F4B8CE' : '#D9A441' }}>{ip}</div>
            {byIp(ip).map((card) => (
              <button
                key={card.mode}
                onClick={() => adopt(card)}
                disabled={!!pending}
                style={{
                  ...S.cardBtn,
                  borderColor: card.accent,
                  background: `linear-gradient(135deg, ${card.accent}22, ${card.accent2}14)`,
                  opacity: pending && pending !== card.mode ? 0.45 : 1,
                }}
              >
                <span style={{ ...S.cardName, color: card.accent }}>
                  {pending === card.mode ? t('familiar.adopting') : t(`familiar.${card.mode}`)}
                </span>
                <span style={S.cardDesc}>{t(`familiar.${card.mode}Desc`)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {err && <div style={S.err}>{err}</div>}
      <div style={S.note}>{t('familiar.degradedNote')}</div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: '16px', padding: '16px 14px', borderRadius: '14px',
    background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.22)',
  },
  head: { marginBottom: '12px', textAlign: 'center' },
  title: { fontSize: '14px', fontWeight: 800, color: '#D4AF37', marginBottom: '4px' },
  sub: { fontSize: '11px', color: '#8B8778', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  ipCol: { display: 'flex', flexDirection: 'column', gap: '8px' },
  ipName: { fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textAlign: 'center' },
  cardBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    padding: '10px 8px', borderRadius: '10px', border: '1px solid', cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  cardName: { fontSize: '12px', fontWeight: 700 },
  cardDesc: { fontSize: '10px', color: '#8B8778', textAlign: 'center', lineHeight: 1.4 },
  err: { marginTop: '10px', fontSize: '11px', color: '#F87171', textAlign: 'center' },
  note: { marginTop: '10px', fontSize: '10px', color: '#666', textAlign: 'center', lineHeight: 1.5 },
  doneBox: {
    marginTop: '16px', padding: '12px', borderRadius: '12px',
    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  },
};

export default FamiliarPicker;
