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

function _aspectItems(list, i18n, lang) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const x = (list[i] && typeof list[i] === 'object') ? list[i] : {};
    const aspKey = _aspectKey(x.aspect);
    // 缺 a/b 或相位名未登记 ⇒ 该条**整条剔除**（绝不静默编造配对）
    if (typeof x.a !== 'string' || typeof x.b !== 'string' || !aspKey) continue;
    if (!TERMS_DICT.domains.planetsShort[x.a] || !TERMS_DICT.domains.planetsShort[x.b]) continue;
    const a = termCard('planetsShort', x.a, lang);
    const b = termCard('planetsShort', x.b, lang);
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
