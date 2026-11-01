/**
 * familiarSfx.ts —— 灵宠微音效·Web Audio 原生纯合成（E114-刀四 · 主公军令 2026-11-01）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：零外部 MP3 素材、零网络加载（永不 404），AudioContext 双振荡器
 * 纯合成，空灵轻柔不打扰：
 *   · playSophiaPurrChime()：528Hz＋852Hz 双正弦谐波（治愈频率泛音），0.3s
 *     平滑渐入（Soft Attack）＋1.8s 指数衰减（Decay）——星芒滑过晶石的清鸣。
 *   · playMiloBubblePop()：气泡期 300Hz 向上扫频微音；~1.7s 破裂点「啵」
 *     （80ms 频降）＋1200Hz 星尘轻灵碎裂音——少年机敏的吐泡笑点。
 *
 * 🔴 安全约束（军令钦定）：
 *   · 主音量 Master Gain 恒锁 0.15（轻灵空灵，杜绝惊吓）；
 *   · SSR / 无 DOM / 无 AudioContext ⇒ 静默兜底**绝不抛错**（node:test 与
 *     构建环境守备——「AudioContext not defined」禁入终端）；
 *   · 浏览器自动播放策略：首次用户交互（pointerdown/keydown）解锁并保活
 *     （ctx suspended ⇒ resume），未解锁前 play 调用静默降级。
 */

const MASTER_GAIN = 0.15;

let ctxRef: AudioContext | null = null;
let unlockBound = false;

/** 惰性取 AudioContext（SSR/无 API ⇒ null 静默兜底；单例保活） */
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null; // SSR/测试环境守卫
  try {
    if (!ctxRef) {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctxRef = new AC();
    }
    if (ctxRef && ctxRef.state === 'suspended') {
      void ctxRef.resume().catch(() => { /* 未解锁前静默 */ });
    }
    return ctxRef;
  } catch {
    return null; // 构造失败（被策略禁用等）⇒ 静默
  }
}

/** 首次用户交互解锁（军令：点击进页/点灵宠后音效自然播放） */
function bindUnlockOnce(): void {
  if (unlockBound || typeof window === 'undefined' || !window.addEventListener) return;
  unlockBound = true;
  try {
    const unlock = () => { getCtx(); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  } catch { /* addEventListener 不可用 ⇒ 静默 */ }
}

/** 主增益出口（0.15 恒锁）——null ctx ⇒ null（调用方静默跳过） */
function masterOut(ctx: AudioContext): GainNode | null {
  try {
    const g = ctx.createGain();
    g.gain.value = MASTER_GAIN;
    g.connect(ctx.destination);
    return g;
  } catch {
    return null;
  }
}

/** 🎵 Sophia 踩奶/宝石脉冲伴音：528Hz＋852Hz 双正弦，0.3s 渐入＋1.8s 衰减 */
export function playSophiaPurrChime(): void {
  bindUnlockOnce();
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const out = masterOut(ctx);
    if (!out) return;
    const t0 = ctx.currentTime;
    for (const freq of [528, 852]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // 0.3s 线性软渐入 → 1.8s 指数衰减（军令钦定包络）
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(freq === 528 ? 0.9 : 0.45, t0 + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3 + 1.8);
      osc.connect(g);
      g.connect(out);
      osc.start(t0);
      osc.stop(t0 + 2.2);
    }
  } catch { /* 合成失败 ⇒ 静默（音效永不阻断动效） */ }
}

/** 🎵 Milo 吐泡伴音：300Hz 上扫频＋~1.7s 破裂「啵」（80ms 频降）＋1200Hz 星尘碎裂 */
export function playMiloBubblePop(): void {
  bindUnlockOnce();
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const out = masterOut(ctx);
    if (!out) return;
    const t0 = ctx.currentTime;
    // ① 气泡升腾：300Hz→620Hz 上扫频（与 CSS 气泡漂移同拍）
    const rise = ctx.createOscillator();
    const rg = ctx.createGain();
    rise.type = 'sine';
    rise.frequency.setValueAtTime(300, t0);
    rise.frequency.linearRampToValueAtTime(620, t0 + 1.5);
    rg.gain.setValueAtTime(0.0001, t0);
    rg.gain.linearRampToValueAtTime(0.35, t0 + 0.25);
    rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.65);
    rise.connect(rg); rg.connect(out);
    rise.start(t0); rise.stop(t0 + 1.7);
    // ② 破裂「啵」：80ms 频降（640→160Hz）短促冲击（与 CSS 破裂帧 ~1.7s 对齐）
    const popT = t0 + 1.68;
    const pop = ctx.createOscillator();
    const pg = ctx.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(640, popT);
    pop.frequency.exponentialRampToValueAtTime(160, popT + 0.08);
    pg.gain.setValueAtTime(0.9, popT);
    pg.gain.exponentialRampToValueAtTime(0.0001, popT + 0.1);
    pop.connect(pg); pg.connect(out);
    pop.start(popT); pop.stop(popT + 0.12);
    // ③ 星尘碎裂：1200Hz 轻灵短音（破裂点齐发）
    const spark = ctx.createOscillator();
    const sg = ctx.createGain();
    spark.type = 'sine';
    spark.frequency.value = 1200;
    sg.gain.setValueAtTime(0.5, popT + 0.04);
    sg.gain.exponentialRampToValueAtTime(0.0001, popT + 0.35);
    spark.connect(sg); sg.connect(out);
    spark.start(popT + 0.04); spark.stop(popT + 0.4);
  } catch { /* 合成失败 ⇒ 静默（音效永不阻断动效） */ }
}
