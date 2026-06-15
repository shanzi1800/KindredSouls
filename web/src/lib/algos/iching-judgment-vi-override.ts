/**
 * iching-judgment-vi-override.ts
 * 
 * I-Ching 卦辞越南语覆盖字典（人工校对版）
 * 
 * 用途：
 *   getIChingResult() 在返回 judgmentVi 前，先查此字典。
 *   有覆盖值 → 用覆盖值（人工校对过的正确汉越占卜语）
 *   无覆盖值 → 用 iching.ts 里原有的 judgmentVi（待逐步校对）
 *
 * 校对原则（军师定）：
 *   - 禁止直译中文隐喻（如"豚鱼"→"Lợn và cá"）
 *   - 用汉越占卜雅称（如"Gia đạo hòa thuận — cát tường"）
 *   - 参考 Thai 版 tone（温馨、正缘感）
 */

const ICHING_JUDGMENT_VI_OVERRIDE: Record<number, string> = {
  // ── 已校对（按发现顺序填入）──

  /** 第37卦 风火家人：原"Lợn và cá"→家道和顺 */
  37: "Gia đạo hòa thuận — cát tường, lợi lộc hanh thông",

  /** 第61卦 风泽中孚：原"Lợn và cá"→诚心合道 */
  61: "Thành tâm hiệp đạo — đại cát, vạn sự hanh thông",

  // ── 待校对（逐步添加）──
  // 1: "",
  // 2: "",
  // ...
};

export default ICHING_JUDGMENT_VI_OVERRIDE;
