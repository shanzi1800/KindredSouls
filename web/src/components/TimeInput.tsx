import React, { useRef } from 'react';

// ── 出生时间输入（HH:MM 两位数字，左自动跳栏；与财富线同源逐字搬迁）──
//   每位置数字上限（H1=小时十位, H2=小时个位, M1=分钟十位, M2=分钟个位）
const HH_MAX = [2, 4];  // 允许 00-24（24:00 失焦时夹到 23:59）
const MM_MAX = [5, 9];  // 允许 00-59

export const TimeInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const hh = value.split(':')[0] || '';
  const mm = value.split(':')[1] || '';
  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);

  // 每位置数字上限验证
  const handleHH = (raw: string) => {
    let cleaned = raw.replace(/\D/g, '').slice(0, 2);
    if (cleaned.length >= 1 && parseInt(cleaned[0], 10) > HH_MAX[0]) {
      cleaned = '';  // H1 超过上限，整段拒
    } else if (cleaned.length === 2 && parseInt(cleaned[1], 10) > HH_MAX[1]) {
      cleaned = cleaned[0];  // H2 超过上限，保留 H1
    }
    onChange(cleaned + (mm ? ':' + mm : ''));
    if (cleaned.length >= 2) {
      setTimeout(() => mmRef.current?.focus(), 0);
    }
  };

  const handleMM = (raw: string) => {
    let cleaned = raw.replace(/\D/g, '').slice(0, 2);
    if (cleaned.length >= 1 && parseInt(cleaned[0], 10) > MM_MAX[0]) {
      cleaned = '';
    } else if (cleaned.length === 2 && parseInt(cleaned[1], 10) > MM_MAX[1]) {
      cleaned = cleaned[0];
    }
    onChange((hh || '') + ':' + cleaned);
  };

  // 失焦时补零并验证边界（HH 允许 00-24，MM 允许 00-59；24:XX 仅保留 24:00）
  const handleBlur = () => {
    let newHH = hh;
    let newMM = mm;
    if (hh) {
      const n = Math.min(parseInt(hh, 10) || 0, 24);
      newHH = String(n).padStart(2, '0');
    } else {
      newHH = '12';
    }
    if (mm) {
      const n = Math.min(parseInt(mm, 10) || 0, 59);
      newMM = String(n).padStart(2, '0');
    } else {
      newMM = '00';
    }
    // 24:XX 仅保留 24:00
    if (newHH === '24' && newMM !== '00') {
      newMM = '00';
    }
    onChange(newHH + ':' + newMM);
  };

  // 统一的内联样式（保证 input 和冒号基线完全一致）
  const lineHeight = '28px';
  const fontSize = 16;

  const inputBase: React.CSSProperties = {
    width: '28px',
    border: 'none',
    background: 'transparent',
    color: '#D4AF37',
    fontSize,
    fontWeight: 600,
    textAlign: 'center',
    outline: 'none',
    padding: 0,
    margin: 0,
    lineHeight,
    cursor: 'text',
    caretColor: '#D4AF37',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2px',
      width: '100%',
      padding: '9px 14px',
      background: 'rgba(255,255,255,0.08)',
      border: '1.5px solid rgba(212,175,55,0.3)',
      borderRadius: '10px',
      lineHeight,  // 与 input 共享行高
    }}>
      <input
        ref={hhRef}
        style={inputBase}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="HH"
        value={hh}
        onChange={e => handleHH(e.target.value)}
        onBlur={handleBlur}
      />
      <span style={{
        color: '#E8E4D9',
        fontSize,
        fontWeight: 400,
        lineHeight,
        margin: '0 4px',
        userSelect: 'none',
      }}>:</span>
      <input
        ref={mmRef}
        style={inputBase}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="MM"
        value={mm}
        onChange={e => handleMM(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default TimeInput;
