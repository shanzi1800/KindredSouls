// TarotIcon.tsx - 22张大阿卡纳塔罗牌动态图标
// 极致方案：emoji旋转 + 逆位R标 + 双重transform兼容

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

  // 极致方案：inline-flex + 双重transform兼容所有浏览器
  // emoji 必须放在 flex 容器内旋转，不能直接旋转 inline 元素
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: `${size}px`,
      height: `${size}px`,
    }}>
      {/* 主图标：旋转180° */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        transform: reversed ? 'rotate(180deg)' : 'rotate(0deg)',
        transformOrigin: '50% 50%',
        filter: reversed 
          ? 'saturate(0.3) brightness(0.65) drop-shadow(0 0 3px rgba(212, 175, 55, 0.2))' 
          : 'saturate(1) brightness(1) drop-shadow(0 0 4px rgba(212, 175, 55, 0.3))',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease',
        WebkitTransform: reversed ? 'rotate(180deg)' : 'rotate(0deg)',
        WebkitFilter: reversed 
          ? 'saturate(0.3) brightness(0.65)' 
          : 'saturate(1) brightness(1)',
        lineHeight: 1,
        fontSize: `${size * 0.85}px`,
      }}>
        {emoji}
      </div>

      {/* 逆位标记：左下角小R徽章 */}
      {reversed && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          left: '-4px',
          width: '12px',
          height: '12px',
          background: 'linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '7px',
          fontWeight: 700,
          color: '#0D0D1A',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '1px solid rgba(212, 175, 55, 0.6)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
          lineHeight: 1,
        }}>
          R
        </div>
      )}
    </div>
  );
};

export default TarotIcon;
