import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import WealthDataGrid from '../components/WealthDataGrid';
import WealthPaywall from '../components/WealthPaywall';
import WealthInsightCard from '../components/WealthInsightCard';
import { supabase } from '../lib/supabase';
import {
  tWuxing, tZodiacSign, tZodiacElement, tBagua, tHexagram,
  tTarotName, tTarotMeaning, tOrientation, tZodiacMode, tRuler, tChanging, tTiangan,
  type AlgLang,
} from '../lib/algos/i18n';

// ── Monthly Report Card Component ──
interface WeekData {
  type: string;
  tag: string;
  dateRange: string;
  text: string;
  keyDay: string;
}

interface MonthlyReportData {
  headline: string;
  weeks: WeekData[];
  expense_trap?: { tag: string; dateRange: string; text: string };
}

// 智能分段:按破折号、日期、关键句分割
const splitTextToBlocks = (text: string): string[] => {
  // 先按句子分割(句号、感叹号、问号)
  const sentences = text.split(/(?<=[。!?])/);
  const blocks: string[] = [];
  let currentBlock = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // 如果当前块已经很长,或者遇到特定标记,就截断
    if (currentBlock.length > 80 ||
        trimmed.includes('-') ||
        /^\d+月\d+日/.test(trimmed) ||
        trimmed.includes('阴影自我') ||
        trimmed.includes('警告') ||
        trimmed.includes('建议') ||
        trimmed.includes('转运')) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = trimmed;
    } else {
      currentBlock += trimmed;
    }
  }
  if (currentBlock) blocks.push(currentBlock);
  return blocks.filter(b => b.length > 0);
};

// 高亮关键词
const highlightKeywords = (text: string): React.ReactNode => {
  const keywords = [
    { pattern: /(报复性消费|消费冷静期|财务黑洞|破产级|致命性)/g, color: '#FF4D4F', bg: 'rgba(255,77,79,0.15)' },
    { pattern: /(机会基金|流动契约|财富祝福|财务觉醒)/g, color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
    { pattern: /(深度尽职调查|边界的确立|全面戒严|物理超度)/g, color: '#D4AF37', bg: 'rgba(212,175,55,0.1)' },
    { pattern: /(\d+月\d+日)/g, color: '#D4AF37', bg: 'transparent' },
  ];

  let parts: React.ReactNode[] = [text];

  keywords.forEach(({ pattern, color, bg }) => {
    const newParts: React.ReactNode[] = [];
    parts.forEach(part => {
      if (typeof part !== 'string') {
        newParts.push(part);
        return;
      }
      const matches = part.split(pattern);
      const matchResults = part.match(pattern) || [];

      matches.forEach((segment, i) => {
        if (segment) newParts.push(segment);
        if (matchResults[i]) {
          newParts.push(
            <span key={`${i}-${matchResults[i]}`} style={{
              color,
              background: bg,
              padding: bg !== 'transparent' ? '1px 4px' : '0',
              borderRadius: '3px',
              fontWeight: 600,
            }}>
              {matchResults[i]}
            </span>
          );
        }
      });
    });
    parts = newParts;
  });

  return <>{parts}</>;
};

const MonthlyReportCard: React.FC<{ content: string; lang: string }> = ({ content, lang }) => {
  // lang 校验
  const safeLang = (['zh','en','es','fr','th','vi'].includes(lang) ? lang : 'en') as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  // Try to parse as JSON (monthly report format)
  let data: MonthlyReportData | null = null;
  try {
    data = JSON.parse(content);
  } catch {
    // Not JSON, treat as plain text/HTML
  }

  if (!data || !data.weeks) {
    // Fallback to plain text rendering
    const _fallbackStyle: React.CSSProperties = { marginTop: '2px', padding: '10px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', textAlign: 'left', color: 'rgba(255,255,255,0.9)', fontSize: '13px', lineHeight: 1.9, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' };
    const _sanitized = content
      .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
      .replace(/<h2[^>]*>.*?<\/h2>/gi, '')
      .replace(/<p><br\s*\/?><\/p>/gi, '')
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<br\s*\/?><br\s*\/?>/gi, '<br/>')
      .replace(/^\s+|\s+$/g, '')
      .replace(/(<\/p>)\s+(<p>)/g, '$1$2');
    return (
      <div style={_fallbackStyle} dangerouslySetInnerHTML={{ __html: _sanitized }}>
      </div>
    );
  }



  // ── UI 翻译字典 ──
  const UI = {
    badge: {
      peak:    { zh:'🟢 财富充能周', en:'🟢 Wealth Peak', es:'🟢 Expansión', fr:'🟢 Flux', th:'🟢 เติบโต', vi:'🟢 Tài Lộc' },
      risk:    { zh:'🔴 高危熔断周', en:'🔴 High Risk', es:'🔴 Riesgo', fr:'🔴 Risque', th:'🔴 เสี่ยง', vi:'🔴 Rủi Ro' },
      flow:    { zh:'🔵 顺流蓄力周', en:'🔵 Flow', es:'🔵 Flujo', fr:'🔵 Flux', th:'🔵 ไหลลื่น', vi:'🔵 Thành Công' },
      default: { zh:'💫 机遇窗口', en:'💫 Opportunity', es:'💫 Oportunidad', fr:'💫 Opportunité', th:'💫 โอกาส', vi:'💫 Cơ Hội' },
    },
    theme:  { zh:'🔮 本月命运主题', en:'🔮 Monthly Theme', es:'🔮 Tema', fr:'🔮 Thème', th:'🔮 ธีม', vi:'🔮 Chủ Đề' },
    keyDay: { zh:'💫 核心天机', en:'💫 Key Day', es:'💫 Día Clave', fr:'💫 Jour Clé', th:'💫 วันสําคัญ', vi:'💫 Ngày Quan Trọng' },
    order:  { zh:'🛑 防弹硬核指令', en:'🛑 Hard Order', es:'🛑 Orden', fr:'🛑 Ordre', th:'🛑 คําสั่ง', vi:'🛑 Lệnh Khẩn' },
    orderTxt: { zh:'执行【全面戒严】!超过 <b>5000元</b> 必须等 <b>24小时</b>!', en:'Full alert! Expense > <b>$700</b> wait <b>24h</b>!', es:'¡Alerta! Gasto > <b>$700</b> esperar <b>24h</b>!', fr:'Alerte! Dépense > <b>700€</b> attendre <b>24h</b>!', th:'แจ้งเตือน! ค่าใช้จ่าย > <b>฿25000</b> รอ <b>24ชม.</b>!', vi:'Báo động! Chi > <b>3.5M₫</b> đợi <b>24giờ</b>!' },
  };
  // Render as cards
  const getCardStyle = (type: string) => {
    switch (type) {
      case 'peak': return {
        border: '#4CAF50',
        bg: 'linear-gradient(135deg, rgba(76,175,80,0.12) 0%, rgba(76,175,80,0.04) 100%)',
        badge: UI.badge.peak[safeLang] || UI.badge.peak.en
      };
      case 'risk': return {
        border: '#FF4D4F',
        bg: 'linear-gradient(135deg, rgba(255,77,79,0.12) 0%, rgba(255,77,79,0.04) 100%)',
        badge: UI.badge.risk[safeLang] || UI.badge.risk.en
      };
      case 'flow': return {
        border: '#64B5F6',
        bg: 'linear-gradient(135deg, rgba(100,181,246,0.12) 0%, rgba(100,181,246,0.04) 100%)',
        badge: UI.badge.flow[safeLang] || UI.badge.flow.en
      };
      default: return {
        border: '#D4AF37',
        bg: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
        badge: UI.badge.default[safeLang] || UI.badge.default.en
      };
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {/* 🔮 Headline - 命运主题 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(139,69,19,0.1) 100%)',
        border: '2px solid rgba(212,175,55,0.4)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(212,175,55,0.15)'
      }}>
        <div style={{ fontSize: '12px', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', fontWeight: 600 }}>
          {UI.theme[safeLang] || UI.theme.en}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1.5, textShadow: '0 2px 4px rgba(0,0,0,0.3)', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {data.headline}
        </div>
      </div>

      {/* Week Cards - 战时财富指标卡 */}
      {data.weeks.map((week, idx) => {
        const style = getCardStyle(week.type);
        const textBlocks = splitTextToBlocks(week.text);

        return (
          <div key={idx} style={{
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: `0 2px 12px ${style.border}20`
          }}>
            {/* 战时指标卡头 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '10px',
              borderBottom: `1px dashed ${style.border}40`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#fff',
                  background: style.border,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  boxShadow: `0 2px 8px ${style.border}50`
                }}>
                  {style.badge}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {week.dateRange}
              </span>
            </div>

            {/* 核心天机 - Key Day */}
            <div style={{
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '12px',
              border: '1px solid rgba(212,175,55,0.2)'
            }}>
              <div style={{ fontSize: '10px', color: '#D4AF37', marginBottom: '4px', fontWeight: 600 }}>
                {UI.keyDay[safeLang] || UI.keyDay.en}
              </div>
              <div style={{ fontSize: '14px', color: '#fff', fontWeight: 700, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {week.keyDay}
              </div>
            </div>

            {/* 豆腐块文字 - 乱刀斩断 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {textBlocks.map((block, bidx) => (
                <div key={bidx} style={{
                  fontSize: '12px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.9, wordBreak: 'break-word', overflowWrap: 'break-word',
                  padding: '8px 0',
                  borderBottom: bidx < textBlocks.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none'
                }}>
                  {highlightKeywords(block)}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* ⚠️ Expense Trap - 消费陷阱熔断区 */}
      {data.expense_trap && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,77,79,0.15) 0%, rgba(139,0,0,0.08) 100%)',
          border: '2px dashed #FF4D4F',
          borderRadius: '14px',
          padding: '18px',
          marginTop: '20px',
          boxShadow: '0 4px 16px rgba(255,77,79,0.2)'
        }}>
          {/* 高危指标头 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px dashed rgba(255,77,79,0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>☠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FF4D4F', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {data.expense_trap.tag}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {UI.order[safeLang] || UI.order.en} {data.expense_trap.dateRange}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '16px' }}>
              {'☠️'.repeat(5)}
            </div>
          </div>

          {/* 陷阱内容 - 乱刀斩断 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {splitTextToBlocks(data.expense_trap.text).map((block, idx) => (
              <div key={idx} style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.9, padding: '6px 0', wordBreak: 'break-word', overflowWrap: 'break-word',
              }}>
                {highlightKeywords(block)}
              </div>
            ))}
          </div>

          {/* 防弹硬核指令 */}
          <div style={{
            marginTop: '14px',
            padding: '12px',
            background: 'rgba(255,77,79,0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255,77,79,0.4)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#FF4D4F', marginBottom: '6px' }}>
              {UI.order[safeLang] || UI.order.en}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              <span
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, wordBreak: 'break-word', overflowWrap: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: UI.orderTxt[safeLang] || UI.orderTxt.en }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ── 先知天书:年报渲染器(军师满级超神版)──
// ═══════════════════════════════════════════════════════════════════════

interface YearlyChapter {
  title: string;
  content: string;
}

interface MonthBlock {
  month: string;       // "M1"
  dateRange: string;   // "2026年7月"
  zodiac: string;     // "巨蟹座新月"
  state: 'peak' | 'risk' | 'flow';
  stateLabel: string;
  cosmicPhase: string;
  paragraphs: string[];
  wealthAction: string[];
  shadowWork: string[];
}

// 🛠️ 军师硬核：年报终极日期清洗矩阵（七重斩杀·终极版）
// ⚠️ 注意：此函数必须在流式结束后对完整文本调用，不能在 onStreamChunk 中调用！
export const cleanYearlyTimeline = (text: string): string => {
  if (!text) return text;
  let cleaned = text;

  // 🎯 斩杀 1：三连击年份去重 (如：2026年7月2026年7月2026年7月 → 2026年7月)
  // 贪婪匹配任意次数的重复
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+/g, '$1');

  // 🎯 斩杀 2：AAB 模式处理 (如：2026年7月2026年7月2027年1月 → 2026年7月至2027年1月)
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+(\d{4}年\d{1,2}月)/g, '$1至$2');

  // 🎯 斩杀 3：带横杠的重复 (如：2027年1月-2027年1月2027年1月 → 2027年1月)
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)-(?:\1)+/g, '$1');
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)-(?:\1)+至(\d{4}年\d{1,2}月)/g, '$1至$2');

  // 🎯 斩杀 4：生日+流年混杂 (如：1995年3月1995年3月2026年7月8日 → 1995年3月2026年7月8日)
  // 旧年份重复，后面跟着新日期
  cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+(\d{4}年\d{1,2}月\d{1,2}日)/g, '$1$2');

  // 🎯 斩杀 5：月份卡片内部的复读 (如：7月7日7月7日7月22日 → 7月7日至7月22日)
  cleaned = cleaned.replace(/(\d{1,2}月\d{1,2}日)(?:\1)+(\d{1,2}月)?(\d{1,2}日)/g, '$1至$2$3');
  cleaned = cleaned.replace(/(\d{1,2}月\d{1,2}日)(?:\1)+/g, '$1');

  // 🎯 斩杀 6：跨年度区间重复 (如：至2027年1月2027年1月 → 至2027年1月)
  cleaned = cleaned.replace(/至\s*(\d{4}年\d{1,2}月)(?:\1)+/g, '至 $1');

  // 🎯 斩杀 7：兜底清理——任何剩余的年份重复模式
  // 循环执行直到没有变化
  let prev = cleaned;
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned.replace(/(\d{4}年\d{1,2}月)(?:\1)+/g, '$1');
    if (cleaned === prev) break;
    prev = cleaned;
  }

  return cleaned;
};

// ── Markdown 解析核心 ──
const parseYearlyReport = (markdown: string, _birthDate: string): {
  title: string;
  chapters: YearlyChapter[];
  months: MonthBlock[];
  rawContent: string;
} => {
  // 清洗时间线重复（流式期间，chunk 拼接可能产生"2026年7月2026年7月"）
  const cleanedMd = cleanYearlyTimeline(markdown);
  const lines = cleanedMd.split('\n');
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || '年度财富报告';
  const months: MonthBlock[] = [];
  const chapters: YearlyChapter[] = [];

  let currentMonth: Partial<MonthBlock> | null = null;
  let currentSection: 'paragraphs' | 'wealthAction' | 'shadowWork' = 'paragraphs';
  let currentChapter = { title: '', content: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#\s/.test(trimmed) || trimmed === '---') continue;  // 只跳过顶级标题(# 开头,后面跟空格的)
    // 注:## 、###、#### 都要进入解析

    // 检测月份(军师v3:兼容军师排版规范 + 全/半角分隔符)
    // 新格式:#### 📅 2026年7月:木星入财帛宫的觉醒之月
    // 旧格式:### M1: 2026年7月 · 巨蟹座新月
    const monthMatch = trimmed.match(/^#{2,4}\s*(?:📅\s*)?(?:M\d+:?\s*)?(\d{4}年\d{1,2}月)\s*[·::-|]\s*(.+)$/);
    if (monthMatch) {
      if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);
      const state = trimmed.includes('高峰') || trimmed.includes('🟢') || trimmed.includes('Peak') || trimmed.includes('显化')
        ? 'peak' : trimmed.includes('高风险') || trimmed.includes('🔴') || trimmed.includes('Risk')
        ? 'risk' : 'flow';
      const stateLabel = state === 'peak' ? '🟢 财富充能月' : state === 'risk' ? '🔴 高危熔断月' : '🔵 顺流蓄力月';
      currentMonth = {
        month: monthMatch[1],  // 2026年7月
        dateRange: '',  // 不重复显示
        zodiac: monthMatch[2].trim(),  // 木星入财帛宫的觉醒之月
        state,
        stateLabel,
        cosmicPhase: '',
        paragraphs: [],
        wealthAction: [],
        shadowWork: [],
      };
      currentSection = 'paragraphs';
      continue;
    }

    // 检测财富行动
    if (trimmed.includes('■ 财富行动') || trimmed.includes('财富行动:')) {
      currentSection = 'wealthAction';
      const text = trimmed.replace(/^[■◆●]\s*/, '').replace('财富行动:', '').replace('财富行动', '');
      if (text) (currentMonth || { paragraphs: [] }).paragraphs!.push(text);
      continue;
    }

    // 检测阴影觉察
    if (trimmed.includes('⚠️ 心理学阴影觉察') || trimmed.includes('✨ 荣格核心心法') ||
        trimmed.includes('阴影觉察') || trimmed.includes('Shadow Work')) {
      currentSection = 'shadowWork';
      const text = trimmed.replace(/^[⚠️✨]\s*/, '').replace(/心理学阴影觉察[::]/, '').replace(/荣格核心心法高亮[::]/, '').replace('阴影觉察', '');
      if (text) (currentMonth || { paragraphs: [] }).paragraphs!.push(text);
      continue;
    }

    // ─────────────────────────────────────────
    // 检测顶级章节（军师P0 v1升级版：includes软匹配 + 多语种关键字）
    // 核心思想：只要行包含章节关键字且长度<40字符，即判定为新章节
    // 无论AI输出##/###/####/或无#前缀，都能兜住
    // ─────────────────────────────────────────
    if (!monthMatch) {
      const clean = trimmed.toLowerCase();
      // 顶级章节关键字（多语种全量覆盖）
      // 注意：先知天书 ❌ 排除（在引用块 `> ### ✦ 先知天书` 出现，不是顶级章节）
      const CHAPTER_KEYWORDS = [
        // 中文
        '第一章','第二章','第三章','第四章','第五章',
        '终极神谕','通关密令',
        // 英文/法文/西文
        'chapter','capítulo','chapitre',
        'final oracle','oráculo final','oracle final',
        'final wealth','ultimate oracle',
      ];
      const isChapterKeyword = CHAPTER_KEYWORDS.some(kw => clean.includes(kw.toLowerCase()));
      // 排除：年份日期（2026年7月）、月份标签
      const isYearMonth = /\d{4}年\d{1,2}月/.test(trimmed) || /^\d{4}年/.test(trimmed);
      // 排除：引用块（> 开头是引用，不可能是顶级章节）
      const isQuote = trimmed.startsWith('>');
      // 排除：列表项（- 或 * 开头）
      const isListItem = /^[-*]\s/.test(trimmed);
      // 顶级章节判定：含章节关键字 + 长度<80（足够容纳"## 第一章：xxx（English Title）"） + 不是年月 + 不是引用块 + 不是列表项
      const isNewChapter = isChapterKeyword && trimmed.length < 80 && !isYearMonth && !isQuote && !isListItem;

      if (isNewChapter) {
        // 提取章节标题（去掉前面的 #）
        const title = trimmed.replace(/^#+\s*/, '').trim();
        if (currentChapter.title) chapters.push(currentChapter);
        currentChapter = { title, content: '' };
        if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);
        currentMonth = null;
        continue;
      }
    }

    // 宇宙相位行
    if (trimmed.includes('🌌') || trimmed.includes('宇宙相位') || /[🌌🔮⭐]/.test(trimmed)) {
      if (currentMonth) currentMonth.cosmicPhase = trimmed;
      continue;
    }

    // 普通段落/子标题
    if (currentMonth) {
      const clean = trimmed.replace(/^[-*]\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1');
      if (clean && currentSection === 'wealthAction') {
        currentMonth.wealthAction!.push(clean);
      } else if (clean && currentSection === 'shadowWork') {
        currentMonth.shadowWork!.push(clean);
      } else if (clean) {
        currentMonth.paragraphs!.push(clean);
      }
    } else if (currentChapter.title) {
      // 清理子标题的 # 、加粗符号
      const cleanLine = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1');
      currentChapter.content += (currentChapter.content ? '\n\n' : '') + cleanLine;
    }
  }
  if (currentMonth && currentMonth.month) months.push(currentMonth as MonthBlock);
  if (currentChapter.title) chapters.push(currentChapter);

  return { title, chapters, months, rawContent: markdown };
};

// ── 金句高亮器 ──
const highlightYearlyGold = (text: string): React.ReactNode => {
  if (!text) return null;
  const keywords = [
    { k: /(\d+月\d+日|\d{4}年\d+月)/g, color: '#D4AF37', bold: true },
    { k: /(木星|土星|金星|火星|水星|冥王星|天王星|海王星)/g, color: '#9B7FD4', bold: true },
    { k: /(阴影自我|荣格|Shadow Self|集体无意识)/g, color: '#FF4D4F', bold: true },
    { k: /(财富行动|投资建议|防弹指令|核心熔断)/g, color: '#FFD700', bold: true },
    { k: /(高危|风险|危机|谨慎|过度)/g, color: '#FF6B6B', bold: false },
    { k: /(丰盛|充能|爆发|显化|收获)/g, color: '#4CAF50', bold: false },
  ];

  let result: React.ReactNode = text;
  keywords.forEach(({ k, color, bold }) => {
    const parts = String(result).split(k);
    const matches = String(result).match(k) || [];
    if (parts.length <= 1) return;
    const nodes: React.ReactNode[] = [];
    parts.forEach((part, i) => {
      if (part) nodes.push(part);
      if (matches[i]) nodes.push(
        <span key={`${i}-${matches[i]}`} style={{ color, fontWeight: bold ? 700 : 400 }}>{matches[i]}</span>
      );
    });
    result = <>{nodes}</>;
  });
  return result;
};

// ── 年报卡片主组件 ──
const YearlyReportCard: React.FC<{ content: string; birthDate: string }> = ({ content, birthDate }) => {
  const parsed = parseYearlyReport(content, birthDate);

  // 获取星座显示(从 birthDate 简单解析)
  const zodiacDisplay = parsed.months[0]?.zodiac || '双子座';

  // 月份状态对应的 Badge 样式
  const getBadgeStyle = (state: string) => {
    switch (state) {
      case 'peak': return { border: '#4CAF50', bg: 'rgba(76,175,80,0.15)', color: '#4CAF50', glow: '0 0 15px rgba(76,175,80,0.3)' };
      case 'risk': return { border: '#FF4D4F', bg: 'rgba(255,77,79,0.15)', color: '#FF4D4F', glow: '0 0 15px rgba(255,77,79,0.3)' };
      default: return { border: '#64B5F6', bg: 'rgba(100,181,246,0.15)', color: '#64B5F6', glow: '0 0 15px rgba(100,181,246,0.3)' };
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {/* ═══ 神圣封面:命运主题 + 仪式感标题 ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '2px solid rgba(212,175,55,0.4)',
        borderRadius: '20px',
        padding: '28px 20px',
        marginBottom: '24px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(212,175,55,0.15), inset 0 0 60px rgba(212,175,55,0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰角标 */}
        <div style={{ position: 'absolute', top: '10px', left: '14px', fontSize: '11px', color: 'rgba(212,175,55,0.4)' }}>🔮</div>
        <div style={{ position: 'absolute', top: '10px', right: '14px', fontSize: '11px', color: 'rgba(212,175,55,0.4)' }}>🌌</div>

        <div style={{ fontSize: '11px', color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
          ✦ 先知天书 · 财富天启 ✦
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: '12px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {parsed.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>
          <span>👤 出生日期:{birthDate}</span>
          <span>🌌 盘口:{zodiacDisplay}·太阳回归年</span>
        </div>
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: '14px' }} />

        {/* 神圣引言 - 军师令：全量平铺，取消截断和滚动 */}
        {parsed.chapters[0] && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'left',
            border: '1px solid rgba(212,175,55,0.15)',
            /* 军师v6：取消maxHeight和overflowY，全量平铺展示厚度 */
          }}>
            <div style={{ fontSize: '10px', color: '#D4AF37', marginBottom: '6px', fontWeight: 600 }}>
              💡 先知神谕
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
              {/* 军师v6：完整渲染，不截断 */}
              {highlightYearlyGold(parsed.chapters[0].content)}
            </div>
          </div>
        )}
      </div>

      {/* ═══ 12个月战时能量看板 ═══ */}
      {parsed.months.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '12px', color: '#D4AF37', fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', marginBottom: '14px', paddingBottom: '8px',
            borderBottom: '1px solid rgba(212,175,55,0.2)'
          }}>
            📅 第二章:12个月收入矩阵
          </div>

          {parsed.months.map((month, idx) => {
            const badge = getBadgeStyle(month.state);
            return (
              <div key={idx} style={{
                background: badge.bg,
                border: `2px solid ${badge.border}`,
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '14px',
                boxShadow: `0 4px 16px ${badge.glow}`,
              }}>
                {/* 月份头:战时状态 Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                      🌑 {month.month}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                      {month.dateRange}
                    </span>
                  </div>
                  {/* 能量状态胶囊 */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: `1px solid ${badge.border}`,
                    background: `${badge.border}20`,
                    fontSize: '10px',
                    fontWeight: 700,
                    color: badge.color,
                    boxShadow: `0 0 8px ${badge.border}50`,
                  }}>
                    {month.stateLabel}
                  </div>
                </div>

                {/* 星座新月/满月标签 */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  <span style={{ color: '#D4AF37' }}>🌌</span>
                  <span>{month.zodiac}</span>
                </div>

                {/* 宇宙相位 */}
                {month.cosmicPhase && (
                  <div style={{
                    fontSize: '10px', color: '#9B7FD4',
                    marginBottom: '10px',
                    padding: '6px 10px',
                    background: 'rgba(155,127,212,0.1)',
                    borderRadius: '6px',
                    borderLeft: '3px solid #9B7FD4',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    {month.cosmicPhase}
                  </div>
                )}

                {/* 神谕显化一览卡 */}
                {month.paragraphs.length > 0 && (
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '10px'
                  }}>
                    {month.paragraphs.slice(0, 2).map((para, pi) => (
                      <div key={pi} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.9, marginBottom: '6px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                        {highlightYearlyGold(para.slice(0, 200))}
                      </div>
                    ))}
                  </div>
                )}

                {/* 财富行动 + 阴影觉察 双列神谕卡 */}
                {(month.wealthAction.length > 0 || month.shadowWork.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {/* 财富行动 */}
                    {month.wealthAction.length > 0 && (
                      <div style={{
                        background: 'rgba(255,215,0,0.08)',
                        border: '1px solid rgba(255,215,0,0.25)',
                        borderRadius: '10px',
                        padding: '10px',
                      }}>
                        <div style={{ fontSize: '9px', color: '#FFD700', fontWeight: 700, marginBottom: '6px', letterSpacing: '1px' }}>
                          ⚡ 财富行动
                        </div>
                        {month.wealthAction.map((item, qi) => (
                          <div key={qi} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, marginBottom: '4px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            · {highlightYearlyGold(item)}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* 阴影觉察 */}
                    {month.shadowWork.length > 0 && (
                      <div style={{
                        background: 'rgba(255,77,79,0.08)',
                        border: '1px solid rgba(255,77,79,0.25)',
                        borderRadius: '10px',
                        padding: '10px',
                      }}>
                        <div style={{ fontSize: '9px', color: '#FF4D4F', fontWeight: 700, marginBottom: '6px', letterSpacing: '1px' }}>
                          ⚠️ 阴影觉察
                        </div>
                        {month.shadowWork.map((item, qi) => (
                          <div key={qi} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, marginBottom: '4px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            · {highlightYearlyGold(item)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 其他章节:完整渲染,取消截断(军师v6) */}
      {parsed.chapters.slice(1).filter(ch => ch.content && ch.content.trim().length > 0).map((ch, idx) => (
        <div key={idx} style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '14px',
          padding: '18px',
          marginBottom: '16px',
          border: '1px solid rgba(212,175,55,0.15)'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#D4AF37', marginBottom: '12px', lineHeight: 1.4 }}>
            {ch.title}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.88)', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {highlightYearlyGold(ch.content)}
          </div>
        </div>
      ))}
    </div>
  );
};


// ── Loading Spinner ──
const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: '#080810',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: '3px solid rgba(212,175,55,0.15)',
      borderTop: '3px solid #D4AF37',
      borderRadius: '50%',
      animation: 'ks-spin 0.7s linear infinite',
      marginBottom: 16,
    }} />
    <p style={{ color: '#8B8778', fontSize: 14 }}>{message}</p>
    <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>
    <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scaleX(0.8); } 50% { opacity: 1; transform: translate(-50%, -50%) scaleX(1); } }`}</style>
  </div>
);

// ── Types ──
interface WealthOracleResponse {
  success: boolean;
  birthDate: string;
  lang: string;
  data: {
    bazi: { display: string; subDisplay?: string };
    zodiac: { display: string; subDisplay?: string };
    iching: { display: string; subDisplay?: string };
    tarot: { display: string; subDisplay?: string };
  };
  insight: string;
  referrer: string;
}

interface WealthReportPageProps {
  onNavigate: (path: string) => void;
}

// 🛡️ KindredSouls 战时黄金文案防弹装甲:6国语言至尊跃迁提示
const UPGRADE_HINTS: Record<string, string> = {
  zh: "您的至尊全通通道已开启。由于您已成功解锁基础格局,现可获得直接跃迁【$99.99/年 终极 VIP】的宇宙特权,全盘解锁未来 12 个月『宇宙生日年鉴』与所有高阶算法。",
  en: "Your supreme all-access channel is active. Having unlocked your basic chart, you now hold the cosmic privilege to upgrade directly to [$99.99/Year Ultimate VIP], fully revealing the next 12 months of your 'Solar Return Almanac' and all high-tier algorithms.",
  fr: "Votre canal d'accès suprême est activé. Ayant débloqué votre thème de base, vous disposez du privilège cosmique de passer directement au [VIP Ultime à 99,99 $/an], révélant l'Almanach du Retour Solaire des 12 prochains mois.",
  es: "Su canal supremo de acceso total está activo. Habiendo desbloqueado su carta básica, ahora tiene el privilegio cósmico de actualizar directamente a [VIP Definitivo de $99.99/año], revelando su Almanaque de Retorno Solar.",
  th: "ช่องทางเข้าถึงระดับสูงสุดของคุณเปิดใช้งานแล้ว ข้อมูลพื้นฐานได้รับการปลดล็อกแล้ว ตอนนี้คุณได้รับสิทธิ์ในการอัปเกรดเป็น [$99.99/ปี Ultimate VIP] เพื่อเปิดเผย 'สมุดบันทึกโซลาร์รีเทิร์น' ในอีก 12 เดือนข้างหน้า",
  vi: "Kênh truy cập tối cao của bạn đã được kích hoạt. Sau khi mở khóa lá số cơ bản, bạn có đặc quyền vũ trụ để nâng cấp trực tiếp lên [VIP Tối Thượng $99.99/Năm], tiết lộ 'Niên Giám Solar Return' cho 12 tháng tới.",
};

// ── Component ──
const WealthReportPage: React.FC<WealthReportPageProps> = ({ onNavigate }) => {
  const { i18n, t } = useTranslation();
  const [birthDate, setBirthDate] = useState<string>('');
  const [lang, setLang] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<WealthOracleResponse | null>(null);
  // 🏅 第一斧:useRef 同步锁定免死金牌,在所有 render 之前抢跑
  const isGreenChannelRef = useRef<boolean>(
    typeof window !== 'undefined' && (
      window.location.search.includes('free_access=1') ||
      sessionStorage.getItem('⚡_FREE_PASS') === '1'
    )
  );
  console.log('🔍 [REF INIT] search=' + (typeof window !== 'undefined' ? window.location.search : 'SSR') + ' ref=' + isGreenChannelRef.current);
  // 一旦检测到,立刻往 sessionStorage 打补丁,防止 URL 被 strip 后丢失凭证
  if (isGreenChannelRef.current && typeof window !== 'undefined') {
    sessionStorage.setItem('⚡_FREE_PASS', '1');
  }

  // 🏅 第二斧:isUnlocked 初始值从 ref 读取,拒绝首帧 false
  const [isUnlocked, setIsUnlocked] = useState(() => isGreenChannelRef.current);
  const [showPaywall, setShowPaywall] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [paidPlans, setPaidPlans] = useState<any>(null);
  const wealthReportRef = useRef<string>('');
  const loadingRef = useRef(false); // 🔒 物理锁:防止重复调用
  const [wealthReportText, setWealthReportText] = useState<string>('');
  const [visibleWeeks, setVisibleWeeks] = useState<number>(1); // 当前可见的卡片数

  // 🛠️ 军师的流式硬切黑魔法:实时提取 headline、weeks 和 expense_trap 数据(无需等待 JSON 闭合)
  // 🛠️ 军师黑魔法:手功从原始 JSON 里提取字段值(支持未闭合字符串)
  // 流式 JSON 累积期间,未闭合的 "text" 字段会让正则 \u5b8c\u5168\u5931\u6548
  // 不用正则,手动跳过转义扫描到下一个 "
  const extractJsonString = (rawText: string, key: string, startFrom = 0): string => {
    const keyPos = rawText.indexOf(`"${key}": "`, startFrom);
    if (keyPos === -1) return '';
    const start = keyPos + `"${key}": "`.length;
    let j = start;
    while (j < rawText.length) {
      if (rawText[j] === '\\' && j + 1 < rawText.length) {
        j += 2; // 跳过转义
        continue;
      }
      if (rawText[j] === '"') break;
      j++;
    }
    return rawText.slice(start, j);
  };

  const extractStreamingHeadline = (rawText: string): string => {
    return extractJsonString(rawText, 'headline');
  };

  const extractStreamingWeeks = (rawText: string): string[] => {
    const weeks: string[] = ['', '', '', ''];

    // 找 weeks 数组的起点
    const weeksStart = rawText.match(/"weeks"\s*:\s*\[/);
    if (!weeksStart) return weeks;

    const after = rawText.slice(weeksStart.index! + weeksStart[0].length);
    let weekIdx = 0;
    let i = 0;

    while (weekIdx < 4 && i < after.length) {
      // 找下一个 { 块起点
      const bracePos = after.indexOf('{', i);
      if (bracePos === -1) break;

      // 在这个块里找 "text": "(手动扫描未闭合字符串)
      const textPos = after.indexOf('"text": "', bracePos);
      if (textPos === -1) break;

      const start = textPos + '"text": "'.length;
      let j = start;
      while (j < after.length) {
        if (after[j] === '\\' && j + 1 < after.length) {
          j += 2;
          continue;
        }
        if (after[j] === '"') break;
        j++;
      }
      weeks[weekIdx] = after.slice(start, j);
      weekIdx++;
      i = j;
    }

    return weeks;
  };

  // 🛠️ 提取 expense_trap 数据(手功提取 tag/dateRange/text,未闭合也能拿)
  const extractExpenseTrap = (rawText: string): { tag: string; dateRange: string; text: string } | null => {
    const trapPos = rawText.indexOf('"expense_trap"');
    if (trapPos === -1) return null;

    // 找到 expense_trap 后的第一个 { 起点
    const bracePos = rawText.indexOf('{', trapPos);
    if (bracePos === -1) return null;

    return {
      tag: extractJsonString(rawText, 'tag', bracePos),
      dateRange: extractJsonString(rawText, 'dateRange', bracePos),
      text: extractJsonString(rawText, 'text', bracePos),
    };
  };

  const setWealthReport = (text: string) => {
    wealthReportRef.current = text;
    setWealthReportText(text);
  };
  const [reportLoading, setReportLoading] = useState<string>('');
  const [streamedOnce, setStreamedOnce] = useState<boolean>(false); // 🛡️ 标记是否曾经流过--流结束后保持报告可见

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let birth = params.get('birth');
    const langParam = params.get('lang');

    if (!birth) {
      birth = sessionStorage.getItem('wealth_birth') || '';
      if (!birth) {
        onNavigate('/wealth');
        return;
      }
    }

    sessionStorage.setItem('wealth_birth', birth);
    sessionStorage.setItem('wealth_lang', langParam || i18n.language || 'en');

    setBirthDate(birth);
    setLang(langParam || i18n.language || 'en');

    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment') === 'success';
    const intentCheckout = urlParams.get('intent') === 'checkout';
    const intentPlan = urlParams.get('plan') || '';
    const urlHasFreeAccess = urlParams.get('free_access') === '1';
    const freeAccess = urlHasFreeAccess || isGreenChannelRef.current;
    console.log('🔍 [URL CHECK] urlHasFreeAccess=' + urlHasFreeAccess + ' ref=' + isGreenChannelRef.current + ' final=' + freeAccess);
    if (urlHasFreeAccess) {
      isGreenChannelRef.current = true;
      sessionStorage.setItem('⚡_FREE_PASS', '1');
    }
    console.log('[WealthReport] 🧪 useEffect run: freeAccess=', freeAccess, 'birth=', birth, 'lang=', langParam);

    // 🏅 useEffect 绿色通道:用 ref 判断(同步、常驻、不受竞态影响)
    if (isGreenChannelRef.current) {
            setIsUnlocked(true);
      setShowPaywall(false);
      setAuthChecking(false);
      setLoading(false);  // ← 加上这行
      setCurrentToken('green-channel-test-token');
      loadWealthData(birth, langParam || i18n.language || 'en');
      return;
    }

    if (intentCheckout && intentPlan && !paymentSuccess) {
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', true, intentPlan);
    } else {
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', paymentSuccess);
    }

    setTimeout(() => setAuthChecking(false), 10000);
  }, []);

  // ── Magic Link 同 tab 回调监听:callback.html 完成后发 KS_AUTH_SUCCESS ──
  // 父窗口 reload 后 App.tsx 触发 SIGNED_IN → 有 plan 则走 Stripe,无 plan 则留在当前页
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'KS_AUTH_SUCCESS') {
        console.log('[WealthReport] 📡 KS_AUTH_SUCCESS received, reloading page...');
        localStorage.setItem('ks_auth_callback_pending', '1');
        window.location.reload();
      }
    };
    window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
  }, []);

  const checkAuthAndLoad = async (birth: string, lang: string, forceRecheck = false, pendingPlan?: string) => {
    let token: string | undefined;
    try {
      const hash = window.location.hash;
      const hashTokenMatch = hash.match(/access_token=([^&]+)/);
      if (hashTokenMatch) {
        token = hashTokenMatch[1];
      }

      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } else {
        // 有 token from hash,但不在这里清理 URL
      }

      if (token) {
        setCurrentToken(token);
        // free_access=1 时不 replaceState(避免 strip URL 导致二次 render 时 free_access 丢失)
        if (new URLSearchParams(window.location.search).get('free_access') !== '1') {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('birth', birth);
          newUrl.searchParams.set('lang', lang);
          window.history.replaceState({}, '', newUrl.toString());
        }

        if (pendingPlan) {
          await handlePurchase(pendingPlan as any, token);
        } else {
          await checkPaidStatus();
        }
      } else if (forceRecheck) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 500));
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2?.access_token) {
            token = s2.access_token;
            setCurrentToken(token);
            await checkPaidStatus();
            break;
          }
        }
        if (!token && new URLSearchParams(window.location.search).get('free_access') !== '1') {
          setIsUnlocked(false);
          setShowPaywall(true);
        } else if (new URLSearchParams(window.location.search).get('free_access') === '1') {
          setIsUnlocked(true);
          setShowPaywall(false);
        }
      } else if (new URLSearchParams(window.location.search).get('free_access') === '1') {
        setIsUnlocked(true);
        setShowPaywall(false);
      } else {
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[WealthReport] Auth check failed:', err);
      setIsUnlocked(false);
      setShowPaywall(true);
    }

    setAuthChecking(false);
    await loadWealthData(birth, lang, token ?? undefined);
  };

  // 🏅 第三斧A:checkPaidStatus 物理断路器
  const checkPaidStatus = async () => {
    // 顶层物理断路:ref 是同步的,不受 React 生命周期影响
    if (isGreenChannelRef.current) {
            setIsUnlocked(true);
      setShowPaywall(false);
      setAuthChecking(false);
      setCurrentToken('green-channel-test-token');
      return true;
    }
    // 🧪 强制解锁:free_access=1 时跳过所有检查,直接解锁
    if (new URLSearchParams(window.location.search).get('free_access') === '1') {
      setIsUnlocked(true);
      setShowPaywall(false);
      setAuthChecking(false);
      return;
    }
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const { data: profiles, error: dbError } = await supabase
        .from('user_profiles')
        .select('paid_plans')
        .eq('user_id', user.id)
        .limit(1);

      if (dbError) {
        console.error('[WealthReport] DB query error:', dbError);
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const rawPlans = profiles?.[0]?.paid_plans;
      const now = Date.now();

      const planMap: Record<string, any> = {};
      if (Array.isArray(rawPlans)) {
        for (const p of rawPlans) {
          if (typeof p === 'string') {
            planMap[p] = true;
          } else if (typeof p === 'object' && p !== null) {
            const pk = p.plan;
            if (pk) planMap[pk] = p;
          }
        }
      } else if (typeof rawPlans === 'object' && rawPlans !== null) {
        Object.assign(planMap, rawPlans);
      }

      const isWealthPaid = (() => {
        // 🧪 测试账号白名单
        if (new URLSearchParams(window.location.search).get('free_access') === '1') return true;
        if (planMap.wealth_once === true) return true;
        if (planMap.wealth_yearly_report === true) return true;
        if (planMap.wealth_monthly_report === true) return true;

        const ap = planMap.all_pass_yearly;
        if (ap) {
          const expiresAt = ap.expires_at || ap.all_pass_expires_at;
          if (!expiresAt || new Date(expiresAt).getTime() > now) return true;
        }

        const sv = planMap.star_monthly_vip;
        if (sv) {
          let used: number, allowance: number, resetsAt: string | undefined;
          if (typeof sv === 'object') {
            used = sv.star_monthly_wealth_used ?? 0;
            allowance = sv.star_monthly_wealth_allowance;
            resetsAt = sv.resets_at ?? sv.star_monthly_resets_at;
          } else {
            used = planMap.star_monthly_wealth_used ?? 0;
            allowance = planMap.star_monthly_wealth_allowance;
            resetsAt = planMap.star_monthly_resets_at;
          }
          if (typeof allowance === 'number' && used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) {
            return true;
          }
        }

        return false;
      })();

      setPaidPlans(rawPlans);

      if (isWealthPaid || new URLSearchParams(window.location.search).get('free_access') === '1') {
        setIsUnlocked(true);
        setShowPaywall(false);
      } else if (new URLSearchParams(window.location.search).get('free_access') === '1') {
        setIsUnlocked(true);
        setShowPaywall(false);
      } else {
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[WealthReport] Error checking paid status:', err);
      if (new URLSearchParams(window.location.search).get('free_access') === '1') {
        setIsUnlocked(true);
        setShowPaywall(false);
      } else {
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    }
  };

  // 🏅 第三斧B:loadWealthData 物理断路器
  const loadWealthData = async (birth: string, lang: string, token?: string) => {
    // 🔒 物理锁:如果正在加载,直接返回
    if (loadingRef.current) {
      console.log('[WealthReport] ⚠️ loadWealthData 已在执行,跳过重复调用');
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    // 顶层物理断路:ref 是同步的,React 竞态无法strip
    if (isGreenChannelRef.current) {
      setIsUnlocked(true);
      setShowPaywall(false);
      // 绿色通道:从 Supabase 读预存数据
      let hasCacheData = false;
      try {
        const res = await fetch('https://wfkxqhlcgrikxoofjvas.supabase.co/rest/v1/wealth_insights_cache?birth_date=eq.' + birth + '&lang=eq.' + lang + '&limit=1', {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indma3hxaGxjZ3Jpa3hvb2ZqdmFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY1NTgyMSwiZXhwIjoyMDk1MjMxODIxfQ.IV6CxfemnwbqXWSkwixaN606PV6-NLWb7nJtYvVGeEw'
          }
        });
        const rows = await res.json();
        if (rows.length > 0 && rows[0].insight) {
          const cached = JSON.parse(rows[0].insight);
          // 只设置主报告数据(四宫格),不设置月报(让用户手动点击按钮)
          if (cached.data) {
            setReportData({
              success: true,
              birthDate: birth,
              lang: lang,
              data: cached.data,
              insight: '',
              referrer: ''
            });
            hasCacheData = true;  // ✅ 标记有缓存数据
          }
          // 月报数据缓存到 localStorage,用户点击按钮时读取
          if (cached.weeks && cached.expense_trap) {
            localStorage.setItem('ks_wealth_monthly_cache_' + birth + '_' + lang, JSON.stringify(cached));
          }
        } else {
          console.warn("[WealthReport] ⚠️ Supabase 无数据 → fallback 到 API");
        }
      } catch (err) {
        console.error('[WealthReport] ❌ Supabase 查询失败:', err);
      }

      // ✅ 只有有缓存数据时才直接返回,否则继续走 API
      if (hasCacheData) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      // 无缓存数据,继续执行下面的 API 调用
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/wealth-oracle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          birthDate: birth,
          lang: lang,
          referrer: 'standalone',
        }),
      });

      if (res.status === 402) {
        const isFreeAccess = birth === '1990-06-15' || new URLSearchParams(window.location.search).get('free_access') === '1';
        try {
          const errData = await res.json();
          if (errData?.data) {
            setReportData({
              success: true,
              birthDate: birth,
              lang,
              data: errData.data,
              insight: errData.preview ? errData.preview : '',
              referrer: 'standalone',
            } as any);
          }
        } catch (_) {}
        setError(null);
        // 🧪 绿色通道:402 不重置解锁状态,让月报/年报按钮保持显示
        if (!isFreeAccess) {
          setIsUnlocked(false);
          setShowPaywall(true);
        }
        return;
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        console.error('[WealthReport] API error body:', res.status, errBody);
        throw new Error(`API error: ${res.status}${errBody ? ' - ' + errBody.substring(0, 200) : ''}`);
      }

      const data: WealthOracleResponse = await res.json();

      if (!data.success) {
        throw new Error('API returned failure');
      }

      setReportData(data);
    } catch (err) {
      console.error('[WealthReport] Error loading data:', err);
      setError(
        lang.startsWith('zh')
          ? '网络开小差,请重试'
          : 'Network error, please try again'
      );
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 🛡️ localStorage 单一信号源:OAuth → Stripe 全链路
  // callback.html 只写 ks_auth_success_trigger,父窗口 polling 接管跳转
  // ═══════════════════════════════════════════════════════════════════════
  const handlePurchase = async (plan: 'star_monthly_vip' | 'all_pass_yearly' | 'wealth_once' | 'wealth_monthly_report' | 'wealth_yearly_report', forceToken?: string) => {

    // ── 绿色通道:测试账号不走 OAuth / Stripe,直接跳免费报告页 ──
    if (new URLSearchParams(window.location.search).get('free_access') === '1') {
      const backUrl = window.location.pathname + '?birth=' + encodeURIComponent(birthDate) + '&lang=' + encodeURIComponent(lang) + '&free_access=1';
      window.location.href = backUrl;
      return;
    }

    // 1. 检查登录状态
    const { data: { session } } = await supabase.auth.getSession();
    let token = forceToken || currentToken || session?.access_token || null;
    if (token && !currentToken) setCurrentToken(token);

    if (!token) {
      // ── 阶段A:弹窗 + localStorage 存 pending plan ──
      localStorage.removeItem('ks_auth_success_trigger');
      localStorage.setItem('ks_pending_checkout_plan', plan);
      if (reportData) localStorage.setItem('ks_result', JSON.stringify(reportData));
      const backUrl = window.location.pathname + '?birth=' + encodeURIComponent(birthDate) + '&lang=' + encodeURIComponent(lang);
      localStorage.setItem('ks_oauth_back_url', backUrl);

      const popup = window.open('about:blank', 'KindredSouls Auth', 'width=500,height=600');
      if (!popup) {
        alert(currentLang === 'zh' ? '请允许浏览器弹窗以完成安全登录!' : 'Please allow popups for authentication!');
        return;
      }
      popup.document.write('<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#D4AF37;background:#0D0D1A;font-size:16px;">🔮 正在连接宇宙安全加密通道,请稍候...</div>');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: { hl: lang === 'zh' ? 'zh-CN' : lang, access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error || !data?.url) {
        popup.close();
        console.error('[WealthReport] ❌ OAuth URL 获取失败:', error);
        setError('Login failed. Please try again.');
        return;
      }

      popup.location.href = data.url;

      // ── 阶段B:polling 扫描单一信号源 ks_auth_success_trigger ──
      await new Promise<void>((resolve) => {
        const pollTimer = setInterval(async () => {
          if (popup.closed) {
            clearInterval(pollTimer);
            console.log('[WealthReport] ⚠️ 用户关闭了登录窗口');
            resolve();
            return;
          }

          // 🛡️ 单一信号源:ks_auth_success_trigger 是唯一权威标志
          const triggerRaw = localStorage.getItem('ks_auth_success_trigger');
          if (triggerRaw) {
            try {
              const trigger = JSON.parse(triggerRaw);
              console.log('[WealthReport] 🛡️ OAuth信号检测到, plan:', trigger.plan, 'expected:', plan);
              if (trigger.plan === plan) {
                clearInterval(pollTimer);
                localStorage.removeItem('ks_auth_success_trigger');
                popup.close();
                // setTimeout(0) 让 Supabase SDK 有机会完成 session 持久化
                await new Promise(r => setTimeout(r, 300));
                const { data: { session: s } } = await supabase.auth.getSession();
                console.log('[WealthReport] Session after OAuth:', s?.user?.email, 'token?', !!s?.access_token);
                if (s?.access_token) {
                  token = s.access_token;
                  setCurrentToken(token);
                }
                resolve();
              }
            } catch (_) { /* ignore */ }
          }
        }, 200);

        setTimeout(() => {
          clearInterval(pollTimer);
          if (!popup.closed) popup.close();
          console.warn('[WealthReport] ⏰ polling 超时30秒');
          resolve();
        }, 30000);
      });
    }

    // ── 阶段C:拿 token 调 Stripe ──
    console.log('[WealthReport] StageC: token available?', !!token, 'plan:', plan);
    if (!token) {
      const { data: { session: s } } = await supabase.auth.getSession();
      token = s?.access_token || null;
      if (token) setCurrentToken(token);
    }
    console.log('[WealthReport] Token confirmed?', !!token);

    if (!token) {
      setError('Authentication failed. Please try again.');
      return;
    }

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      console.log('[WealthReport] Stripe response status:', res.status, 'data:', JSON.stringify(data));

      if (res.status === 401) {
        // 🛡️ Token 失效:清掉强制重 OAuth
        console.warn('[WealthReport] ⚠️ Token 失效,强制重 OAuth');
        setCurrentToken(null);
        localStorage.removeItem('ks_pending_checkout_plan');
        localStorage.removeItem('ks_auth_success_trigger');
        setError(currentLang === 'zh' ? '登录已过期,正在重新登录...' : 'Session expired, please re-login');
        // 递归重试(重新走 OAuth)
        setTimeout(() => handlePurchase(plan), 500);
        return;
      }

      if (data.url) {
        console.log('[WealthReport] Redirecting to Stripe:', data.url);
        window.location.href = data.url;
      } else if (data.already_paid) {
        setIsUnlocked(true);
        setShowPaywall(false);
        if (reportData && !reportData.insight) {
          loadWealthData(birthDate, lang, token ?? undefined);
        }
      } else {
        console.error('[WealthReport] Checkout failed:', data);
        setError(data.detail || data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('[WealthReport] Purchase error:', err);
    }
  };

  const handleTriggerInsight = async () => {
    if (!currentToken || !reportData) return;
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;

    try {
      const res = await fetch('/api/wealth-oracle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          birthDate,
          lang,
          referrer: 'standalone',
          includeInsight: true,
        }),
      });

      const data = await res.json();
      if (data.insight) {
        setReportData(prev => prev ? { ...prev, insight: data.insight } : null);
      }
    } catch (err) {
      console.error('[WealthReport] Error triggering insight:', err);
    } finally {
      loadingRef.current = false;
    }
  };

  const generateWealthReport = async (type: 'monthly' | 'yearly') => {
    // 🧪 绿色通道:free_access=1 时优先从 localStorage 读取缓存
    const isFreeTest = new URLSearchParams(window.location.search).get('free_access') === '1';
    if (isFreeTest && type === 'monthly') {
      const cacheKey = 'ks_wealth_monthly_cache_' + birthDate + '_' + lang;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.log('[WealthReport] 📦 从 localStorage 读取月报缓存(但强制走流式输出以验证效果)');
        // ⚠️ 暂时注释掉直接返回,让流式输出也能测试
        // const data = JSON.parse(cached);
        // setWealthReport(JSON.stringify(data));
        // return;
      }
    }

    if (!currentToken && !isFreeTest) {
      setWealthReport(t('wealthReport.loginFirst'));
      return;
    }
    setReportLoading(type === 'monthly' ? 'wealth_monthly' : 'wealth_yearly');
    setWealthReport('');
    setStreamedOnce(false); // 🛡️ 重置:新一轮开始前清空标记

    // 🌊 流式输出开关(开发中,暂用旧接口)
    const USE_STREAM = true; // 🔥 军师下令:全量开火!

    if (USE_STREAM) {
      // 🚀 流式接收
      try {
        const res = await fetch('/api/wealth-oracle/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birthDate, lang, reportType: type }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader!.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                // 🎯 军师钩子:流式结束瞬间弹出复购/裂变引导
                console.log('[WealthReport] 📜 天书刻印完成,触发商业钩子');
                setStreamedOnce(true); // 🛡️ 标记:曾经流过,报告保持可见
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  setWealthReportText((prev) => prev + parsed.text);
                  wealthReportRef.current = (wealthReportRef.current || '') + parsed.text;

                  // 🔮 自动滚动锚定(圣旨效果)
                  setTimeout(() => {
                    const reportContainer = document.getElementById('wealth-report-container');
                    if (reportContainer) {
                      reportContainer.scrollTo({
                        top: reportContainer.scrollHeight,
                        behavior: 'smooth'
                      });
                    }
                  }, 50);
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error('[WealthReport] Stream error:', err);
      } finally {
        // 🔮 军师铁律:骨架框就是最终卡片,永不卸载
        // 只在 JSON 完整时更新 visibleWeeks,保持 reportLoading 状态
        setTimeout(() => {
          try {
            const parsed = JSON.parse(wealthReportRef.current || '{}');
            if (parsed.weeks && parsed.expense_trap) {
              // ✅ JSON 完整:更新可见卡片数(形成节奏感)
              for (let i = 1; i < Math.min(5, parsed.weeks.length + 1); i++) {
                setTimeout(() => setVisibleWeeks(i), i * 300);
              }
            }
            // ⚠️ 绝对不清空 reportLoading!骨架框就是最终卡片!
          } catch {
            // ❌ JSON 解析失败:保持纯文本模式,清空 loading 状态让用户能重新点击
            setReportLoading('');
          }
        }, 1000); // 1秒后验证
      }
      return;
    }

    // 📡 旧接口(非流式)
    try {
      const res = await fetch('/api/wealth-oracle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          birthDate,
          lang,
          referrer: 'standalone',
          reportType: type,
          includeInsight: false,
        }),
      });
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        console.error('[WealthReport] API error:', res.status, errData);
        if (res.status === 402) {
          await handlePurchase(
            type === 'monthly' ? 'wealth_monthly_report' : 'wealth_yearly_report'
          );
          return;
        }
        // 403/429 等其他错误:显示具体原因
        const errCode = (errData as any)?.code || '';
        let userMsg: string;
        if (errCode === 'MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED') {
          userMsg = `${t('wealthReport.alreadyGeneratedMonthly')} ${(errData as any)?.nextAvailable || ''}`;
        } else if (errCode === 'YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED') {
          userMsg = currentLang === 'zh'
            ? `${t('wealthReport.alreadyGeneratedYearly')} ${(errData as any)?.nextAvailable || ''}`
            : `${t('wealthReport.alreadyGeneratedYearlyEn') || 'Yearly report already generated'} ${(errData as any)?.nextAvailable || ''}`;
        } else {
          const errMsg = (errData as any)?.error || (errData as any)?.message || `错误码 ${res.status}`;
          userMsg = `${t('wealthReport.generateFail')}: ${errMsg}`;
        }
        setWealthReport(userMsg);
        return;
      }
      let data;
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        console.error('[WealthReport] API error response:', res.status, data);
        setWealthReport(
          `${t('wealthReport.generateFail')} (${res.status}): ${data?.error || data?.message || 'Unknown error'}`
        );
        return;
      }
      const rawText = data.report || data.insight || '';
      // 🔧 清理 HTML:移除空白段落、隐藏元素、多余换行
      const cleanText = rawText
        .replace(/<p><br\s*\/?><\/p>/gi, '')
        .replace(/<p>\s*<\/p>/gi, '')
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        .replace(/<[^>]*style=["'][^"']*color:\s*transparent[^"']*["'][^>]*>.*?<\/[^>]+>/gi, '')
        .replace(/<[^>]*style=["'][^"']*opacity:\s*0[^"']*["'][^>]*>.*?<\/[^>]+>/gi, '')
        .replace(/<br\s*\/?><br\s*\/?>/gi, '<br/>')
        .replace(/^\s+/, '')
        .replace(/\s+$/, '');
      setWealthReport(cleanText);
    } catch (err) {
      console.error('[WealthReport] generateWealthReport error:', err);
      setWealthReport(currentLang === 'zh' ? '网络错误,请检查网络连接后重试。' : 'Network error, please try again.');
    } finally {
      setReportLoading('');
    }
  };

  const currentLang = (lang || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(212, 175, 55, 0.3)',
          borderTopColor: '#D4AF37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }} />
        <p style={{ color: '#D4AF37', fontSize: '14px' }}>
          {currentLang === 'zh' ? '正在召唤财富密码......' : 'Summoning wealth code...'}
        </p>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <p style={{ color: '#E05C5C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={() => loadWealthData(birthDate, lang, currentToken || undefined)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #D4AF37',
            background: 'transparent',
            color: '#D4AF37',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {currentLang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    );
  }

  const baziField = reportData?.data?.bazi
    ? (() => {
        const b = reportData.data.bazi as any;
        const sz = b.sizhu;
        const dmRaw = sz?.dayMaster || '';  // 可能是 "甲·木" 或 "甲"
        const dp = sz?.dayPillar || '';      // 例如 "甲午"
        // 从 dp 提取日主天干(首字),从 dmRaw 提取五行(第一个 "·" 后的字)
        const dmStem = dp ? dp[0] : (dmRaw.split('·')[0] || '');
        const dmWuxing = dmRaw.includes('·') ? dmRaw.split('·')[1] : (b.dayMasterWuxing || '');
        const display = dp
          ? `${tTiangan(dmStem, currentLang as AlgLang)}${dmWuxing ? ' · ' + tWuxing(dmWuxing, currentLang as AlgLang) : ''} · ${dp}`
          : (dmRaw || '--');
        const wx = b.wuxing;
        const subDisplay = wx
          ? Object.entries(wx).filter(([,v]: any) => (v as number) > 0).map(([k,v]: any) => `${tWuxing(k, currentLang as AlgLang)}${v}`).join(' ')
          : '';
        // oneLiner 多语言切换
        const oneLinerBazi = currentLang === 'zh'
          ? '五行雷达:你的宇宙签名由核心元素深度驱动,这为你的先天财运注入了顶级的执行力与造富韧性。'
          : currentLang === 'es'
          ? 'Radar de Elementos: Tu firma cósmica fluye con elementos clave, impulsando tu base de riqueza.'
          : currentLang === 'fr'
          ? 'Radar Élémentaire : Votre signature cosmique vibre avec les éléments clés, fortifiant vos fondations financières.'
          : currentLang === 'th'
          ? 'เรดาร์ธาตุเจ้าเรือน: รหัสลับจักรวาลของคุณขับเคลื่อนด้วยธาตุหลัก ประจุพลังแห่งความมั่งคั่งและการลงมือทําอย่างทรงพลัง'
          : currentLang === 'vi'
          ? 'Rada Bản Mệnh: Chữ ký vũ trụ của bạn được thúc đẩy bởi các nguyên tố chủ chốt, định hình nền tảng tài lộc.'
          : 'Element Radar: Your cosmic signature is heavily powered by Metal, injecting elite execution and unbreakable resilience into your foundational wealth luck.';

        return { label: '', value: display, subValue: subDisplay, oneLiner: oneLinerBazi };
      })()
    : { label: '', value: '--', subValue: '', oneLiner: '' };

  const zodiacField = reportData?.data?.zodiac
    ? (() => {
        const z = reportData.data.zodiac as any;
        // oneLiner 多语言切换
        const oneLinerZodiac = currentLang === 'zh'
          ? '水星动态:你的思维如风般敏捷,这让你能比 95% 的人更快锁定高回报的金融机会。'
          : currentLang === 'es'
          ? 'Dinámica de Mercurio: Tu mente cambia como el viento, permitiéndote identificar oportunidades financieras de alto rendimiento más rápido que el 95% de la gente.'
          : currentLang === 'fr'
          ? 'Dynamique de Mercure : Votre esprit change comme le vent, vous permettant de repérer des opportunités financières à haut rendement plus rapidement que 95% des gens.'
          : currentLang === 'th'
          ? 'พลวัตดาวพุธ: จิตใจของคุณเปลี่ยนไปมาคล้ายลม ช่วยให้คุณมองเห็นโอกาสทางการเงินที่ให้ผลตอบแทนสูงได้เร็วกว่า 95% ของฝูงชน'
          : currentLang === 'vi'
          ? 'Động lực Sao Thủy: Tâm trí bạn thay đổi như gió, cho phép bạn nhìn thấy các cơ hội tài chính có lợi nhuận cao nhanh hơn 95% đám đông.'
          : 'Mercury Dynamic: Your mind shifts like the wind, allowing you to spot high-yield financial opportunities faster than 95% of the crowd.';

        return { label: '', value: `${tZodiacSign(z.sunSign, currentLang as AlgLang)} · ${tZodiacElement(z.sunSignElement, currentLang as AlgLang)}`, subValue: `${tZodiacMode(z.sunSignMode, currentLang as AlgLang)} · ${tRuler(z.sunSignRuler, currentLang as AlgLang)}`, oneLiner: oneLinerZodiac };
      })()
    : { label: '', value: '--', subValue: '', oneLiner: '' };

  const ichingField = reportData?.data?.iching
    ? (() => {
        const ic = reportData.data.iching as any;
          // oneLiner 多语言切换
          const oneLinerIChing = currentLang === 'zh'
            ? '量子转折:当前卦象警告你资产结构存在隐秘分歧--微微调整赛道,即可解锁指数级增长。'
            : currentLang === 'es'
            ? 'El Pivote Cuántico: El hexagramma actual advierte una divergencia oculta-ajusta tu rumbo para desbloquear un crecimiento exponencial.'
            : currentLang === 'fr'
            ? 'Le Pivot Quantique : L\'hexagramme actuel révèle une divergence cachée-ajustez votre trajectoire pour débloquer une croissance exponentielle.'
            : currentLang === 'th'
            ? 'จุดเปลี่ยนควอนตัม: ผังฉลากเตือนถึงรอยแยกที่ซ่อนอยู่ในการเงิน ปรับทิศทางเล็กน้อยจะพบการเติบโตแบบทวีคูณ'
            : currentLang === 'vi'
            ? 'Bước Ngoặt Lượng Tử: Quẻ dịch cảnh báo một sự chênh lệch ẩn giấu-điều chỉnh lộ trình để bứt phá.'
            : 'The Quantum Pivot: Hexagram #38 warns of a hidden divergence in your current asset structure-divert your trajectory slightly to unlock exponential growth.';

          return {
            label: '',
            value: `${tHexagram(ic.hexName, currentLang as AlgLang)} #${ic.hexNum}`,
            subValue: `${tBagua(ic.hexNature, currentLang as AlgLang)} · ${tChanging(ic.changingLineDesc || ic.changingLine, currentLang as AlgLang)} → ${tHexagram(ic.transformedHexName, currentLang as AlgLang)}`,
            detail: '',
            oneLiner: oneLinerIChing
          };
      })()
    : { label: '', value: '--', subValue: '', detail: '', oneLiner: '' };

  const tarotField = reportData?.data?.tarot
    ? (() => {
        const t = reportData.data.tarot as any;
        const reversed = (t.orientation || '').toLowerCase().includes('reversed');
        const cardId = t.id || 0;

        // Tarot oneLiner 多语言切换(22张牌全覆盖)
        const tarotOneLiners: Record<string, Record<number, { upright: string; reversed: string }>> = {
          zh: {
            0: { upright: '今日催化剂:愚人--今天适合砸开一扇没试过的门,小额试错成本最低。', reversed: '今日催化剂:愚人逆位--市场在给你最后一课,今天别碰任何新资金盘。' },
            1: { upright: '今日催化剂:魔术师--今天你手头工具足够撬动一个项目,直接动手别等。', reversed: '今日催化剂:魔术师逆位--你手里有牌但不会打,今天先列清楚你的可用资源。' },
            2: { upright: '今日催化剂:女祭司--你第六感今天比财报准,信它一次。', reversed: '今日催化剂:女祭司逆位--直觉离线了,今天不做超3万的决定。' },
            3: { upright: '今日催化剂:女皇--今天适合收割你之前种下的项目,果实该摘了。', reversed: '今日催化剂:女皇逆位--你在透支现金流,今天查账户算清还剩多少余粮。' },
            4: { upright: '今日催化剂:皇帝--今天拍板一个决策,把人管住钱理清。', reversed: '今日催化剂:皇帝逆位--你的财务纪律崩了,今天必须重建收支框架。' },
            5: { upright: '今日催化剂:教皇--今天找个比你赚得多的人聊,问题可能出在认知圈。', reversed: '今日催化剂:教皇逆位--别人说的赚钱路子全是坑,今天只听自己的判断。' },
            6: { upright: '今日催化剂:恋人--今天跟钱有关的选择,选让你心跳加速那条。', reversed: '今日催化剂:恋人逆位--两条路都不完美,今天必须选一条,犹豫就是亏。' },
            7: { upright: '今日催化剂:战车--今天全速推进,犹豫一秒都是对财运的不尊重。', reversed: '今日催化剂:战车逆位--今天管住手,任何操作都不如不动。' },
            8: { upright: '今日催化剂:力量--今天要么搞定那笔钱,要么搞定那个不敢谈价的人。', reversed: '今日催化剂:力量逆位--你今天容易犯怂,盯住那个最怕的决定,直接上。' },
            9: { upright: '今日催化剂:隐士--今天关掉消息提醒,花30分钟盘你的财务底牌。', reversed: '今日催化剂:隐士逆位--别一个人硬扛财务问题,今天打给懂行的人。' },
            10: { upright: '今日催化剂:命运之轮--你的财运拐点到了,今天必须做一次主动出击。', reversed: '今日催化剂:命运之轮逆位--今天不适合赌运气,守住本金比赚钱重要。' },
            11: { upright: '今日催化剂:正义--今天做一件正确但难开口的事,跟合伙人谈分成。', reversed: '今日催化剂:正义逆位--你欠的账(金钱或人情)今天不去还,利息会翻倍。' },
            12: { upright: '今日催化剂:倒吊人--停下来的勇气比冲的勇气值钱。', reversed: '今日催化剂:倒吊人逆位--别再为沉没成本加注了,今天割了就割了。' },
            13: { upright: '今日催化剂:死神--清理一个拖你后腿的财务包袱,结束才有新生。', reversed: '今日催化剂:死神逆位--你抱住不放的老项目在吸血,今天必须松手。' },
            14: { upright: '今日催化剂:节制--今天最适合做资产配置的一步调整。', reversed: '今日催化剂:节制逆位--你在消费和投资上都在走极端,今天必须踩刹车。' },
            15: { upright: '今日催化剂:恶魔--直视你最上瘾的那笔消费或投资,那是你财务的病灶。', reversed: '今日催化剂:恶魔逆位--消费贷和赌性投资的锁正在松,今天是断舍离窗口。' },
            16: { upright: '今日催化剂:高塔--打破一个旧的收入结构,制造一次主动破坏。', reversed: '今日催化剂:高塔逆位--如果今天有崩盘信号,别救,让它塌。' },
            17: { upright: '今日催化剂:星星--今天适合定下一个长期目标,钱是信念的副产品。', reversed: '今日催化剂:星星逆位--别因为短期倒霉就放弃长期规划,熬过今天就好。' },
            18: { upright: '今日催化剂:月亮--赚钱机会藏在模糊信息里,今天把它扒出来。', reversed: '今日催化剂:月亮逆位--有人对你隐瞒了财务信息,今天必须追问到底。' },
            19: { upright: '今日催化剂:太阳--今天是亮牌日,把价值show出来,钱自然跟来。', reversed: '今日催化剂:太阳逆位--别因为情绪不好就放弃一个好机会,它依然是机会。' },
            20: { upright: '今日催化剂:审判--复盘一次过去的财务失误,把教训变成行动规则。', reversed: '今日催化剂:审判逆位--你的财务模式在重复错误,今天必须换打法。' },
            21: { upright: '今日催化剂:世界--一个财务周期结束了,今天奖励自己,同时为下轮布局。', reversed: '今日催化剂:世界逆位--差最后一哆嗦,今天用最粗暴的方式收尾。' }
          },
          es: {
            0: { upright: 'Catalizador Diario: El Loco señala una nueva aventura financiera-toma riesgos calculados hoy.', reversed: 'Catalizador Diario: El Loco invertido advierte contra gastos impulsivos-pausa antes de movimientos financieros arriesgados.' },
            1: { upright: 'Catalizador Diario: El Mago señala el poder de manifestación de riqueza-tus herramientas financieras están listas.', reversed: 'Catalizador Diario: El Mago invertido advierte sobre potencial financiero desperdiciado-activa tus habilidades de dinero.' },
            2: { upright: 'Catalizador Diario: La Sacerdotisa señala que la intuición financiera alcanza su punto máximo-confía en tu instinto hoy.', reversed: 'Catalizador Diario: La Sacerdotisa invertida advierte sobre intuición financiera bloqueada-verifica decisiones de dinero.' },
            3: { upright: 'Catalizador Diario: La Emperatriz señala abundancia financiera fluyendo-la riqueza crece con cuidado paciente.', reversed: 'Catalizador Diario: La Emperatriz invertida advierte sobre negligencia financiera-cuida tu jardín de dinero.' },
            4: { upright: 'Catalizador Diario: El Emperador señala base financiera sólida-construye riqueza con reglas claras.', reversed: 'Catalizador Diario: El Emperador invertido advierte sobre problemas de control financiero-audita tu estructura de dinero.' },
            5: { upright: 'Catalizador Diario: El Papa señala alineación de riqueza-tu camino del dinero coincide con tus valores.', reversed: 'Catalizador Diario: El Papa invertido advierte sobre dogmatismo financiero-cuestiona tus creencias sobre el dinero.' },
            6: { upright: 'Catalizador Diario: Los Enamorados señalan punto de decisión financiera-sigue tu corazón del dinero.', reversed: 'Catalizador Diario: Los Enamorados invertidos advierten parálisis de elección financiera-elige un camino ahora.' },
            7: { upright: 'Catalizador Diario: El Carro (Derecho) señala impulso financiero imparable-ejecuta decisiones de riqueza con confianza.', reversed: 'Catalizador Diario: El Carro invertido advierte dirección financiera dispersa-enfoca tu energía de dinero.' },
            8: { upright: 'Catalizador Diario: La Fuerza señala poder financiero interior-fortaleza de riqueza gentil despierta.', reversed: 'Catalizador Diario: La Fuerza invertida advierte debilidad financiera-construye confianza en el dinero ahora.' },
            9: { upright: 'Catalizador Diario: El Ermitaño señala sabiduría financiera interior-la soledad trae perspectivas de dinero.', reversed: 'Catalizador Diario: El Ermitaño invertido advierte aislamiento financiero-busca mentor de riqueza.' },
            10: { upright: 'Catalizador Diario: La Rueda de la Fortuna señala que el ciclo financiero gira-la fortuna favorece movimientos audaces.', reversed: 'Catalizador Diario: La Rueda invertida advierte suerte financiera estancada-fuerza el cambio ahora.' },
            11: { upright: 'Catalizador Diario: La Justicia señala equilibrio del karma financiero-la justicia del dinero llega.', reversed: 'Catalizador Diario: La Justicia invertida advierte desequilibrio financiero-audita el flujo de dinero.' },
            12: { upright: 'Catalizador Diario: El Colgado señala cambio de perspectiva financiera-se necesita nueva visión del dinero.', reversed: 'Catalizador Diario: El Colgado invertido advierte obsesión financiera-suelta la fijación del dinero.' },
            13: { upright: 'Catalizador Diario: La Muerte señala transformación financiera-el viejo tú financiero muere, el nuevo emerge.', reversed: 'Catalizador Diario: La Muerte invertida advierte resistencia a la muerte financiera-los patrones antiguos deben terminar.' },
            14: { upright: 'Catalizador Diario: La Templanza señala equilibrio financiero-el enfoque moderado del dinero gana.', reversed: 'Catalizador Diario: La Templanza invertida advierte extremos financieros-encuentra el camino del dinero moderado.' },
            15: { upright: 'Catalizador Diario: El Diablo señala trabajo con la sombra financiera-enfrenta tus demonios del dinero para ganar.', reversed: 'Catalizador Diario: El Diablo invertido señala libertad financiera comenzando-rompe las cadenas del dinero.' },
            16: { upright: 'Catalizador Diario: La Torre señala avance financiero-cambio repentino de dinero entrante.', reversed: 'Catalizador Diario: La Torre invertida advierte demora del colapso financiero-reconstruye riqueza más inteligente.' },
            17: { upright: 'Catalizador Diario: La Estrella señala que la esperanza financiera regresa-la estrella de riqueza guía tu camino.', reversed: 'Catalizador Diario: La Estrella invertida advierte esperanza financiera perdida-mantén fe en tu camino del dinero.' },
            18: { upright: 'Catalizador Diario: La Luna señala que la intuición financiera alcanza su pico-la magia lunar del dinero funciona.', reversed: 'Catalizador Diario: La Luna invertida advierte ilusión financiera-ve la verdad del dinero claramente.' },
            19: { upright: 'Catalizador Diario: El Sol señala éxito financiero brillante adelante-la luz del dinero te bendice.', reversed: 'Catalizador Diario: El Sol invertido advierte que la luz financiera está bloqueada-la riqueza aún está creciendo.' },
            20: { upright: 'Catalizador Diario: El Juicio señala renacimiento financiero-el llamado de la riqueza es escuchado.', reversed: 'Catalizador Diario: El Juicio invertido advierte despertar financiero demorado-escucha el llamado del dinero.' },
            21: { upright: 'Catalizador Diario: El Mundo señala ciclo financiero completo-el mundo del dinero se transforma.', reversed: 'Catalizador Diario: El Mundo invertido advierte incompleción financiera-termina tus asuntos de dinero.' }
          },
          fr: {
            0: { upright: 'Catalyseur Quotidien: Le Mat signale une nouvelle aventure financière-prends des risques calculés aujourd\'hui.', reversed: 'Catalyseur Quotidien: Le Mat inversé avertit contre les dépenses impulsives-pause avant les mouvements financiers risqués.' },
            1: { upright: 'Catalyseur Quotidien: Le Bateleur signale le pouvoir de manifestation de richesse-tes outils financiers sont prêts.', reversed: 'Catalyseur Quotidien: Le Bateleur inversé avertit du potentiel financier gaspillé-active tes compétences financières.' },
            2: { upright: 'Catalyseur Quotidien: La Papesse signale que l\'intuition financière atteint son sommet-fais confiance à ton instinct.', reversed: 'Catalyseur Quotidien: La Papesse inversée avertit de l\'intuition financière bloquée-vérifie tes décisions.' },
            3: { upright: 'Catalyseur Quotidien: L\'Impératrice signale l\'abondance financière-la richesse croît avec des soins patients.', reversed: 'Catalyseur Quotidien: L\'Impératrice inversée avertit de la négligence financière-prends soin de ton jardin financier.' },
            4: { upright: 'Catalyseur Quotidien: L\'Empereur signale une base financière solide-construis ta richesse avec des règles claires.', reversed: 'Catalyseur Quotidien: L\'Empereur inversé avertit des problèmes de contrôle financier-vérifie ta structure.' },
            5: { upright: 'Catalyseur Quotidien: Le Pape signale l\'alignement de richesse-ton chemin financier correspond à tes valeurs.', reversed: 'Catalyseur Quotidien: Le Pape inversé avertit du dogmatisme financier-remets en question tes croyances.' },
            6: { upright: 'Catalyseur Quotidien: Les Amoureux signalent un point de décision financière-suis ton cœur financier.', reversed: 'Catalyseur Quotidien: Les Amoureux inversés avertissent de la paralysie décisionnelle-choisis un chemin maintenant.' },
            7: { upright: 'Catalyseur Quotidien: Le Char (Droit) signale un élan financier irrésistible-exécute tes décisions avec confiance.', reversed: 'Catalyseur Quotidien: Le Char inversé avertit d\'une direction financière dispersée-concentre ton énergie.' },
            8: { upright: 'Catalyseur Quotidien: La Force signale le pouvoir financier intérieur-une force financière douce s\'éveille.', reversed: 'Catalyseur Quotidien: La Force inversée avertit de la faiblesse financière-construis ta confiance maintenant.' },
            9: { upright: 'Catalyseur Quotidien: L\'Ermite signale la sagesse financière intérieure-la solitude apporte des perspectives.', reversed: 'Catalyseur Quotidien: L\'Ermite inversé avertit de l\'isolement financier-cherche un mentor.' },
            10: { upright: 'Catalyseur Quotidien: La Roue de Fortune signale que le cycle financier tourne-la fortune favorise les actions audacieuses.', reversed: 'Catalyseur Quotidien: La Roue inversée avertit de la malchance financière-force le changement.' },
            11: { upright: 'Catalyseur Quotidien: La Justice signale l\'équilibre du karma financier-la justice monétaire arrive.', reversed: 'Catalyseur Quotidien: La Justice inversée avertit du déséquilibre financier-vérifie tes flux.' },
            12: { upright: 'Catalyseur Quotidien: Le Pendu signale un changement de perspective financière-une nouvelle vision s\'impose.', reversed: 'Catalyseur Quotidien: Le Pendu inversé avertit de l\'obsession financière-lâche prise.' },
            13: { upright: 'Catalyseur Quotidien: La Mort signale la transformation financière-l\'ancien toi meurt, le nouveau naît.', reversed: 'Catalyseur Quotidien: La Mort inversée avertit de la résistance au changement-termine les vieux schémas.' },
            14: { upright: 'Catalyseur Quotidien: La Tempérance signale l\'équilibre financier-la modération paie.', reversed: 'Catalyseur Quotidien: La Tempérance inversée avertit des extrêmes financiers-trouve le juste milieu.' },
            15: { upright: 'Catalyseur Quotidien: Le Diable signale le travail sur l\'ombre financière-affronte tes démons pour gagner.', reversed: 'Catalyseur Quotidien: Le Diable inversé signale la liberté financière-brise tes chaînes.' },
            16: { upright: 'Catalyseur Quotidien: La Maison Dieu signale une percée financière-changement soudain imminent.', reversed: 'Catalyseur Quotidien: La Maison Dieu inversée avertit de l\'effondrement-reconstruis intelligemment.' },
            17: { upright: 'Catalyseur Quotidien: L\'Étoile signale le retour de l\'espoir financier-l\'étoile de richesse guide ton chemin.', reversed: 'Catalyseur Quotidien: L\'Étoile inversée avertit de l\'espoir perdu-maintiens ta foi.' },
            18: { upright: 'Catalyseur Quotidien: La Lune signale que l\'intuition financière culmine-la magie lunaire fonctionne.', reversed: 'Catalyseur Quotidien: La Lune inversée avertit de l\'illusion financière-vois la vérité.' },
            19: { upright: 'Catalyseur Quotidien: Le Soleil signale un succès financier brillant-la lumière financière te bénit.', reversed: 'Catalyseur Quotidien: Le Soleil inversé avertit que la lumière est bloquée-la richesse grandit encore.' },
            20: { upright: 'Catalyseur Quotidien: Le Jugement signale la renaissance financière-l\'appel de la richesse est entendu.', reversed: 'Catalyseur Quotidien: Le Jugement inversé avertit de l\'éveil différé-écoute l\'appel.' },
            21: { upright: 'Catalyseur Quotidien: Le Monde signale la fin d\'un cycle financier-le monde se transforme.', reversed: 'Catalyseur Quotidien: Le Monde inversé avertit de l\'incomplétude-termine tes affaires.' },
          },
          th: {
            0: { upright: 'ตัวเร่งประจําวัน: เดอะฟูล บ่งบอกการผจญภัยทางการเงินใหม่-ลองเสี่ยงแบบมีการคํานวณวันนี้', reversed: 'ตัวเร่งประจําวัน: เดอะฟูล กลับหลังเตือนเรื่องการใช้จ่ายแบบหุนหันพลันแล่น-หยุดก่อนเสี่ยงทางการเงิน' },
            1: { upright: 'ตัวเร่งประจําวัน: เดอะเมจิเชี่ยน บ่งบอกพลังแสดงออกทางการเงิน-เครื่องมือทางการเงินของคุณพร้อมแล้ว', reversed: 'ตัวเร่งประจําวัน: เดอะเมจิเชี่ยน กลับหลังเตือนศักยภาพทางการเงินถูกทิ้ง-เปิดใช้ทักษะหาเงินตอนนี้' },
            2: { upright: 'ตัวเร่งประจําวัน: เดอะไฮพรีสเตส บ่งบอกสัญชาตญาณทางการเงินถึงจุดสูงสุด-ไว้ใจความรู้สึกเรื่องเงินวันนี้', reversed: 'ตัวเร่งประจําวัน: เดอะไฮพรีสเตส กลับหลังเตือนสัญชาตญาณทางการเงินถูกบล็อก-ตรวจสอบการตัดสินใจเรื่องเงิน' },
            3: { upright: 'ตัวเร่งประจําวัน: เดอะเอมเพรส บ่งบอกเงินไหลมาอย่างอุดมสมบูรณ์-ความมั่งคั่งเติบโตด้วยการดูแลอย่างอดทน', reversed: 'ตัวเร่งประจําวัน: เดอะเอมเพรส กลับหลังเตือนการละเลยทางการเงิน-ดูแลสวนเงินของคุณตอนนี้' },
            4: { upright: 'ตัวเร่งประจําวัน: เดอะเอมเพอเรอร์ บ่งบอกฐานะทางการเงินมั่นคง-สร้างความมั่งคั่งด้วยกฎที่ชัดเจน', reversed: 'ตัวเร่งประจําวัน: เดอะเอมเพอเรอร์ กลับหลังเตือนปัญหาการควบคุมทางการเงิน-ตรวจสอบโครงสร้างเงินของคุณ' },
            5: { upright: 'ตัวเร่งประจําวัน: เดอะไฮโรแฟนต์ บ่งบอกทองเส้นทางเงินสอดคล้องค่านิยม-เส้นทางหาเงินที่ถูกจริยธรรมชัดเจน', reversed: 'ตัวเร่งประจําวัน: เดอะไฮโรแฟนต์ กลับหลังเตือนลัทธิทางการเงิน-ตั้งคําถามเกี่ยวกับความเชื่อเรื่องเงิน' },
            6: { upright: 'ตัวเร่งประจําวัน: เดอะเลิฟเวอร์ส บ่งบอกจุดตัดสินใจทางการเงิน-ทําตามหัวใจเรื่องเงินของคุณ', reversed: 'ตัวเร่งประจําวัน: เดอะเลิฟเวอร์ส กลับหลังเตือนอาการอ่อนล้าจากการเลือกทางการเงิน-เลือกเส้นทางหนึ่งตอนนี้' },
            7: { upright: 'ตัวเร่งประจําวัน: เดอะแชริออต (ตั้งตรง) บ่งบอกแรงผลักดันทางการเงินที่หยุดไม่ได้-ดําเนินการตัดสินใจด้านความมั่งคั่งอย่างมั่นใจ', reversed: 'ตัวเร่งประจําวัน: เดอะแชริออต กลับหลังเตือนทิศทางทางการเงินกระจัด-โฟกัสพลังงานเงินของคุณตอนนี้' },
            8: { upright: 'ตัวเร่งประจําวัน: สเตรงธ์ บ่งบอกพลังการเงินภายใน-พลังอ่อนโยนแห่งความมั่งคั่งกําลังตื่น', reversed: 'ตัวเร่งประจําวัน: สเตรงธ์ กลับหลังเตือนความอ่อนแอทางการเงิน-สร้างความมั่นใจเรื่องเงินตอนนี้' },
            9: { upright: 'ตัวเร่งประจําวัน: เดอะเฮอร์มิต บ่งบอกปัญญาทางการเงินจากภายใน-ความสันโดษให้มุมมองใหม่เรื่องเงิน', reversed: 'ตัวเร่งประจําวัน: เดอะเฮอร์มิต กลับหลังเตือนความโดดเดี่ยวทางการเงิน-หาที่ปรึกษาด้านความมั่งคั่ง' },
            10: { upright: 'ตัวเร่งประจําวัน: วีลออฟฟอร์จูน บ่งบอกวงจรทางการเงินกําลังหมุน-โชคสนับสนุนการเคลื่อนไหวทางการเงินที่กล้าหาญ', reversed: 'ตัวเร่งประจําวัน: วีลออฟฟอร์จูน กลับหลังเตือนโชคทางการเงินหยุดชะงัก-บังคับการเปลี่ยนแปลงตอนนี้' },
            11: { upright: 'ตัวเร่งประจําวัน: จัสติซ บ่งบอกการสมดุลกรรมทางการเงิน-ความยุติธรรมของเงินมาถึง', reversed: 'ตัวเร่งประจําวัน: จัสติซ กลับหลังเตือนความไม่สมดุลทางการเงิน-ตรวจสอบกระแสเงินตอนนี้' },
            12: { upright: 'ตัวเร่งประจําวัน: เดอะแฮงค์แมน บ่งบอกการเปลี่ยนมุมมองทางการเงิน-ต้องการวิสัยทัศน์ใหม่เรื่องเงิน', reversed: 'ตัวเร่งประจําวัน: เดอะแฮงค์แมน กลับหลังเตือนความหมกมุ่นทางการเงิน-ปล่อยวางการยึดติดเรื่องเงิน' },
            13: { upright: 'ตัวเร่งประจําวัน: เดธ บ่งบอกการเปลี่ยนแปลงทางการเงิน-ตัวตนทางการเงินเดิมตาย ตัวใหม่เกิด', reversed: 'ตัวเร่งประจําวัน: เดธ กลับหลังเตือนการต่อต้านการเปลี่ยนแปลงทางการเงิน-รูปแบบเงินเก่าต้องยุติ' },
            14: { upright: 'ตัวเร่งประจําวัน: เทมเปอแรนซ์ บ่งบอกความสมดุลทางการเงิน-แนวทางเงินปานกลางชนะ', reversed: 'ตัวเร่งประจําวัน: เทมเปอแรนซ์ กลับหลังเตือนความรุนแรงทางการเงิน-หาเส้นทางเงินตรงกลาง' },
            15: { upright: 'ตัวเร่งประจําวัน: เดอะเดวิล บ่งบอกการทํางานกับเงาทางการเงิน-เผชิญปีศาจเงินเพื่อชนะ', reversed: 'ตัวเร่งประจําวัน: เดอะเดวิล กลับหลังบ่งบอกอิสรภาพทางการเงินเริ่มต้น-ทําลายโซ่ตรวนเงิน' },
            16: { upright: 'ตัวเร่งประจําวัน: เดอะทาวเวอร์ บ่งบอกการทะลุทางการเงิน-การเปลี่ยนแปลงทางการเงินฉับพลันกําลังมา', reversed: 'ตัวเร่งประจําวัน: เดอะทาวเวอร์ กลับหลังเตือนการชะลอการล่มสลายทางการเงิน-สร้างความมั่งคั่งใหม่อย่างฉลาดกว่า' },
            17: { upright: 'ตัวเร่งประจําวัน: เดอะสตาร์ บ่งบอกความหวังทางการเงินกลับมา-ดาวความมั่งคั่งนําทางการเดินทางของคุณ', reversed: 'ตัวเร่งประจําวัน: เดอะสตาร์ กลับหลังเตือนความหวังทางการเงินสูญหาย-รักษาความเชื่อในเส้นทางเงินของคุณ' },
            18: { upright: 'ตัวเร่งประจําวัน: เดอะมูน บ่งบอกสัญชาตญาณทางการเงินถึงจุดสูงสุด-เวทมนตร์จันทรคติใช้ได้ผลกับเงิน', reversed: 'ตัวเร่งประจําวัน: เดอะมูน กลับหลังเตือนภาพลวงทางการเงิน-เห็นความจริงเรื่องเงินชัดเจน' },
            19: { upright: 'ตัวเร่งประจําวัน: เดอะซัน บ่งบอกความสําเร็จทางการเงินสุกสว่างข้างหน้า-แสงอาทิตย์ความมั่งคั่งโปรดคุณ', reversed: 'ตัวเร่งประจําวัน: เดอะซัน กลับหลังเตือนแสงทางการเงินถูกบล็อก-ความมั่งคั่งยังคงเติบโต' },
            20: { upright: 'ตัวเร่งประจําวัน: จัดเมนต์ บ่งบอกการกลับมาของทางการเงิน-เสียงเรียกความมั่งคั่งถูกได้ยิน', reversed: 'ตัวเร่งประจําวัน: จัดเมนต์ กลับหลังเตือนการตื่นทางการเงินล่าช้า-ฟังเสียงเรียกเรื่องเงิน' },
            21: { upright: 'ตัวเร่งประจําวัน: เดอะเวิร์ลด์ บ่งบอกวงจรทางการเงินสมบูรณ์-โลกทางการเงินกําลังเปลี่ยน', reversed: 'ตัวเร่งประจําวัน: เดอะเวิร์ลด์ กลับหลังเตือนการไม่สมบูรณ์ทางการเงิน-ทําธุรกิจเงินให้เสร็จตอนนี้' }
          },
          vi: {
            0: { upright: 'Chất xúc tác hàng ngày: Kẻ Khờ báo hiệu cuộc phiêu lưu tài chính mới-thử những rủi ro có tính toán hôm nay.', reversed: 'Chất xúc tác hàng ngày: Kẻ Khờ ngược cảnh báo chi tiêu bốc đồng-tạm dừng trước quyết định tài chính mạo hiểm.' },
            1: { upright: 'Chất xúc tác hàng ngày: Ảo Thuật Gia báo hiệu năng lượng hiện thực hóa tài lộc-công cụ tài chính của bạn đã sẵn sàng.', reversed: 'Chất xúc tác hàng ngày: Ảo Thuật Gia ngược cảnh báo tiềm năng tài chính bị lãng phí-kích hoạt kỹ năng kiếm tiền ngay.' },
            2: { upright: 'Chất xúc tác hàng ngày: Nữ Tư Tế báo hiệu trực giác tài chính đạt đỉnh-tin vào bản năng tiền bạc hôm nay.', reversed: 'Chất xúc tác hàng ngày: Nữ Tư Tế ngược cảnh báo trực giác tài chính bị chặn-kiểm tra kỹ quyết định tiền bạc.' },
            3: { upright: 'Chất xúc tác hàng ngày: Nữ Hoàng báo hiệu tài lộc dồi dào chảy đến-của cải lớn lên nhờ sự kiên nhẫn.', reversed: 'Chất xúc tác hàng ngày: Nữ Hoàng ngược cảnh báo tài chính bị bỏ bê-chăm sóc khu vườn tiền bạc ngay.' },
            4: { upright: 'Chất xúc tác hàng ngày: Hoàng Đế báo hiệu nền tảng tài chính vững chắc-xây dựng của cải với quy tắc rõ ràng.', reversed: 'Chất xúc tác hàng ngày: Hoàng Đế ngược cảnh báo vấn đề kiểm soát tài chính-kiểm toán cấu trúc tiền bạc.' },
            5: { upright: 'Chất xúc tác hàng ngày: Giáo Hoàng báo hiệu tài lộc thẳng hàng với giá trị-con đường tiền bạc phù hợp đạo đức rõ ràng.', reversed: 'Chất xúc tác hàng ngày: Giáo Hoàng ngược cảnh báo giáo điều tài chính-đặt câu hỏi về niềm tin tiền bạc.' },
            6: { upright: 'Chất xúc tác hàng ngày: Tình Nhân báo hiệu điểm quyết định tài chính-theo trái tim tiền bạc của bạn.', reversed: 'Chất xúc tác hàng ngày: Tình Nhân ngược cảnh báo tê liệt chọn lựa tài chính-chọn một hướng đi ngay.' },
            7: { upright: 'Chất xúc tác hàng ngày: Chiến Xe (thuận) báo hiệu đà tài chính không thể ngăn cản-thực hiện quyết định thịnh vượng với sự tự tin.', reversed: 'Chất xúc tác hàng ngày: Chiến Xe ngược cảnh báo hướng tài chính tan rã-tập trung năng lượng tiền bạc.' },
            8: { upright: 'Chất xúc tác hàng ngày: Sức Mạnh báo hiệu sức mạnh tài chính bên trong-năng lượng giàu có dịu dàng đang thức tỉnh.', reversed: 'Chất xúc tác hàng ngày: Sức Mạnh ngược cảnh báo sự yếu đuối tài chính-xây dựng sự tự tin tiền bạc ngay.' },
            9: { upright: 'Chất xúc tác hàng ngày: Ẩn Sĩ báo hiệu trí tuệ tài chính từ bên trong-sự cô độc mang lại góc nhìn tiền bạc mới.', reversed: 'Chất xúc tác hàng ngày: Ẩn Sĩ ngược cảnh báo sự cô lập tài chính-tìm kiếm cố vấn giàu có.' },
            10: { upright: 'Chất xúc tác hàng ngày: Bánh Xe Số Phận báo hiệu chu kỳ tài lộc đang quay-vận may ủng hộ động thái tài chính táo bạo.', reversed: 'Chất xúc tác hàng ngày: Bánh Xe Số Phận ngược cảnh báo vận may tài chính đình trệ-thay đổi ngay.' },
            11: { upright: 'Chất xúc tác hàng ngày: Công Lý báo hiệu cân bằng nghiệp tài chính-tiền bạc được đền bù công minh.', reversed: 'Chất xúc tác hàng ngày: Công Lý ngược cảnh báo mất cân bằng tài chính-kiểm toán dòng tiền ngay.' },
            12: { upright: 'Chất xúc tác hàng ngày: Người Treo báo hiệu chuyển đổi góc nhìn tài chính-cần tầm nhìn tiền bạc mới.', reversed: 'Chất xúc tác hàng ngày: Người Treo ngược cảnh báo ám ảnh tài chính-buông bỏ sự phụ thuộc tiền bạc.' },
            13: { upright: 'Chất xúc tác hàng ngày: Cái Chết báo hiệu biến đổi tài chính-người tài chính cũ chết, người mới ra đời.', reversed: 'Chất xúc tác hàng ngày: Cái Chết ngược cảnh báo chống lại sự kết thúc tài chính-kết thúc thói quen tiền bạc cũ.' },
            14: { upright: 'Chất xúc tác hàng ngày: Điều Độ báo hiệu cân bằng tài chính-chiến lược tiền bạc vừa phải chiến thắng.', reversed: 'Chất xúc tác hàng ngày: Điều Độ ngược cảnh báo cực đoan tài chính-tìm con đường tiền bạc trung dung.' },
            15: { upright: 'Chất xúc tác hàng ngày: Ác Ma báo hiệu công việc với bóng tối tài chính-đối mặt quỷ tiền bạc để chiến thắng.', reversed: 'Chất xúc tác hàng ngày: Ác Ma ngược báo hiệu tự do tài chính bắt đầu-phá vỡ xiềng xích tiền bạc.' },
            16: { upright: 'Chất xúc tác hàng ngày: Tháp Đổ báo hiệu đột phá tài chính-sự thay đổi tiền bạc đột ngột sắp đến.', reversed: 'Chất xúc tác hàng ngày: Tháp Đổ ngược cảnh báo trì hoãn sụp đổ tài chính-xây dựng lại của cải khôn ngoan hơn.' },
            17: { upright: 'Chất xúc tác hàng ngày: Ngôi Sao báo hiệu hy vọng tài chính quay lại-sao giàu có dẫn đường hành trình của bạn.', reversed: 'Chất xúc tác hàng ngày: Ngôi Sao ngược cảnh báo hy vọng tài chính mất đi-giữ niềm tin trên con đường tiền bạc.' },
            18: { upright: 'Chất xúc tác hàng ngày: Mặt Trăng báo hiệu trực giác tài chính đạt đỉnh-phép thuật trăng tròn hiệu quả với tiền bạc.', reversed: 'Chất xúc tác hàng ngày: Mặt Trăng ngược cảnh báo ảo tưởng tài chính-nhìn rõ sự thật tiền bạc.' },
            19: { upright: 'Chất xúc tác hàng ngày: Mặt Trời báo hiệu thành công tài chính rực rỡ phía trước-ánh dương giàu có ban phước cho bạn.', reversed: 'Chất xúc tác hàng ngày: Mặt Trời ngược cảnh báo ánh dương tài chính bị chặn-của cải vẫn đang lớn lên.' },
            20: { upright: 'Chất xúc tác hàng ngày: Phán Xét báo hiệu tái sinh tài chính-tiếng gọi giàu có được nghe thấy.', reversed: 'Chất xúc tác hàng ngày: Phán Xét ngược cảnh báo sự thức tỉnh tài chính bị trì hoãn-lắng nghe tiếng gọi tiền bạc.' },
            21: { upright: 'Chất xúc tác hàng ngày: Thế Giới báo hiệu chu kỳ tài chính hoàn tất-thế giới tiền bạc đang biến đổi.', reversed: 'Chất xúc tác hàng ngày: Thế Giới ngược cảnh báo chưa hoàn thành tài chính-kết thúc công việc tiền bạc ngay.' }
          }
        };

        // 默认英文(已覆盖全22张牌)
        const enOneLiners: Record<number, { upright: string; reversed: string }> = {
          0: { upright: 'Daily Catalyst: The Fool signals a new financial adventure-take calculated risks today.', reversed: 'Daily Catalyst: The Fool reversed warns against impulse spending-pause before risky financial moves.' },
          1: { upright: 'Daily Catalyst: The Magician signals wealth manifestation power-your financial tools are ready.', reversed: 'Daily Catalyst: The Magician reversed warns of wasted financial potential-activate your money skills now.' },
          2: { upright: 'Daily Catalyst: The High Priestess signals financial intuition peak-trust your money gut today.', reversed: 'Daily Catalyst: The High Priestess reversed warns of blocked financial intuition-double-check money decisions.' },
          3: { upright: 'Daily Catalyst: The Empress signals financial abundance flowing-wealth grows with patient care.', reversed: 'Daily Catalyst: The Empress reversed warns of financial neglect-tend to your money garden now.' },
          4: { upright: 'Daily Catalyst: The Emperor signals solid financial foundation-build wealth with clear rules.', reversed: 'Daily Catalyst: The Emperor reversed warns of financial control issues-audit your money structure.' },
          5: { upright: 'Daily Catalyst: The Hierophant signals wealth alignment-your money path matches your values.', reversed: 'Daily Catalyst: The Hierophant reversed warns of financial dogma-question your money beliefs.' },
          6: { upright: 'Daily Catalyst: The Lovers signals financial choice point-follow your money heart.', reversed: 'Daily Catalyst: The Lovers reversed warns of financial choice paralysis-pick one path now.' },
          7: { upright: 'Daily Catalyst: The Chariot (Upright) signals unstoppable financial momentum-execute wealth decisions with confidence.', reversed: 'Daily Catalyst: The Chariot reversed warns of scattered financial direction-focus your money energy.' },
          8: { upright: 'Daily Catalyst: Strength signals inner financial power-gentle wealth strength awakens.', reversed: 'Daily Catalyst: Strength reversed warns of financial weakness-build money confidence now.' },
          9: { upright: 'Daily Catalyst: The Hermit signals financial wisdom within-solitude brings money insights.', reversed: 'Daily Catalyst: The Hermit reversed warns of financial isolation-seek wealth mentor.' },
          10: { upright: 'Daily Catalyst: Wheel of Fortune signals financial cycle turning-fortune favors bold money moves.', reversed: 'Daily Catalyst: Wheel of Fortune reversed warns of stagnant financial luck-force change now.' },
          11: { upright: 'Daily Catalyst: Justice signals financial karma balancing-money justice arrives.', reversed: 'Daily Catalyst: Justice reversed warns of financial imbalance-audit money flow now.' },
          12: { upright: 'Daily Catalyst: The Hanged Man signals financial perspective shift-new money vision needed.', reversed: 'Daily Catalyst: The Hanged Man reversed warns of financial obsession-let go of money fixation.' },
          13: { upright: 'Daily Catalyst: Death signals financial transformation-old financial you dies, new emerges.', reversed: 'Daily Catalyst: Death reversed warns of resisting financial death-old money patterns must end.' },
          14: { upright: 'Daily Catalyst: Temperance signals financial balance-moderate money approach wins.', reversed: 'Daily Catalyst: Temperance reversed warns of financial extremes-find middle money path.' },
          15: { upright: 'Daily Catalyst: The Devil warns of financial shadow work-face money demons to win.', reversed: 'Daily Catalyst: The Devil reversed signals financial freedom begins-break money chains now.' },
          16: { upright: 'Daily Catalyst: The Tower signals financial breakthrough-sudden money shift incoming.', reversed: 'Daily Catalyst: The Tower reversed warns of delaying financial collapse-rebuild wealth smarter.' },
          17: { upright: 'Daily Catalyst: The Star signals financial hope returns-wealth star guides your journey.', reversed: 'Daily Catalyst: The Star reversed warns of lost financial hope-keep faith in money path.' },
          18: { upright: 'Daily Catalyst: The Moon signals financial intuition peaks-lunar money magic works.', reversed: 'Daily Catalyst: The Moon reversed warns of financial illusion-see money truth clearly.' },
          19: { upright: 'Daily Catalyst: The Sun signals financial success bright ahead-wealth sunshine blesses you.', reversed: 'Daily Catalyst: The Sun reversed warns of blocked financial sunshine-wealth still growing.' },
          20: { upright: 'Daily Catalyst: Judgement signals financial rebirth-wealth calling heard.', reversed: 'Daily Catalyst: Judgement reversed warns of delayed financial awakening-listen to money calling.' },
          21: { upright: 'Daily Catalyst: The World signals financial cycle complete-wealth world transforms.', reversed: 'Daily Catalyst: The World reversed warns of financial incompletion-finish money business now.' }
        };

        const langData = tarotOneLiners[currentLang];
        const cardData = (langData || {})[cardId] || enOneLiners[cardId];
        const oneLiner = cardData ? (reversed ? cardData.reversed : cardData.upright) : (t.oneLiner || '');

        return {
          label: '',
          value: `${t.emoji || '🃏'} ${tTarotName(cardId, currentLang as AlgLang)}`,
          subValue: `${tOrientation(t.orientation || 'upright', currentLang as AlgLang)} · ${tTarotMeaning(cardId, currentLang as AlgLang)}`,
          oneLiner: oneLiner
        };
      })()
    : { label: '', value: '--', subValue: '', oneLiner: '' };

  return (
    <>
      {authChecking && <LoadingOverlay message={currentLang === 'zh' ? '正在验证...' : 'Verifying...'} />}

      <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
      padding: '56px 16px 60px',
      position: 'relative',
    }}>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(1.5px 1.5px at 20% 30%, rgba(212,175,55,0.3) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 80% 70%, rgba(129,216,208,0.3) 50%, transparent 50%),
          #080810
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => onNavigate('/wealth')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#8B8778',
              fontSize: '12px',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            ← {currentLang === 'zh' ? '返回' : 'Back'}
          </button>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#D4AF37',
            marginBottom: '4px',
          }}>
            {t('wealthReport.reportTitle')}
          </h1>
          <p style={{ fontSize: '12px', color: '#8B8778' }}>
            {t('input.yourBirthday')}: {birthDate}
          </p>
        </div>

        <WealthDataGrid
          bazi={baziField}
          zodiac={zodiacField}
          iching={ichingField}
          tarot={tarotField}
          lang={currentLang}
        />

        {!authChecking && !isUnlocked && showPaywall && (
          <WealthPaywall
            lang={currentLang}
            onPurchase={handlePurchase}
          />
        )}

        {isUnlocked && reportData?.insight && (
          <WealthInsightCard
            insight={reportData.insight}
          />
        )}

        {isUnlocked && reportData && (
          <div style={{ marginTop: '4px', padding: '10px', background: 'rgba(212,175,55,0.06)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
              📊 {t('wealthReport.almanac')}
            </div>
            <div style={{ fontSize: '11px', color: '#81D8D0', marginBottom: '8px' }}>
              {t('wealthReport.almanacDesc')}
            </div>
            {(paidPlans?.all_pass_yearly === true || new URLSearchParams(window.location.search).get('free_access') === '1') ? (
              <>
                <button onClick={() => generateWealthReport('monthly')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '4px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading === 'wealth_monthly' ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading === 'wealth_monthly' ? '⏳...' : t('wealthReport.monthlyReport')}
                </button>
                <button onClick={() => generateWealthReport('yearly')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '4px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading === 'wealth_yearly' ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading === 'wealth_yearly' ? '⏳...' : t('wealthReport.yearlyReport')}
                </button>
                <div style={{ fontSize: '10px', color: '#81D8D0', marginTop: '4px' }}>✨ {t('wealthReport.vipFree')}</div>
              </>
            ) : (
              <>
                <button onClick={() => handlePurchase('wealth_monthly_report')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '4px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  📅 {t('wealthReport.unlockMonthly')}
                </button>
                <button onClick={() => handlePurchase('wealth_yearly_report')} disabled={!!reportLoading} style={{ marginBottom: '4px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)', background: reportLoading ? '#444' : 'rgba(129,216,208,0.1)', color: '#81D8D0', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  📆 {t('wealthReport.unlockYearly')}
                </button>
                <div style={{ fontSize: '10px', color: 'rgba(129,216,208,0.6)', marginTop: '4px' }}>
                  💡 {UPGRADE_HINTS[currentLang] || UPGRADE_HINTS['en']}
                </div>
              </>
            )}
          </div>
        )}

        {/* 🔮 骨架框架流:4个卡片实时提取流式数据 */}
        {(() => {
          // 🛠️ 军师v2:同时支持月报和年报的流式骨架
          const isMonthlyComplete = (() => {
            if (!wealthReportText || !wealthReportText.trim().startsWith('{')) return false;
            try {
              const parsed = JSON.parse(wealthReportText);
              return !!(parsed.expense_trap && parsed.weeks && parsed.weeks.length === 4);
            } catch { return false; }
          })();
          const isYearlyComplete = wealthReportText && wealthReportText.trim().length > 100 && !wealthReportText.trim().startsWith('{');

          return reportLoading === 'wealth_monthly' || reportLoading === 'wealth_yearly' || streamedOnce
            || (wealthReportText && wealthReportText.trim().startsWith('{') && !isMonthlyComplete)
            || (reportLoading === 'wealth_yearly' && wealthReportText && !isYearlyComplete);
        })() && (
          <div id="wealth-report-container" style={{ position: 'relative' }}>
            {/* 🛠️ 军师v4:流式期间显示已流到的内容 + 加载指示器;流式结束后渲染卡片 */}
            {(() => {
              const isLoading = reportLoading === 'wealth_monthly' || reportLoading === 'wealth_yearly';
              return isLoading;  // 只有还在流式时才显示纯文本骨架
            })() ? (
              <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', minHeight: '200px' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {wealthReportText}
                  <span style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1.2em',
                    background: 'linear-gradient(180deg, #D4AF37 0%, #FFD700 100%)',
                    marginLeft: '2px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(212,175,55,0.6)',
                    verticalAlign: 'middle',
                  }}/>
                </div>
              </div>
            ) : (
              wealthReportText && wealthReportText.trim().startsWith('{')
                ? <MonthlyReportCard lang={currentLang} content={wealthReportText} />
                : wealthReportText && wealthReportText.trim().length > 100
                ? <YearlyReportCard content={wealthReportText} birthDate={birthDate} />
                : null
            )}
          </div>
        )}

        {isUnlocked && !reportData?.insight && (
          <button
            onClick={handleTriggerInsight}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            ✨ {t('wealthReport.generateAI')}
          </button>
        )}

        {error && (
          <p style={{ color: '#E05C5C', fontSize: '12px', marginTop: '12px' }}>{error}</p>
        )}
      </div>
    </div>
    </>
  );
};

export default WealthReportPage;
