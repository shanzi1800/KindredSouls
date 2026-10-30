// ═══ E102 闸门：东南亚双语（TH/VI）越南语纯净化与命理纠偏（主公军令 2026-10-29）═══
// 三刀：③ vi 八字锁汉越化（干支表/合冲刑害/日主五行真值/同气红线/guard 纯语铁律）
//      ② 64 卦汉越第五列＋卦体结构锁（Khôn trên / Cấn dưới——卦 15 倒置根治）
//      ① 孤儿句拔除（Hướng dẫn vi mô của Ẩn Sĩ → quẻ Phục 寄语）
//      ④ 输出侧 _e102ViWash（英文术语/拼音零命中）＋刀四 CSS（th 削顶/vi uppercase/390px）
//      ⑤ 存量作废 v3→v4（旧 vi 报告含 Qian2/英文渗漏/孤儿句，长度守卫挡不住）
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const SERVER = read('server.js');
const APPCSS = read('web/src/App.css');
const LANGMODAL = read('web/src/components/LangModal.tsx');
const AUTHBTN = read('web/src/components/AuthButton.tsx');
const WEALTHPAYWALL = read('web/src/components/WealthPaywall.tsx');
const WEALTHDATAGRID = read('web/src/components/WealthDataGrid.tsx');
const SANDBOXCASHIER = read('web/src/components/SandboxCashier.tsx');
const PIPE = read('lib/reportPipeline.mjs');
const PKG = JSON.parse(read('package.json'));

// VM 花括号配平抽取（E98/E100 先例同法；默认参无——callAI 级坑不适用）
function fnB(sig) {
  const i = SERVER.indexOf(sig);
  assert.ok(i !== -1, '函数缺失：' + sig);
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, 'fn body unbalanced：' + sig);
  return eval('(' + SERVER.slice(i, end + 1) + ')');
}

// ── E102-③-1 vi 八字锁行为级：全汉越、零 CJK、零拼音、零英文术语、日主真值、同气红线 ──
test('E102-③-1 vi 分支行为级：汉越干支＋合冲刑害＋日主五行真值＋同气红线，零 CJK/零拼音/零英文', () => {
  const _E92 = fnB('function _E92CompatBaziLock(');
  const _e96 = fnB('function _e96LocalizeCompatBaziLock(');
  const bl = _E92('1976-12-3', '1997-10-18', null, null);
  const out = JSON.parse(JSON.stringify(bl));
  _e96(out, 'vi');
  const t = out.lock;
  // 汉越干支军令钦定口径（Kỷ Sửu / Quý Tỵ / Canh Tuất / Đinh Sửu）
  assert.ok(t.includes('Kỷ Sửu (trụ ngày)'), '汉越干支 Kỷ Sửu 缺失');
  assert.ok(t.includes('Quý Tỵ (trụ ngày)'), '汉越干支 Quý Tỵ 缺失');
  assert.ok(t.includes('Đinh Sửu (trụ năm)'), '汉越干支 Đinh Sửu 缺失');
  assert.ok(t.includes('Canh Tuất (trụ tháng)'), '汉越干支 Canh Tuất 缺失');
  // 关系术语汉越（tương xung/tương hình/bán hợp Kim cục）
  assert.ok(t.includes('Thìn–Tuất tương xung'), '相冲汉越化缺失');
  assert.ok(t.includes('Hợi–Tỵ tương xung'), '亥巳相冲汉越化缺失');
  assert.ok(t.includes('Sửu–Tuất tương hình'), '相刑汉越化缺失');
  assert.ok(t.includes('Sửu–Tỵ bán hợp Kim cục'), '半合汉越化缺失（军令钦定 bán hợp Kim cục）');
  // 🔴 刀三③ 同气红线：Sửu–Sửu 伪合化根治（同支＝đồng khí，非合化）
  assert.ok(t.includes('Sửu–Sửu đồng khí tương ứng (không phải hợp hóa)'), '同气红线缺失（Sửu-Sửu 伪合化回潮）');
  assert.ok(!/Sửu–Sửu (bán hợp|hợp hóa)/.test(t), 'Sửu–Sửu 伪合化残留');
  // 🔴 刀三② 日主五行真值行（bản tính Kim 自相矛盾根治）
  assert.ok(/Nhật Chủ A: Kỷ Sửu \(âm Thổ\); B: Quý Tỵ \(âm Thủy\)/.test(t), '日主五行真值行缺失（âm Thổ/âm Thủy）');
  assert.ok(t.includes('cấm tự gán "bản tính Kim"'), '日主防令缺失');
  // 年龄差真值行
  assert.ok(t.includes('21 năm'), '年龄差真值缺失');
  // lock 体内零 CJK、零拼音、零英文契约术语
  assert.strictEqual((t.match(/[\u4e00-\u9fa5]/g) || []).length, 0, 'vi lock 体内 CJK 残留');
  assert.ok(!/\b(Ji|Gui|Chou)\b/.test(t), '拼音残留（Ji/Gui/Chou）');
  assert.ok(!/ clash\b| trine\b| half-combination| friction\b/.test(t), '英文契约术语残留');
  // guard：vi 纯语铁律＋五行红线＋同气红线
  assert.ok(out.guard.includes('SỰ THUẦN KHIẾT CỦA NGÔN NGỮ'), 'vi 语言纯粹性铁律缺失');
  assert.ok(out.guard.includes('NGŨ HÀNH NGÀY CHỦ'), 'vi guard 五行红线缺失');
  assert.ok(out.guard.includes('ĐỒNG CHI KHÔNG PHẢI HỢP HÓA'), 'vi guard 同气红线缺失');
});

// ── E102-③-2 th/es/fr/en 契约逐字保全（vi 分支零外溢）──
test('E102-③-2 四语契约逐字保全（vi 分支零外溢）', () => {
  const _E92 = fnB('function _E92CompatBaziLock(');
  const _e96 = fnB('function _e96LocalizeCompatBaziLock(');
  const bl = _E92('1976-12-3', '1997-10-18', null, null);
  const mk = () => JSON.parse(JSON.stringify(bl));
  const en = mk(); _e96(en, 'en');
  assert.ok(en.lock.includes('half-combination of the Metal trine'), 'en 契约漂移（E96 原格式）');
  assert.ok(en.guard.includes('LANGUAGE PURITY'), 'en guard 漂移');
  const th = mk(); _e96(th, 'th');
  assert.ok(th.lock.includes('ครึ่งไตรภาคีธาตุทอง'), 'th 契约漂移（E100 锚）');
  assert.ok(th.guard.includes('ความบริสุทธิ์ของภาษา'), 'th guard 漂移');
  const es = mk(); _e96(es, 'es');
  assert.ok(es.lock.includes('Semialianza de Metal (Chou-Si)'), 'es 契约漂移（🛡️ E103-① 后继化：军令钦定口径）');
  const fr = mk(); _e96(fr, 'fr');
  assert.ok(fr.lock.includes('Demi-combinaison de Métal (Chou-Si)'), 'fr 契约漂移（🛡️ E103-① 后继化：军令钦定口径）');
  // zh 零触碰：调用点守卫（_e96 仅非 zh 语种调用 ⇒ zh 同气关系行原样保留中文）
  assert.ok(SERVER.includes("if (_e92BL && !/^zh/i.test(String(lang || 'zh'))) _e96LocalizeCompatBaziLock"), 'zh 必须经调用守卫零触碰 _e96');
});

// ── E102-② 64 卦汉越第五列＋卦体结构锁（卦 15 倒置根治）──
test('E102-②-1 卦锁 vi 行为级：64 卦全汉越＋外内卦结构行＋零 CJK＋零 Qian[0-9]', () => {
  const H = fnB('function _e100IchingHexLine(');
  // 军令评审盘确定性：同输入恒同输出
  const a = H('1976-12-3', '1997-10-18', 'w0', 'vi');
  assert.strictEqual(a, H('1976-12-3', '1997-10-18', 'w0', 'vi'), '同输入必须同卦');
  // 全 64 卦覆盖采样（窗口枚举 4000 次）
  const seen = new Set();
  for (let k = 0; k < 4000; k++) seen.add(H('1976-12-3', '1997-10-18', 'w' + k, 'vi'));
  assert.strictEqual(seen.size, 64, '64 卦全覆盖失败：' + seen.size);
  const STRUCT = /ngoại quái là (Càn|Khôn|Cấn|Chấn|Ly|Khảm|Tốn|Đoài) \((Trời|Đất|Núi|Sấm|Lửa|Nước|Gió|Hồ)\) ở trên, nội quái là (Càn|Khôn|Cấn|Chấn|Ly|Khảm|Tốn|Đoài) \((Trời|Đất|Núi|Sấm|Lửa|Nước|Gió|Hồ)\) ở dưới/;
  for (const l of seen) {
    assert.ok(!/[\u4e00-\u9fff]/.test(l), 'vi 卦行 CJK 渗漏：' + l);
    assert.ok(!/Qian[0-9]/.test(l), 'vi 卦行拼音泄漏（Qian2）' + l);
    assert.ok(/^Quẻ số \d+: /.test(l), 'vi 卦行格式漂移：' + l);
    assert.ok(STRUCT.test(l), 'vi 卦体结构行缺失/漂移：' + l);
  }
  // 🔴 军令刀三① 卦 15 地山谦钦定：Khôn 上 Cấn 下（倒置根治）
  const khiem = [...seen].find((l) => l.includes('Khiêm'));
  assert.ok(khiem, '卦 15 Khiêm 未采样到');
  assert.ok(khiem.includes('Quẻ số 15: Khiêm (Địa Sơn Khiêm)'), '卦 15 钦定句式漂移：' + khiem);
  assert.ok(khiem.includes('ngoại quái là Khôn (Đất) ở trên, nội quái là Cấn (Núi) ở dưới'), '卦 15 卦体结构倒置（Khôn 须上、Cấn 须下）：' + khiem);
  // 卦 24 Phục（孤儿句寄语联动锚）
  const phuc = [...seen].find((l) => l.includes('Phục'));
  assert.ok(phuc && phuc.includes('Địa Lôi Phục'), '卦 24 Phục 汉越名缺失');
  // th/zh/en 契约回归
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'th').startsWith('กั้วที่'), 'th 卦行契约漂移');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'zh').startsWith('第'), 'zh 卦行契约漂移');
  assert.ok(H('1976-12-3', '1997-10-18', 'w0', 'en').startsWith('Hexagram No.'), 'en 卦行契约漂移');
});

// ── E102-① 孤儿句拔除（Hướng dẫn vi mô của Ẩn Sĩ → quẻ Phục 寄语）──
test('E102-①-3 月报塔罗引线 vi 句：孤儿句拔除＋quẻ Phục 寄语钦定', () => {
  assert.ok(!SERVER.includes('Hướng dẫn vi mô của'), '孤儿句旧源残留（Hướng dẫn vi mô của Ẩn Sĩ）');
  assert.ok(SERVER.includes('Lời chỉ dẫn sâu sắc từ quẻ Phục chính là ngọn đèn ấm áp soi sáng'), 'vi 塔罗引线寄语缺失');
});

// ── E102-④ 输出侧清洗：_e102ViWash 行为级（军令刀五验收正则零命中）＋交付层接入 ──
test('E102-④-1 _e102ViWash 行为级：军令正则零命中＋换行保全＋交付层双保险接入', () => {
  const W = fnB('function _e102ViWash(');
  const dirty = '(Dragon-Dog clash) (Pig-Snake clash) (Ox-Dog) friction Tiger-Snake friction half-combination of the Metal trine half-combination of the Fire trine Qian2 (Modesty) Fu (Return) lá số synastry keynote\nbare: Dragon-Dog, Ox-Dog, Pig-Snake, Tiger-Snake';
  const out = W(dirty);
  assert.ok(!/(Dragon-Dog|Pig-Snake|Ox-Dog|Metal trine|Fire trine)/.test(out), '军令刀五英文术语正则命中');
  assert.ok(!/Qian[0-9]/.test(out), '军令刀五拼音正则命中（Qian[0-9]）');
  assert.ok(!/lá số synastry/.test(out) && !/keynote/.test(out), 'lá số synastry/keynote 渗漏');
  assert.ok(out.includes('bán hợp Kim cục') && out.includes('bán hợp Hỏa cục'), '半合汉越替代词缺失');
  assert.ok(out.includes('Thìn–Tuất tương xung') && out.includes('Sửu–Tuất tương hình'), '关系汉越替代词缺失');
  // 纯净文本零触碰
  assert.strictEqual(W('Trái tim thuần khiết của đôi hồn'), 'Trái tim thuần khiết của đôi hồn', '纯净 vi 文本被误触');
  // 交付层接入：SSE 帧级＋终帧（vi 双层清洗；其他语种 E100 层不动）
  // 🛡️ E103-③ 后继化：SSE 帧级清洗链接入 fr/es 排版层（vi 层零改动，结构外扩）
  assert.ok(SERVER.includes("_sse.text(_e100NonZh ? (_e102ViLang ? _e102ViWash(_e100StripCjk(d)) : _e103FrLang ? _e103FrWash(_e100StripCjk(d)) : _e103EsLang ? _e103EsWash(_e100StripCjk(d)) : _e100StripCjk(d)) : ((reportType === 'yearly' && _e94IsZh) ? _e108LockQuarterRanges(d, _compat.timeCtx.windowStart) : d))"), 'SSE 帧级 vi 双层清洗缺失（E103 扩链形态）');
  assert.ok(SERVER.includes("if (_e100NonZh) insight = _e102ViLang ? _e102ViWash(_e100StripCjk(insight)) : _e100StripCjk(insight);"), '终帧 vi 双层清洗缺失');
});

// ── E102-刀四 移动端排版安全（th 削顶/vi uppercase/390px 断点）──
test('E102-④-2 刀四 CSS：th 声调符削顶防护＋390px 纵向堆叠（源码＋dist 双验）', () => {
  // th 削顶：正文/章节 line-height 1.55+＋padding-top 4px（军令钦定）
  assert.ok(APPCSS.includes('.ks-report-para') && APPCSS.includes('padding-top: 4px'), 'App.css 削顶防护 padding-top 缺失');
  const para = APPCSS.slice(APPCSS.indexOf('.ks-report-para'), APPCSS.indexOf('.ks-report-para') + 400);
  assert.ok(para.includes('line-height: 1.75') && para.includes('padding-top: 4px'), '.ks-report-para 削顶规格漂移');
  // 390px 断点：月/年报纵向堆叠
  assert.ok(APPCSS.includes('@media screen and (max-width: 390px)'), '390px 断点缺失');
  assert.ok(APPCSS.includes('.ks-duo-grid, .ks-fact-grid { grid-template-columns: 1fr; }'), '390px 单列规则缺失');
  // dist 产物双验（build 链由部署保证；闸门侧验 CSS 类已产）
  const html = read('web/dist/index.html');
  const m = html.match(/assets\/(index-[^"]+\.css)/);
  assert.ok(m, 'dist CSS 未引用');
  const css = read('web/dist/assets/' + m[1]);
  assert.ok(css.includes('ks-duo-grid') && css.includes('390px'), 'dist CSS 缺 390px 断点/栅格类');
});

test('E102-④-3 刀四 vi 大标题禁 uppercase＋CTA 可换行（活体组件）', () => {
  // 活体组件 vi 分流（LangModal/AuthButton/WealthPaywall/WealthDataGrid——生产 bundle 已实锤编译入）
  assert.ok(LANGMODAL.includes("textTransform: i18n.language === 'vi' ? 'none' : 'uppercase'"), 'LangModal vi uppercase 分流缺失');
  assert.ok(AUTHBTN.includes("textTransform: lang === 'vi' ? 'none' : 'uppercase'"), 'AuthButton vi uppercase 分流缺失');
  assert.ok(WEALTHPAYWALL.includes("textTransform: lang === 'vi' ? 'none' : 'uppercase'"), 'WealthPaywall vi uppercase 分流缺失');
  assert.ok(WEALTHDATAGRID.includes("lang === 'vi' ? 'none' : 'uppercase'"), 'WealthDataGrid vi uppercase 分流缺失');
  // CTA 可换行（vi 长标签 390px 不溢出）
  assert.ok(SANDBOXCASHIER.includes("whiteSpace: 'normal'"), 'SandboxCashier CTA nowrap 残留');
  assert.ok(!/whiteSpace: 'nowrap'/.test(SANDBOXCASHIER), 'SandboxCashier CTA nowrap 回潮');
});

// ── E102-⑤ 存量作废：COMPAT_PERSIST_VERSION v3→v4 ──
test('E102-⑤-0 存量作废：COMPAT_PERSIST_VERSION v4（旧 vi 毒行长度守卫挡不住 ⇒ 版本作废）', () => {
  assert.ok(PIPE.includes("export const COMPAT_PERSIST_VERSION = 'compat_report.v5';"), '持久化版本须为 v5（🛡️ E103-⑤ 后继化：fr/es 旧口径作废）');
  assert.ok(PIPE.includes('E103-⑤'), 'v5 升版注释（E103 军令记录）缺失');
  assert.ok(!PIPE.includes("'compat_report.v4';"), 'v4 字面量残留（作废不彻底）');
  assert.ok(!PIPE.includes("'compat_report.v3';"), 'v3 字面量残留（作废不彻底）');
  assert.ok(!PIPE.includes("'compat_report.v2';"), 'v2 字面量残留（作废不彻底）');
});

// ── 军规链基线（E102 入编后 77 段；e102 恒插 e40-compat 之前、python 恒链尾）──
test('E102-⑥ 军规链基线 77 段（e102 居 e100 后 e40 前、e40 恒 len-2、python 恒链尾）', () => {
  const parts = PKG.scripts['test:astro'].split('&&').map(s => s.trim()).filter(Boolean);
  assert.strictEqual(parts.length, 84, '军规链段数漂移：' + parts.length);   // 🛡️ E105 后继化：79→80   // 🛡️ E103/E104 后继化：77→79
  const e40 = parts.findIndex(p => p.includes('e40-compat'));
  assert.strictEqual(e40, parts.length - 2, 'e40-compat 须恒为 len-2');
  assert.ok(parts[parts.length - 1].includes('python3'), 'python 须恒为链尾');
  const e102 = parts.findIndex(p => p.includes('audit-e102-vi-l10n'));
  assert.ok(e102 !== -1, 'e102 闸门未入编');
  assert.ok(e102 < e40, 'e102 须插在 e40-compat 之前（长链入编位铁律）');
  assert.ok(parts[e102 - 1].includes('e100-th-purity-iching'), 'e102 须紧跟 e100 之后');
});
