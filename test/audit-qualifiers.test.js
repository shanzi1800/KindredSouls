// 🛠️ V434-1 回归门：行星修饰词错配硬锁（日月无逆行）
//
// 【病根】LLM 偶发把「逆行」贴在太阳/月亮身上（天文上日月永不逆行）→ 懂行用户一眼假。
//
// 【本套件验什么】
//   ① 坏样本必抓：六语种日月误贴逆行（括号式/紧邻式）必须被剥离
//   ② 防误杀：水星/金星等**合法**逆行必须完整保留
//   ③ 零漂移：正常日月句（无逆行词）一字不动
//   ④ 跨行星防误伤：同句内逆行词属于别的行星（Moon and Mercury retrograde）不得被删
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('提取 V434 锁源码块失败');
const BLOCK = SRC.slice(_from, _to);
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI'].map((k) => {
  const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];'));
  return m ? m[0] : '';
}).join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v434LockQualifiers };`)();

describe('V434-1：行星修饰词错配硬锁（Qualifier Alignment）', () => {
  test('① 六语种日月误贴逆行 → 必须剥离（坏样本自证）', () => {
    const bad = [
      { lang: 'vi', input: 'Mặt Trăng (đang nghịch hành) đi qua Nhà 7.', expected: 'Mặt Trăng đi qua Nhà 7.' },
      { lang: 'zh', input: '月亮（逆行中）进入第8宫，带来情绪起伏。', expected: '月亮进入第8宫，带来情绪起伏。' },
      { lang: 'en', input: 'The Sun (retrograde) moves into House 4.', expected: 'The Sun moves into House 4.' },
      { lang: 'es', input: 'La Luna retrógrada transita por Piscis.', expected: 'La Luna transita por Piscis.' },
      { lang: 'fr', input: 'Le Soleil en rétrogradation illumine la Maison 1.', expected: 'Le Soleil illumine la Maison 1.' },
      { lang: 'th', input: 'ดวงจันทร์ (กำลังถอยหลัง) เคลื่อนเข้าสู่ภพที่ 5', expected: 'ดวงจันทร์ เคลื่อนเข้าสู่ภพที่ 5' },
    ];
    for (const c of bad) {
      const out = F._v434LockQualifiers(c.input, c.lang);
      assert.notEqual(out, c.input, `[${c.lang}] 坏样本未触发剥离`);
      assert.equal(out, c.expected, `[${c.lang}] 剥离结果不符预期`);
    }
  });

  test('② 防误杀：其他行星的合法逆行必须完整保留', () => {
    const valid = [
      { lang: 'vi', text: 'Thủy Tinh đang nghịch hành tại Nhà 3.' },
      { lang: 'zh', text: '水星处于逆行状态，注意沟通与协议签署。' },
      { lang: 'en', text: 'Mercury in retrograde affects electronic devices.' },
      { lang: 'es', text: 'Venus retrógrado revisa temas de relaciones.' },
      { lang: 'fr', text: 'Mercure en rétrogradation ralentit les projets.' },
      { lang: 'th', text: 'ดาวพุธถอยหลังส่งผลต่อการสื่อสาร' },
    ];
    for (const c of valid) {
      const out = F._v434LockQualifiers(c.text, c.lang);
      assert.equal(out, c.text, `[${c.lang}] 误杀合法行星逆行`);
    }
  });

  test('③ 零漂移：正常日月句一字不动', () => {
    const normal = [
      { lang: 'vi', text: 'Mặt Trăng hành vận đi qua Bạch Dương (Nhà 7).' },
      { lang: 'zh', text: '太阳行运经过金牛座第8宫。' },
      { lang: 'en', text: 'The Moon moves through Gemini in House 9.' },
      { lang: 'fr', text: 'La Lune traverse le Lion, Maison 3.' },
    ];
    for (const c of normal) {
      const out = F._v434LockQualifiers(c.text, c.lang);
      assert.equal(out, c.text, `[${c.lang}] 正常文本被改动`);
    }
  });

  test('④ 跨行星防误伤：同句内逆行词属于别的行星 → 不得删除', () => {
    const cases = [
      { lang: 'en', text: 'The Moon and Mercury retrograde both color this week.' },
      { lang: 'zh', text: '月亮与水星逆行相伴，沟通易生误会。' },
      { lang: 'vi', text: 'Mặt Trăng kết hợp Thủy Tinh đang nghịch hành.' },
    ];
    for (const c of cases) {
      const out = F._v434LockQualifiers(c.text, c.lang);
      assert.equal(out, c.text, `[${c.lang}] 误删了其他行星的逆行词`);
    }
  });

  test('⑤ 幂等 + 空值安全', () => {
    const t = '月亮（逆行中）进入第8宫。';
    const once = F._v434LockQualifiers(t, 'zh');
    assert.equal(F._v434LockQualifiers(once, 'zh'), once);
    assert.equal(F._v434LockQualifiers('', 'zh'), '');
    assert.equal(F._v434LockQualifiers(null, 'zh'), null);
    assert.equal(F._v434LockQualifiers('月亮逆行。', 'xx'), '月亮逆行。');
  });
});
