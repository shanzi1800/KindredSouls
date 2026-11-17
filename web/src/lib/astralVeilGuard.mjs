/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E143-ASTRAL-VEIL-GUARD（主公军令 2026-11-17）：星灵封印护栏纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（模块二）：
 *   · 对内 sanitizeCompanionPersonaTone：抹除 AI 机械腔（作为一个AI/根据系统
 *     数据/首先其次最后序列/综上所述）——词组级闭集剥离，挂 emitDelta 唯一
 *     出流口（对齐 E142.1 品牌清洗形制：逐 delta 独立清洗＋双空格归一；
 *     跨分片断词残留为已知边界，prompt 戒律为主闸）；
 *   · 对外 interceptAstralProbe：零 Token 正则前置安检（SSE 建流前，门控
 *     先于 header），拦多语种越狱句式；命中即零模型帧注入 SSE 契约（
 *     emitDelta 一帧挡回语＋done 帧，客户端零改动）；
 *   · 输出侧内部标识脱敏 stripInternalMarkers：内部工程记号静默剥离
 *     （同挂 emitDelta，双空格归一）；
 *   · astralRateLimiter：滑动窗口限流（外网单 IP 每分钟聊天 ≤15/报告 ≤10）
 *     ——回环 127.0.0.1/localhost/::1 及携带 x-ks-internal-test 头的自动化
 *     回归请求 100% 豁免（军令防误伤铁律 1：严禁阻塞 FULL_EXIT 跑测速度）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；禁词表宁窄勿宽（铁律 19：
 *    宁漏勿杀，防撞西英常规词）；fail-closed 绝不臆造。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ═══════════ 六语星灵封印挡回语（军令原文逐字——命中探测即返回）═══════════ */
export const L_ASTRAL_VEIL_REJECTION = Object.freeze({
  zh: '星盘里的底层契约受星灵封印，可不能用咒语硬撬哦✨',
  en: 'The deeper astral covenant is sealed by starlight—no peeking behind the veil✨',
  fr: 'Les secrets du grimoire astral sont scellés, inutile de forcer le sort✨',
  es: 'Los secretos del cosmos están sellados, ningún conjuro puede forzarlos✨',
  th: 'ความลับแห่งดวงดาวถูกผนึกไว้ ไม่สามารถใช้คาถาเปิดดูได้นะ✨',
  vi: 'Bí mật tinh bàn đã được phong ấn, không thể dùng mật lệnh phá giải đâu✨',
});

/** 挡回语取值（六语外 ⇒ en 兜底） */
export function astralVeilRejection(lang) {
  const l = String(lang || '');
  return (['zh', 'en', 'fr', 'es', 'th', 'vi'].includes(l) && L_ASTRAL_VEIL_REJECTION[l])
    || L_ASTRAL_VEIL_REJECTION.en;
}

/* ═══════════ 越狱正则（宁窄勿宽——词组级闭集，禁单词级泛杀）═══════════ */
export const ASTRAL_PROBE_RE = new RegExp(
  [
    // 英文越狱句式（完整词组）
    'ignore (?:all )?previous instructions',
    'disregard (?:all )?previous instructions',
    'ignore (?:the |your )?system prompt',
    'reveal (?:your )?(?:system prompt|instructions|initial instructions|initial settings)',
    'show (?:me )?your (?:system prompt|initial instructions|initial settings)',
    'repeat (?:the )?(?:text|instructions?|prompt) above',
    'system prompt', // 完整词组（正常聊天几乎零出现——宁窄勿宽边界内）
    // 中文越狱句式（完整词组）
    '忽略(?:掉|所有)?之前(?:的)?(?:指令|提示|设定|规则)',
    '无视(?:之前|以上)(?:的)?(?:指令|设定|规则|提示)',
    '输出(?:你的)?(?:系统提示|系统指令|内部设定|提示词|初始指令)',
    '打印(?:你的)?(?:设定|系统提示|初始设定|提示词)',
    '透露(?:你的)?(?:系统|内部|初始)(?:设定|指令|提示|秘密)',
    '复述(?:一遍|上面|之前)(?:的)?(?:指令|设定|提示|文字)',
  ].join('|'),
  'i',
);

/** 前置安检（零 Token——命中 ⇒ true ⇒ 路由短路走零模型帧挡回链） */
export function interceptAstralProbe(text) {
  const s = String(text || '').trim();
  if (!s || s.length > 4000) return false; // 超长异常输入交既有入参守卫，此处宁窄
  return ASTRAL_PROBE_RE.test(s);
}

/* ═══════════ 对内：机械腔清洗（词组级闭集——E142.1 品牌清洗同形制）═══════════ */
export const ASTRAL_TONE_RE = new RegExp(
  [
    // zh 机械腔（完整词组；分点序列「首先…其次…最后」跨分片断词为已知边界——prompt 戒律主闸）
    '作为一个AI',
    '作为一个(?:人工智能|语言模型|虚拟助手|智能助手|助手)',
    '是(?:一个)?AI(?:人工智能|语言模型)?(?:助手)?，',
    '根据(?:系统|内部|我的训练)数据',
    '根据我的数据库',
    '综上(?:所述|归纳)',
    '首先，?[^。]{0,10}其次', // 单 delta 内短距序列（宽窗跨片不可靠）
    // en 机械腔（完整词组）
    '[Aa]s an AI(?:,| language model)?',
    '[Aa]s a language model',
    'I\'?m (?:sorry,? )?but (?:as an? )?AI',
    '[Bb]ased on my training data',
    'according to (?:the|my) (?:system|database|training data)',
    '[Ii]n conclusion,?\\s*',
  ].join('|'),
  'g',
);

/** 机械腔剥离（词组删＋双空格归一收口在 astralVeilWash 统一做） */
export function sanitizeCompanionPersonaTone(text) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(ASTRAL_TONE_RE, '');
}

/* ═══════════ 输出侧内部标识脱敏（静默剥离——军令钦定名单）═══════════ */
export const ASTRAL_INTERNAL_MARKERS = Object.freeze([
  'CLIENT TIME SYNC', 'companionTopicQueue', 'dailyNameCallQuota', 'ks_user_name',
  'SoulBondState', 'AstralVeilGuard', 'E1421', 'E143', 'SANCTUARY WHISPER',
  'buildFamiliarChatSystemPrompt', 'resolveFamiliarChatAuth', 'ks_soul_bond_state',
  'ks_astral_resonance_log', 'AstralMemoryBadge',
]);

const ASTRAL_INTERNAL_RE = new RegExp(
  ASTRAL_INTERNAL_MARKERS.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g',
);

/** 内部标识剥离（命中即静默删除；双空格归一收口在 astralVeilWash） */
export function stripInternalMarkers(text) {
  if (typeof text !== 'string' || !text) return text;
  return text.replace(ASTRAL_INTERNAL_RE, '');
}

/**
 * 出流口统一清洗（emitDelta 唯一挂点消费——对齐 E142.1 _e1421BrandWash 形制）：
 *   机械腔剥离 → 内部标识剥离 → 双空格归一。
 * 逐 delta 独立纯函数（跨分片断词残留为已知边界，prompt 戒律为主闸——与
 * E142.1 品牌清洗一致声明）。
 */
export function astralVeilWash(text) {
  if (typeof text !== 'string' || !text) return text;
  return sanitizeCompanionPersonaTone(stripInternalMarkers(text)).replace(/ {2,}/g, ' ');
}

/* ═══════════ 星历限流器（滑动窗口＋军令防误伤铁律 1 豁免）═══════════ */

/** 军令钦定限流阈值：外网单 IP 每分钟聊天 ≤15 / 报告测算 ≤10 */
export const ASTRAL_RATE_LIMITS = Object.freeze({
  chat: Object.freeze({ limit: 15, windowMs: 60_000 }),
  report: Object.freeze({ limit: 10, windowMs: 60_000 }),
});

/** 回环地址闭集（军令钦定：127.0.0.1 / localhost / ::1） */
export const ASTRAL_LOOPBACK_IPS = Object.freeze(['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1']);

/** 豁免判定：回环地址 或 携带内部测试标识头（x-ks-internal-test）⇒ 100% 放行 */
export function isRateLimitExempt(ip, headers) {
  const ipStr = String(ip || '').trim();
  if (ASTRAL_LOOPBACK_IPS.includes(ipStr)) return true;
  try {
    const h = headers || {};
    const get = (k) => (typeof h.get === 'function' ? h.get(k) : h[String(k).toLowerCase()]);
    const v = get('x-ks-internal-test');
    return String(v || '').trim() !== '';
  } catch {
    return false;
  }
}

/**
 * 滑动窗口限流器工厂（内存 Map<`${bucket}|${ip}`, timestamps[]>——重部即清零）。
 * checkBucket：豁免态恒放行；超窗过期戳滚动清理（防 Map 无限膨胀）。
 */
export function createAstralRateLimiter() {
  const windows = new Map();
  return {
    /** @returns {{ok: boolean, limit: number, windowMs: number}} ok=false ⇒ 调用方返 429 */
    check({ ip, bucket, exempt }) {
      const cfg = (bucket === 'report') ? ASTRAL_RATE_LIMITS.report : ASTRAL_RATE_LIMITS.chat;
      if (exempt) return { ok: true, ...cfg }; // 军令防误伤铁律 1：回环/测标 100% 放行
      const key = `${cfg === ASTRAL_RATE_LIMITS.report ? 'report' : 'chat'}|${String(ip || '')}`;
      const now = Date.now();
      let arr = [];
      const raw = windows.get(key);
      if (Array.isArray(raw)) arr = raw.filter((ts) => now - ts < cfg.windowMs);
      if (arr.length >= cfg.limit) {
        windows.set(key, arr); // 记录在案（滚动窗口维持）但不新增
        return { ok: false, ...cfg };
      }
      arr.push(now);
      windows.set(key, arr);
      if (windows.size > 5000) windows.clear(); // 极端防膨胀护栏（重部同语义）
      return { ok: true, ...cfg };
    },
  };
}
