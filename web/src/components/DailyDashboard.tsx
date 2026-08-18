import React from 'react';

// ── Deterministic seed from today's date ──
function dailySeed(): number {
  const d = new Date();
  // Asia/Shanghai date
  const local = new Date(d.getTime() + 8 * 3600000);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth() + 1;
  const day = local.getUTCDate();
  return y * 10000 + m * 100 + day;
}

function simpleHash(seed: number, max: number): number {
  const s = (seed * 9301 + 49297) % 233280;
  return (s / 233280) * max;
}

// ── Flower Data ──
interface Flower {
  emoji: string;
  names: Record<string, string>;
  meanings: Record<string, string>;
}

const FLOWERS: Flower[] = [
  {
    emoji: '🌹',
    names: { zh: '红玫瑰', en: 'Red Rose', es: 'Rosa Roja', fr: 'Rose Rouge', th: 'กุหลาบแดง', vi: 'Hoa Hồng Đỏ' },
    meanings: { zh: '炽热的激情与深沉的眷恋', en: 'Passion & Deep Devotion', es: 'Pasión y Devoción Profunda', fr: 'Passion et Dévotion Profonde', th: 'ความหลงใหลและความผูกพันลึกซึ้ง', vi: 'Đam mê và Tình cảm sâu sắc' },
  },
  {
    emoji: '🌺',
    names: { zh: '芙蓉花', en: 'Hibiscus', es: 'Hibisco', fr: 'Hibiscus', th: 'ชบา', vi: 'Hoa Dâm Bụt' },
    meanings: { zh: '优雅敏感的灵魂之美', en: 'Delicate Beauty & Sensitivity', es: 'Belleza Delicada y Sensibilidad', fr: 'Beauté Délicate et Sensibilité', th: 'ความงามที่อ่อนโยนและละเอียดอ่อน', vi: 'Vẻ đẹp tinh tế và nhạy cảm' },
  },
  {
    emoji: '🪷',
    names: { zh: '莲花', en: 'Lotus', es: 'Loto', fr: 'Lotus', th: 'ดอกบัว', vi: 'Hoa Sen' },
    meanings: { zh: '出淤泥不染的觉醒之力', en: 'Purity & Spiritual Awakening', es: 'Pureza y Despertar Espiritual', fr: 'Pureté et Éveil Spirituel', th: 'ความบริสุทธิ์และการตื่นรู้ทางจิตวิญญาณ', vi: 'Sự thuần khiết và thức tỉnh tâm linh' },
  },
  {
    emoji: '🌻',
    names: { zh: '向日葵', en: 'Sunflower', es: 'Girasol', fr: 'Tournesol', th: 'ดอกทานตะวัน', vi: 'Hoa Hướng Dương' },
    meanings: { zh: '追逐光明的忠诚与积极', en: 'Loyalty & Radiant Optimism', es: 'Lealtad y Optimismo Radiante', fr: 'Loyauté et Optimisme Rayonnant', th: 'ความภักดีและการมองโลกในแง่ดี', vi: 'Trung thành và lạc quan rực rỡ' },
  },
  {
    emoji: '🌸',
    names: { zh: '樱花', en: 'Cherry Blossom', es: 'Flor de Cerezo', fr: 'Fleur de Cerisier', th: 'ดอกซากุระ', vi: 'Hoa Anh Đào' },
    meanings: { zh: '转瞬即逝的极致之美', en: 'Ephemeral Beauty & Grace', es: 'Belleza Efímera y Gracia', fr: 'Beauté Éphémère et Grâce', th: 'ความงามที่ชั่วคราวและสง่างาม', vi: 'Vẻ đẹp thoáng qua và duyên dáng' },
  },
  {
    emoji: '🌿',
    names: { zh: '薰衣草', en: 'Lavender', es: 'Lavanda', fr: 'Lavande', th: 'ลาเวนเดอร์', vi: 'Hoa Oải Hương' },
    meanings: { zh: '平静内心的深层智慧', en: 'Calm Mind & Inner Wisdom', es: 'Mente Calma y Sabiduría Interior', fr: 'Calme Mental et Sagesse Intérieure', th: 'จิตใจที่สงบและปัญญาภายใน', vi: 'Tâm trí bình thản và trí tuệ nội tâm' },
  },
  {
    emoji: '🌷',
    names: { zh: '郁金香', en: 'Tulip', es: 'Tulipán', fr: 'Tulipe', th: 'ดอกทิวลิป', vi: 'Hoa Tulip' },
    meanings: { zh: '热烈而直白的爱的宣言', en: 'Declaration of Passionate Love', es: 'Declaración de Amor Apasionado', fr: 'Déclaration d\'Amour Passionné', th: 'การประกาศความรักที่ร้อนแรง', vi: 'Tuyên ngôn tình yêu nồng cháy' },
  },
  {
    emoji: '💐',
    names: { zh: '牡丹花', en: 'Peony', es: 'Peonía', fr: 'Pivoine', th: 'ดอกโบตั๋น', vi: 'Hoa Mẫu Đơn' },
    meanings: { zh: '富贵吉祥与圆满人生', en: 'Prosperity & Fulfillment', es: 'Prosperidad y Plenitud', fr: 'Prospérité et Épanouissement', th: 'ความเจริญรุ่งเรืองและความสมบูรณ์', vi: 'Thịnh vượng và viên mãn' },
  },
  {
    emoji: '🎋',
    names: { zh: '竹子', en: 'Bamboo', es: 'Bambú', fr: 'Bambou', th: 'ไม้ไผ่', vi: 'Cây Tre' },
    meanings: { zh: '韧性生长的低调强者', en: 'Resilience & Steady Growth', es: 'Resiliencia y Crecimiento Constante', fr: 'Résilience et Croissance Constante', th: 'ความยืดหยุ่นและการเติบโตที่มั่นคง', vi: 'Kiên cường và phát triển bền vững' },
  },
  {
    emoji: '🌙',
    names: { zh: '夜来香', en: 'Night Blooming Jasmine', es: 'Jazmín Nocturno', fr: 'Jasmin de Nuit', th: 'ดอกมะลิราตรี', vi: 'Hoa Lài Đêm' },
    meanings: { zh: '暗夜中绽放的神秘直觉', en: 'Mysterious Intuition in Darkness', es: 'Intuición Misteriosa en la Oscuridad', fr: 'Intuition Mystérieuse dans l\'Obscurité', th: 'สัญชาตญาณลึกลับในความมืด', vi: 'Trực giác huyền bí trong bóng tối' },
  },
  {
    emoji: '💜',
    names: { zh: '紫罗兰', en: 'Violet', es: 'Violeta', fr: 'Violette', th: 'ดอกไวโอเล็ต', vi: 'Hoa Violet' },
    meanings: { zh: '谦逊的永恒之美', en: 'Humble Eternal Beauty', es: 'Belleza Eterna y Humilde', fr: 'Beauté Éternelle et Humble', th: 'ความงามที่ถ่อมตนและเป็นนิรันดร์', vi: 'Vẻ đẹp khiêm tốn vĩnh cửu' },
  },
  {
    emoji: '🌼',
    names: { zh: '雏菊', en: 'Daisy', es: 'Margarita', fr: 'Marguerite', th: 'ดอกเดซี่', vi: 'Hoa Cúc' },
    meanings: { zh: '纯真快乐与新的开始', en: 'Innocence & New Beginnings', es: 'Inocencia y Nuevos Comienzos', fr: 'Innocence et Nouveaux Départs', th: 'ความบริสุทธิ์และการเริ่มต้นใหม่', vi: 'Ngây thơ và khởi đầu mới' },
  },
];

// ── Colors ──
const COLORS = [
  { hex: '#D4AF37', zh: '金色', en: 'Gold', es: 'Oro', fr: 'Or', th: 'สีทอง', vi: 'Vàng Kim' },
  { hex: '#81D8D0', zh: '薄荷绿', en: 'Mint', es: 'Menta', fr: 'Menthe', th: 'สีมิ้นต์', vi: 'Bạc Hà' },
  { hex: '#A855F7', zh: '星云紫', en: 'Nebula Purple', es: 'Púrpura Nebulosa', fr: 'Violet Nébuleuse', th: 'สีม่วงเนบิวลา', vi: 'Tím Tinh Vân' },
  { hex: '#FF6B6B', zh: '珊瑚红', en: 'Coral Red', es: 'Rojo Coral', fr: 'Rouge Corail', th: 'สีแดงปะการัง', vi: 'Đỏ San Hô' },
  { hex: '#4ECDC4', zh: '海蓝', en: 'Ocean Blue', es: 'Azul Océano', fr: 'Bleu Océan', th: 'สีฟ้ามหาสมุทร', vi: 'Xanh Đại Dương' },
  { hex: '#FFD93D', zh: '琥珀黄', en: 'Amber', es: 'Ámbar', fr: 'Ambre', th: 'สีอำพัน', vi: 'Hổ Phách' },
  { hex: '#DA70D6', zh: '兰花紫', en: 'Orchid', es: 'Orquídea', fr: 'Orchidée', th: 'สีกล้วยไม้', vi: 'Tím Phong Lan' },
  { hex: '#20B2AA', zh: '深海绿', en: 'Deep Sea', es: 'Verde Marino', fr: 'Vert Océan Profond', th: 'สีเขียวทะเลลึก', vi: 'Xanh Biển Sâu' },
  { hex: '#FFA07A', zh: '暖橘', en: 'Warm Orange', es: 'Naranja Cálido', fr: 'Orange Doux', th: 'สีส้มอบอุ่น', vi: 'Cam Ấm' },
  { hex: '#C39BD3', zh: '紫丁香', en: 'Lilac', es: 'Lila', fr: 'Lilas', th: 'สีไลแลค', vi: 'Tử Đinh Hương' },
  { hex: '#85C1E9', zh: '天空蓝', en: 'Sky Blue', es: 'Azul Cielo', fr: 'Bleu Ciel', th: 'สีฟ้า', vi: 'Xanh Trời' },
  { hex: '#F0B27A', zh: '蜜桃', en: 'Peach', es: 'Durazno', fr: 'Pêche', th: 'สีพีช', vi: 'Đào' },
];

// ── Vibe/Mood ──
const VIBES: Record<string, string[]> = {
  zh: ['✨ 今日能量高开，适合主动出击', '🌊 顺势而为，事半功倍的一天', '🔥 内在动力充沛，适合攻坚', '💫 人际关系磁场强烈', '⭐ 机会藏在细节中', '🌈 今日宜复盘，不宜冒进', '🎯 专注当下，能量自然汇聚', '🌙 适合独处，倾听内心声音'],
  en: ['✨ High energy today — take initiative', '🌊 Go with the flow and事半功倍', '🔥 Inner drive is strong — tackle challenges', '💫 Strong social connection energy', '⭐ Opportunities hide in the details', '🌈 Reflect today, don\'t rush', '🎯 Stay focused — energy will follow', '🌙 Time for solitude — listen within'],
};

// ── Component ──
interface DailyDashboardProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
}

const DailyDashboard: React.FC<DailyDashboardProps> = ({ lang }) => {
  const seed = dailySeed();
  
  // Pick items based on daily seed
  const flowerIdx = Math.floor(simpleHash(seed, FLOWERS.length));
  const colorIdx = Math.floor(simpleHash(seed + 1, COLORS.length));
  const luckyNumber = Math.floor(simpleHash(seed + 2, 99)) + 1; // 1-99
  const vibeIdx = Math.floor(simpleHash(seed + 3, (VIBES[lang] || VIBES.en).length));
  
  const today = new Date(new Date().getTime() + 8 * 3600000);
  const dateStr = `${today.getUTCMonth() + 1}/${today.getUTCDate()}`;
  
  const flower = FLOWERS[flowerIdx];
  const color = COLORS[colorIdx];
  const vibe = (VIBES[lang] || VIBES.en)[vibeIdx];
  
  const flowerName = (flower.names as any)[lang] || flower.names.en;
  const flowerMeaning = (flower.meanings as any)[lang] || flower.meanings.en;
  const colorName = (color as any)[lang] || color.en;
  
  const title = ({
    zh: `今日运势 · ${dateStr}`,
    en: `Today's Fortune · ${dateStr}`,
    es: `Horóscopo de Hoy · ${dateStr}`,
    fr: `Fortune du Jour · ${dateStr}`,
    th: `ดวงวันนี้ · ${dateStr}`,
    vi: `Vận Hạn Hôm Nay · ${dateStr}`,
  })[lang] || `Today's Fortune · ${dateStr}`;

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '24px auto 0',
      padding: '16px 18px',
      background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(168,85,247,0.04) 100%)',
      border: '1px solid rgba(212, 175, 55, 0.15)',
      borderRadius: '16px',
    }}>
      {/* Title */}
      <div style={{
        fontSize: '12px',
        color: '#D4AF37',
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: '14px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
      }}>
        {title}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
      }}>
        {/* Lucky Number */}
        <div style={{
          textAlign: 'center',
          padding: '10px 6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '10px', color: '#8888aa', marginBottom: '4px' }}>
            {({ zh: '幸运数字', en: 'Lucky #', es: '# Suerte', fr: '# Chance', th: 'เลขนำโชค', vi: 'Số May' })[lang] || 'Lucky #'}
          </div>
          <div style={{
            fontSize: '26px', fontWeight: 800, color: '#D4AF37',
            textShadow: '0 2px 12px rgba(212,175,55,0.3)',
          }}>
            {luckyNumber}
          </div>
        </div>

        {/* Lucky Color */}
        <div style={{
          textAlign: 'center',
          padding: '10px 6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '10px', color: '#8888aa', marginBottom: '4px' }}>
            {({ zh: '幸运色', en: 'Lucky Color', es: 'Color', fr: 'Couleur', th: 'สีนำโชค', vi: 'Màu May' })[lang] || 'Color'}
          </div>
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${color.hex} 0%, ${color.hex}88 100%)`,
            margin: '2px auto',
            boxShadow: `0 0 12px ${color.hex}44`,
          }} />
          <div style={{ fontSize: '10px', color: '#b0b0d0', marginTop: '4px' }}>{colorName}</div>
        </div>

        {/* Flower */}
        <div style={{
          textAlign: 'center',
          padding: '10px 6px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '10px', color: '#8888aa', marginBottom: '4px' }}>
            {({ zh: '幸运花', en: 'Lucky Flower', es: 'Flor', fr: 'Fleur', th: 'ดอกไม้', vi: 'Hoa May' })[lang] || 'Flower'}
          </div>
          <div style={{ fontSize: '22px', margin: '2px auto' }}>{flower.emoji}</div>
          <div style={{ fontSize: '10px', color: '#b0b0d0', marginTop: '2px', lineHeight: 1.3 }}>{flowerName}</div>
        </div>
      </div>

      {/* Vibe line */}
      <div style={{
        marginTop: '10px',
        padding: '8px 12px',
        background: 'rgba(129, 216, 208, 0.06)',
        borderRadius: '10px',
        border: '1px solid rgba(129, 216, 208, 0.1)',
        fontSize: '12px',
        color: '#81D8D0',
        textAlign: 'center',
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {vibe}
      </div>

      {/* Flower meaning - subtle, optional */}
      <div style={{
        marginTop: '6px',
        fontSize: '10px',
        color: '#7777aa',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 1.4,
      }}>
        {flower.emoji} {flowerName} · {flowerMeaning}
      </div>
    </div>
  );
};

export default DailyDashboard;
