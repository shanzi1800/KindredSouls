// ═══════════════════════════════════════════════════════════════════════
// ── V475: DeepSeek 采样参数单一真源（纯函数，可单测） ──
// ═══════════════════════════════════════════════════════════════════════
//
// 【为什么这个模块必须存在】
// 2026-09-29 生产事故：中文年报全文"每隔两三个字缺一个字"（"太阳双子座"→"太双"、
// "先知神谕 · 财富启示录"→"先 · 财录"），且应数万字的报告 5199 字就提前收笔。
//
// 【根因】callDeepSeekStream 对年报沿用月报的 frequency_penalty=0.3 /
//   presence_penalty=0.3 / repetition_penalty=1.05。这三个惩罚按 token 出现频率
//   压制后续生成——而年报 Prompt 是天文级术语密度（P1.1 真值表要求 COPY EXACTLY，
//   "座/星/阳/亮/王/在/的" 在 Prompt 里已出现成百上千次）→ 模型从第一个 token 起
//   就被禁止再说这些字 → 全文系统性缺字 + 被惩罚逼到提前烂尾。
//
// 【对照实验铁证】(2026-09-29, 同一 astro 密集 prompt, deepseek-flash)
//   现行参数: 5865 字, "座"=96, "在"=126, "的"=75
//   零惩罚:   6601 字, "座"=199, "在"=207, "的"=160
//   生产事故文本与该退化模式逐字吻合（"的"在 5199 字中近乎绝迹）。
//
// 【变更纪律】月报参数经 V470/V472 多轮封仓验证保持原样（最小爆炸半径）；
//   仅年报路径改零惩罚 + 扩容 max_tokens。改这里的任何返回值都属于
//   "输出链变更" → 必须 bump wealth 缓存 key！

export function buildDeepSeekSamplingParams(reportType, lang) {
  if (reportType === 'monthly') {
    // 🛡️ V437-fix 沿革: th/vi BPE 膨胀 → 16384; zh 12000; 其余 10000
    // 月报参数经过多轮封仓验证，保持原样（最小爆炸半径）
    return {
      max_tokens: (lang === 'th' || lang === 'vi') ? 16384 : (lang === 'zh' ? 12000 : 10000),
      temperature: 0.7,
      frequency_penalty: lang === 'vi' ? 0 : 0.3,
      presence_penalty: lang === 'vi' ? 0 : 0.3,
      repetition_penalty: lang === 'vi' ? 1.08 : 1.05,
    };
  }
  if (reportType === 'yearly') {
    // 🛡️ V475: 年报必须零惩罚 + 扩容。
    // 旧值 max_tokens=8000 也是错的（月报都有 12000，年报却只有 8000）。
    return {
      max_tokens: 16384,
      temperature: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
      repetition_penalty: 1,
    };
  }
  // 'once'(先天财富DNA) 等短报告：维持历史参数
  return {
    max_tokens: 8000,
    temperature: 0.7,
    frequency_penalty: 0.3,
    presence_penalty: 0.3,
    repetition_penalty: 1.05,
  };
}
