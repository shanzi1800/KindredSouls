// V438 回归门：月亮「周级轨迹硬覆盖」后处理护栏
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

const _en2z = SRC.match(/const _EN2ZIDX\s*=\s*\{[^}]*\};/);
if (!_en2z) throw new Error('extract _EN2ZIDX fail');

const SUN_SIGN_EN=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SUN_SIGN_ES=["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"];
const SUN_SIGN_ZH=["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"];
const SUN_SIGN_FR=["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"];
const SUN_SIGN_TH=["เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม","มกราคม","กุมภาพันธ์","มีนาคม"];
const SUN_SIGN_VI=["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải","Sư Tử","Xử Nữ","Thiên Bình","Thiên Yết","Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"];

const _from = SRC.indexOf('function _v438WeekTruth');
const _to = SRC.indexOf('// 月报章节标题兜底修复');
if (_from < 0 || _to < 0 || _to <= _from) throw new Error('extract V438 block fail');
const BLOCK = SRC.slice(_from, _to);

const F = new Function(_en2z[0]+'\n'+
  'const SUN_SIGN_EN=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];\n'+
  'const SUN_SIGN_ES=["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"];\n'+
  'const SUN_SIGN_ZH=["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"];\n'+
  'const SUN_SIGN_FR=["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"];\n'+
  'const SUN_SIGN_TH=["เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม","มกราคม","กุมภาพันธ์","มีนาคม"];\n'+
  'const SUN_SIGN_VI=["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải","Sư Tử","Xử Nữ","Thiên Bình","Thiên Yết","Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"];\n'+
  BLOCK+'\nreturn { applyMoonWeekHardOverride };');
const { applyMoonWeekHardOverride } = F();

// 1997-10-18 真值
const weeks=[
  {week:1,legs:[{sign:'Aries',house:9},{sign:'Aries',house:10},{sign:'Taurus',house:10},{sign:'Taurus',house:11},{sign:'Gemini',house:11},{sign:'Gemini',house:12},{sign:'Cancer',house:12},{sign:'Cancer',house:1}]},
  {week:2,legs:[{sign:'Cancer',house:1},{sign:'Leo',house:1},{sign:'Leo',house:2},{sign:'Virgo',house:2},{sign:'Virgo',house:3},{sign:'Libra',house:3},{sign:'Libra',house:4},{sign:'Scorpio',house:4}]},
  {week:3,legs:[{sign:'Scorpio',house:4},{sign:'Sagittarius',house:4},{sign:'Sagittarius',house:5},{sign:'Capricorn',house:5},{sign:'Capricorn',house:6},{sign:'Aquarius',house:6},{sign:'Aquarius',house:7},{sign:'Pisces',house:7}]},
  {week:4,legs:[{sign:'Pisces',house:7},{sign:'Aries',house:7},{sign:'Aries',house:8},{sign:'Taurus',house:8},{sign:'Taurus',house:9},{sign:'Gemini',house:9},{sign:'Gemini',house:9},{sign:'Cancer',house:9},{sign:'Cancer',house:10}]},
];
const astroMatrix={months:[{moon_weeks:weeks}]};

const zhHalluc='✦ [🔮 本月命运主题] ✦\n概述...\n\n✦[🟢第1周：9月1日–7日（财富充能）]\n流月月亮依次行经白羊座（第9宫→第10宫）、金牛座（第10宫→第11宫）、双子座（第11宫→第12宫）、巨蟹座（第12宫→第1宫）。9月1日月亮进入金牛座（第10宫）。\n\n✦[🔴第2周：9月8日–14日（高危熔断）]\n流月月亮依次行经巨蟹座（第1宫）、白羊座（第9宫→第2宫）、白羊座（第9宫→第3宫）、白羊座（第9宫→第4宫）。9月10日月亮进入处女座（第2宫）。\n\n✦[🔵第3周：9月15日–22日（顺流蓄力）]\n流月月亮依次行经白羊座（第9宫→第5宫）、白羊座（第9宫→第6宫）、白羊座（第9宫→第7宫）。9月19日月亮进入射手座（第4宫）。\n\n✦[🟢第4周：9月23日–30日（财富爆发）]\n流月月亮依次行经双鱼座（第7宫）、白羊座（第7宫→第8宫）、金牛座（第8宫→第9宫）。9月27日月亮进入白羊座（第7宫）。\n\n⚠️ [消费陷阱：2026年9月]\n本月财务风险...白羊座冲动消费需警惕。';

describe('V438 月亮周级轨迹硬覆盖', () => {
  test('① zh: W2/W3 幻觉白羊座被真值整段替换', () => {
    const out = applyMoonWeekHardOverride(zhHalluc, 'zh', astroMatrix);
    const w2 = out.split('第2周')[1].split('第3周')[0];
    const w3 = out.split('第3周')[1].split('第4周')[0];
    assert.ok(!/白羊座/.test(w2), 'W2 不应含白羊座');
    assert.ok(!/白羊座/.test(w3), 'W3 不应含白羊座');
  });

  test('② zh: 真值含白羊的周(W1/W4)保留白羊', () => {
    const out = applyMoonWeekHardOverride(zhHalluc, 'zh', astroMatrix);
    const w1 = out.split('第1周')[1].split('第2周')[0];
    const w4 = out.split('第4周')[1].split('消费陷阱')[0];
    assert.ok(/白羊座/.test(w1), 'W1 应含白羊座');
    assert.ok(/白羊座/.test(w4), 'W4 应含白羊座');
  });

  test('③ zh: 主题段/消费陷阱段不被触碰', () => {
    const out = applyMoonWeekHardOverride(zhHalluc, 'zh', astroMatrix);
    assert.ok(out.includes('本月命运主题'), '主题段应保留');
    assert.ok(out.includes('消费陷阱'), '消费陷阱段应保留');
    assert.ok(out.includes('白羊座冲动'), '消费陷阱内容应保留');
  });

  test('④ zh: 日期锚定句保留', () => {
    const out = applyMoonWeekHardOverride(zhHalluc, 'zh', astroMatrix);
    assert.ok(out.includes('9月1日'), '9月1日应保留');
    assert.ok(out.includes('9月10日'), '9月10日应保留');
  });

  test('⑤ zh: 幂等 —— 已正确文本再跑零改动', () => {
    const once = applyMoonWeekHardOverride(zhHalluc, 'zh', astroMatrix);
    const twice = applyMoonWeekHardOverride(once, 'zh', astroMatrix);
    assert.strictEqual(once, twice, '幂等应连续两次相同');
  });

  test('⑥ zh: 无 moon_weeks 真值 → 原文透传', () => {
    const noTruth = applyMoonWeekHardOverride(zhHalluc, 'zh', {months:[{moon_weeks:null}]});
    assert.strictEqual(noTruth, zhHalluc, '空 moon_weeks 应透传');
    const noMatrix = applyMoonWeekHardOverride(zhHalluc, 'zh', null);
    assert.strictEqual(noMatrix, zhHalluc, 'null astroMatrix 应透传');
  });

  test('⑦ 未知 lang → 透传', () => {
    const out = applyMoonWeekHardOverride(zhHalluc, 'xx', astroMatrix);
    assert.strictEqual(out, zhHalluc, '未知语种应透传');
  });

  test('⑧ en: 幻觉 W2 Aries 被真值替换且空格正确', () => {
    const enHalluc = [
      '\u240a\u240b✦[🟢 Week 1: Sep 1\u20137]',
      'The Moon transits through Aries (House 9\u2192House 10), Taurus (House 10\u2192House 11).',
      '',
      '✦[🔴 Week 2: Sep 8\u201314]',
      'The Moon transits through Cancer (House 1), Aries (House 9\u2192House 2), Aries (House 9\u2192House 3), Aries (House 9\u2192House 4).',
      '',
      '✦[🔵 Week 3: Sep 15\u201322]',
      'The Moon transits through Aries (House 5), Aries (House 6), Aries (House 7).',
      '',
      '✦[🟢 Week 4: Sep 23\u201330]',
      'The Moon transits through Aries (House 8), Taurus (House 9).',
    ].join('\n');
    const out = applyMoonWeekHardOverride(enHalluc, 'en', astroMatrix);
    const w2 = out.split('Week 2')[1].split('Week 3')[0];
    assert.ok(!/Aries/.test(w2), 'EN W2 不应含 Aries');
    assert.ok(/Cancer \(House 1\), Leo/.test(out), 'EN 空格与真值正确');
    assert.ok(/Scorpio \(House 4\)/.test(out), 'EN W2 真值尾=Scorpio');
  });
});
