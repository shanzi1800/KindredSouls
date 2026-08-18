// ZodiacIcon.tsx - 12星座动态图标 (emoji方案，确保跨平台兼容)

import React from 'react';

interface ZodiacIconProps {
  sign: string;
  size?: number;
  color?: string;
}

const ZodiacIcon: React.FC<ZodiacIconProps> = ({ 
  sign, 
  size = 32, 
  color = '#D4AF37' 
}) => {
  // 从 value 字符串中提取星座名
  const extractSign = (value: string): string => {
    const separators = [' · ', ' ·', '· ', '·', ' | ', ' |', '| ', '|'];
    for (const sep of separators) {
      if (value.includes(sep)) {
        return value.split(sep)[0].trim();
      }
    }
    return value.trim();
  };
  
  const extractedSign = extractSign(sign);

  // 星座 emoji 映射 (使用标准Unicode星座符号)
  const emojiMap: Record<string, string> = {
    // 中文
    '白羊座': '♈', '金牛座': '♉', '双子座': '♊', '巨蟹座': '♋',
    '狮子座': '♌', '处女座': '♍', '天秤座': '♎', '天蝎座': '♏',
    '射手座': '♐', '摩羯座': '♑', '水瓶座': '♒', '双鱼座': '♓',
    // 英文
    'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
    'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
    'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓',
    // 西班牙语
    'Tauro': '♉', 'Géminis': '♊', 'Cáncer': '♋', 'Escorpio': '♏',
    'Sagitario': '♐', 'Capricornio': '♑', 'Acuario': '♒', 'Piscis': '♓',
    // 法语
    'Bélier': '♈', 'Taureau': '♉', 'Gémeaux': '♊', 'Lion': '♌',
    'Vierge': '♍', 'Balance': '♎', 'Scorpion': '♏', 'Sagittaire': '♐',
    'Capricorne': '♑', 'Verseau': '♒', 'Poissons': '♓',
    // 泰语
    'ราศีเมษ': '♈', 'ราศีพฤษภ': '♉', 'ราศีเมถุน': '♊', 'ราศีกรกฎ': '♋',
    'ราศีสิงห์': '♌', 'ราศีกันย์': '♍', 'ราศีตุลย์': '♎', 'ราศีพิจิก': '♏',
    'ราศีธนู': '♐', 'ราศีมังกร': '♑', 'ราศีกุมภ์': '♒', 'ราศีมีน': '♓',
    // 越南语
    'Bạch Dương': '♈', 'Kim Ngưu': '♉', 'Song Tử': '♊', 'Cự Giải': '♋',
    'Sư Tử': '♌', 'Xử Nữ': '♍', 'Thiên Bình': '♎', 'Bọ Cạp': '♏',
    'Nhân Mã': '♐', 'Ma Kết': '♑', 'Bảo Bình': '♒', 'Song Ngư': '♓',
  };

  const emoji = emojiMap[extractedSign] || '✦';

  return (
    <span style={{ 
      fontSize: `${size}px`, 
      color: color,
      lineHeight: 1,
      display: 'inline-block'
    }}>
      {emoji}
    </span>
  );
};

export default ZodiacIcon;
