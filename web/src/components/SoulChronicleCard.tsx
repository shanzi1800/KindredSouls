/**
 * 🏆 E145-刀四（军令 2026-11-19）：灵魂成长年鉴卡（Soul Growth Chronicle）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：立即上线「生成与导出」能力（沉淀阶段星象/关键塔罗/情绪蜕变/
 * 灵犀羁绊轨迹——前端本地排版导出，零重型服务端渲染）＋按权益免费解锁：
 *   love_yearly($29.99 姻缘年度) ⇒ 姻缘模块；wealth_yearly_report($29.99
 *   财富年度) ⇒ 财富模块；all_pass_monthly 连续满 6 个月 ⇒ 双模块；
 *   all_pass_yearly($99.99 年度全通) ⇒ 双模块（soulChronicleEntitlement 纯核判定）。
 * 🔴 纪律：六语自容（零 i18n 键扰动）；对话舱红线＝零价格字眼（权益态仅
 *   「已解锁/待解锁」中性词）；导出走 Blob text/html 本地排版。
 */
import React, { useState } from 'react';
// @ts-ignore —— soulChronicleEntitlement.mjs 纯 JS 逻辑核（形状由 e145 闸门守备）
import {
  buildSoulChronicleHTML, L_CHRONICLE_TITLE, L_CHRONICLE_STATE,
  chronicleModuleGate, readChronicleState, chronicleChargingLabel,
} from '../lib/soulChronicleEntitlement.mjs';
// @ts-ignore —— soulBondState.mjs 纯 JS 逻辑核（形状由 E143 闸门守备）
import { readSoulBondState } from '../lib/soulBondState.mjs';

type ChronicleModule = 'romance' | 'wealth';

interface SoulChronicleCardProps {
  module: ChronicleModule;
  lang: string;
  paidPlans: any;
  /** 年鉴星象概要行（报告页/结果区供料；缺省 ⇒ 章节降级为羁绊轨迹） */
  summaryLines?: string[];
  companionName?: string;
}

const CHRONICLE_LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

const L_UI: Record<string, { hint: string; locked: string }> = {
  zh: { hint: '沉淀你的阶段星象、情绪蜕变与灵犀羁绊轨迹', locked: '解锁对应年度报告后，此模块年鉴免费开放' },
  en: { hint: 'Preserve your phase stars, emotional shifts and bond trail', locked: 'Unlocks free with the matching yearly report' },
  fr: { hint: 'Conservez vos phases astrales, mutations émotionnelles et lien', locked: 'Gratuit avec le rapport annuel correspondant' },
  es: { hint: 'Guarda tus fases astrales, cambios y vínculo', locked: 'Gratis con el informe anual correspondiente' },
  th: { hint: 'บันทึกดวงดารา อารมณ์ และสายใยผูกพัน', locked: 'ฟรีเมื่อมีรายงานรายปีที่ตรงกัน' },
  vi: { hint: 'Lưu giữ tinh tượng, chuyển hóa cảm xúc và sợi dây tâm linh', locked: 'Miễn phí khi có báo cáo năm tương ứng' },
};

const SoulChronicleCard: React.FC<SoulChronicleCardProps> = ({
  module, lang, paidPlans, summaryLines, companionName,
}) => {
  const [exported, setExported] = useState(false);
  const l = CHRONICLE_LANGS.includes(String(lang || '')) ? String(lang) : 'en';
  const ui = L_UI[l] || L_UI.en;

  // 🆕 E147-刀四：双门槛门控（权益 × 时间≥30 天 × 轨迹≥5）——轨迹档案直读
  //    localStorage（done 帧随行回写；隐私模式 null ⇒ 全空 fail-closed）。
  const chronMeta = readChronicleState(
    (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null
  );
  const gate = chronicleModuleGate(paidPlans, module, chronMeta.sessions);
  const unlocked = gate.status === 'unlocked';
  const charging = gate.status === 'charging';
  const chargingText = charging
    ? chronicleChargingLabel(l, { trajectory: gate.trajectory, unlockDateISO: gate.unlockDateISO })
    : '';
  const title = L_CHRONICLE_TITLE[l] || L_CHRONICLE_TITLE.en;
  const moduleName = L_CHRONICLE_STATE.module[module][l] || L_CHRONICLE_STATE.module[module].en;
  const stateWord = unlocked
    ? (L_CHRONICLE_STATE.unlocked[l] || L_CHRONICLE_STATE.unlocked.en)
    : (L_CHRONICLE_STATE.locked[l] || L_CHRONICLE_STATE.locked.en);
  const cta = L_CHRONICLE_STATE.exportCta[l] || L_CHRONICLE_STATE.exportCta.en;

  const handleExport = () => {
    try {
      // 灵犀羁绊轨迹（本地真源 ks_soul_bond_state——fail-closed 坏档跳段）
      const bond = readSoulBondState(
        (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null
      );
      const bondScore = bond && Number.isFinite(Number(bond.resonanceScore))
        ? Math.max(0, Math.min(100, Number(bond.resonanceScore))) : 0;
      const lvKey = String((bond && bond.bondLevel) || 'lv1');
      const lvNum = lvKey === 'lv3' ? 3 : (lvKey === 'lv2' ? 2 : 1);
      const sections = [];
      if (Array.isArray(summaryLines) && summaryLines.length) {
        sections.push({ heading: moduleName, lines: summaryLines.slice(0, 12) });
      }
      sections.push({ heading: title, lines: [
        `Lv.${lvNum} · ${bondScore}/100`,
      ] });
      const html = buildSoulChronicleHTML({
        lang: l, companion: companionName, sections,
      });
      if (!html) return;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KindredSouls-Soul-Chronicle-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setExported(true);
      window.setTimeout(() => setExported(false), 1600);
    } catch { /* 隐私模式 fail-soft */ }
  };

  return (
    <div className="ks-chronicle-card" data-testid="soul-chronicle-card" data-module={module}>
      <div className="ks-chronicle-head">
        <span className="ks-chronicle-title">✦ {title}</span>
        <span className={`ks-chronicle-state${unlocked ? ' is-unlocked' : ''}`}>{stateWord}</span>
      </div>
      <p className="ks-chronicle-hint">{ui.hint}</p>
      {unlocked ? (
        <button
          type="button"
          className="ks-chronicle-cta"
          onClick={handleExport}
          data-testid="soul-chronicle-export"
        >
          {exported ? '✓' : cta}
        </button>
      ) : charging ? (
        <>
          {/* 🆕 E147-刀四：蓄能态（⏳ 编纂蓄能中·已沉淀 N 条轨迹·预计启封日）
              ——导出按钮置灰禁用，防空壳导出（军令钦定六语逐字）。 */}
          <p className="ks-chronicle-charging" data-testid="soul-chronicle-charging">{chargingText}</p>
          <button
            type="button"
            className="ks-chronicle-cta is-charging"
            disabled
            data-testid="soul-chronicle-export"
          >
            {cta}
          </button>
        </>
      ) : (
        <p className="ks-chronicle-locked">{ui.locked}</p>
      )}
    </div>
  );
};

export default SoulChronicleCard;
