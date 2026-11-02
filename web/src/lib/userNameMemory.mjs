/**
 * userNameMemory.mjs —— 用户姓名/昵称静默捕获核（E118-刀一/刀二/刀四 · 主公军令 2026-11-02）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：根治灵宠「跨日失忆」——会话历史（dailyChatSession）受当日 24:00
 * 过期管辖，而**用户身份档案永不过期**：
 *   缓存键  ks_familiar_profile_${chartSig}（E49 按盘隔离铁律：与认领档/会话档
 *            同口径绑定星盘签名，严禁全局裸存）
 *   形状    FamiliarUserProfile {
 *             chartSig: string,
 *             displayName: string,     // 提取真名/昵称（1~24 字符）
 *             nameCapturedAt: number,  // 首次捕获毫秒时间戳
 *             updatedAt: number,       // 最近变更毫秒时间戳
 *           }
 * 刀一：多语言姓名意图捕获——中英正则（我叫/叫我/我是/你可以叫我/我的名字是/
 *        喊我 + my name is / i am / call me / i'm），假阳性黑名单熔断
 *        （射手座/男生/单身/程序员/student/single 等状态词绝不误存）。
 * 刀二：档案读写（形状守卫 fail-soft——坏档/隐私模式/写满额一律静默降级，
 *        绝不阻断对话流；normalizeFamiliarRecord 白名单会剥离未知字段 ⇒ 独立键）。
 * 刀四：跨日唤醒首语带名——六语前缀装配器 prependUserName（有名字带名、
 *        无名字原样透传，零 i18n 新键）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络；storage 注入可单测）；
 *    静态字面量键名；服务端 `_e118DisplayName` 二次形状守卫独立守备。
 */

/** 军令钦定键名：ks_familiar_profile_${chartSig} */
export function userNameProfileKey(chartSig) {
  return `ks_familiar_profile_${String(chartSig || 'anon')}`;
}

/* ═══════════ 刀一：姓名意图捕获（正则 + 假阳性黑名单熔断）═══════════ */

/** 中文口语尾缀虚词（「阿山就好啦」→「阿山」）：循环剥离至稳定 */
const ZH_TAIL_FILLERS = ['就好啦', '就好', '而已', '啦', '呀', '啊', '呢', '吧', '哈', '嘛', '哦', '喽'];

/** 中文假阳性黑名单——状态词/星座/身份词绝不误存为名字（军令钦定口径） */
const ZH_BLACKLIST = new Set([
  '男生', '女生', '男人', '女人', '男孩', '女孩', '帅哥', '美女', '单身', '已婚', '恋爱中',
  '同性恋', '双性恋', '跨性别', '直男', '直女', '程序员', '工程师', '设计师', '老师', '医生',
  '护士', '律师', '学生', '上班族', '打工人', '老板', '富婆', '宅男', '宅女', '社恐', '社牛',
  '射手座', '天蝎座', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座',
  '摩羯座', '水瓶座', '双鱼座', '星座', '中国人', '外国人', '南方人', '北方人', '广东人',
  '上海人', '北京人', '台湾人', '香港人', '本地人', '过来人', '有缘人', '明白人', '懂事',
  '认真', '努力', '开心', '难过', '抱歉', '害羞', '幽默', '浪漫', '专一', '花心',
]);

/** 中文虚词/代词/动词字符——真名里几乎不会出现（「我是真的想你」⇒熔断） */
const ZH_PARTICLE_CHARS = '的了很也很都还想念爱喜欢要会在能没太不和与你我他她它们个对错真假好棒'.split('');

/** 英文假阳性黑名单——状态词/形容词/国别词（军令钦定口径 + 常见后继） */
const EN_BLACKLIST = new Set([
  'a', 'an', 'the', 'male', 'female', 'man', 'woman', 'boy', 'girl', 'guy', 'lady', 'single',
  'married', 'divorced', 'taken', 'student', 'teacher', 'doctor', 'nurse', 'engineer',
  'programmer', 'developer', 'designer', 'lawyer', 'boss', 'worker', 'adult', 'teenager',
  'gay', 'lesbian', 'bisexual', 'trans', 'straight', 'chinese', 'american', 'thai',
  'vietnamese', 'french', 'spanish', 'japanese', 'korean', 'indian', 'foreigner', 'local',
  'fine', 'ok', 'okay', 'good', 'well', 'bad', 'sad', 'happy', 'tired', 'bored', 'lonely',
  'busy', 'free', 'ready', 'done', 'back', 'here', 'sorry', 'glad', 'shy', 'old', 'young',
  'new', 'first', 'last', 'only', 'still', 'just', 'very', 'really', 'so', 'too', 'not',
  'yours', 'mine', 'hers', 'his', 'theirs', 'alone', 'afraid', 'angry', 'upset', 'lost',
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
  'hundred', 'thousand', 'million', 'years', 'old', '岁',
]);

/** 中文捕获模式（按优先级长前缀在前）：叫我 X / 我叫 X / 我是 X / 你可以叫我 X /
 *  我的名字是 X / 名字是 X / 喊我 X —— 捕获组止于标点/空白，≤12 字 */
const ZH_PATTERNS = [
  /(?:你可以叫我|我的名字是|名字是|叫我|我叫|我是|喊我)\s*([^，。！？!?;；,.\s]{1,12})/,
];

/** 英文捕获模式（大小写不敏感；捕获组仅字母含重音符，≤20 字符） */
const EN_PATTERNS = [
  /(?:my name is|name's|call me|i am|i'm|im)\s+([A-Za-zÀ-ÖØ-öø-ÿ]{1,20})/i,
];

/** 剥离中文尾缀虚词（循环至稳定：「阿山就好啦」→「阿山」） */
function stripZTail(tok) {
  let s = tok;
  for (let i = 0; i < 4; i++) {
    let changed = false;
    for (const f of ZH_TAIL_FILLERS) {
      if (s.length > f.length && s.endsWith(f)) { s = s.slice(0, -f.length); changed = true; break; }
    }
    if (!changed) break;
  }
  return s;
}

/** 中文候选词熔断校验：黑名单 / 虚词字符 / 长度（真名 ≤ 8 个 CJK 字符） */
function zhCandidateOk(tok) {
  if (!tok) return null;
  const s = stripZTail(String(tok));
  if (!s) return null;
  if (s.length < 1 || s.length > 8) return null;
  if (ZH_BLACKLIST.has(s)) return null;
  for (const ch of s) if (ZH_PARTICLE_CHARS.includes(ch)) return null;
  if (ZH_BLACKLIST.has(s)) return null;
  return s;
}

/** 英文候选词熔断校验：黑名单 / 长度（1~20 字母）＋首字母规范化 */
function enCandidateOk(tok) {
  if (!tok) return null;
  const s = String(tok).trim();
  if (s.length < 1 || s.length > 20) return null;
  if (EN_BLACKLIST.has(s.toLowerCase())) return null;
  if (/^[a-z]+$/.test(s) && s.length <= 2) return null; // 「I am ok」类两字母小写短词熔断
  // 仅保留首字母大写 + 其余小写的规范形态（Emma / North / ALICE → Alice）
  const norm = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  if (EN_BLACKLIST.has(norm.toLowerCase())) return null;
  return norm;
}

/**
 * 刀一主函数：从用户消息提取姓名/昵称意图（静默捕获）。
 * @param {string} text 用户消息原文
 * @returns {string|null} 提取出的名字（已熔断校验）；无意图/假阳性 ⇒ null
 */
export function extractUserNameIntent(text) {
  const raw = (typeof text === 'string') ? text : '';
  if (!raw || raw.length > 300) return null;
  // ① 中文模式
  for (const p of ZH_PATTERNS) {
    const m = raw.match(p);
    if (m) {
      const ok = zhCandidateOk(m[1]);
      if (ok) return ok;
    }
  }
  // ② 英文模式
  for (const p of EN_PATTERNS) {
    const m = raw.match(p);
    if (m) {
      const ok = enCandidateOk(m[1]);
      if (ok) return ok;
    }
  }
  return null;
}

/* ═══════════ 刀二：身份档案持久化（永不过期 · 形状守卫 fail-soft）═══════════ */

/** 档案形状守卫：chartSig 严格相等 + displayName 1~24 字符 + 时间戳有限数 */
function profileOk(v, chartSig) {
  return !!(v && typeof v === 'object'
    && String(v.chartSig || '') === String(chartSig || '')
    && typeof v.displayName === 'string'
    && v.displayName.trim().length >= 1 && v.displayName.trim().length <= 24
    && Number.isFinite(Number(v.nameCapturedAt))
    && Number.isFinite(Number(v.updatedAt)));
}

/**
 * 读档（开舱/发送时）——永不过期；无档/坏档/隐私模式 ⇒ null。
 * @param {Storage|null} store localStorage 注入
 * @param {string} chartSig 星盘签名（档案按盘隔离真源）
 */
export function readUserNameProfile(store, chartSig) {
  try {
    if (!store || typeof store.getItem !== 'function') return null;
    const raw = store.getItem(userNameProfileKey(chartSig));
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!profileOk(v, chartSig)) { store.removeItem(userNameProfileKey(chartSig)); return null; }
    return {
      chartSig: String(v.chartSig),
      displayName: String(v.displayName).trim(),
      nameCapturedAt: Number(v.nameCapturedAt),
      updatedAt: Number(v.updatedAt),
    };
  } catch {
    try { if (store && typeof store.removeItem === 'function') store.removeItem(userNameProfileKey(chartSig)); } catch { /* noop */ }
    return null; // 坏 JSON/隐私模式 ⇒ 即弃即清（fail-soft）
  }
}

/**
 * 写档（捕获命中即静默写入；改名 ⇒ 覆写并刷新 updatedAt，nameCapturedAt 留初值）。
 * @returns {boolean} 写入成败（写满额/隐私模式 ⇒ false，绝不抛错阻断对话）
 */
export function writeUserNameProfile(store, chartSig, displayName, now = Date.now()) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    const name = String(displayName || '').trim();
    if (name.length < 1 || name.length > 24) return false;
    const prev = readUserNameProfile(store, chartSig);
    const profile = {
      chartSig: String(chartSig || 'anon'),
      displayName: name,
      nameCapturedAt: prev ? prev.nameCapturedAt : Number(now),
      updatedAt: Number(now),
    };
    store.setItem(userNameProfileKey(chartSig), JSON.stringify(profile));
    return true;
  } catch {
    return false; // iOS 无痕/写满额 ⇒ 静默降级（对话流绝不因此中断）
  }
}

/* ═══════════ 刀四：跨日唤醒首语带名（六语前缀装配 · 零 i18n 新键）═══════════ */

/** 六语称谓分隔符（军令钦定同构模板）：zh「，」/ en-fr-es「, 」/ vi「 ơi, 」/ th 空格 */
const LANG_PREFIX_SEP = {
  zh: '，',
  en: ', ',
  fr: ', ',
  es: ', ',
  th: ' ',
  vi: ' ơi, ',
};

/**
 * 刀四主函数：跨日首语带名前缀装配。
 * @param {string} lang 当前语种（zh/en/fr/es/th/vi；未知 ⇒ 逗号通用）
 * @param {string} userName 已捕获的用户名字；空 ⇒ 原样透传（无名字兜底＝今日现行为）
 * @param {string} base helloDaily 基础句（dailyFortune {{color}}/{{num}} 插值后）
 * @returns {string} 「North，新的一天，星轨又为你转动啦！…」同构六语
 */
export function prependUserName(lang, userName, base) {
  const b = String(base || '');
  const n = String(userName || '').trim();
  if (!n || n.length > 24) return b;
  const sep = LANG_PREFIX_SEP[lang] || ', ';
  return `${n}${sep}${b}`;
}
