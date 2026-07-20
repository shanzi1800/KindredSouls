// TarotIcon.tsx - 22张大阿卡纳塔罗牌动态图标 (emoji方案)

import React from 'react';

interface TarotIconProps {
  cardId: number;
  reversed?: boolean;
  size?: number;
  color?: string;
}

const TarotIcon: React.FC<TarotIconProps> = ({ 
  cardId, 
  reversed = false, 
  size = 32, 
  color = '#D4AF37'
}) => {
  // 22张大阿卡纳 emoji 映射
  const cardEmojis: Record<number, string> = {
    0: '🃏',   // 愚人 The Fool
    1: '🎩',   // 魔术师 The Magician
    2: '📿',   // 女祭司 The High Priestess
    3: '👑',   // 女皇 The Empress
    4: '⚜️',   // 皇帝 The Emperor
    5: '✝️',   // 教皇 The Hierophant
    6: '💕',   // 恋人 The Lovers
    7: '🏎️',   // 战车 The Chariot
    8: '🦁',   // 力量 Strength
    9: '🕯️',   // 隐士 The Hermit
    10: '☸️',  // 命运之轮 Wheel of Fortune
    11: '⚖️',  // 正义 Justice
    12: '🙃',  // 倒吊人 The Hanged Man
    13: '💀',  // 死神 Death
    14: '🏺',  // 节制 Temperance
    15: '😈',  // 恶魔 The Devil
    16: '🏰',  // 高塔 The Tower
    17: '⭐',   // 星星 The Star
    18: '🌙',  // 月亮 The Moon
    19: '☀️',  // 太阳 The Sun
    20: '📯',  // 审判 Judgement
    21: '🌍',  // 世界 The World
  };

  const safeCardId = Math.max(0, Math.min(21, cardId || 0));
  const emoji = cardEmojis[safeCardId] || '🃏';

  return (
    <span style={{ 
      fontSize: `${size}px`, 
      color: color,
      lineHeight: 1,
      display: 'inline-block',
      filter: reversed ? 'grayscale(0.5) opacity(0.7)' : 'none',
      transform: reversed ? 'rotate(180deg)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      {emoji}
    </span>
  );
};

export default TarotIcon;
