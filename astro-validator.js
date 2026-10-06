// astro-validator.js — 天象硬核核验断路器（Astro-Logic Validator）
// ESM module. 在 AI 生成文本交付用户前跑，检测逻辑矛盾；通不过返回 errors，由调用方熔断重调。
//
// 检测规则（军师裁决升级版）：
//  1. 外行星宫位唯一性：土星/木星/冥王星全年位置必须一致且 == 真值（不得既10宫又4宫、不得闪现水瓶）。
//  2. 流月太阳连贯性：一年内太阳不得进入同一星座两次（天文不可能）。
//  3. 星座原型夺舍：双鱼座不得含双子座特质词（灵活多变/处理多重信息/沟通连接/善于学习）。
//  4. 流月太阳与真值表硬比对：从文本定位到某月，则该月太阳星座必须 == 真值表（已升级为硬校验，天文不可篡改）。
//  5. 缝合怪检测：禁止"星座+星座"直接连接（如"处女座金牛座"）。
//  6. 未提供行星禁则：**引擎未供给**的行星（凯龙/北交点）不得声明具体星座或宫位。
//
// 🛡️ E23/R11q ①（2026-10-06）三处窄化 —— 全部是「误报消除」，检出目标与检出能力不变：
//   · 规则 1：接受集合扩张为「流年 ∪ 本命」成对一致（原只认流年 ⇒ 本命合法声明被判矛盾）。
//   · 规则 6：改为**数据驱动**（truth.providedPlanets）—— 火星实为引擎已供给 ⇒ 不再误禁。
//   · 规则「4 硬校验」：改为**锚定月份标题行**（原取标签首次出现 ⇒ 撞邻月标题 ⇒ 误报）。
//   实证：本地复现 s1 zh 固定触发三连重生成（MISS 128.9s）；三处修复后应回到 1 Shot。
//
// 🛡️ E23/R11q ①b（2026-10-06）规则 1 再窄化 —— **引擎实算流年宫位**纳入接受集合（第三源）：
//   病根（本地复现实证 s7 zh 安克雷奇盘）：等宫粗映射（整星座，忽略度数）与引擎真值
//   （Placidus 真宫头）在「星座起始段跨宫头」时**每个宫号差 1**（土/木/冥 5↔6、9↔10、3↔4）；
//   提示词给 LLM 的是引擎真值 ⇒ validator 拿等宫值比对 ⇒ 三连重生成（MISS 111.7s）。
//   治法：接受「流年等宫 ∪ 本命 ∪ 引擎流年」任一**成对一致**（`truth.outerPlanetsEngine`，
//   与生产 `houseLock` **同源同取材**：`astroMatrix.months[0]`）。
//
// 返回 { pass: bool, errors: string[] }

import { SIGN_ORDER_ZH, SIGN_ORDER_EN } from './astro-truth.js';

// 🛡️ E23/R11q ①（2026-10-06）：星座 token 从「任意 1~3 个汉字 + 座」改为**真 12 星座词表**。
//   病根（本地复现 s1 zh attempt 1 实证）：旧式 `([\u4e00-\u9fa5]{1,3}座)` 会把
//   **「土星在同一星座」** 捕获成「同一星座」⇒ 拿它跟真值「白羊座」比对 ⇒ 误报星座矛盾
//   ⇒ 白白多烧一整轮生成。词表由 `SIGN_ORDER_ZH`（与全局真值**同源**）拼装 ⇒ 顺带把
//   「水瓶/射手」等**无量词**写法判为不匹配（宁漏不改，绝不再误报）。
const ZH_SIGN = '(' + SIGN_ORDER_ZH.join('|') + ')';
/** 月份标题行锚定：`^#{1,6} … \d{4}年\d{1,2}月 …`（「2 连贯性」与「4 硬校验」共用同一锚定） */
function _zhMonthHeadingLines(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    if (!/^#{1,6}\s/.test(line)) continue;
    if (!/\d{4}\s*年\s*\d{1,2}\s*月/.test(line)) continue;
    out.push(line);
  }
  return out;
}

export function validateAstroLogic(text, truth, lang = 'zh') {
  const errors = [];
  if (!text || !truth) return { pass: true, errors: [] };

  // ── 1. 外行星宫位唯一性 + 与真值比对 ──
  const planetMap = [
    { name: '土星', key: 'saturn' },
    { name: '木星', key: 'jupiter' },
    { name: '冥王星', key: 'pluto' },
  ];
  for (const p of planetMap) {
    const t = truth.outerPlanets?.[p.key];
    if (!t) continue;
    // 🛡️ E23/R11q ①（2026-10-06）：**本命真值一并接受** —— 病根见 astro-truth.js
    //   `getNatalOuterPlanets` 头注：validator 原只认**流年**年度主题，而年报合法同时陈述
    //   **本命**盘位置（特罗姆瑟 s1 本命 Jupiter=Aquarius/H3 被按流年狮子/H9 判两错 ⇒
    //   每稿必挂 ⇒ 三连重生成 ⇒ MISS 128.9s）。命中「流年或本命」任一**成对一致**即合法。
    // 🛡️ E23/R11q ①b（2026-10-06）：**引擎实算流年宫位**亦为接受源 —— 病根见 astro-truth.js
    //   `getEngineOuterPlanets` 头注（安克雷奇 s7：等宫映射 白羊=第6宫 vs 引擎真值 第5宫，
    //   提示词给 LLM 的是引擎值 ⇒ 拿等宫值比对必误报 ⇒ MISS 111.7s）。
    const nt = truth.natalOuterPlanets?.[p.key] || null;
    const et = truth.outerPlanetsEngine?.[p.key] || null;
    const re = new RegExp(`${p.name}在${ZH_SIGN}第?(\\d+)?宫?`, 'g');
    let m;
    const found = [];
    while ((m = re.exec(text)) !== null) {
      found.push({ sign: m[1], house: m[2] ? parseInt(m[2], 10) : null });
    }
    // 检查是否出现与真值不同的表述（矛盾 / 闪现）
    for (const f of found) {
      // 「(星座,宫位) **成对一致**」判据：分别与流年等宫真值 / 本命真值 / 引擎流年真值比对，
      //   任一**成对**成立即放行。
      //   ⚠️ 不采用「星座命中甲、宫位命中乙」的松耦合 —— 否则「本命星座 + 流年宫位」这类
      //     混合幻觉句会被放过去（检出能力必须保住）。下方 miss 分支亦按成对语义给措辞。
      const _pair = (tt) => !!tt && f.sign === tt.signZH && (f.house === null || f.house === tt.house);
      if (_pair(t) || _pair(nt) || _pair(et)) continue;
      const _ref = et || t;   // 报错措辞优先给**引擎真值**（与提示词同源，最权威）
      const _signExists = nt ? `，本命在${nt.signZH}` : '';
      const _houseExists = nt ? `，本命第${nt.house}宫` : '';
      if (f.sign !== _ref.signZH && !(nt && f.sign === nt.signZH) && !(et && f.sign === et.signZH)) {
        errors.push(`❌ ${p.name}星座矛盾：文本写"${p.name}在${f.sign}"，真值为"${p.name}在${_ref.signZH}"（全年固定${_signExists}）`);
      } else if (f.house !== null) {
        // 星座对上了某套真值，但宫位与**三套都不成对** ⇒ 宫位矛盾
        errors.push(`❌ ${p.name}宫位矛盾：文本写"${p.name}在${f.sign}第${f.house}宫"，真值为"第${_ref.house}宫"（上升${truth.risingSignZH}${_houseExists}）`);
      }
    }
  }

  // ── 2. 流月太阳连贯性：一年内太阳不得进同一星座两次 ──
  // 🛡️ E23/R11q ①（2026-10-06）：改为**只统计月份标题行**（与「4 硬校验」共用同一锚定）。
  //   病根（本地复现 s1 zh attempt 1 实证）：原实现统计**全文任意** `太阳在/进入 X座`
  //   ⇒ 报告正文到处出现「流年太阳在双鱼座」（月度概览/高峰窗口/回顾句）就被计 3 次 ⇒
  //   误报「太阳一年内进入双鱼座3次」（同日另有金牛座 ×2）⇒ 又白烧一轮生成。
  //   判据原意（12 个月标题的太阳星座必须两两不同）由标题行统计**精确等价**保留。
  const monthSigns = [];
  for (const line of _zhMonthHeadingLines(text)) {
    const sm = line.match(new RegExp('太阳在?' + ZH_SIGN));
    if (sm) monthSigns.push(sm[1]);
  }
  const counts = {};
  monthSigns.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
  for (const [sign, cnt] of Object.entries(counts)) {
    if (cnt > 1) {
      errors.push(`❌ 太阳一年内进入"${sign}"${cnt}次（天文不可能，每年每个星座仅一次）`);
    }
  }

  // ── 3. 星座原型夺舍：双鱼座不得含双子座特质 ──
  const forbiddenForPisces = ['灵活多变', '处理多重信息', '沟通连接', '善于学习', '信息掮客', '同时处理', '多重信息'];
  const piscesRe = /双鱼座[^。\n]{0,80}/g;
  let pm;
  while ((pm = piscesRe.exec(text)) !== null) {
    for (const fw of forbiddenForPisces) {
      if (pm[0].includes(fw)) {
        errors.push(`❌ 双鱼座原型被双子座夺舍：含"${fw}"`);
        break;
      }
    }
  }
  // 反向：双子座特质词出现在"双鱼座原型"描述附近
  if (/拥抱你内在的双鱼座原型[^。\n]{0,60}(灵活多变|处理多重信息|沟通连接|善于学习|信息掮客)/.test(text)) {
    errors.push('❌ 双鱼座原型被双子座夺舍（原型描述错配）');
  }

  // ── 4. 本命太阳星座（头部元数据）校验：不得被 AI 幻觉改错 ──
  const natalZH = truth.natalSunSignZH;
  if (lang === 'zh') {
    const m = text.match(/年度星盘:\s*([\u4e00-\u9fa5]{2,3}座)/);
    if (m && m[1] !== natalZH) {
      errors.push(`❌ 本命太阳星座错误：头部写"${m[1]}"，真值为"${natalZH}"（生日 ${truth.birthDate} 天文计算）`);
    }
  } else if (lang === 'en') {
    const enToZh = {};
    SIGN_ORDER_EN.forEach((en, i) => { enToZh[en.toLowerCase()] = SIGN_ORDER_ZH[i]; });
    const m = text.match(/Solar Chart:\s*([A-Z][a-z]+)/);
    if (m) {
      const zh = enToZh[m[1].toLowerCase()];
      if (zh && zh !== natalZH) {
        errors.push(`❌ Natal Sun sign error: header says "${m[1]}" (${zh}), truth is "${natalZH}" (birth ${truth.birthDate})`);
      }
    }
  }

  // ── 5. 缝合怪检测：两个星座名直接连接（如"处女座金牛座"） ──
  // 12个星座中文名，任意两个相连都是非法的（如"双子座白羊座"、"处女座金牛座"）
  const signNames = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  for (let i = 0; i < signNames.length; i++) {
    for (let j = 0; j < signNames.length; j++) {
      if (i === j) continue;
      const combo = signNames[i] + signNames[j];
      if (text.includes(combo)) {
        errors.push(`❌ 缝合怪星座：'${combo}'（天文不存在，将两个星座名直接连接）`);
      }
    }
  }

  // ── 6. 未提供行星禁止声明宫位/星座（凯龙/北交点不在astroMatrix中） ──
  // 🛡️ E23/R11q ①（2026-10-06）：**数据驱动**化 —— 仅对本轮**引擎确实未供给**的行星生效。
  //   病根：`火星` 被硬编码进本表，注释前提「火星不在 AstroMatrix 中」**与事实相反** ——
  //     ① 引擎 `astro_matrix.py --mode natal` 输出 Mars（实测 s1：Mars=Sagittarius/H1）；
  //     ② `v69_client.js:746` FACT_SHEET 逐行星列出 `Mars: <sign> House <n>`；
  //     ③ `buildPerMonthData` 逐月供给 `mars_sign/mars_house`，`PLANET_KEYS_MONTHLY` 含 Mars。
  //   ⇒ **prompt 教模型写火星、校验器却禁止写火星** = 结构性自相矛盾 ⇒ 任何提及火星星座的
  //     中文年报**必然**被判失败 ⇒ 三连重生成（本地 s1 复现：三轮 errors 均含火星项）。
  //   治法：`truth.providedPlanets`（引擎 computed_houses 键集）命中的行星 ⇒ 跳过本禁则；
  //     未传该字段时保持历史行为（全查），向后兼容。
  const unprovidedChecks = [
    { planet: '火星', key: 'Mars', patterns: [/火星在[\u4e00-\u9fa5]{1,3}座(?!不)/, /火星进入[\u4e00-\u9fa5]{1,3}座/, /火星在第[一二三四五六七八九十百\d]+宫/] },
    { planet: '凯龙', key: 'Chiron', patterns: [/凯龙在[\u4e00-\u9fa5]{1,3}座/, /凯龙在第[一二三四五六七八九十百\d]+宫/] },
    { planet: '北交点', key: 'NorthNode', patterns: [/北交点在[\u4e00-\u9fa5]{1,3}座/, /北交点在第[一二三四五六七八九十百\d]+宫/] },
  ];
  // 归一化键：剔除非字母字符（'NorthNode' / 'north_node' / 'North Node' 视作同源）
  const _normKey = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  const _provided = Array.isArray(truth.providedPlanets) ? truth.providedPlanets.map(_normKey) : null;
  for (const check of unprovidedChecks) {
    if (_provided && _provided.indexOf(_normKey(check.key)) !== -1) continue;   // 引擎已供给 ⇒ 声明合法
    for (const re of check.patterns) {
      const match = text.match(re);
      if (match) {
        errors.push(`❌ 未提供行星声明宫位/星座：'${match[0]}' — ${check.planet}不在AstroMatrix中，禁止声明具体星座或宫位`);
      }
    }
  }


  // ── 4 硬校验：流月太阳星座必须与真值表逐一匹配（防 AstroMatrix/Python 层给错值）──
  // 🛡️ E23/R11q ①（2026-10-06）：**锚定月份标题行**，而非「标签首次出现」。
  //   病根（本地 s1 复现实证）：`text.indexOf(monthLabel)` 命中的是**散文里**首次提及该月的
  //   位置（如第一章「2026年10月将回到这个位置」），随后 300 字窗内撞上**邻月标题**
  //   （`### 2026年7月: 太阳巨蟹座…`）⇒ 正则捞出「太阳巨蟹座」与本月真值「天秤座」比对
  //   ⇒ 误报「流月太阳错误」。而真正的月份标题行 `### 2026年10月: 太阳天秤座 第11宫`
  //   **完全正确** —— 该误报每稿必现（三轮 errors 均含），是 zh 三连重生成的第三根支柱。
  //   治法：只在**标题行内**（`^#{1,6} …月 …`，行内截断）取太阳星座；查不到标题行/行内无
  //   太阳 token ⇒ **弃权**（宁漏不改，绝不回退到散文位置）。
  if (truth.months && truth.months.length > 0) {
    for (const monthData of truth.months) {
      const monthLabel = monthData.label; // e.g. "2026年7月"
      const trueSign = monthData.sunSignZH; // e.g. "巨蟹座"
      const esc = String(monthLabel).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const headRe = new RegExp('^#{1,6}[^\\n]*?' + esc, 'm');
      const mh = headRe.exec(text);
      if (!mh) continue;                                   // 找不到月份标题行 ⇒ 弃权
      const eol = text.indexOf('\n', mh.index);
      const line = text.slice(mh.index, eol === -1 ? text.length : eol);
      const sunMatch = line.match(/太阳在?([\u4e00-\u9fa5]{1,3}座)/);
      if (sunMatch && sunMatch[1] !== trueSign) {
        errors.push(`❌ 流月太阳错误：${monthLabel}写"太阳在${sunMatch[1]}"，真值为"太阳在${trueSign}"（天文不可篡改！）`);
      }
    }
  }
  return { pass: errors.length === 0, errors };
}
