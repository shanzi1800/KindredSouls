// 🛠️ V462 回归门：周副标题单一真源 + 去套话 + 月轨句去日志化
//
// 【血泪背景】
//   军师连续两轮反馈「改了没生效」，根因不是 LLM 不听话，而是**代码把 LLM 改回去**：
//   ① V461-B/C 只改了 _W1_SUB~_W4_SUB 与提示词黑名单，但三处模板仍硬编码旧套话
//      （HEADER_TEMPLATES / HEADER_TEMPLATES_RP / _langW1Title）
//   ② fixMonthlySectionTitles 还把残缺词「修复」回旧套话（（财充）→（财富充能））
//   ③ 月轨句替换只写在 callDeepSeekStream 的「逐 chunk」清洗链里，
//      而 `月亮过境：流月月亮依次行经…` 会跨 chunk 边界（FLUSH_SIZE=80）→ 永远匹配不到
//   ④ 提示词里的 ❌ 反例给了 LLM 可照抄的原句 → 负例反而被复读
//
// 【不变量】
//   ① 6 语言旧套话全词 → 新诗意意象（幂等）
//   ② 中文残缺词（财充/高熔/顺蓄/财爆）→ 新意象（幂等）
//   ③ 月轨句去日志化：标签前缀消失、日志式引导词变诗意、日期清单句被剔除
//   ④ 模板区与提示词区不再残留旧套话 / 可照抄的坏句
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// ── 从 server.js 原文抽取 V462 源码块（测试里绝不手写第二份真源）──
const _from = SRC.indexOf('const V462_WEEK_SUB = {');
const _to = SRC.indexOf('function fixMonthlySectionTitles(');
if (_from < 0 || _to <= _from) throw new Error('未能从 server.js 提取 V462 源码块');
const BLOCK = SRC.slice(_from, _to);

const F = new Function(`${BLOCK}\nreturn { V462_WEEK_SUB, V462_LEGACY_SUB, v462NormalizeWeekSub, v462PoeticizeTrail, v462TrailIntro, v462StreamSafeEmitter };`)();

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
const norm = (t, l) => F.v462NormalizeWeekSub(t, l);
const poet = (t, l) => F.v462PoeticizeTrail(t, l);

describe('V462 周副标题单一真源 · 去套话', () => {
  test('① 6 语言旧套话 → 新诗意意象（且幂等）', () => {
    const fails = [];
    for (const lang of LANGS) {
      const subs = F.V462_WEEK_SUB[lang];
      assert.strictEqual(subs.length, 4, `${lang} 必须有 4 周副标题`);
      F.V462_LEGACY_SUB[lang].forEach(([oldWord, idx]) => {
        // 旧词单测 + 旧词嵌在周标题里两种形态
        for (const input of [oldWord, `✦ [🟢 第${idx + 1}周：9月1日–7日（${oldWord}）]`]) {
          const out = norm(input, lang);
          if (out.includes(oldWord)) fails.push(`${lang} 旧词未清除: ${oldWord} → ${out}`);
          if (input.includes('（') && !out.includes(subs[idx]))
            fails.push(`${lang} 未归一到新意象: ${oldWord} → ${out}`);
          const twice = norm(out, lang);
          if (twice !== out) fails.push(`${lang} 幂等失败: ${oldWord}\n  一次: ${out}\n  二次: ${twice}`);
        }
      });
      // 新意象必须零改动（不得误伤）
      subs.forEach((s, i) => {
        const good = `✦ [🟢 第${i + 1}周：9月1日–7日（${s}）]`;
        if (norm(good, lang) !== good) fails.push(`${lang} 误伤新样本: ${good} → ${norm(good, lang)}`);
      });
    }
    assert.deepStrictEqual(fails, [], '旧套话归一失败：\n  ' + fails.join('\n  '));
  });

  test('④ 模板区不再残留旧套话（HEADER_TEMPLATES / _RP / _langW1Title）', () => {
    // 花括号配对抽取（不靠缩进/换行假设，避免抽到大段无关代码造成假阳性）
    const extractObject = (marker) => {
      const i = SRC.indexOf(marker);
      if (i < 0) return null;
      const open = SRC.indexOf('{', i);
      let depth = 0;
      for (let k = open; k < SRC.length; k++) {
        if (SRC[k] === '{') depth++;
        else if (SRC[k] === '}') { depth--; if (depth === 0) return SRC.slice(open, k + 1); }
      }
      return null;
    };
    const fails = [];
    for (const marker of ['const HEADER_TEMPLATES = {', 'const HEADER_TEMPLATES_RP = {']) {
      const body = extractObject(marker);
      if (body === null) { fails.push(`缺少 ${marker}`); continue; }
      for (const lang of LANGS) {
        for (const [oldWord] of F.V462_LEGACY_SUB[lang]) {
          if (body.includes(oldWord)) fails.push(`${marker} 仍硬编码旧套话: ${oldWord}`);
        }
      }
    }
    const li = SRC.indexOf('_langW1Title');
    if (li >= 0) {
      const line = SRC.slice(SRC.lastIndexOf('\n', li) + 1, SRC.indexOf('\n', li));
      for (const [oldWord] of F.V462_LEGACY_SUB.zh) {
        if (line.includes(oldWord)) fails.push(`_langW1Title 仍含旧词: ${oldWord}`);
      }
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});

describe('V462-fix3 流式分块安全发射器', () => {
  // 真实脏样本（生产实测原样）：月轨日志句 + 日期清单 + 旧套话副标题
  const dirtyZh = [
    '✦ [🔮 本月命运主题] ✦',
    '当流年太阳行经处女座（第3宫），你被点亮。',
    '✦ [🟢 第1周：9月1日–7日（财富充能）]',
    '月亮过境：流月月亮依次行经白羊座（第10宫）、金牛座（第10宫→第11宫）、双子座（第11宫）。1日金牛座、3日双子座、5日巨蟹座换座。',
    '1日月亮进入金牛座，3日进入双子座，5日进入巨蟹座。',
    '本周财富能量从远方起步。',
    '✦ [🔴 第2周：9月8日–14日（高危熔断）]',
    '月亮过境：流月月亮依次行经巨蟹座（第12宫）、狮子座（第12宫→第1宫）。8日狮子座、10日处女座换座。',
    '本周是财务高压线。',
    '✦ [🔵 第3周：9月15日–22日（顺流蓄力）]',
    '月亮过境：流月月亮依次行经天蝎座（第4宫）、射手座（第5宫）。17日射手座换座。',
    '静水深流的一周。',
    '✦ [🟢 第4周：9月23日–30日（财富爆发）]',
    '月亮过境：流月月亮依次行经摩羯座（第6宫）、水瓶座（第6宫→第7宫）。22日水瓶座换座。',
    '收获的时节。',
    '✦ [⚠️ 消费陷阱：9月]',
    '若一笔支出以紧迫之名召唤你，那份紧迫本身就是警报。',
  ].join('\n');

  const splitFeed = (text, size, lang) => {
    const out = [];
    const em = F.v462StreamSafeEmitter((t) => out.push(t), lang);
    for (let i = 0; i < text.length; i += size) em.push(text.slice(i, i + size), false);
    em.push('', true);
    return out.join('');
  };

  test('①② 任意分块粒度（60/17/1 字）必须全部净化干净且非空', () => {
    const fails = [];
    for (const size of [60, 200, 17, 1]) {
      const full = splitFeed(dirtyZh, size, 'zh');
      for (const banned of ['月亮过境', '流月月亮依次行经', '换座', '财富充能', '高危熔断', '顺流蓄力', '财富爆发']) {
        if (full.includes(banned)) fails.push(`分块=${size} 仍残留: ${banned}`);
      }
      if (!full.includes('月光的足迹掠过')) fails.push(`分块=${size} 未注入诗意月轨`);
      // 无损护栏：净化不得吞掉正文
      for (const keep of ['本周财富能量从远方起步', '静水深流的一周', '收获的时节', '那份紧迫本身就是警报', '本月命运主题']) {
        if (!full.includes(keep)) fails.push(`分块=${size} 正文被吞: ${keep}`);
      }
      // 无损护栏：净化只允许删「日期清单句」，不得吞正文（keep 列表逐条验证）
      if (size === 1 && full.length < dirtyZh.length * 0.55) fails.push(`分块=1 输出异常短(${full.length}/${dirtyZh.length})`);
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('③ 空输入/纯残句不误发；多次 force 幂等', () => {
    const out = [];
    const em = F.v462StreamSafeEmitter((t) => out.push(t), 'zh');
    em.push('', true);
    assert.deepStrictEqual(out, [], '空输入不得发射');
    em.push('残句无句末标点', false);
    assert.deepStrictEqual(out, [], '未成句不得发射');
    em.push('。', true);
    const once = out.join('');
    em.push('', true);
    em.push('', true);
    assert.strictEqual(out.join(''), once, 'force 必须幂等');
  });

  test('④ en 分块跨边界同样净化（旧套话副标题 + 日志式月轨）', () => {
    const dirtyEn = '✦ [🔮 Monthly Destiny Theme] ✦\nThe Sun in Virgo, House 3.\n✦ [🟢 Week 1: Sep 1–7 (Wealth Recharging)]\nMoon transit: The Moon transits through Aries, House 9, Taurus, House 9. Sun enters Virgo.\n✦ [🔴 Week 2: Sep 8–14 (High-Risk Circuit Breaker)]\nTension peaks.\n';
    const full = splitFeed(dirtyEn, 23, 'en');
    const fails = [];
    for (const banned of ['Wealth Recharging', 'High-Risk Circuit Breaker', 'The Moon transits through']) {
      if (full.includes(banned)) fails.push(`仍残留: ${banned}`);
    }
    if (!full.includes('Mercury Forged')) fails.push('未归一到新副标题意象');
    if (!full.includes("The Moon's path sweeps through")) fails.push('未注入英文诗意月轨');
    if (!full.includes('Tension peaks')) fails.push('正文被吞');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});

describe('V462-fix2 月轨句去日志化（整段/全文级）', () => {
  test('③ 中文：标签前缀消失 + 引导词诗化 + 日期清单句剔除 + 幂等', () => {
    const bad = '\u6708\u4eae\u8fc7\u5883\uff1a\u6d41\u6708\u6708\u4eae\u4f9d\u6b21\u884c\u7ecf\u767d\u7f8a\u5ea7\uff08\u7b2c9\u5bab\uff09\u3001\u91d1\u725b\u5ea7\uff08\u7b2c9\u5bab\u2192\u7b2c10\u5bab\uff09\u30021\u65e5\u91d1\u725b\u5ea7\u30013\u65e5\u53cc\u5b50\u5ea7\u6362\u5ea7\u3002\n1\u65e5\u6708\u4eae\u8fdb\u5165\u91d1\u725b\u5ea7\uff0c3\u65e5\u8fdb\u5165\u53cc\u5b50\u5ea7\uff0c5\u65e5\u8fdb\u5165\u5de8\u87f9\u5ea7\u3002\n\u672c\u5468\u6d41\u5e74\u592a\u9633\u5728\u5904\u5973\u5ea7\u7b2c2\u5bab\u6301\u7eed\u4e3a\u4f60\u70b9\u71c3\u8d22\u5e1b\u5bab\u7684\u706b\u79cd\u3002';
    const out = poet(bad, 'zh');
    const fails = [];
    for (const banned of ['\u6708\u4eae\u8fc7\u5883\uff1a', '\u6d41\u6708\u6708\u4eae\u4f9d\u6b21\u884c\u7ecf', '\u6362\u5ea7', '1\u65e5\u91d1\u725b\u5ea7', '1\u65e5\u6708\u4eae\u8fdb\u5165\u91d1\u725b\u5ea7']) {
      if (out.includes(banned)) fails.push(`\u4ecd\u6b8b\u7559\u65e5\u5fd7\u5f0f\u5185\u5bb9: ${banned}`);
    }
    if (!out.includes('\u6708\u5149\u7684\u8db3\u8ff9\u63a0\u8fc7')) fails.push('\u672a\u66ff\u6362\u4e3a\u8bd7\u610f\u5f15\u5bfc\u8bcd');
    if (!out.includes('\u767d\u7f8a\u5ea7\uff08\u7b2c9\u5bab\uff09')) fails.push('\u8bef\u4f24\u6708\u8f68\u672c\u4f53');
    if (!out.includes('\u672c\u5468\u6d41\u5e74\u592a\u9633\u5728\u5904\u5973\u5ea7\u7b2c2\u5bab')) fails.push('\u8bef\u4f24\u6b63\u6587\uff08\u6b63\u6587Sentence\u88ab\u5220\uff09');
    if (poet(out, 'zh') !== out) fails.push('\u5e42\u7b49\u5931\u8d25');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('③ 各语言逐条：日志式引导词 → 该语言诗意引导词', () => {
    const cases = {
      en: 'Moon transit: The Moon transits through Aries, House 9.',
      es: 'Tránsito lunar: La Luna transita por Aries, Casa 9.',
      fr: 'Transit lunaire : La Lune traverse Bélier, Maison 9.',
      th: 'การโคจรของดวงจันทร์: ดวงจันทร์เคลื่อนผ่านเมษ บ้าน 9',
      vi: 'Quá cảnh Mặt Trăng: Mặt Trăng đi qua Bạch Dương Nhà 9',
    };
    const fails = [];
    for (const [lang, input] of Object.entries(cases)) {
      const out = poet(input, lang);
      const intro = F.v462TrailIntro(lang);
      if (!out.includes(intro)) fails.push(`${lang} 未注入诗意引导词(${intro}): ${out}`);
      if (poet(out, lang) !== out) fails.push(`${lang} 幂等失败`);
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('④ 提示词区不再残留可照抄的坏句（负例污染根治）', () => {
    const lines = SRC.split('\n');
    const bad = [];
    lines.forEach((l, i) => {
      const t = l.trim();
      // 以坏句开头的「独立示例行」= 可被 LLM 照抄的负例污染
      if (/^月亮过境：流月月亮依次行经/.test(t)) bad.push(`L${i + 1} 独立坏例行: ${t.slice(0, 60)}`);
      if (/BAD:\s*月亮过境/.test(l)) bad.push(`L${i + 1} BAD 段残留坏例: ${t.slice(0, 60)}`);
      if (/❌\s*⚠️?\s*禁止前缀：「月亮过境：」/.test(l)) bad.push(`L${i + 1} 禁止前缀反引坏词: ${t.slice(0, 60)}`);
    });
    assert.deepStrictEqual(bad, [], '提示词负例污染未清除：\n  ' + bad.join('\n  '));
  });
});

describe('V462-fix4 周标题误删回归门', () => {
  const titles = [
    '✦ [🟢 第1周：9月1日–7日（水星淬火 · 技能显化之窗）]',
    '✦ [🔴 第2周：9月8日–14日（海王迷雾 · 绝对熔断）]',
    '✦ [🔵 第3周：9月15日–22日（土星沉淀 · 静水深流）]',
    '✦ [🟢 第4周：9月23日–30日（木星高光 · 收割落袋）]',
    '✦ [⚠️ 消费陷阱：2026年9月] ✦',
  ];

  test('① 含日期区间的周标题必须零改动（生产事故根因）', () => {
    const fails = [];
    for (const t of titles) {
      const o = poet(t, 'zh');
      if (o !== t) fails.push(`标题被改动:\n   入: ${t}\n   出: ${o}`);
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('② 标题 + 清单句混排：只剔清单句，标题与正文完整', () => {
    const mixed = titles[0] + '\n1日月亮进入金牛座，3日进入双子座，5日进入巨蟹座。\n本周财富能量从社群宫位启动。\n' + titles[1];
    const out = poet(mixed, 'zh');
    const fails = [];
    if (!out.includes(titles[0])) fails.push('W1 标题被删');
    if (!out.includes(titles[1])) fails.push('W2 标题被删');
    if (out.includes('1日月亮进入金牛座')) fails.push('清单句未被剔除');
    if (!out.includes('本周财富能量从社群宫位启动')) fails.push('正文被误删');
    if (poet(out, 'zh') !== out) fails.push('幂等失败');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('③ 月轨本体（含 N日 的行进句）不得被当清单删', () => {
    const trail = '月光的足迹掠过巨蟹座（第3宫）、狮子座（第3宫→第4宫）。';
    const narr = '26–28日月光的足迹掠过白羊座第11宫时，与流年土星形成碰撞。';
    const fails = [];
    if (poet(trail, 'zh') !== trail) fails.push('月轨本体被改动');
    if (!poet(narr, 'zh').includes('月光的足迹掠过白羊座第11宫')) fails.push('叙事句被误删');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});

describe('V462-fix6 行级守卫收紧 + 无冒号月亮过境归一', () => {
  test('① 正文含「第2周」字样时，日期清单句仍必须被剔除', () => {
    const t = '26日月亮转入白羊座第1宫与第2宫，是本月签单的黄金日。28日月亮进入金牛座第2宫与第3宫，现金流落袋为安。建议：把第2周搁置的谈判重新摆上桌面。';
    const out = poet(t, 'zh');
    const fails = [];
    if (out.includes('28日月亮进入金牛座')) fails.push('行级守卫过宽：含「第2周」的正文行被整体免检');
    if (!out.includes('把第2周搁置的谈判重新摆上桌面')) fails.push('正文被误删');
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });

  test('② 无冒号的「月亮过境」也必须归一为诗意替词', () => {
    const t = '日期区间为1–7日（月亮过境第2、3、4、5、6宫期间）、8–14日（月亮过境第6、7、8宫期间）。';
    const out = poet(t, 'zh');
    assert.ok(!out.includes('月亮过境'), '仍残留「月亮过境」');
    assert.ok(out.includes('月亮途经'), '未替换为「月亮途经」');
  });
});

describe('V462-fix7 标签冒号残留清算（全角/半角/已归一形态）', () => {
  test('① 全角/半角/月亮途经 三种标签形态都必须清零', () => {
    const cases = [
      '月亮过境：月光的足迹掠过白羊座（第5宫）。',
      '月亮过境: 流月月亮依次行经白羊座（第5宫）。',
      '月亮途经: 月光的足迹掠过白羊座（第5宫）。',
      '月球过境：月光的足迹掠过白羊座（第5宫）。',
    ];
    const fails = [];
    for (const t of cases) {
      const o = poet(t, 'zh');
      for (const banned of ['月亮过境', '月球过境', '月亮途经:', '月亮途经：', '：月光的足迹', ': 月光的足迹']) {
        if (o.includes(banned)) fails.push(`入: ${t}\n   出: ${JSON.stringify(o)}\n   残留: ${banned}`);
      }
      if (!o.startsWith('月光的足迹掠过')) fails.push(`未归一到诗化开篇: ${JSON.stringify(o)}`);
      if (poet(o, 'zh') !== o) fails.push(`幂等失败: ${JSON.stringify(o)}`);
    }
    assert.deepStrictEqual(fails, [], fails.join('\n  '));
  });
});
