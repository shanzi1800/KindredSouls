// 🤝 E155-刀一/刀二（主公军令 2026-11-25）：Resonance Code 服务层 + 路由
//   「一人付费 · 双方各得专属第一视角报告」：
//     建单 →（沙盒/Stripe 付讫 ⇒ webhook 订单级幂等置 paid）→ 路径 1 即刻双盘生成
//     → A 得邀请链接 → B 零付费认领；路径 2 B 自填生辰后双盘计算同时落库 A/B。
//   🔴 依赖全注入（db / auth / computeTruth / callAI）⇒ 内存假库 + 假模型可直测全链。
//   🔴 红线：token 仅认领一次；第三方零隐私；webhook 重放幂等；生成失败 ⇒ failed
//      （绝不落伪造报告）；报告仅 ready 态下发。

import {
  RESONANCE_PLAN, RESONANCE_SCENES, RESONANCE_LOCALES, RESONANCE_TABLE,
  generateInviteToken, normalizeInviteToken, normalizeScene, normalizeResonanceLocale,
  sanitizePersonProfile, personProfileComplete, normalizeOrderRow, canTransitionReport,
  reportStatusAfterPayment, projectInviteEnvelope, projectOrderView, resolveResonanceRole,
  createPostgrestResonanceDb,
} from '../lib/resonance/resonanceCore.mjs';
import { buildResonancePrompts, checkResonancePurity, parseResonanceReport } from '../lib/resonance/resonancePrompt.mjs';

export const RESONANCE_PRICE_PENDING = 'price_E155ResonancePENDING';
export const RESONANCE_MAX_TOKENS = 2600;

/* ── 星历真值（SwissEph：getAstroMatrix 真源；缺分钟 ⇒ 日期级显式降级）── */
export function createResonanceTruthCalc(d) {
  const getAstroMatrix = d.getAstroMatrix;
  const extractNatalTriad = d.extractNatalTriad;
  const buildCompatSynastryTruth = d.buildCompatSynastryTruth;
  const renderSynastryBlock = d.renderSynastryBlock;
  const resolveTimeZone = d.resolveTimeZone;
  const resolveCoordinates = d.resolveCoordinates;
  const housesOf = (mx) => {
    const ch = (mx && mx.meta && mx.meta.computed_houses) || {};
    const o = {};
    for (const p of Object.keys(ch)) {
      const h = Number(ch[p] && ch[p].house);
      if (Number.isInteger(h) && h >= 1 && h <= 12) o[p] = h;
    }
    return o;
  };
  const side = async (p) => {
    const bt = String(p.birthTime == null ? '' : p.birthTime).trim();
    const tzr = resolveTimeZone(p.tz, p.lat, p.lon);
    const coord = resolveCoordinates(p.lat, p.lon);
    const tzUsable = tzr.ok && tzr.tier >= 1;
    const coordExplicit = coord.ok && coord.tier === 'explicit';
    const timed = bt !== '' && (tzUsable || coordExplicit);
    const matrix = timed
      ? await getAstroMatrix(p.birthDate, bt, coord.lat, coord.lon, tzr.tz, {})
      : await getAstroMatrix(p.birthDate, undefined, undefined, undefined, undefined, {});
    if (!matrix) return null;
    const triad = extractNatalTriad(matrix);
    return {
      sunSign: triad.sunSign, moonSign: triad.moonSign, ascSign: timed ? triad.ascSign : null,
      birthTimeKnown: timed && triad.birthTimeKnown !== false,
      planetHouses: timed ? (triad.planetHouses || housesOf(matrix)) : {},
      planetLongitudes: triad.planetLongitudes || {},
    };
  };
  return async function computeResonanceTruth(personA, personB) {
    const [a, b] = await Promise.all([side(personA), side(personB)]);
    if (!a || !b) return null;
    let syn = { available: false, reason: 'engine_error' };
    try {
      syn = await buildCompatSynastryTruth({
        timeTruth: {
          a: { birthTime: personA.birthTime || '', tz: personA.tz, lat: personA.lat, lon: personA.lon },
          b: { birthTime: personB.birthTime || '', tz: personB.tz, lat: personB.lat, lon: personB.lon },
        },
      }, personA.birthDate, personB.birthDate);
    } catch (e) {
      syn = { available: false, reason: (e && e.code) || 'engine_error' };
    }
    return { sideA: a, sideB: b, syn, synBlock: renderSynastryBlock(syn, 'en') };
  };
}

/* ── 服务层 ── */
export function createResonanceService(deps) {
  const d = deps || {};
  const db = d.db || createPostgrestResonanceDb({ env: d.env });
  const envOf = d.env || (() => process.env);
  const computeTruth = d.computeTruth;
  const callAI = d.callAI;
  const log = d.log || console;
  const inflight = new Set();

  async function produce(order, perspective) {
    const prompts = buildResonancePrompts({
      scene: order.scene, locale: order.locale, profileA: order.personA, profileB: order.personB,
      sideA: order.truth.sideA, sideB: order.truth.sideB, synBlock: order.truth.synBlock,
    });
    const system = perspective === 'a' ? prompts.systemA : prompts.systemB;
    let user = perspective === 'a' ? prompts.userA : prompts.userB;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await callAI(system, user, envOf(), { maxTokens: RESONANCE_MAX_TOKENS, reportType: RESONANCE_PLAN });
      const parsed = parseResonanceReport(raw);
      if (parsed) {
        const purity = checkResonancePurity(parsed.sections.map((s) => s.title + ' ' + s.body).join('\n') + parsed.closing + parsed.keywords.join(' '), order.locale);
        if (purity.ok) {
          return {
            perspective, scene: order.scene, locale: order.locale,
            degraded: perspective === 'a' ? prompts.degradedA : prompts.degradedB,
            truth: { a: { sunSign: order.truth.sideA.sunSign, moonSign: prompts.degradedA ? null : order.truth.sideA.moonSign, ascSign: prompts.degradedA ? null : order.truth.sideA.ascSign },
                     b: { sunSign: order.truth.sideB.sunSign, moonSign: prompts.degradedB ? null : order.truth.sideB.moonSign, ascSign: prompts.degradedB ? null : order.truth.sideB.ascSign } },
            precision: (prompts.degradedA || prompts.degradedB) ? 'date_level' : 'timed',
            keywords: parsed.keywords, sections: parsed.sections, closing: parsed.closing,
            generatedAt: new Date().toISOString(),
          };
        }
        log.warn && log.warn(`[E155] purity retry perspective=${perspective} violations=${purity.violations.join(',')}`);
      } else {
        log.warn && log.warn(`[E155] unparsable model output perspective=${perspective} attempt=${attempt}`);
      }
      user += '\n\nREMINDER: return only the strict JSON object, in the required single language, with no forbidden terms.';
    }
    throw new Error('generation_failed_' + perspective);
  }

  /** 生成 A/B 双报告并落库（同 token 进程内去重；条件 PATCH ⇒ 并发只留一份）*/
  async function generate(order) {
    const token = order.inviteToken;
    if (inflight.has(token)) return { started: false, reason: 'inflight' };
    inflight.add(token);
    try {
      if (order.reportStatus !== 'generating') {
        const r = await db.setReportStatus(token, order.reportStatus, 'generating');
        if (!r.ok) return { started: false, reason: r.reason };
        order = r.order;
      }
      try {
        const truth = await computeTruth(order.personA, order.personB);
        if (!truth) throw new Error('truth_unavailable');
        const withTruth = Object.assign({}, order, { truth });
        const [reportA, reportB] = await Promise.all([produce(withTruth, 'a'), produce(withTruth, 'b')]);
        await db.setReportStatus(token, 'generating', 'ready', { report_a_json: reportA, report_b_json: reportB });
        log.log && log.log(`[E155] reports ready token=${token.slice(0, 6)}…`);
        return { started: true, done: true };
      } catch (e) {
        await db.setReportStatus(token, 'generating', 'failed', { report_a_json: null, report_b_json: null });
        log.error && log.error('[E155] generation failed:', e && e.message);
        return { started: true, done: false, error: e && e.message };
      }
    } finally {
      inflight.delete(token);
    }
  }

  /** 懒修复：已付且 B 档案齐 ⇒ 若未在生成/未就绪 ⇒ 触发（覆盖 webhook 与 claim 竞态、进程重启残态）*/
  function kickIfEligible(order) {
    if (!order || order.paymentStatus !== 'paid' || !personProfileComplete(order.personB)) return;
    if (order.reportStatus === 'awaiting_partner' || order.reportStatus === 'awaiting_payment' || order.reportStatus === 'failed'
      || (order.reportStatus === 'generating' && !inflight.has(order.inviteToken))) {
      generate(order).catch((e) => log.error && log.error('[E155] lazy generate error:', e && e.message));
    }
  }

  return {
    db, generate, inflight,
    async createOrder(input) {
      const it = input || {};
      const scene = normalizeScene(it.scene);
      const locale = normalizeResonanceLocale(it.locale) || 'zh';
      const personA = sanitizePersonProfile(it.personA);
      if (!scene) return { error: 400, code: 'bad_scene' };
      if (!personProfileComplete(personA)) return { error: 400, code: 'bad_profile_a' };
      let personB = null;
      if (it.personB && Object.keys(it.personB || {}).length > 0) {
        personB = sanitizePersonProfile(it.personB);
        if (!personProfileComplete(personB)) return { error: 400, code: 'bad_profile_b' };
      }
      const row = {
        invite_token: generateInviteToken(), scene, locale,
        payer_user_id: String(it.userId), person_a_profile: personA, person_b_profile: personB,
        payment_status: 'pending', report_status: 'awaiting_payment',
      };
      let order = await db.insert(row);
      for (let n = 0; n < 3 && !order; n++) { row.invite_token = generateInviteToken(); order = await db.insert(row); }
      if (!order) return { error: 500, code: 'insert_failed' };
      return { order, view: projectOrderView(order, it.userId) };
    },
    async envelope(token) { return projectInviteEnvelope(await db.getByToken(token)); },
    async view(token, userId) {
      const order = await db.getByToken(token);
      if (!order) return { error: 404, code: 'not_found' };
      kickIfEligible(order);
      return { view: projectOrderView(order, userId) };
    },
    /** 认领：B ≠ A；claimed_by 为空才写（条件 PATCH）；B 可补/改自己的档案 */
    async claim(token, userId, profileB) {
      const t = normalizeInviteToken(token);
      if (!t) return { error: 400, code: 'bad_token' };
      const before = await db.getByToken(t);
      if (!before) return { error: 404, code: 'not_found' };
      if (resolveResonanceRole(before, userId) === 'payer') return { error: 409, code: 'payer_cannot_claim' };
      if (before.claimedByUserId) {
        if (before.claimedByUserId === String(userId)) {
          if (profileB && personProfileComplete(sanitizePersonProfile(profileB))) {
            const p = sanitizePersonProfile(profileB);
            const r = await db.setReportStatus(t, before.reportStatus, before.reportStatus, { person_b_profile: p });
            if (r.ok) { kickIfEligible(r.order); return { view: projectOrderView(r.order, userId) }; }
          }
          return { view: projectOrderView(before, userId) };
        }
        return { error: 409, code: 'already_claimed' };
      }
      const p = profileB ? sanitizePersonProfile(profileB) : null;
      if (!personProfileComplete(p)) {
        // 路径 1：A 已知 B 生辰 ⇒ B 可零填直接认领（沿用 A 填写的 B 档案）
        if (!personProfileComplete(before.personB)) return { error: 400, code: 'bad_profile_b' };
      }
      const r = await db.claim(t, String(userId), personProfileComplete(p) ? p : before.personB);
      if (!r.ok) return { error: 409, code: 'already_claimed' };
      kickIfEligible(r.order);
      return { view: projectOrderView(r.order, userId) };
    },
    /** webhook 置付：订单级幂等（pending→paid 条件 PATCH；重放恒 changed:false）*/
    async onPaid(token) {
      const t = normalizeInviteToken(token);
      if (!t) return { ok: false, reason: 'bad_token' };
      const r = await db.markPaid(t);
      if (!r.ok) return { ok: true, changed: false, reason: r.reason };
      let order = r.order;
      const target = reportStatusAfterPayment(order);
      if (target === 'generating') {
        const s = await db.setReportStatus(t, 'awaiting_payment', 'generating');
        if (s.ok) order = s.order;
      } else {
        await db.setReportStatus(t, 'awaiting_payment', 'awaiting_partner');
      }
      kickIfEligible(order);
      return { ok: true, changed: true, order };
    },
  };
}

/* ── 路由 ── */
function readToken(raw) {
  const m = /^\/invite\/([A-Za-z0-9_-]{1,64})$/.exec(String(raw || ''));
  return normalizeInviteToken(m ? m[1] : '');
}

export function mountResonance(app, service, deps) {
  const auth = (deps || {}).auth;
  app.post('/api/resonance/order', async (req, res) => {
    try {
      const who = await auth(req);
      if (who.error) return res.status(who.error).json({ error: who.message });
      const body = (req.body || {});
      const out = await service.createOrder({ scene: body.scene, locale: body.locale, personA: body.personA, personB: body.personB, userId: who.userId });
      if (out.error) return res.status(out.error).json({ error: out.code });
      return res.json({ ok: true, token: out.order.inviteToken, order: out.view });
    } catch (e) { return res.status(500).json({ error: 'resonance order failed' }); }
  });
  // 受邀函（免登录）：仅场景与可领状态
  app.get('/api/resonance/invite/:token', async (req, res) => {
    try {
      const token = normalizeInviteToken(req.params.token);
      const env = token ? await service.envelope(token) : { found: false };
      if (!env.found) return res.status(404).json({ error: 'not_found' });
      return res.json(env);
    } catch (e) { return res.status(500).json({ error: 'resonance invite failed' }); }
  });
  app.get('/api/resonance/order/:token', async (req, res) => {
    try {
      const who = await auth(req);
      if (who.error) return res.status(who.error).json({ error: who.message });
      const token = normalizeInviteToken(req.params.token);
      if (!token) return res.status(400).json({ error: 'bad_token' });
      const out = await service.view(token, who.userId);
      if (out.error) return res.status(out.error).json({ error: out.code });
      return res.json(out.view);
    } catch (e) { return res.status(500).json({ error: 'resonance view failed' }); }
  });
  app.post('/api/resonance/claim', async (req, res) => {
    try {
      const who = await auth(req);
      if (who.error) return res.status(who.error).json({ error: who.message });
      const out = await service.claim((req.body || {}).token, who.userId, (req.body || {}).personB);
      if (out.error) return res.status(out.error).json({ error: out.code });
      return res.json(out.view);
    } catch (e) { return res.status(500).json({ error: 'resonance claim failed' }); }
  });
}

/** webhook 分支：由 /api/webhook 在 plan==='resonance' 时移交（不写 user_profiles.paid_plans）*/
export async function handleResonanceWebhook(res, session, service) {
  const token = normalizeInviteToken(session && session.metadata && session.metadata.resonance_token);
  if (!token) return res.json({ received: true, skipped: 'no_resonance_token' });
  const r = await service.onPaid(token);
  return res.json({ received: true, resonance: true, changed: r.changed === true });
}

export { RESONANCE_PLAN, RESONANCE_SCENES, RESONANCE_LOCALES, RESONANCE_TABLE, normalizeInviteToken, normalizeOrderRow, canTransitionReport };
