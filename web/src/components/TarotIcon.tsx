// TarotIcon.tsx - 22张大阿卡纳塔罗牌动态SVG图标
// 根据塔罗牌ID (0-21) 显示对应图标

import React from 'react';

interface TarotIconProps {
  cardId: number; // 0-21 大阿卡纳
  reversed?: boolean; // 是否逆位
  size?: number;
  color?: string;
  bgColor?: string; // 逆位时背景变暗
}

const TarotIcon: React.FC<TarotIconProps> = ({ 
  cardId, 
  reversed = false, 
  size = 32, 
  color = '#D4AF37',
  bgColor = '#FF6B6B'
}) => {
  // 22张大阿卡纳图标符号
  // 每个图标都是简洁的象征图形
  const icons: Record<number, React.ReactNode> = {
    // 0. 愚人 The Fool - 环球/冒险者
    0: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="10" r="4" fill={color}/>
        <path d="M12 14 L16 22 L20 14 Z" fill={color} opacity="0.7"/>
        <path d="M10 26 Q16 22 22 26" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8" cy="8" r="2" fill={color} opacity="0.5"/>
      </svg>
    ),
    
    // 1. 魔术师 The Magician - 符号∞/工具
    1: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M8 8 L24 24 M24 8 L8 24" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="3" fill={color}/>
        <path d="M6 6 L10 10 M26 6 L22 10 M6 26 L10 22 M26 26 L22 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 2. 女祭司 The High Priestess - 月亮/卷轴
    2: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 6 Q22 10 22 16 Q22 22 16 24 Q10 22 10 16 Q10 10 16 6" fill="none" stroke={color} strokeWidth="2"/>
        <circle cx="16" cy="14" r="4" fill={color} opacity="0.5"/>
        <path d="M12 26 L16 22 L20 26" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 3. 女皇 The Empress - 星星/圆形
    3: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="14" r="7" fill="none" stroke={color} strokeWidth="2"/>
        <circle cx="16" cy="14" r="3" fill={color}/>
        <path d="M16 6 L16 8 M16 20 L16 22 M24 14 L22 14 M10 14 L8 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 26 L16 20 L22 26" fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 4. 皇帝 The Emperor - 方形/权威
    4: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="8" y="8" width="16" height="16" fill="none" stroke={color} strokeWidth="2" rx="1"/>
        <path d="M12 6 L12 8 M20 6 L20 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="16" y1="8" x2="16" y2="24" stroke={color} strokeWidth="1" strokeDasharray="2,2"/>
        <line x1="8" y1="16" x2="24" y2="16" stroke={color} strokeWidth="1" strokeDasharray="2,2"/>
      </svg>
    ),
    
    // 5. 教皇 The Hierophant - 十字/三
    5: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="16" y1="6" x2="16" y2="26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M10 20 L16 24 L22 20" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 6. 恋人 The Lovers - 双人/心
    6: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 24 L10 18 Q6 14 10 10 Q14 6 16 10 Q18 6 22 10 Q26 14 22 18 Z" fill={color} opacity="0.8"/>
        <circle cx="12" cy="10" r="2" fill={color}/>
        <circle cx="20" cy="10" r="2" fill={color}/>
      </svg>
    ),
    
    // 7. 战车 The Chariot - 战车/箭头
    7: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect x="8" y="12" width="16" height="10" fill="none" stroke={color} strokeWidth="2" rx="2"/>
        <path d="M12 12 L12 8 M20 12 L20 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="8" cy="24" r="3" fill={color}/>
        <circle cx="24" cy="24" r="3" fill={color}/>
        <path d="M16 8 L12 6 M16 8 L20 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 8. 力量 Strength - 狮子/无限符号
    8: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 6 Q22 10 22 16 Q22 22 16 24 Q10 22 10 16 Q10 10 16 6" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M8 16 Q8 12 12 12 Q16 12 16 16 Q16 12 20 12 Q24 12 24 16" fill="none" stroke={color} strokeWidth="2"/>
      </svg>
    ),
    
    // 9. 隐士 The Hermit - 提灯老人 (简化版)
    9: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        {/* 头部 */}
        <circle cx="16" cy="8" r="3" fill={color}/>
        {/* 身体/斗篷 */}
        <path d="M10 12 L16 28 L22 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        {/* 提灯 */}
        <circle cx="22" cy="14" r="2" fill={color} opacity="0.8"/>
        <path d="M20 14 L18 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        {/* 手杖 */}
        <line x1="12" y1="20" x2="12" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 10. 命运之轮 Wheel of Fortune - 轮子
    10: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="10" fill="none" stroke={color} strokeWidth="2"/>
        <circle cx="16" cy="16" r="4" fill={color}/>
        <path d="M16 6 L16 12 M16 20 L16 26 M6 16 L12 16 M20 16 L26 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 9 L13 13 M19 13 L23 9 M9 23 L13 19 M19 19 L23 23" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 11. 正义 Justice - 剑/天平
    11: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="16" y1="4" x2="16" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="24" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 12 L5 18 L11 18 Z" fill={color}/>
        <path d="M24 12 L21 18 L27 18 Z" fill={color}/>
        <path d="M12 26 L16 20 L20 26" fill="none" stroke={color} strokeWidth="2"/>
      </svg>
    ),
    
    // 12. 倒吊人 The Hanged Man - 倒吊人
    12: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="10" r="4" fill={color}/>
        <path d="M12 14 L16 10 L20 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 14 L16 22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 18 L16 22 L22 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 26 L16 22 L20 26" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    // 13. 死神 Death - 骷髅/镰刀
    13: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="10" r="6" fill="none" stroke={color} strokeWidth="2"/>
        <circle cx="13" cy="9" r="1.5" fill={color}/>
        <circle cx="19" cy="9" r="1.5" fill={color}/>
        <path d="M14 14 L18 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 16 L16 26" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M16 16 Q26 12 24 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 20 L22 18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    // 14. 节制 Temperance - 蝴蝶/双翼
    14: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 8 Q8 14 8 20 Q8 26 16 22 Q24 26 24 20 Q24 14 16 8" fill={color} opacity="0.7"/>
        <path d="M16 10 Q12 14 12 18 Q12 22 16 20 Q20 22 20 18 Q20 14 16 10" fill={color}/>
        <path d="M16 22 L16 28" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    // 15. 恶魔 The Devil - 五芒星/链
    15: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="12" r="6" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M10 10 L16 16 L22 10 M16 16 L16 26" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 22 Q6 20 8 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M22 22 Q26 20 24 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="22" r="2" fill={color}/>
      </svg>
    ),
    
    // 16. 高塔 The Tower - 闪电/塔
    16: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 4 L16 6 M12 4 L12 6 M20 4 L20 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 6 L20 14 L20 26 L12 26 L12 14 Z" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M16 6 L12 2 M16 6 L20 2 M16 6 L16 0" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 26 L10 20 M24 26 L22 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    
    // 17. 星星 The Star - 星星/水
    17: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M16 6 L18 12 L24 12 L19 16 L21 22 L16 18 L11 22 L13 16 L8 12 L14 12 Z" fill={color}/>
        <path d="M10 26 Q14 22 16 24 Q18 22 22 26" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="20" r="1" fill={color} opacity="0.5"/>
        <circle cx="20" cy="20" r="1" fill={color} opacity="0.5"/>
      </svg>
    ),
    
    // 18. 月亮 The Moon - 月牙
    18: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <path d="M20 6 Q28 12 28 18 Q28 24 20 28 Q24 22 24 18 Q24 14 20 10 Q16 6 20 6" fill={color}/>
        <circle cx="10" cy="12" r="1.5" fill={color} opacity="0.6"/>
        <circle cx="8" cy="20" r="1" fill={color} opacity="0.4"/>
        <circle cx="14" cy="24" r="1.5" fill={color} opacity="0.5"/>
      </svg>
    ),
    
    // 19. 太阳 The Sun - 太阳
    19: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="14" r="7" fill={color}/>
        <path d="M16 4 L16 7 M16 21 L16 24 M4 14 L7 14 M25 14 L28 14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 8 L10 10 M22 8 L24 10 M8 20 L10 22 M22 20 L24 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 26 Q16 22 22 26" fill="none" stroke={color} strokeWidth="1.5"/>
      </svg>
    ),
    
    // 20. 审判 Judgement - 十字架/天使
    20: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <line x1="16" y1="4" x2="16" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="10" x2="22" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M12 18 Q16 14 20 18" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M12 22 Q16 18 20 22" fill="none" stroke={color} strokeWidth="1.5"/>
        <path d="M16 26 L16 22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    
    // 21. 世界 The World - 世界之眼/圆环
    21: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="10" fill="none" stroke={color} strokeWidth="2"/>
        <ellipse cx="16" cy="16" rx="4" ry="10" fill="none" stroke={color} strokeWidth="1.5"/>
        <line x1="6" y1="16" x2="26" y2="16" stroke={color} strokeWidth="1.5"/>
        <circle cx="16" cy="16" r="2" fill={color}/>
        <path d="M16 4 L14 8 L18 8 Z" fill={color}/>
      </svg>
    ),
  };

  // 确保 cardId 在 0-21 范围内
  const safeCardId = Math.max(0, Math.min(21, cardId || 0));

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      filter: reversed ? 'grayscale(0.3) opacity(0.85)' : 'none',
      transform: reversed ? 'rotate(180deg)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      {icons[safeCardId] || icons[0]}
    </div>
  );
};

export default TarotIcon;
