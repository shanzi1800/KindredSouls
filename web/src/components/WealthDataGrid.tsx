import React, { useEffect, useRef, useState } from 'react';
import ZodiacIcon from './ZodiacIcon';
import IChingIcon from './IChingIcon';
import TarotIcon from './TarotIcon';

// ── Types ──
interface DataField {
  label: string;
  value: string;
  subValue?: string;
  detail?: string; // 展开后显示的详细信息（如卦辞）
  oneLiner?: string; // 灵魂释义（军师一句话天机）
  cardId?: number; // 塔罗牌ID (0-21)
}

interface WealthDataGridProps {
  bazi: DataField;
  zodiac: DataField;
  iching: DataField;
  tarot: DataField;
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
}

// ── Animation hook ──
const useStaggeredFadeIn = (count: number, delay = 80) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  }, [count, delay]);
  return refs;
};

// ── Card Config ──
const CARD_CONFIG = [
  {
    key: 'bazi',
    icon: '☯',
    label: { zh: '八字命盘', en: 'BaZi Profile', es: 'Perfil BaZi', fr: 'Profil BaZi', th: 'ไพ่ซี', vi: 'Tử Vi' },
    color: '#D4AF37',
  },
  {
    key: 'zodiac',
    icon: '✦',
    label: { zh: '星座分析', en: 'Zodiac Analysis', es: 'Análisis Zodiacal', fr: 'Analyse Zodiacale', th: 'ราศี', vi: 'Cung Hoàng Đạo' },
    color: '#81D8D0',
  },
  {
    key: 'iching',
    icon: '☰',
    label: { zh: '易经卦象', en: 'I Ching Hexagram', es: 'Hexagrama I Ching', fr: 'Hexagramme I Ching', th: 'กัวอี้', vi: 'Kinh Dịch' },
    color: '#B088F9',
  },
  {
    key: 'tarot',
    icon: '🃏',
    label: { zh: '今日塔罗', en: "Today's Tarot", es: 'Tarot de Hoy', fr: 'Tarot du Jour', th: 'ไพ่ทาโรต์', vi: 'Tarot Hôm Nay' },
    color: '#FF6B6B',
  },
] as const;

// ── Component ──
const WealthDataGrid: React.FC<WealthDataGridProps> = ({ bazi, zodiac, iching, tarot, lang }) => {
  const refs = useStaggeredFadeIn(4);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fields: Record<string, DataField> = { bazi, zodiac, iching, tarot };

  const toggleExpand = (key: string) => {
    setExpandedCard(prev => prev === key ? null : key);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0' }}>
      {CARD_CONFIG.map((card, i) => {
        const field = fields[card.key];
        const ref = (el: HTMLDivElement | null) => { refs.current[i] = el; };
        const isExpanded = expandedCard === card.key;
        const hasDetail = field.detail && field.detail.trim().length > 0;

        return (
          <div
            key={card.key}
            ref={ref}
            onClick={() => hasDetail ? toggleExpand(card.key) : null}
            style={{
              background: 'linear-gradient(135deg, #0e0e1a 0%, #12121f 100%)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '12px',
              padding: isExpanded ? '16px 16px 20px 16px' : '16px',
              cursor: hasDetail ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              minHeight: isExpanded ? '140px' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
              if (!isExpanded) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Gold shimmer effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.08), transparent)',
                transition: 'left 0.5s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.left = '100%'; }}
            />

            {/* 动态图标: 星座/易经/塔罗根据数据变化, 八字固定 */}
            <div style={{ marginBottom: '8px' }}>
              {card.key === 'zodiac' && field.value ? (
                <ZodiacIcon sign={field.value} size={32} color="#D4AF37" />
              ) : card.key === 'iching' && field.value ? (
                <IChingIcon hexName={field.value} size={32} color="#D4AF37" />
              ) : card.key === 'tarot' && field.cardId !== undefined ? (
                <TarotIcon 
                  cardId={field.cardId} 
                  reversed={field.subValue ? /逆|reversed|invertido|renversé|ผ่านกลับ|ngược/.test(field.subValue) : false}
                  size={32} 
                  color="#D4AF37" 
                />
              ) : (
                <span style={{ fontSize: '28px', fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>{card.icon}</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#8B8778', marginBottom: '6px', textTransform: 'uppercase' as const }}>
              {card.label[lang] || card.label.en}
            </div>
            <div style={{ fontSize: '14px', color: '#E8E4D9', fontWeight: 700, lineHeight: 1.4 }}>
              {field.value}
            </div>
            {field.subValue && (
              <div style={{ fontSize: '11px', color: '#8B8778', marginTop: '4px', lineHeight: 1.4 }}>
                {field.subValue}
              </div>
            )}
            {/* 灵魂释义（军师一句话天机） */}
            {field.oneLiner && (
              <div style={{ 
                marginTop: '12px', 
                padding: '10px 12px', 
                background: 'rgba(212, 175, 55, 0.08)',
                borderRadius: '8px',
                borderLeft: '3px solid #D4AF37',
                fontSize: '12px', 
                color: '#D4AF37', 
                lineHeight: 1.6, 
                fontStyle: 'italic',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {field.oneLiner}
              </div>
            )}

            {/* 展开区域：显示详细信息 */}
            {hasDetail && (
              <div
                style={{
                  maxHeight: isExpanded ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.4s ease-out, opacity 0.3s ease-out',
                  opacity: isExpanded ? 1 : 0,
                  marginTop: isExpanded ? '12px' : '0',
                  paddingTop: isExpanded ? '12px' : '0',
                  borderTop: isExpanded ? '1px solid rgba(212, 175, 55, 0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '12px', color: '#B8B49A', lineHeight: 1.6, textAlign: 'left' as const }}>
                  {field.detail}
                </div>
              </div>
            )}

            {/* 展开/收起提示 */}
            {hasDetail && (
              <div
                style={{
                  fontSize: '10px',
                  color: '#8B8778',
                  marginTop: '8px',
                  textAlign: 'center' as const,
                  opacity: 0.7,
                }}
              >
                {isExpanded ? (lang === 'zh' ? '点击收起 ▲' : 'Click to collapse ▲') : (lang === 'zh' ? '点击展开 ▼' : 'Click to expand ▼')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WealthDataGrid;
