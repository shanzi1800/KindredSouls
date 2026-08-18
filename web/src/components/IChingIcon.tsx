// IChingIcon.tsx - 易经八卦动态SVG图标
// 根据卦象显示对应的八卦符号

import React from 'react';

interface IChingIconProps {
  hexName: string; // 卦名: 乾, 坤, 震, 巽, 坎, 离, 艮, 兑
  size?: number;
  color?: string;
}

const IChingIcon: React.FC<IChingIconProps> = ({ 
  hexName, 
  size = 32, 
  color = '#D4AF37' 
}) => {
  // 八卦线条配置: 阳爻(实线) = true, 阴爻(断线) = false
  // 从下往上: 初爻、二爻、三爻
  const trigrams: Record<string, [boolean, boolean, boolean]> = {
    '乾': [true, true, true],   // ☰ 三条实线
    '坤': [false, false, false], // ☷ 三条断线
    '震': [true, false, false],  // ☳ 下实上虚
    '巽': [false, false, true],  // ☴ 下虚上实
    '坎': [false, true, false],  // ☵ 中实上下虚
    '离': [true, false, true],   // ☲ 中虚上下实
    '艮': [false, true, true],   // ☶ 下实上虚(反)
    '兑': [true, true, false],   // ☱ 下虚上实(反)
  };

  // 多语言卦名映射
  const nameMap: Record<string, string> = {
    'Qian': '乾', '乾': '乾',
    'Kun': '坤', '坤': '坤',
    'Zhen': '震', '震': '震',
    'Xun': '巽', '巽': '巽',
    'Kan': '坎', '坎': '坎',
    'Li': '离', '离': '离',
    'Gen': '艮', '艮': '艮',
    'Dui': '兑', '兑': '兑',
  };

  const normalizedName = nameMap[hexName] || hexName;
  const lines = trigrams[normalizedName] || [true, true, true];

  // 渲染单条爻线
  const renderLine = (isYang: boolean, y: number) => {
    if (isYang) {
      // 阳爻: 实线
      return (
        <line 
          key={y} 
          x1="6" 
          y1={y} 
          x2="26" 
          y2={y} 
          stroke={color} 
          strokeWidth="3" 
          strokeLinecap="round"
        />
      );
    } else {
      // 阴爻: 断线 (两段)
      return (
        <g key={y}>
          <line x1="6" y1={y} x2="13" y2={y} stroke={color} strokeWidth="3" strokeLinecap="round"/>
          <line x1="19" y1={y} x2="26" y2={y} stroke={color} strokeWidth="3" strokeLinecap="round"/>
        </g>
      );
    }
  };

  // 从下往上画: 初爻(底部)、二爻(中间)、三爻(顶部)
  const linePositions = [24, 16, 8];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        {lines.map((isYang, index) => renderLine(isYang, linePositions[index]))}
      </svg>
    </div>
  );
};

export default IChingIcon;
