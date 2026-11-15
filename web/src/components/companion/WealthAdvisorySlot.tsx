/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E139-ASTRO-WEALTH-ADVISORY-ENGINE 刀二（主公军令 2026-11-15）：财商处方卡插槽
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令三件（本文件＝360px 暗金胶囊微缩卡——E137 WellnessRxSlot 同构姊妹
 * 形制）：
 *   · 星盘财商与守财罗盘卡：标题（wealth_rx_card_title）＋人生阶段章
 *     （stageName·岁数）＋四维行（固定图标列 48px＋i18n 维度标签＋六语
 *     处方文案——服务端引擎按出生年五阶＋本命元素众数算好随流下发）；
 *   · 主按钮（wealth_ask_companion）：灵宠真名动态呼唤（Sophia/Milo——
 *     认领档单源 companionDisplayName，空降回退默认 Sophia，永不残留
 *     {name} 占位符）⇒ 点击直接向对话舱 send 深度定制追问（追问句
 *     WEALTH_ASK_TEMPLATES 六语模板——引擎单源 {name} 手动 replace）；
 *   · 卡底常驻六语金融合规免责声明（wealth_edu_disclaimer 静奢微字——
 *     教育启发定性，不构成持牌投顾建议）。
 * 🔴 军规红线：金融合规——卡内零个股代码、零第三方银行品牌、零价格符号
 *   零促销词（E130 对话舱神圣净土铁律；e139 闸门全量扫杀）；泰语无空格
 *   长词防溢出（overflow-wrap: anywhere＋固定图标列宽 48px）；fail-closed
 *   ——wealthPrescription 形状不全 ⇒ 整卡不渲染；零 CSS 文件改动（inline）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WEALTH_ASK_TEMPLATES } from '../../lib/astroWealthAdvisoryEngine.mjs';
// @ts-ignore —— familiarHome.mjs 为纯 JS 逻辑核（E137.2 同源 import 先例；形状由闸门守备）
import { companionDisplayName } from '../../lib/familiarHome.mjs';

/** 服务端 meta 帧 wealthPrescription 投影形状（chat route E139-刀二） */
export interface WealthAdvisoryMeta {
  stageKey: string;
  stageName: string;
  age: number | null;
  ageSource: string;
  dominantElement: string;
  rx: {
    cashflow_stage: { category: string; prescription: string };
    asset_spectrum: { category: string; prescription: string };
    credit_leverage: { category: string; prescription: string };
    cut_and_legacy: { category: string; prescription: string };
  };
}

/** 四维行定义（军令钦定序：财库/配置/杠杆/破局——图标列恒 48px） */
const WEALTH_DIMS: ReadonlyArray<{ labelKey: string; icon: string; field: keyof WealthAdvisoryMeta['rx'] }> = Object.freeze([
  { labelKey: 'wealth_pillar_cashflow', icon: '🏺', field: 'cashflow_stage' },
  { labelKey: 'wealth_pillar_allocation', icon: '🧭', field: 'asset_spectrum' },
  { labelKey: 'wealth_pillar_credit', icon: '⚖️', field: 'credit_leverage' },
  { labelKey: 'wealth_pillar_cut_shield', icon: '🛡️', field: 'cut_and_legacy' },
]);

/** 形状守卫（fail-closed：阶段章或四维处方任一缺席 ⇒ 整卡不渲染零破坏） */
export function isWealthAdvisoryMeta(v: unknown): v is WealthAdvisoryMeta {
  if (!v || typeof v !== 'object') return false;
  const w = v as Record<string, any>;
  if (typeof w.stageName !== 'string' || !w.stageName.trim()) return false;
  const rx = w.rx;
  if (!rx || typeof rx !== 'object') return false;
  for (const f of ['cashflow_stage', 'asset_spectrum', 'credit_leverage', 'cut_and_legacy']) {
    const d = rx[f];
    if (!d || typeof d !== 'object' || typeof d.prescription !== 'string' || !d.prescription.trim()) return false;
  }
  return true;
}

export interface WealthAdvisorySlotCardProps {
  wealth: WealthAdvisoryMeta;
  /** 追问联动：父层向对话舱 send（追问句作为用户消息上屏） */
  onAsk: (message: string) => void;
  /** 流式守卫：流式中禁点（父层 disabled 传参——双保险） */
  disabled?: boolean;
}

export const WealthAdvisorySlotCard: React.FC<WealthAdvisorySlotCardProps> = ({ wealth, onAsk, disabled }) => {
  const { t, i18n } = useTranslation();
  if (!isWealthAdvisoryMeta(wealth)) return null; // 双保险（挂载点已守卫）
  const lang = String(i18n.language || 'zh').slice(0, 2).toLowerCase();
  // 🏆 E139：灵宠真名动态呼唤（认领档 ks_familiar 单源；空降回退默认 Sophia）
  const companionName = companionDisplayName(
    typeof window !== 'undefined' && window.localStorage ? window.localStorage : null,
  );
  const askTemplate = WEALTH_ASK_TEMPLATES[lang as keyof typeof WEALTH_ASK_TEMPLATES]
    || WEALTH_ASK_TEMPLATES.zh;
  const askMessage = askTemplate.replace('{name}', companionName);
  const askLabel = t('wealth_ask_companion').replace('{name}', companionName);
  const ageChip = (typeof wealth.age === 'number' && Number.isFinite(wealth.age))
    ? `${wealth.stageName} · ${wealth.age}` : wealth.stageName;
  return (
    <div
      data-testid="wealth-advisory-slot"
      style={{
        width: '360px', maxWidth: '100%',
        marginTop: 8, padding: '13px 14px 12px',
        background: 'rgba(14,13,18,0.9)',
        border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 14,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.5), 0 0 18px rgba(212,175,55,0.08)',
      }}
    >
      {/* 标题行：罗盘铭题＋人生阶段章（stageName·岁数） */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.5, color: '#F3E5AB', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('wealth_rx_card_title')}
        </div>
        <span
          data-testid="wealth-advisory-stage"
          style={{
            flexShrink: 0, fontSize: 9.5, color: 'rgba(212,188,122,0.85)',
            border: '1px solid rgba(212,175,55,0.4)', borderRadius: 999,
            padding: '2px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 168,
          }}
        >
          ✧ {ageChip}
        </span>
      </div>

      {/* 四维行：固定图标列 48px＋i18n 维度标签＋六语处方文案
          （泰语无空格长词 ⇒ overflow-wrap anywhere 防溢出——390×844 军规） */}
      <div data-testid="wealth-advisory-dims" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {WEALTH_DIMS.map((d) => {
          const dim = wealth.rx[d.field];
          return (
            <div key={d.field} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                aria-hidden="true"
                style={{
                  width: 48, height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, background: 'rgba(19,16,10,0.85)',
                  border: '1px solid rgba(212,175,55,0.35)', borderRadius: 10,
                }}
              >
                {d.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <div style={{ fontSize: 10, letterSpacing: 0.5, color: 'rgba(159,199,232,0.9)', fontWeight: 600 }}>
                  {t(d.labelKey)}
                </div>
                <div style={{ marginTop: 2, fontSize: 10.5, lineHeight: 1.6, color: 'rgba(212,188,122,0.92)', overflowWrap: 'anywhere' }}>
                  {dim.prescription}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 主按钮：灵宠真名呼唤 ⇒ onAsk 直发深度定制追问（E137.2 {name} 手动
          replace 单源先例——i18next 双花括号插值军规禁用） */}
      <button
        type="button"
        data-testid="wealth-advisory-ask"
        disabled={disabled}
        onClick={() => onAsk(askMessage)}
        style={{
          display: 'block', width: '100%', marginTop: 10, padding: '9px 12px', borderRadius: 999,
          textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
          background: 'linear-gradient(135deg, rgba(212,175,55,0.92), rgba(160,120,40,0.92))',
          border: '1px solid #D4AF37', color: '#141310',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5,
          boxShadow: '0 0 16px rgba(212,175,55,0.25)', overflowWrap: 'anywhere',
        }}
      >
        {askLabel}
      </button>

      {/* 卡底常驻：六语金融合规免责声明（静奢微字——教育启发定性零投顾建议） */}
      <div
        data-testid="wealth-advisory-disclaimer"
        style={{
          marginTop: 9, fontSize: 8.5, lineHeight: 1.55,
          color: 'rgba(212,188,122,0.5)', overflowWrap: 'anywhere', textAlign: 'left',
        }}
      >
        {t('wealth_edu_disclaimer')}
      </div>
    </div>
  );
};
