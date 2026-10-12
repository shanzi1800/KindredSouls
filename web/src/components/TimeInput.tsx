import React, { useRef } from 'react';

// ── 出生时间输入（HH:MM 两位数字，左自动跳栏；与财富线同源逐字搬迁）──
//   🛠️ 45-B7 修复：原 HH_MAX=[2,4] 硬限小时个位 ≤4 ⇒ 15/16/17/18/19 点**无法输入**（且放行了非法的 24:00）。
//   现按真值域收紧/放开：H1∈0-2；H2 依赖 H1（H1='2' ⇒ 0-3，否则 0-9）⇒ 小时域 00-23；
//   分钟 M1∈0-5、M2∈0-9 ⇒ 分钟域 00-59。与服务端规范校验器（test/audit-e24h：24:00 属非法）逐位对齐。
const H1_MAX = 2;
const H2_MAX_WHEN_H1_IS_2 = 3;
const MM_MAX = [5, 9];  // 分钟十位 ≤5、个位 ≤9 ⇒ 00-59
/** 小时个位上限：十位为 2 时只能 0-3（23），否则 0-9（09/19） */
const hourUnitMax = (h1: string): number => (h1 === '2' ? H2_MAX_WHEN_H1_IS_2 : 9);

//   🛠️ 45-B7 第二修：小时输满 2 位后自动跳栏到分钟，而分钟已被失焦兜底预填 "00"，
//   叠加 maxLength=2 ⇒ 用户「打不进分钟数」。修法：两框 onFocus 即全选（打字直接覆盖），
//   保留「值恒为 HH:MM 规范化」不变式（缺省 12:00 / 00:00）。
export const TimeInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const hh = value.split(':')[0] || '';
  const mm = value.split(':')[1] || '';
  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);

  // 每位置数字上限验证（🛠️ 45-B7：小时个位上限随十位动态；分钟十位 ≤5、个位 ≤9）
  const handleHH = (raw: string) => {
    let cleaned = raw.replace(/\D/g, '').slice(0, 2);
    if (cleaned.length >= 1 && parseInt(cleaned[0], 10) > H1_MAX) {
      cleaned = '';  // H1 超过上限（3-9），整段拒
    } else if (cleaned.length === 2 && parseInt(cleaned[1], 10) > hourUnitMax(cleaned[0])) {
      cleaned = cleaned[0];  // H2 超过动态上限（如 25/26），保留 H1
    }
    if (cleaned.length === 2) {
      // 🔴 45-B7 关键次序：分钟兜底种子必须**随小时这一拍同批落盘**（此刻 mm 为空则补 '00'），
      //   下一拍才自动跳栏 ⇒ 聚焦分钟时 DOM 已是 '00' ⇒ onFocus 全选生效 ⇒ 打字直接覆盖。
      //   （若改由 HH 失焦兜底，种子在 focus 事件之后才写入 ⇒ 全选落空 + maxLength 挡字 ⇒ 分钟打不进。）
      onChange(cleaned + ':' + (mm || '00'));
      setTimeout(() => mmRef.current?.focus(), 0);
    } else {
      onChange(cleaned + (mm ? ':' + mm : ''));
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

  // 失焦时补零并验证边界（真值域：HH 00-23、MM 00-59；与服务端校验器同源）
  const handleBlur = () => {
    let newHH = hh;
    let newMM = mm;
    if (hh) {
      const n = Math.min(parseInt(hh, 10) || 0, 23);
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
        onFocus={e => e.currentTarget.select()}
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
        onFocus={e => e.currentTarget.select()}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default TimeInput;
