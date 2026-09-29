// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V475 回归门：年报文本完整度闸门
//
// 保护的失效模式：LLM 长生成退化/采样惩罚导致中文年报"每隔两三个字缺一个字"
// （生产实证 2026-09-29：座密度 15.9→3.1/千字，全文 5199 字提前收笔），
// 且此类毒化文本曾被写入缓存永久复发（V394 卫生守卫只防 vi，不防 zh 缺字）。
//
// 夹具说明：
//   yearly-zh-garbled-20260929.txt —— 生产事故原文（1985-06-15 奥斯陆盘，真实泄漏），
//                                     永久保留作为回归标定基准。
//   yearly-zh-healthy-sample.txt   —— 同盘本地健康生成物（10518 字，结构完整）。
// ═══════════════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessYearlyReportIntegrity } from '../lib/yearly_integrity.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const garbled = readFileSync(join(here, 'fixtures/yearly-zh-garbled-20260929.txt'), 'utf8');
const healthy = readFileSync(join(here, 'fixtures/yearly-zh-healthy-sample.txt'), 'utf8');

test('事故夹具必须被判定为不完整（生产 2026-09-29 真实毒化样本）', () => {
  const r = assessYearlyReportIntegrity(garbled, { lang: 'zh' });
  assert.equal(r.ok, false, '事故样本必须拦截');
  assert.ok(r.reasons.length >= 2, `应同时命中长度+密度两条判据，实际: ${r.reasons.join(' | ')}`);
  assert.ok(r.metrics.density_座 < 8, `座密度应 <8/千字，实际 ${r.metrics.density_座}`);
  assert.ok(r.metrics.astroDensityPerK < 20, `合计密度应 <20/千字，实际 ${r.metrics.astroDensityPerK}`);
});

test('健康夹具必须通过闸门（同盘正常生成物）', () => {
  const r = assessYearlyReportIntegrity(healthy, { lang: 'zh' });
  assert.equal(r.ok, true, `健康样本误杀: ${r.reasons.join(' | ')}`);
  assert.ok(r.metrics.density_座 > 10, `座密度应 >10/千字，实际 ${r.metrics.density_座}`);
  assert.ok(r.metrics.astroDensityPerK > 30, `合计密度应 >30/千字，实际 ${r.metrics.astroDensityPerK}`);
});

test('空文本/极短文本必须拦截', () => {
  assert.equal(assessYearlyReportIntegrity('', { lang: 'zh' }).ok, false);
  assert.equal(assessYearlyReportIntegrity(null, { lang: 'zh' }).ok, false);
  assert.equal(assessYearlyReportIntegrity('太短', { lang: 'zh' }).ok, false);
});

test('健康样本被截断到事故规模时，长度判据必须单独报警', () => {
  const cut = healthy.slice(0, 5200);
  const r = assessYearlyReportIntegrity(cut, { lang: 'zh' });
  assert.equal(r.ok, false);
  assert.ok(r.reasons.some(s => s.includes('长度')), '应命中长度判据');
  // 但密度仍应健康（截断不改变密度）→ 证明长度与密度是两条独立防线
  assert.ok(r.metrics.astroDensityPerK > 30);
});

test('非 zh 语言：密度判据不启用（applicable=false），仅长度护栏', () => {
  const shortEn = 'a'.repeat(100);
  const r1 = assessYearlyReportIntegrity(shortEn, { lang: 'en' });
  assert.equal(r1.applicable, false);
  assert.equal(r1.ok, false);
  const longEn = 'a'.repeat(8000);
  const r2 = assessYearlyReportIntegrity(longEn, { lang: 'en' });
  assert.equal(r2.ok, true);
});
