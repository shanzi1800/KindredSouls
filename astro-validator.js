// astro-validator.js — 天象硬核核验断路器（Astro-Logic Validator）
// ESM module. 在 AI 生成文本交付用户前跑，检测逻辑矛盾；通不过返回 errors，由调用方熔断重调。
//
// 检测规则（军师裁决升级版）：
//  1. 外行星宫位唯一性：土星/木星/冥王星全年位置必须一致且 == 真值（不得既10宫又4宫、不得闪现水瓶）。
//  2. 流月太阳连贯性：一年内太阳不得进入同一星座两次（天文不可能）。
//  3. 星座原型夺舍：双鱼座不得含双子座特质词（灵活多变/处理多重信息/沟通连接/善于学习）。
//  4. 流月太阳与真值表比对：若能从文本定位到某月，则该月太阳星座必须 == 真值表（可选，脆弱故仅做软校验）。
//  5. 缝合怪检测：禁止"星座+星座"直接连接（如"处女座金牛座"）。
//  6. 未提供行星禁则：火星/凯龙/北交点未在AstroMatrix中，不得声明具体星座或宫位。
//
// 返回 { pass: bool, errors: string[] }

import { SIGN_ORDER_ZH, SIGN_ORDER_EN } from './astro-truth.js';

const ZH_SIGN = '([\\u4e00-\\u9fa5]{1,3}座)';

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
    const re = new RegExp(`${p.name}在${ZH_SIGN}第?(\\d+)?宫?`, 'g');
    let m;
    const found = [];
    while ((m = re.exec(text)) !== null) {
      found.push({ sign: m[1], house: m[2] ? parseInt(m[2], 10) : null });
    }
    // 检查是否出现与真值不同的表述（矛盾 / 闪现）
    for (const f of found) {
      if (f.sign !== t.signZH) {
        errors.push(`❌ ${p.name}星座矛盾：文本写"${p.name}在${f.sign}"，真值为"${p.name}在${t.signZH}"（全年固定）`);
      }
      if (f.house !== null && f.house !== t.house) {
        errors.push(`❌ ${p.name}宫位矛盾：文本写"${p.name}在${f.sign}第${f.house}宫"，真值为"第${t.house}宫"（上升${truth.risingSignZH}）`);
      }
    }
  }

  // ── 2. 流月太阳连贯性：一年内太阳不得进同一星座两次 ──
  const sunMatches = text.match(new RegExp(`太阳在?进入?${ZH_SIGN}`, 'g')) || [];
  const sunSigns = sunMatches.map((s) => s.replace(/太阳在?进入?/, ''));
  const counts = {};
  sunSigns.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
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

  // ── 6. 未提供行星禁止声明宫位/星座（火星/凯龙/北交点不在astroMatrix中） ──
  const unprovidedChecks = [
    { planet: '火星', patterns: [/火星在[\u4e00-\u9fa5]{1,3}座(?!不)/, /火星进入[\u4e00-\u9fa5]{1,3}座/, /火星在第[一二三四五六七八九十百\d]+宫/] },
    { planet: '凯龙', patterns: [/凯龙在[\u4e00-\u9fa5]{1,3}座/, /凯龙在第[一二三四五六七八九十百\d]+宫/] },
    { planet: '北交点', patterns: [/北交点在[\u4e00-\u9fa5]{1,3}座/, /北交点在第[一二三四五六七八九十百\d]+宫/] },
  ];
  for (const check of unprovidedChecks) {
    for (const re of check.patterns) {
      const match = text.match(re);
      if (match) {
        errors.push(`❌ 未提供行星声明宫位/星座：'${match[0]}' — ${check.planet}不在AstroMatrix中，禁止声明具体星座或宫位`);
      }
    }
  }


  // ── 4 硬校验：流月太阳星座必须与真值表逐一对应（治本：防 AstroMatrix/Python 层给错值）──
  if (truth.months && truth.months.length === 12) {
    // 逐月从文本中捞太阳星座，看是否匹配真值
    // 策略：每月的标题行（含"2026年7月"等）通常紧跟该月太阳位置描述
    for (const monthData of truth.months) {
      const monthLabel = monthData.label; // e.g. "2026年7月"
      const trueSign = monthData.sunSignZH; // e.g. "巨蟹座"
      // 如果文本提到了该月（包含月份），检查附近是否出现"太阳在XX座"
      // 用月份作锚点，捞其附近200字符内的太阳描述
      const monthIdx = text.indexOf(monthLabel);
      if (monthIdx !== -1) {
        const snippet = text.slice(Math.max(0, monthIdx), Math.min(text.length, monthIdx + 300));
        // 找"太阳在XX座"模式
        const sunMatch = snippet.match(/太阳在?([\u4e00-\u9fa5]{2,3}座)/);
        if (sunMatch && sunMatch[1] !== trueSign) {
          errors.push(`❌ 流月太阳错误：${monthLabel}文本写"太阳在${sunMatch[1]}"，真值为"太阳在${trueSign}"（天文不可篡改！）`);
        }
      }
    }
  }

  // ── 4 硬校验：流月太阳星座必须与真值表逐一匹配（防 AstroMatrix/Python 层给错值）──
  if (truth.months && truth.months.length > 0) {
    for (const monthData of truth.months) {
      const monthLabel = monthData.label; // e.g. "2026年7月"
      const trueSign = monthData.sunSignZH; // e.g. "巨蟹座"
      const monthIdx = text.indexOf(monthLabel);
      if (monthIdx !== -1) {
        // 捞该月后200字符内的"太阳在XX座"
        const snippet = text.slice(Math.max(0, monthIdx), Math.min(text.length, monthIdx + 300));
        const sunMatch = snippet.match(/太阳在?([一-龥]{1,3}座)/);
        if (sunMatch && sunMatch[1] !== trueSign) {
          errors.push(`❌ 流月太阳错误：${monthLabel}写"太阳在${sunMatch[1]}"，真值为"太阳在${trueSign}"（天文不可篡改！）`);
        }
      }
    }
  }
  return { pass: errors.length === 0, errors };
}
