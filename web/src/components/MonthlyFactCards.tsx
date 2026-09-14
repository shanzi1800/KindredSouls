// ═══ 军师 B路线 / 9-14 ═══
// MonthlyFactCards —— 算法真值层渲染组件
// 数据来源：后端 /api/wealth-oracle(/stream) 推送的 factTree SSE 事件（SwissEph 真值 JSON）
// 原则：LLM 不参与此处任何事实组装，本组件 100% 由算法真值驱动，杜绝幻觉穿透
import React from 'react';

interface MoonTransit { sign: string; houses: number[]; }
interface WeekTransit {
  week: number;
  fromDay: number;
  toDay: number;
  transits: MoonTransit[];
  ingresses: { day: number; time: string; sign: string }[];
}
interface TransitPlanet { key: string; sign: string; house: number; retrograde?: boolean; }
interface SpendingTrap { symbol: string; threshold: number; unit: string; }
export interface MonthlyFactTree {
  reportMeta: { month: string; natalSun: string; rising: string; natalMoon: string | null };
  weeklyMoonTransits: WeekTransit[];
  transitPlanets: TransitPlanet[];
  spendingTrap: SpendingTrap;
}

const PLANET_LABEL: Record<string, Record<string, string>> = {
  sun: { zh:'太阳', en:'Sun', es:'Sol', fr:'Soleil', th:'ดวงอาทิตย์', vi:'Mặt Trời' },
  mercury: { zh:'水星', en:'Mercury', es:'Mercurio', fr:'Mercure', th:'ดวงพุธ', vi:'Sao Thủy' },
  venus: { zh:'金星', en:'Venus', es:'Venus', fr:'Vénus', th:'ดวงศุกร์', vi:'Sao Kim' },
  mars: { zh:'火星', en:'Mars', es:'Marte', fr:'Mars', th:'ดวงอังคาร', vi:'Sao Hỏa' },
  jupiter: { zh:'木星', en:'Jupiter', es:'Júpiter', fr:'Jupiter', th:'ดวงพฤหัส', vi:'Sao Mộc' },
  saturn: { zh:'土星', en:'Saturn', es:'Saturno', fr:'Saturne', th:'ดวงเสาร์', vi:'Sao Thổ' },
};

const TRAP_LABEL: Record<string, { title: string; desc: string }> = {
  zh: { title: '本月熔断阈值', desc: '单笔消费超过此金额须强制冷静 24 小时' },
  en: { title: 'Circuit-Breaker Threshold', desc: 'Spend above this in one go →强制 24h cool-down' },
  es: { title: 'Umbral de Disyuntor', desc: 'Gasto superior → enfriamiento 24h' },
  fr: { title: 'Seuil de Disjoncteur', desc: 'Dépense supérieure → refroidissement 24h' },
  th: { title: 'เกณฑ์ตัดวงจร', desc: 'ใช้จ่ายเกิน → พัก 24 ชม.' },
  vi: { title: 'Ngưỡng Ngắt Mạch', desc: 'Chi vượt mức → bắt buộc nghỉ 24h' },
};

const GOLD = '#D4AF37';
const GOLD_SOFT = 'rgba(212,175,55,0.16)';
const BG = '#0D0D1A';

const MonthlyFactCards: React.FC<{ factTree: MonthlyFactTree | null; lang: string }> = ({ factTree, lang }) => {
  if (!factTree) return null;
  const L = (lang || 'zh') as string;
  const planetLabel = (k: string) => PLANET_LABEL[k]?.[L] || PLANET_LABEL[k]?.en || k;
  const fmtHouse = (h: number) => (L === 'zh' ? `第${h}宫` : `H${h}`);
  const fmtThreshold = (t: SpendingTrap) => `${t.symbol}${t.threshold.toLocaleString()}${t.unit}`;
  const trap = TRAP_LABEL[L] || TRAP_LABEL.zh;
  const meta = factTree.reportMeta || {};

  return (
    <div style={{
      background: `linear-gradient(180deg, ${BG}, #11111f)`,
      border: `1px solid ${GOLD_SOFT}`,
      borderRadius: '14px',
      padding: '16px 16px 18px',
      margin: '0 0 16px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.45)',
    }}>
      {/* 标题栏：算法真值层标识 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
          color: '#0D0D1A', background: GOLD, padding: '3px 8px', borderRadius: '5px',
        }}>🔒 {L === 'zh' ? '算法真值层' : 'TRUTH LAYER'}</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          {L === 'zh' ? 'SwissEph 天文算法 · 非 AI 生成' : 'SwissEph computed · not AI-generated'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: GOLD, fontWeight: 600 }}>
          {meta.month || ''}
        </span>
      </div>

      {/* 本命锚点 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        {[['☀️', meta.natalSun], ['⬆️', meta.rising], ['🌙', meta.natalMoon]].map(([icon, val], i) => (
          val ? (
            <span key={i} style={{
              fontSize: '11px', color: '#fff', background: GOLD_SOFT,
              border: `1px solid ${GOLD_SOFT}`, borderRadius: '20px', padding: '3px 10px',
            }}>{icon} {val}</span>
          ) : null
        ))}
      </div>

      {/* 周月亮过境时间线（权威轨迹） */}
      <SectionTitle zh="月亮每周过境轨迹" en="Weekly Moon Transit" lang={L} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {(factTree.weeklyMoonTransits || []).map((w) => (
          <div key={w.week} style={{
            borderLeft: `3px solid ${GOLD}`, paddingLeft: '12px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: GOLD, marginBottom: '6px' }}>
              {L === 'zh' ? `第${w.week}周` : `Week ${w.week}`}
              <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginLeft: '8px' }}>
                {w.fromDay}–{w.toDay}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {w.transits.map((t, i) => (
                <span key={i} style={{
                  fontSize: '11px', color: '#fff', background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px', padding: '3px 8px', border: `1px solid rgba(255,255,255,0.08)`,
                }}>
                  {t.sign}
                  <span style={{ color: GOLD, marginLeft: '4px' }}>
                    ({t.houses.map((h) => fmtHouse(h)).join('→')})
                  </span>
                </span>
              ))}
            </div>
            {w.ingresses && w.ingresses.length > 0 && (
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>
                {w.ingresses.map((ig, i) => `${ig.day}日 ${ig.sign}`).join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 流年行星宫位网格 */}
      <SectionTitle zh="流年行星落位" en="Transit Planets" lang={L} />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '8px', marginBottom: '16px',
      }}>
        {(factTree.transitPlanets || []).map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 10px',
            border: `1px solid rgba(255,255,255,0.08)`,
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>
              {planetLabel(p.key)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
              {p.sign} <span style={{ color: GOLD }}>{fmtHouse(p.house)}</span>
            </div>
            {p.retrograde && (
              <div style={{ fontSize: '9px', color: '#ff8a80', marginTop: '2px', fontWeight: 600 }}>
                {L === 'zh' ? '逆行' : '℞ Rx'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 消费陷阱阈值徽章 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.02))',
        border: `1px solid ${GOLD_SOFT}`, borderRadius: '10px', padding: '10px 14px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: GOLD, fontWeight: 700, letterSpacing: '0.5px' }}>{trap.title}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{trap.desc}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: 800, color: '#fff', textShadow: `0 2px 8px ${GOLD_SOFT}` }}>
          {fmtThreshold(factTree.spendingTrap)}
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ zh: string; en: string; lang: string }> = ({ zh, en, lang }) => (
  <div style={{
    fontSize: '11px', fontWeight: 700, color: GOLD, letterSpacing: '1px',
    marginBottom: '8px', textTransform: 'uppercase',
  }}>
    {lang === 'zh' ? zh : en}
  </div>
);

export default MonthlyFactCards;
