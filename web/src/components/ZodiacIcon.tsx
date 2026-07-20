// ZodiacIcon.tsx - 12星座动态SVG图标
// 根据出生日期对应的星座显示专属图标

import React from 'react';

interface ZodiacIconProps {
  sign: string; // 星座英文名: Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces
  size?: number;
  color?: string;
}

const ZodiacIcon: React.FC<ZodiacIconProps> = ({ 
  sign, 
  size = 32, 
  color = '#D4AF37' 
}) => {
  // 从 value 字符串中提取星座名 (如 "射手座 · 火" -> "射手座")
  const extractSign = (value: string): string => {
    // 尝试匹配各种分隔符
    const separators = [' · ', ' ·', '· ', '·', ' | ', ' |', '| ', '|', ' - ', ' -', '- ', '-'];
    for (const sep of separators) {
      if (value.includes(sep)) {
        return value.split(sep)[0].trim();
      }
    }
    return value.trim();
  };
  
  const extractedSign = extractSign(sign);
  const icons: Record<string, React.ReactNode> = {
    // 1. 白羊座 ♈ - 羊角
    Aries: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M8 20 Q6 12 12 8 Q16 6 20 8 Q26 12 24 20" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="20" r="5" fill={color}/>
      </svg>
    ),
    
    // 2. 金牛座 ♉ - 牛头
    Taurus: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M10 12 Q8 8 12 8 L14 10 L18 10 L20 8 Q24 8 22 12" 
              fill="none" stroke={color} strokeWidth="2"/>
        <path d="M10 12 Q6 6 8 4 M22 12 Q26 6 24 4" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="16" cy="18" r="3" fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 3. 双子座 ♊ - 双胞胎
    Gemini: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="11" cy="10" r="3" fill={color}/>
        <circle cx="21" cy="10" r="3" fill={color}/>
        <path d="M11 14 L11 26 M21 14 L21 26" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M11 18 Q16 16 21 18 M11 22 Q16 20 21 22" 
              fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 4. 巨蟹座 ♋ - 螃蟹
    Cancer: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <ellipse cx="16" cy="20" rx="7" ry="5" fill={color}/>
        <path d="M9 16 Q4 12 6 8 Q8 6 10 10" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M23 16 Q28 12 26 8 Q24 6 22 10" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 24 L8 28 M16 25 L16 29 M22 24 L24 28" 
              fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 5. 狮子座 ♌ - 狮子
    Leo: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="6" fill={color}/>
        <path d="M10 10 Q6 6 8 12 M22 10 Q26 6 24 12 M8 16 Q4 16 8 20 M24 16 Q28 16 24 20 M10 22 Q6 26 12 24 M22 22 Q26 26 20 24" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 20 Q26 24 24 28" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    // 6. 处女座 ♍ - 少女与麦穗
    Virgo: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M12 8 Q16 6 20 8 L18 14 L20 20 L16 26 L12 20 L14 14 Z" 
              fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M22 10 L22 24 M20 12 L24 14 M20 16 L24 18 M20 20 L24 22" 
              fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 7. 天秤座 ♎ - 天平
    Libra: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="16" y1="6" x2="16" y2="20" stroke={color} strokeWidth="2"/>
        <line x1="8" y1="14" x2="24" y2="14" stroke={color} strokeWidth="2"/>
        <path d="M8 14 L6 20 L10 20 Z" fill={color}/>
        <path d="M24 14 L22 20 L26 20 Z" fill={color}/>
        <path d="M12 26 L16 20 L20 26" fill="none" stroke={color} strokeWidth="2"/>
      </svg>
    ),
    
    // 8. 天蝎座 ♏ - 蝎子
    Scorpio: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M8 20 Q8 12 14 12 Q20 12 20 18 Q20 22 16 22" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 22 Q22 24 24 18 Q26 12 22 10" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M22 10 L24 6 L26 10" fill={color}/>
        <path d="M10 14 Q6 10 8 8 M18 14 Q22 10 20 8" 
              fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 9. 射手座 ♐ - 人马弓箭
    Sagittarius: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M8 24 Q8 8 20 8" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="24" y2="8" stroke={color} strokeWidth="2"/>
        <path d="M24 8 L22 6 L26 6 Z" fill={color}/>
        <path d="M12 20 L10 18 L10 22 Z" fill={color}/>
        <path d="M20 24 L18 28 M22 24 L24 28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 10. 摩羯座 ♑ - 山羊鱼尾
    Capricorn: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M10 12 Q8 6 12 6 Q14 6 14 10" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M22 12 Q24 6 20 6 Q18 6 18 10" fill="none" stroke={color} strokeWidth="2"/>
        <ellipse cx="16" cy="14" rx="4" ry="3" fill={color}/>
        <path d="M16 17 Q16 24 12 26 Q16 24 20 26 Q16 24 16 28" 
              fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 11. 水瓶座 ♒ - 水波纹
    Aquarius: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M6 12 Q10 8 14 12 Q18 16 22 12 Q26 8 30 12" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M6 20 Q10 16 14 20 Q18 24 22 20 Q26 16 30 20" 
              fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 6 L12 10 M20 6 L20 10" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 12. 双鱼座 ♓ - 双鱼
    Pisces: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <ellipse cx="12" cy="12" rx="5" ry="3" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(-20 12 12)"/>
        <ellipse cx="20" cy="20" rx="5" ry="3" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(20 20 20)"/>
        <path d="M7 12 L4 10 L4 14 Z" fill={color}/>
        <path d="M25 20 L28 18 L28 22 Z" fill={color}/>
        <line x1="12" y1="15" x2="20" y2="17" stroke={color} strokeWidth="1" strokeDasharray="2,2"/>
      </svg>
    ),
  };

  // 多语言星座名映射到英文
  const nameToEn: Record<string, string> = {
    // 中文
    '白羊座': 'Aries', '金牛': 'Taurus', '双子座': 'Gemini', '巨蟹座': 'Cancer',
    '狮子座': 'Leo', '处女座': 'Virgo', '天秤座': 'Libra', '天蝎座': 'Scorpio',
    '射手座': 'Sagittarius', '摩羯座': 'Capricorn', '水瓶座': 'Aquarius', '双鱼座': 'Pisces',
    // 英文
    'Aries': 'Aries', 'Taurus': 'Taurus', 'Gemini': 'Gemini', 'Cancer': 'Cancer',
    'Leo': 'Leo', 'Virgo': 'Virgo', 'Libra': 'Libra', 'Scorpio': 'Scorpio',
    'Sagittarius': 'Sagittarius', 'Capricorn': 'Capricorn', 'Aquarius': 'Aquarius', 'Pisces': 'Pisces',
    // 西班牙语
    'Aries': 'Aries', 'Tauro': 'Taurus', 'Géminis': 'Gemini', 'Cáncer': 'Cancer',
    'Leo': 'Leo', 'Virgo': 'Virgo', 'Libra': 'Libra', 'Escorpio': 'Scorpio',
    'Sagitario': 'Sagittarius', 'Capricornio': 'Capricorn', 'Acuario': 'Aquarius', 'Piscis': 'Pisces',
    // 法语
    'Bélier': 'Aries', 'Taureau': 'Taurus', 'Gémeaux': 'Gemini', 'Cancer': 'Cancer',
    'Lion': 'Leo', 'Vierge': 'Virgo', 'Balance': 'Libra', 'Scorpion': 'Scorpio',
    'Sagittaire': 'Sagittarius', 'Capricorne': 'Capricorn', 'Verseau': 'Aquarius', 'Poissons': 'Pisces',
    // 泰语
    'ราศีเมษ': 'Aries', 'ราศีพฤษภ': 'Taurus', 'ราศีเมถุน': 'Gemini', 'ราศีกรกฎ': 'Cancer',
    'ราศีสิงห์': 'Leo', 'ราศีกันย์': 'Virgo', 'ราศีตุลย์': 'Libra', 'ราศีพิจิก': 'Scorpio',
    'ราศีธนู': 'Sagittarius', 'ราศีมังกร': 'Capricorn', 'ราศีกุมภ์': 'Aquarius', 'ราศีมีน': 'Pisces',
    // 越南语
    'Bạch Dương': 'Aries', 'Kim Ngưu': 'Taurus', 'Song Tử': 'Gemini', 'Cự Giải': 'Cancer',
    'Sư Tử': 'Leo', 'Xử Nữ': 'Virgo', 'Thiên Bình': 'Libra', 'Bọ Cạp': 'Scorpio',
    'Nhân Mã': 'Sagittarius', 'Ma Kết': 'Capricorn', 'Bảo Bình': 'Aquarius', 'Song Ngư': 'Pisces',
  };

  const normalizedSign = nameToEn[extractedSign] || nameToEn[extractedSign.split(' ')[0]] || extractedSign;
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {icons[normalizedSign] || icons['Aries']}
    </div>
  );
};

export default ZodiacIcon;
