// ═══ E135 闸门：对话舱几何扩容＋左缘垂线对齐＋提示条三精二（主公军令 2026-11-11）═══
// 刀一（尺寸扩容）：桌面悬浮舱 420×600 → 477×638（宽 +57px≈15mm、高 +38px≈10mm；
//   96 DPI 1mm≈3.78px）。仅 768px 断点生效；移动端底部抽屉（100% × 55vh）零改动；
//   Sophia（左下）/Milo（右下）共用同一块 .ks-chat-sheet 常量（E77 镜像单源铁律）。
// 刀二（左缘垂线对齐）：对话流内框卡（2.5D 路书卡/密函微缩卡/文本气泡）左沿与
//   下方提示条胶囊左沿 getBoundingClientRect().left Δ=0px —— .ks-chat-flow
//   padding-x 2px→0（sheet padding 14px 单源）＋两插槽 wrapper flex-end→flex-start。
// 刀三（提示条三精二·六语同步）：familiar.chatQ2「抚平我今天的情绪内耗」六语退役；
//   chatQ1（今日财运与破财避坑）保留；chatQ3 凝练「结合星盘的今日指引」——
//   军令钦定六语词表逐字；全站源码零 Q2 旧文案。
// 链位：e135 入编 e134 后、e40-compat 前；全链 102→103 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

/* 🏆 E135-刀三：军令钦定六语词表（chatQ1/chatQ3 逐字；emoji 前缀沿 E66 既版保留） */
const PILLS = {
  zh: { q1: '💰 今日财运与破财避坑', q3: '🔮 结合星盘的今日指引' },
  en: { q1: "💰 Today's Wealth & Pitfall Guide", q3: '🔮 Today\'s Astral Chart Guidance' },
  fr: { q1: '💰 Fortune & Pièges Financiers du Jour', q3: '🔮 Conseils Astraux selon mon Thème' },
  es: { q1: '💰 Fortuna de Hoy y Trampas Financieras', q3: '🔮 Guía Astral según mi Carta Natal' },
  th: { q1: '💰 โชคลาภวันนี้และจุดระวังเสียทรัพย์', q3: '🔮 คำชี้แนะดวงดาวประจำวันตามลัคนา' },
  vi: { q1: '💰 Tài Vận Hôm Nay & Tránh Tiêu Hao', q3: '🔮 Chỉ Dẫn Tinh Bàn Hôm Nay' },
};

test('E135-A 刀一：桌面舱扩容 477×638（+57/+38px）仅 768px 断点生效，移动端零扰动', () => {
  const css = read('web/src/App.css');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');

  // ① 桌面断点块：宽 477 / 高 638 单源（Sophia/Milo 共用，禁分角色另起一套）
  const mediaIdx = css.indexOf('@media (min-width: 768px)');
  assert.ok(mediaIdx > -1, '缺 768px 桌面断点');
  const mediaBlock = css.slice(mediaIdx, mediaIdx + 2400);
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*width:\s*477px[^}]*height:\s*638px/.test(mediaBlock),
    '桌面悬浮舱须 477×638（E135 扩容 +15mm/+10mm）');
  // 扩容后旧值拔除（防回潮）
  assert.ok(!/\.ks-chat-sheet\s*\{[^}]*width:\s*420px/.test(mediaBlock), '旧宽 420px 残留');
  assert.ok(!/\.ks-chat-sheet\s*\{[^}]*height:\s*600px/.test(mediaBlock), '旧高 600px 残留');

  // ② E77 镜像单源不破：Milo 右下 / Sophia 左下（flex 换边＋左右内边距对调）
  assert.ok(/\.ks-chat-layer\s*\{[^}]*justify-content:\s*flex-end[^}]*padding:\s*0 24px 20px 0/.test(mediaBlock),
    'Milo 侧默认右下镜像位被扰动');
  assert.ok(/\.ks-chat-layer\[data-familiar="sophia"\]\s*\{[^}]*justify-content:\s*flex-start[^}]*padding:\s*0 0 20px 24px/.test(mediaBlock),
    'Sophia 侧镜像位被扰动');
  assert.ok(!/\.ks-chat-sheet\[data-familiar[^{]*\{[^}]*\b(left|right):/.test(css),
    '禁给 sheet 加 left/right 绝对定位（E77 流内镜像铁律）');

  // ③ 移动端零扰动：基座（断点外）仍 100% × 55vh，477/638 不得外溢出断点块
  const baseSheet = (css.match(/\.ks-chat-sheet\s*\{([^}]*)\}/) || [])[1] || '';
  assert.ok(/width:\s*100%/.test(baseSheet), '移动端全宽抽屉被扰动');
  assert.ok(/height:\s*55vh/.test(baseSheet), '移动端 55vh 半屏被扰动');
  const beforeMedia = css.slice(0, mediaIdx);
  assert.ok(!/width:\s*477px/.test(beforeMedia), '477px 误外溢到移动端基座');

  // ④ 组件侧：定位真源仍按 ip 判定（data-familiar 单源）
  assert.ok(/data-familiar=\{ip === 'Milo' \? 'milo' : 'sophia'\}/.test(sheet),
    'data-familiar 定位真源被扰动');
});

test('E135-B 刀二：左缘垂线对齐——flow padding-x=0＋插槽 wrapper flex-start（Δ=0px 源级契约）', () => {
  const css = read('web/src/App.css');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');

  // ① 对话流容器：左右 padding 归零（气泡/卡左沿 = sheet padding 14px 单源）
  const flowRule = (css.match(/\.ks-chat-flow\s*\{([^}]*)\}/) || [])[1] || '';
  assert.ok(/padding:\s*12px 0 8px/.test(flowRule),
    '.ks-chat-flow 须 padding: 12px 0 8px（左缘 2px 错位拔除）');
  assert.ok(!/padding:\s*12px 2px 8px/.test(css), '旧 flow padding 2px 残留');

  // ② 提示条容器：padding-x 0 保持（左沿与 flow 同锚 sheet padding）
  const pillsRule = (css.match(/\.ks-chat-pills\s*\{([^}]*)\}/) || [])[1] || '';
  assert.ok(/padding:\s*2px 0 8px/.test(pillsRule), '.ks-chat-pills padding 被扰动');

  // ③ 两插槽 wrapper（密函卡＋路书卡）齐左：flex-end 右挂拔除
  assert.ok((sheet.match(/justifyContent:\s*'flex-start',\s*marginTop:\s*8/g) || []).length >= 2,
    '密函卡＋路书卡两插槽 wrapper 须 flex-start（左缘垂线对齐）');
  assert.ok(!/justifyContent:\s*'flex-end',\s*marginTop:\s*8/.test(sheet),
    '插槽 wrapper 仍 flex-end 右挂（桌面左豁口病根）');

  // ④ E134 互斥守卫不破
  assert.ok(sheet.includes('lifestyleSlot && !scribeSlot && !streaming'), 'E134 互斥守卫被扰动');
  assert.ok(!sheet.includes('RoadtripRouteMap'), 'ChatSheet 严禁直接挂沙盘（E134 红线）');
});

test('E135-C 刀三：提示条三精二——chatQ2 六语退役＋chatQ1/Q3 军令词表逐字＋全站零旧文案', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');

  // ① 组件侧：药丸数组恰两颗（chatQ1/chatQ3），chatQ2 调用零引用（注释提及不算）
  assert.ok(sheet.includes("const pills = [t('familiar.chatQ1'), t('familiar.chatQ3')];"),
    'pills 数组须恰为 [chatQ1, chatQ3]');
  assert.ok(!/t\('familiar\.chatQ2'\)/.test(sheet), 'ChatSheet 仍调用退役键 familiar.chatQ2');

  // ② 六语键契约：chatQ2 死键（六语全无）＋chatQ1/chatQ3 军令钦定逐字
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.ok(!('chatQ2' in o.familiar), `${l}.json chatQ2 退役键回流`);
    assert.equal(o.familiar.chatQ1, PILLS[l].q1, `${l} chatQ1 军令词表漂移`);
    assert.equal(o.familiar.chatQ3, PILLS[l].q3, `${l} chatQ3 军令词表漂移`);
  }

  // ③ 全站源码零「抚平我今天的情绪内耗」及六语 Q2 旧文案（禁 dist 产物——源码为真源）
  const retired = ['抚平我今天的情绪内耗', 'Soothe my emotional drain', 'Apaise ma fatigue émotionnelle',
    'Calma mi desgaste emocional', 'ปลอบใจความเหนื่อยล้าของฉัน', 'Xoa dịu hao mòn cảm xúc của tôi'];
  const hit = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'dist' || name === 'node_modules' || name.startsWith('.')) continue;
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(tsx?|jsx?|mjs|css|json|html|py)$/.test(name)) {
        const c = readFileSync(p, 'utf8');
        for (const phrase of retired) if (c.includes(phrase)) hit.push(`${p}: ${phrase}`);
      }
    }
  };
  walk(join(ROOT, 'web', 'src'));
  walk(join(ROOT, 'api'));
  walk(join(ROOT, 'astro'));
  for (const f of ['server.js']) {
    try { const c = read(f); for (const phrase of retired) if (c.includes(phrase)) hit.push(`${f}: ${phrase}`); } catch { /* 无此文件则跳过 */ }
  }
  assert.deepEqual(hit, [], `全站残留退役文案（须零命中）: ${hit.join('; ')}`);
});

test('E135-S 链位自保：e135 入编（e134 后、e40-compat 前；全链 102→103 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 103, `军规链段数须为 103（E135 入编后 102→103；实为 ${segs.length}）`);
  const iE135 = segs.findIndex((s) => s.includes('audit-e135-chat-geometry-pills'));
  const iE134 = segs.findIndex((s) => s.includes('audit-e134-aesthetic-25d-route-map'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.ok(iE135 !== -1, 'e135 未入编 test:astro');
  assert.ok(iE134 !== -1 && iE135 === iE134 + 1, 'e135 须紧随 e134（版本序）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 须恒为链尾');
  assert.ok(iE135 < iCap, 'e135 须居 e40-compat 之前');
});
