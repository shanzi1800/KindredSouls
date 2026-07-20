// IChingIcon.tsx - 易经八卦动态图标 (emoji方案)

import React from 'react';

interface IChingIconProps {
  hexName: string;
  size?: number;
  color?: string;
}

const IChingIcon: React.FC<IChingIconProps> = ({ 
  hexName, 
  size = 32, 
  color = '#D4AF37' 
}) => {
  // 从 value 字符串中提取卦名
  const extractHexName = (value: string): string => {
    if (value.includes('#')) {
      return value.split('#')[0].trim();
    }
    const parts = value.trim().split(/\s+/);
    return parts[0] || value;
  };
  
  const extractedName = extractHexName(hexName);

  // 八卦 Unicode 符号映射
  const trigramMap: Record<string, string> = {
    // 中文
    '乾': '☰', '坤': '☷', '震': '☳', '巽': '☴',
    '坎': '☵', '离': '☲', '艮': '☶', '兑': '☱',
    // 拼音
    'Qian': '☰', 'Kun': '☷', 'Zhen': '☳', 'Xun': '☴',
    'Kan': '☵', 'Li': '☲', 'Gen': '☶', 'Dui': '☱',
  };

  const symbol = trigramMap[extractedName] || '☯';

  return (
    <span style={{ 
      fontSize: `${size}px`, 
      color: color,
      lineHeight: 1,
      display: 'inline-block'
    }}>
      {symbol}
    </span>
  );
};

export default IChingIcon;
