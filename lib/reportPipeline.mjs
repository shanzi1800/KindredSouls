/**
 * reportPipeline.mjs — 灵宠合盘「多语言标准化报告 Payload」生成管线（Gate 40 · 甲线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 战役目标（军师《Gate 40 骨架攻坚》令）：
 *   依托 SwissEph 计算核心 + 已锁死的 astro_terms_dict.json 六语真值字典，
 *   打通「双人时空真值 → 结构化张量 → 多语言标准化报告 Payload」的端到端流水线。
 *
 * 🔴 本模块是**纯逻辑核**（pure core）：
 *   · 零网络 / 零子进程 / 零 LLM / 零 DOM —— 端到端可单测（不起 python、不碰浏览器）；
 *   · 不发明任何术语：一切行星/星座/相位/学说词条**只从字典取词**（经 astroTerms.js）；
 *   · 不持有任何本地化文案：报告字段名一律由调用方注入 E40+ 真值资产（SYNASTRY_I18N）；
 *   · 结构化真值只来自引擎张量（truth），**绝不从 LLM 正文反推**（禁幻觉穿透）。
 *
 * 状态机（军师裁决 ①：内部英文状态机，前端只识可用性/降级）：
 *   pending → calculating → assembling → ready（成功终态）
 *        ↘         ↘            ↘
 *        failed（fail-closed 旁路终态）
 *   🔴 「降级」不是状态，而是 ready 上的 degraded 标记 —— 与 E38/E40+ 三态纪律同源。
 *   🔴 对外视图模型 toViewModel() **只**暴露 truth.available 与 degraded，
 *      流水线内部瞬态绝不泄漏到展示层（前后端彻底解耦）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { TERMS_DICT } from '../astroTerms.js';
import { createHash } from 'node:crypto';  // Gate 41：Report ID 确定性派生（纯哈希，零网络）

/** Payload 契约版本（结构变更必须同步升版，闸门锁定） */
export const REPORT_PAYLOAD_SCHEMA = 'report_payload.v1';

/** 流水线状态全集（英文内部状态机） */
export const PIPELINE_STATES = Object.freeze(['pending', 'calculating', 'assembling', 'ready', 'failed']);

/** 终态：ready（成功）｜failed（fail-closed 旁路） */
export const TERMINAL_STATES = Object.freeze(['ready', 'failed']);

/**
 * 合法迁移表（白名单）。
 * 🔴 fail-closed 语义：任何不在白名单内的迁移一律**拒绝**（返回 false），绝不隐式跳步；
 *    已知状态一旦进入终态即**不可再迁出**。
 */
const TRANSITIONS = Object.freeze({
  pending: Object.freeze(['calculating', 'failed']),
  calculating: Object.freeze(['assembling', 'failed']),
  assembling: Object.freeze(['ready', 'failed']),
  ready: Object.freeze([]),
  failed: Object.freeze([]),
});

/** 四段骨架锚（E39 唯一真源；禁止增删第四轴） */
export const SECTION_ICONS = Object.freeze(['🎯', '⚡', '💡', '🌿']);

/** 六语（由字典元信息推导，禁止另写语言清单） */
export const PIPELINE_LANGS = Object.freeze([...TERMS_DICT.meta.langs]);
const LANGS = PIPELINE_LANGS;

const BUDGETS = TERMS_DICT.slots.budgets;
const ASSIGNMENT = TERMS_DICT.slots.assignment;

/**
 * 槽位超预算时的**降语域**通路（labelCard → chip）。
 * 例：星座「ราศีมีน」超 budget 时退到 signsShort「มีน」；仍未收敛则按 hardCap 字素裁剪。
 * 只登记「确有更紧凑语域」的域；未登记域直接走 hardCap 裁剪。
 */
const REGISTER_FALLBACK = Object.freeze({
  signs: 'signsShort',
  planets: 'planetsShort',
  aspects: 'aspectsShort',
  elementsLong: 'elements',
  modesLong: 'modes',
});

// ── 字素计数（Intl.Segmenter：泰/越语组合符不误判为多字）─────────────────────
const SEG = new Intl.Segmenter('en', { granularity: 'grapheme' });

/** 字素长度 */
export function graphemes(str) {
  return [...SEG.segment(String(str == null ? '' : str))].length;
}

/** 字素安全裁剪（超预算时以省略号收束；绝不劈开组合字素簇） */
export function fitGraphemes(str, maxGraphemes) {
  const s = String(str == null ? '' : str);
  const parts = [...SEG.segment(s)].map((x) => x.segment);
  const cap = Number.isFinite(maxGraphemes) && maxGraphemes > 0 ? Math.floor(maxGraphemes) : 0;
  if (parts.length <= cap) return s;
  if (cap <= 1) return parts.slice(0, cap).join('');
  return parts.slice(0, cap - 1).join('') + '…';
}

// ═══════════════════════════════════════════════════════════════
// 1. 状态机
// ═══════════════════════════════════════════════════════════════

/**
 * 创建一份报告生成管线（单次报告一个实例，状态私有、不可外部篡改）。
 */
export function createReportPipeline() {
  let state = PIPELINE_STATES[0];
  const failures = [];

  const pipeline = {
    get state() { return state; },
    isTerminal() { return TERMINAL_STATES.includes(state); },
    /** 预览：本状态是否允许迁往 next（不产生副作用） */
    can(next) { return TRANSITIONS[state].includes(next); },
    /**
     * 正式迁移。返回 boolean：
     *   true  = 迁移成功；
     *   false = 非法迁移被**拒绝**（状态不变，fail-closed）。
     * 未知状态名一律抛错（防拼写错误造成静默假绿）。
     */
    advance(next) {
      if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, next)) {
        throw new Error(`reportPipeline: 未知状态 "${next}"（合法值：${PIPELINE_STATES.join('|')}）`);
      }
      if (!TRANSITIONS[state].includes(next)) return false;
      state = next;
      return true;
    },
    /** fail-closed 旁路：记录原因并进入 failed（已在终态则拒绝，返回 false） */
    fail(reason) {
      if (TERMINAL_STATES.includes(state)) return false;
      failures.push(String(reason == null || reason === '' ? 'unknown' : reason));
      state = 'failed';
      return true;
    },
    /** 只读快照（内部诊断用；**不得**下发前端） */
    snapshot() {
      return { state, terminal: TERMINAL_STATES.includes(state), failures: failures.slice() };
    },
  };
  return pipeline;
}

// ═══════════════════════════════════════════════════════════════
// 2. 字典取词层（唯一取词入口 · 槽位预算 + 降语域 + hardCap）
// ═══════════════════════════════════════════════════════════════

const _slotBudget = (domain) => {
  const slot = ASSIGNMENT[domain];
  const b = slot ? BUDGETS[slot] : null;
  return (b && Number.isFinite(b.maxGraphemes)) ? b.maxGraphemes : BUDGETS.hardCap.maxGraphemes;
};

/**
 * 取一个术语卡片条目（领域 + 英文键 + 语种）⇒ { domain, key, label, slot }。
 *
 * 🔴 三条纪律：
 *   ① 缺键/缺域 ⇒ **抛错**（拒绝静默伪造术语）；
 *   ② 超所属槽位预算 ⇒ 走降语域通路（若登记）后重新评估；
 *   ③ 仍超 hardCap ⇒ 字素安全裁剪（三层溢出防御之第 1、2 层；第 3 层在渲染层 CSS）。
 */
export function termCard(domain, key, lang) {
  const dom = TERMS_DICT.domains[domain];
  if (!dom || !dom[key]) throw new Error(`reportPipeline: 字典缺条目 ${domain}.${key}`);
  const L = LANGS.includes(lang) ? lang : 'zh';
  let useDomain = domain;
  let label = dom[key][L];
  const cap = _slotBudget(domain);
  if (graphemes(label) > cap) {
    const fb = REGISTER_FALLBACK[domain];
    if (fb && TERMS_DICT.domains[fb] && TERMS_DICT.domains[fb][key]
      && graphemes(TERMS_DICT.domains[fb][key][L]) < graphemes(label)) {
      useDomain = fb;
      label = TERMS_DICT.domains[fb][key][L];
    }
  }
  const hardCap = BUDGETS.hardCap.maxGraphemes;
  if (graphemes(label) > hardCap) label = fitGraphemes(label, hardCap);
  return { domain: useDomain, key, label, slot: ASSIGNMENT[useDomain] || ASSIGNMENT[domain] || 'chip' };
}

// ═══════════════════════════════════════════════════════════════
// 3. 四段壳解析（🎯⚡💡🌿；与前端 reportText.split('\n\n') 渲染粒度严格同源）
// ═══════════════════════════════════════════════════════════════

const LEAD_ICON = /^([\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]+)\s*/u;

/**
 * 纯文本报告 → 四段壳数组 [{ icon, text }]。
 * 无前导图标者 icon=''（视为上一段的续写段落，前端渲染为普通段落）。
 */
export function parseCompatSections(prose) {
  if (typeof prose !== 'string' || prose.trim() === '') return [];
  return prose.split('\n\n')
    .map((b) => b.trim())
    .filter((b) => b !== '')
    .map((block) => {
      const m = LEAD_ICON.exec(block);
      return m ? { icon: m[1], text: block.slice(m[0].length).trim() } : { icon: '', text: block };
    });
}

// ═══════════════════════════════════════════════════════════════
// 4. Payload 装配（schemaVersion = report_payload.v1）
// ═══════════════════════════════════════════════════════════════

/** 报告字段名白名单（一律取自 E40+ 注入的本地化真值资产，本模块零本地化文案） */
const LABEL_KEYS = Object.freeze([
  'precision', 'timed', 'dateLevel', 'harmony', 'hard', 'total', 'ratio',
  'unknown', 'none', 'bonds', 'frictions', 'signatures',
]);

const _num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

/**
 * 相位键归一：引擎（synastry_engine / SYNASTRY_I18N）用**小写**相位名
 * （`trine` / `conjunction`），字典键为 CamelCase（`Trine`）。
 * 映射由字典键序推导（禁手写对照表）；未登记相位名一律返回 null ⇒ 该条剔除。
 */
const ASPECT_KEY_BY_LOWER = Object.freeze(Object.fromEntries(
  Object.keys(TERMS_DICT.domains.aspectsShort).map((k) => [k.toLowerCase(), k]),
));
const _aspectKey = (raw) => ASPECT_KEY_BY_LOWER[String(raw == null ? '' : raw).toLowerCase()] || null;

/** 五相位计数（键序与引擎小写口径同源；缺值补 0，绝不臆造） */
function _aspectCounts(raw) {
  const src = (raw && typeof raw === 'object') ? raw : {};
  const out = {};
  for (const lower of Object.keys(ASPECT_KEY_BY_LOWER)) {
    const v = src[lower];
    out[lower] = (typeof v === 'number' && isFinite(v)) ? v : 0;
  }
  return out;
}

/** 相位三元组 → 本地化短语（模板取自注入资产 pairFmt；词条一律查字典） */
function _pairText(fmt, itemA, aspectLabel, itemB, orb) {
  const tpl = (typeof fmt === 'string' && fmt) ? fmt : '{a}{asp}{b}';
  const orbText = (typeof orb === 'number' && isFinite(orb)) ? String(orb) : '?';
  return tpl
    .replace('{a}', itemA.label)
    .replace('{asp}', aspectLabel)
    .replace('{b}', itemB.label)
    .replace('{orb}', orbText);
}

/**
 * 星体名双域解析（行星 planetsShort + 虚点 points）。
 * 🔴 虚点（北交点/宿命点）为**合法真值**，在羁绊/契约卡中必须保留（不得因过窄而剔除）。
 */
function _bodyTerm(name, lang) {
  if (TERMS_DICT.domains.planetsShort[name]) return termCard('planetsShort', name, lang);
  if (TERMS_DICT.domains.points[name]) return termCard('points', name, lang);
  return null;
}

function _aspectItems(list, i18n, lang) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const x = (list[i] && typeof list[i] === 'object') ? list[i] : {};
    const aspKey = _aspectKey(x.aspect);
    // 缺 a/b 或相位名未登记 ⇒ 该条**整条剔除**（绝不静默编造配对）
    if (typeof x.a !== 'string' || typeof x.b !== 'string' || !aspKey) continue;
    const a = _bodyTerm(x.a, lang);
    const b = _bodyTerm(x.b, lang);
    if (!a || !b) continue;
    const aspect = termCard('aspectsShort', aspKey, lang);
    // 短语用**注入资产**的相位槽位值（含语种内联间隔符，与 renderSynastryBlock 同源同文）；
    // 🔴 该值本身已被 Gate 40 C 组锁定为「字典词干 ± 空白」⇒ 仍属字典派生，非自由机译。
    const aspectSlot = i18n.aspects[aspKey.toLowerCase()] ?? aspect.label;
    out.push({
      id: `${x.a}.${aspKey}.${x.b}`,
      a, b, aspect,
      orb: (typeof x.orb === 'number' && isFinite(x.orb)) ? x.orb : null,
      polarity: (x.polarity === 'harmonious' || x.polarity === 'hard') ? x.polarity : null,
      text: _pairText(i18n.pairFmt, a, aspectSlot, b, x.orb),
    });
  }
  return out;
}


/** 灵宠学说专属词条（dict.domains.familiar）—— 供「学说描述」槽位取词 */
function familiarTerm(key, lang) {
  return termCard('familiar', key, lang);
}

function _buildCards(truth, i18n, lang) {
  const labels = i18n.labels || {};
  const cards = [];
  const bonds = _aspectItems(Array.isArray(truth.bonds) ? truth.bonds : [], i18n, lang);
  const frictions = _aspectItems(Array.isArray(truth.frictions) ? truth.frictions : [], i18n, lang);
  if (bonds.length) cards.push({ id: 'bonds', kind: 'aspectList', titleKey: 'labels.bonds', title: labels.bonds || '', items: bonds });
  if (frictions.length) cards.push({ id: 'frictions', kind: 'aspectList', titleKey: 'labels.frictions', title: labels.frictions || '', items: frictions });

  // 核心羁绊（signatures：tag → [相位]；tag 为引擎内部英文键，仅登记不渲染）
  const sig = (truth.signatures && typeof truth.signatures === 'object') ? truth.signatures : {};
  const sigItems = [];
  for (const tag of Object.keys(sig)) {
    const arr = Array.isArray(sig[tag]) ? sig[tag] : [];
    for (const it of _aspectItems(arr, i18n, lang)) sigItems.push({ ...it, tagId: tag });
  }
  if (sigItems.length) {
    cards.push({ id: 'signatures', kind: 'aspectList', titleKey: 'labels.signatures', title: labels.signatures || '', items: sigItems });
  }
  return cards;
}

/**
 * 装配标准化报告 Payload。
 *
 * 入参：
 *   lang        语种（非法 ⇒ 回退 zh）
 *   reportType  'once' | 'monthly' | 'yearly' | null
 *   truth       引擎张量摘要（buildCompatSynastryTruth 出参；**逐字映射**，禁二次算法）
 *   prose       LLM 生成的 \n\n 纯文本四段（仅进 sections，**绝不反向污染 truth**）
 *   i18n        E40+ 本地化真值资产 SYNASTRY_I18N[lang]（必传；缺失 ⇒ 抛错，拒绝伪造）
 *   generatedAt 可选时间戳（缺省 null ⇒ 保持幂等可测）
 *
 * 🔴 缺 i18n ⇒ 抛错。理由：本地化字段名是本 Payload 的组成部分，凭空虚造即为伪造真值。
 */
export function buildReportPayload(opts) {
  const o = opts || {};
  const lang = LANGS.includes(o.lang) ? o.lang : 'zh';
  const i18n = o.i18n;
  if (!i18n || typeof i18n !== 'object' || !i18n.labels || !i18n.aspects) {
    throw new Error('reportPipeline: 缺少 i18n 真值资产（拒绝在无本地化字段名/相位槽位时伪造 Payload）');
  }
  const truth = (o.truth && typeof o.truth === 'object') ? o.truth : {};
  const available = !!truth.available;
  const precision = (truth.precision === 'timed' || truth.precision === 'date_level') ? truth.precision : null;
  const unknownKeys = Array.isArray(truth.unknown)
    ? truth.unknown.filter((k) => typeof k === 'string' && k !== '' && !!TERMS_DICT.domains.planetsShort[k])
    : [];
  // 🔴 降级 = 可用但精度不足（date_level）。available:false 属「不可用」，另栏处理。
  const degraded = available && precision === 'date_level';

  const truthOut = {
    available,
    degraded,
    precision,
    degradedReason: available
      ? (degraded ? 'date_level' : null)
      : (typeof truth.reason === 'string' && truth.reason ? truth.reason : 'unavailable'),
    harmonious: _num(truth.harmonious),
    hard: _num(truth.hard),
    total: _num(truth.total),
    ratio: (typeof truth.ratio === 'number' && isFinite(truth.ratio)) ? truth.ratio : null,
    counts: _aspectCounts(truth.counts),
    unknown: unknownKeys.map((k) => termCard('planetsShort', k, lang)),
  };

  // 灵宠学说专属词条（dict.domains.familiar）—— 与真值层分离：词条属「本地化命名」，非数值真值
  const terms = {
    synastry: familiarTerm('SynastryChart', lang),
    bond: familiarTerm('FamiliarBond', lang),
    signature: familiarTerm('BondSignature', lang),
    karmic: familiarTerm('KarmicContract', lang),
  };

  const labels = {};
  for (const k of LABEL_KEYS) labels[k] = (i18n.labels[k] == null) ? '' : String(i18n.labels[k]);

  return {
    schemaVersion: REPORT_PAYLOAD_SCHEMA,
    lang,
    reportType: typeof o.reportType === 'string' ? o.reportType : null,
    generatedAt: (typeof o.generatedAt === 'string' && o.generatedAt) ? o.generatedAt : null,
    truth: truthOut,
    terms,
    labels,
    cards: available ? _buildCards(truth, i18n, lang) : [],
    sections: parseCompatSections(o.prose),
  };
}

/**
 * 展示层视图模型 —— 🔴 **只**输出可用性与降级标识。
 * 流水线内部状态（pending/calculating/assembling/failed）**绝不**下发前端。
 */
export function toViewModel(payload) {
  const t = (payload && payload.truth) || {};
  return { available: !!t.available, degraded: !!t.degraded };
}


// ═══════════════════════════════════════════════════════════════════════════
// Gate 41 · 实名持久化层（read-through 复读的纯逻辑底座）
// ───────────────────────────────────────────────────────────────────────────
// 战役目标（军师《双盘真实闭环攻坚令》红线 ④）：
//   report_payload.v1 须具备唯一 Report ID 索引并持久化，支持刷新/二次回访时
//   **无须重新消耗算力**即可秒级复读。
//
// 🔴 仍守纯逻辑核纪律：本层只做「确定性派生 + 行构造 + 反序列化守卫」三件纯函数，
//    零网络（Supabase 调用由 server.js 适配器执行）；零 DDL（落点
//    compatibility_results 的 ai_context/ai_insight 两列零占用，经实证）。
// 🔴 fail-safe：缺任一真值 ⇒ 返回 null（调用方自然走 MISS 生成链路），绝不伪造。
// ═══════════════════════════════════════════════════════════════════════════

/** 持久化契约版本（与 REPORT_PAYLOAD_SCHEMA 双版本线：行结构变更必须升版）
 *  🛡️ E98-⑤（主公军令 2026-10-29）：v1 → v2 一次性作废旧存量——E98-② 年龄差真值
 *  行是全语种事实性修复（旧报告缺该行），且 E98-③④ 法语生肖/塔罗新词形须触达
 *  已生成报告 ⇒ bump 版本令 reportId 全变 ⇒ Gate41 replay 全 MISS ⇒ 强制走
 *  E98 新管道重生（E95 promptSalt 一次性作废同款先例；v1 行 deserialize
 *  fail-closed 天然拒收，无需迁移）。
 *  🛡️ E100-⑤（主公军令 2026-10-28 泰语审核）：v2 → v3 一次性作废旧存量——E100 四刀
 *  （终章印章守卫/泰语八字锁/周易 64 卦真值映射/CJK 输出侧剥离）全部落在月/年报
 *  生成侧，属全语种事实性修复；旧泰语报告含「重生」汉字渗漏、幻觉卦、英文 Bazi
 *  术语、无印章截断尾，长度守卫（≥1200/≥2000）挡不住这些"长而毒"的行 ⇒
 *  bump 版本令 reportId 全变 ⇒ Gate41 replay 全 MISS ⇒ 强制走 E100 新管道重生
 *  （E98-⑤ 同款先例；v2 行 deserialize fail-closed 天然拒收）。
 *  🛡️ E102-⑤（主公军令 2026-10-29 越南语审核）：v3 → v4 一次性作废旧存量——E102 三刀
 *  （vi 八字锁汉越化/64 卦汉越第五列＋卦体结构锁/孤儿句拔除＋vi 输出侧清洗）全部
 *  落在 vi 生成侧；旧 vi 报告含 Qian2 (Modesty) 拼音泄漏、half-combination of the
 *  Metal trine 等英文渗漏、卦 15 卦象倒置、Sửu-Sửu 伪合化、Hướng dẫn vi mô của
 *  Ẩn Sĩ 孤儿句，长度守卫挡不住这些"长而毒"的行 ⇒ bump 令 reportId 全变 ⇒
 *  Gate41 replay 全 MISS ⇒ 强制走 E102 新管道重生（E95/E98/E100 三代同款先例；
 *  v3 行 deserialize fail-closed 天然拒收）。 */
export const COMPAT_PERSIST_VERSION = 'compat_report.v4';

/** Report ID 长度（sha256 hex 截取；128 bit ⇒ 碰撞可忽略） */
export const REPORT_ID_HEX_LEN = 32;

/**
 * 稳定 JSON 序列化（键递归排序）。
 * 🔴 同一输入无论键序如何 ⇒ 同一序列化 ⇒ 同一 Report ID（复读幂等的根基）。
 */
function _stableJson(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(_stableJson).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + _stableJson(v[k])).join(',') + '}';
}

/**
 * 确定性 Report ID 派生。
 * 同输入（双方盘面 + 语种 + 档位 + 出生时空真值）⇒ 同 ID ⇒ 复读幂等；
 * 任一真值不同 ⇒ 不同 ID ⇒ 各自生成（绝不串报告）。
 * 🔴 E95-②（主公军令 2026-10-26）：promptSalt 版本盐——once 档掺 'e95_bazi_lock'
 *   ⇒ E92 八字锁之前的旧 once 存量（含「亥卯未/丑未冲」幻觉回潮）reportId 一次性
 *   全部失效 ⇒ Gate41 replay MISS ⇒ 强制走带硬锁的新生成管道重落库。
 *   月报/年报不掺盐（长度守卫已挡旧壳，且防 live 周期锁误伤已购用户）。
 * @returns 32 位 hex 字符串
 */
export function deriveCompatReportId(opts) {
  const o = opts || {};
  const sig = {
    reportType: typeof o.reportType === 'string' ? o.reportType : null,
    lang: typeof o.lang === 'string' ? o.lang : null,
    d1: o.d1 == null ? null : o.d1,
    d2: o.d2 == null ? null : o.d2,
    promptSalt: typeof o.promptSalt === 'string' && o.promptSalt ? o.promptSalt : null,
    birth: {
      bazi: o.bazi == null ? null : o.bazi,
      zodiac: o.zodiac == null ? null : o.zodiac,
      iching: o.iching == null ? null : o.iching,
      tarot: (o.tarot && o.tarot.name) ? o.tarot.name : null,
      zodiacMeta: Array.isArray(o.zodiacMeta) ? o.zodiacMeta : null,
      userBirthDate: o.userBirthDate || null,
    },
  };
  return createHash('sha256')
    .update(COMPAT_PERSIST_VERSION + '|' + _stableJson(sig))
    .digest('hex')
    .slice(0, REPORT_ID_HEX_LEN);
}

/**
 * 构造持久化行（落点 compatibility_results；零 DDL 复用零占用列）。
 * 🔴 缺任一真值（userId / reportId / insight / payload）⇒ 返回 null ⇒ 调用方跳过落库。
 * @returns {user_id, language, ai_insight, ai_context} 或 null
 */
export function planPersistRow(opts) {
  const o = opts || {};
  const userId = (typeof o.userId === 'string' && o.userId.trim()) ? o.userId.trim() : null;
  const reportId = (typeof o.reportId === 'string' && o.reportId.trim()) ? o.reportId.trim() : null;
  const insight = (typeof o.insight === 'string' && o.insight.trim()) ? o.insight : null;
  const payload = (o.payload && o.payload.schemaVersion === REPORT_PAYLOAD_SCHEMA) ? o.payload : null;
  if (!userId || !reportId || !insight || !payload) return null;
  return {
    user_id: userId,
    language: (typeof o.lang === 'string' && o.lang) ? o.lang : null,
    ai_insight: insight,
    ai_context: {
      persistVersion: COMPAT_PERSIST_VERSION,
      reportId,
      reportType: (typeof o.reportType === 'string' && o.reportType) ? o.reportType : null,
      schemaVersion: REPORT_PAYLOAD_SCHEMA,
      payload,
    },
  };
}

/**
 * 反序列化守卫（复读回放）。
 * 🔴 只认本契约：persistVersion / schemaVersion 双版本 + 最小形状（truth/labels/cards/sections）。
 *    历史行、异构行、被篡改行一律返回 null（fail-closed，绝不回放未知结构）。
 */
export function deserializePersistedPayload(row) {
  const r = row || {};
  const insight = (typeof r.ai_insight === 'string' && r.ai_insight.trim()) ? r.ai_insight : null;
  const ctx = r.ai_context;
  if (!insight || !ctx || typeof ctx !== 'object' || Array.isArray(ctx)) return null;
  if (ctx.persistVersion !== COMPAT_PERSIST_VERSION) return null;
  const p = ctx.payload;
  if (!p || p.schemaVersion !== REPORT_PAYLOAD_SCHEMA) return null;
  if (typeof p.lang !== 'string' || !p.truth || typeof p.truth !== 'object') return null;
  if (!Array.isArray(p.sections) || !Array.isArray(p.cards)) return null;
  if (!p.labels || typeof p.labels !== 'object') return null;
  return {
    insight,
    payload: p,
    reportId: (typeof ctx.reportId === 'string' && ctx.reportId) ? ctx.reportId : null,
  };
}
