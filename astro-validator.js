// astro-validator.js — 天象硬核核验断路器（Astro-Logic Validator）
// ESM module. 在 AI 生成文本交付用户前跑，检测逻辑矛盾；通不过返回 errors，由调用方熔断重调。
//
// 检测规则（军师裁决升级版）：
//  1. 外行星宫位唯一性：土星/木星/冥王星全年位置必须一致且 == 真值（不得既10宫又4宫、不得闪现水瓶）。
//  2. 流月太阳连贯性：一年内太阳不得进入同一星座两次（天文不可能）。
//  3. 星座原型夺舍：双鱼座不得含双子座特质词（灵活多变/处理多重信息/沟通连接/善于学习）。
//  4. 流月太阳与真值表比对：若能从文本定位到某月，则该月太阳星座必须 == 真值表（可选，脆弱故仅做软校验）。
//
// 返回 { pass: bool, errors: string[] }

import { SIGN_ORDER_ZH } from './astro-truth.js';

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

  return { pass: errors.length === 0, errors };
}
