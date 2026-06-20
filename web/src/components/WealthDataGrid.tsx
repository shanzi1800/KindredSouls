import React, { useEffect, useRef } from 'react';

// ── Types ──
interface DataField {
  label: string;
  value: string;
  subValue?: string;
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

  const fields: Record<string, DataField> = { bazi, zodiac, iching, tarot };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0' }}>
      {CARD_CONFIG.map((card, i) => {
        const field = fields[card.key];
        const ref = (el: HTMLDivElement | null) => { refs.current[i] = el; };
        return (
          <div
            key={card.key}
            ref={ref}
            style={{
              background: 'linear-gradient(135deg, #0e0e1a 0%, #12121f 100%)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.2)';
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

            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
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
          </div>
        );
      })}
    </div>
  );
};

export default WealthDataGrid;
