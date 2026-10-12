import React, { useEffect, useRef } from 'react';

// ── 出生时间输入（HH:MM 两位数字，左自动跳栏；合婚 / 财富共用）──
//   真值域：小时 00-23、分钟 00-59（与服务端校验器 test/audit-e24h 同源；24:00 属非法）。
//
//   🔴 45-B8 设计铁律：**绝不吞键**（真机血训：`maxLength` 挡字 + 依赖 `select()` 覆盖
//      + 打字即改写受控值 ⇒ iOS / 微信 WebView 上表现为「很多数字打不进」）。
//   规则：
//     ① 不设 maxLength —— DOM 永不拦输入，每一个数字键必有反馈；
//     ② 每格只保留「后 2 位数字」（满格续打 = 整格重写）⇒ 已有值上直接打即可改，
//        完全不依赖聚焦全选，真机光标落点无所谓；
//     ③ 键入不拒值（3-9 作十位也照收，用户看得见可改，不静默吞掉）；
//     ④ 自动跳栏仅在「小时已成合法两位值（≤23）」时触发；
//     ⑤ 失焦兜底：补零 + 越界夹紧（HH≤23 / MM≤59），缺省 12:00 / 00:00（值恒为 HH:MM）。
const H_DEFAULT = '12';
const M_DEFAULT = '00';
const H_MAX = 23;
const M_MAX = 59;

/** 槽位取值：结果在容量内直接采用（覆盖/删除/粘贴都自然）；
 *  满格续打 ⇒ 视为整格重写（优先取**本次实际按下的那位数字**，真机光标落点无关；
 *  虚拟键盘不报 key 时退化为「取末位」）；未满格却溢出（粘贴）⇒ 取末 N 位。
 *  **全程不丢键**：任何一次按键都会带来可见变化。 */
export const slotNext = (prev: string, raw: string, cap: number, typed?: string): string => {
  const next = (raw || '').replace(/\D/g, '');
  if (next.length <= cap) return next;
  if ((prev || '').length >= cap) return (typed && /^[0-9]$/.test(typed)) ? typed : next.slice(-1);
  return next.slice(-cap);
};

/** 失焦归一：空 ⇒ 缺省；越界 ⇒ 夹紧；补零两位 */
const normalizeSlot = (v: string, def: string, max: number): string =>
  v ? String(Math.min(parseInt(v, 10) || 0, max)).padStart(2, '0') : def;

/** 聚焦即把光标移到末尾（居中短槽内点击落点不可控 ⇒ 真机上会「前插」成 10/32 这类乱序）；
 *  延后一拍执行，确保晚于浏览器自身的 tap 落点逻辑。 */
const caretToEnd = (e: React.FocusEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  setTimeout(() => { try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* 忽略 */ } }, 0);
};

export const TimeInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const hh = value.split(':')[0] || '';
  const mm = value.split(':')[1] || '';
  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);
  // 写穿式最新值（消除「失焦闭包读到旧值 ⇒ 吞掉刚键入的数字」竞态）
  const latest = useRef({ h: hh, m: mm });
  // 本次实际按下的数字键（真机光标落在字符中间时也能精确整格重写）
  const typed = useRef('');
  useEffect(() => { latest.current = { h: hh, m: mm }; }, [hh, mm]);

  const handleHH = (raw: string) => {
    const cleaned = slotNext(latest.current.h, raw, 2, typed.current);
    typed.current = '';
    latest.current = { h: cleaned, m: latest.current.m };
    onChange(cleaned + ':' + latest.current.m);
    // 合法两位小时才跳栏；非法（如 25/90）留在本格，用户可继续改（绝不静默吞键）
    if (cleaned.length === 2 && parseInt(cleaned, 10) <= H_MAX) {
      setTimeout(() => mmRef.current?.focus(), 0);
    }
  };

  const handleMM = (raw: string) => {
    const cleaned = slotNext(latest.current.m, raw, 2, typed.current);
    typed.current = '';
    latest.current = { h: latest.current.h, m: cleaned };
    onChange(latest.current.h + ':' + cleaned);
  };

  // 失焦（离开本格）：补零 + 夹紧；值恒为规范 HH:MM
  //   🔴 以 **DOM 实际显示值** 为真源（用户看到什么就归一到什么），防「状态落后于 DOM」竞态。
  const handleBlur = () => {
    const rawH = (hhRef.current?.value ?? latest.current.h).replace(/\D/g, '').slice(-2);
    const rawM = (mmRef.current?.value ?? latest.current.m).replace(/\D/g, '').slice(-2);
    const h = normalizeSlot(rawH, H_DEFAULT, H_MAX);
    const m = normalizeSlot(rawM, M_DEFAULT, M_MAX);
    latest.current = { h, m };
    onChange(h + ':' + m);
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
        autoComplete="off"
        pattern="[0-9]*"
        placeholder="HH"
        value={hh}
        onChange={e => handleHH(e.target.value)}
        onKeyDown={e => { typed.current = /^[0-9]$/.test(e.key) ? e.key : ''; }}
        onFocus={caretToEnd}
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
        autoComplete="off"
        pattern="[0-9]*"
        placeholder="MM"
        value={mm}
        onChange={e => handleMM(e.target.value)}
        onKeyDown={e => { typed.current = /^[0-9]$/.test(e.key) ? e.key : ''; }}
        onFocus={caretToEnd}
        onBlur={handleBlur}
      />
    </div>
  );
};

export default TimeInput;
