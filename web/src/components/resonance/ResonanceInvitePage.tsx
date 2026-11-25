import { useCallback, useEffect, useRef, useState } from 'react';
// @ts-ignore —— 纯 JS 逻辑核
import { personSubmittable, resonanceInviteUrl } from '../../lib/resonanceClient.mjs';
// @ts-ignore —— 六语字典单源
import { resT } from '../../lib/resonanceI18n.mjs';
// @ts-ignore —— 坐标卡入参装配
import { buildResonanceCardPayload } from '../../lib/resonanceCardPayload.mjs';
import PersonBirthForm, { emptyPerson, personDraftToProfile, type PersonDraft } from './PersonBirthForm';
import HappinessCardActions from './HappinessCardActions';
import { runResonanceCheckout } from './resonanceCheckoutFlow';
import { useResonanceLang, useResonanceSession, startResonanceLogin, resonanceApi } from './ResonancePage';
import '../../resonance.css';

type View = {
  found?: boolean; role?: string; scene?: string; locale?: string;
  paymentStatus?: string; reportStatus?: string; inviteToken?: string; claimed?: boolean;
  self?: { name?: string } | null; report?: Record<string, unknown> | null;
  partnerName?: string | null; partnerFilled?: boolean; selfSunSign?: string | null; partnerSunSign?: string | null;
  claimable?: boolean; paid?: boolean; partnerPrefilled?: boolean;
};

/** 受邀落地页 `/invite/:token`：信封仪式 → 登录认领 → （路径 2）自填生辰 → 报告＋坐标卡；A 视角同页 */
export default function ResonanceInvitePage({ token, onBackHome }: { token: string; onBackHome: () => void }) {
  const lang = useResonanceLang();
  const [session] = useResonanceSession();
  const [envelope, setEnvelope] = useState<View | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [formB, setFormB] = useState<PersonDraft>(emptyPerson);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const paidArrival = useRef(false);

  const api = resonanceApi(async () => (session ? session.access_token : null));

  const loadView = useCallback(async () => {
    if (!session) return;
    const r = await api.view(token);
    if (r.ok && r.data && typeof r.data === 'object') setView(r.data as View);
  }, [api, session, token]);

  useEffect(() => {
    api.envelope(token).then((r: { ok: boolean; data: unknown }) => { if (r.ok && r.data && typeof r.data === 'object') setEnvelope(r.data as View); });
    const u = new URL(window.location.href);
    paidArrival.current = u.searchParams.get('payment') === 'success';
    if (u.searchParams.has('payment')) { u.searchParams.delete('payment'); window.history.replaceState({}, '', u.pathname + u.search); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { if (session) loadView(); }, [session, loadView]);

  // 轮询：generating ⇒ 至 ready/failed；付讫回跳（webhook 竞态）⇒ 短窗重读
  useEffect(() => {
    if (!session || !view) return;
    const need = view.reportStatus === 'generating' || (paidArrival.current && view.paymentStatus === 'pending');
    if (!need) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      loadView();
      if (n > 40 || (view.paymentStatus === 'paid' && paidArrival.current)) { window.clearInterval(id); paidArrival.current = false; }
    }, 2500);
    return () => window.clearInterval(id);
  }, [session, view, loadView]);

  const scene = (envelope && envelope.scene) || (view && view.scene) || '';
  const role = view && view.role ? view.role : (session ? '' : 'anonymous');
  const shareUrl = resonanceInviteUrl(window.location.origin, token);

  const onClaim = async () => {
    setBusy(true); setError('');
    try {
      const needForm = !(view && view.partnerPrefilled);
      let personB: Record<string, unknown> | undefined;
      if (needForm) {
        const v = personSubmittable(formB);
        if (!v.ok) { setError(resT(lang, v.reason === 'time_city' ? 'err_time_city' : 'err_profile')); setBusy(false); return; }
        personB = v.person;
      }
      const r = await api.claim(token, personB);
      if (!r.ok) { setError(resT(lang, r.status === 409 ? 'invite_claimed' : 'err_generic')); setBusy(false); return; }
      if (r.data && typeof r.data === 'object') setView(r.data as View);
    } catch { setError(resT(lang, 'err_generic')); }
    setBusy(false);
  };

  const onRepay = async () => {
    setBusy(true); setError('');
    const out = await runResonanceCheckout(api, token, lang);
    if (out === 'error') setError(resT(lang, 'err_generic'));
    if (out !== 'redirect') setBusy(false);
  };

  const onCopy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* noop */ }
  };

  const report = view && view.report ? view.report : null;
  const cardPayload = report && view ? buildResonanceCardPayload({ lang, role: view.role, view, origin: window.location.origin }) : null;

  return (
    <div className="rs-root rs-root--invite" data-testid="rs-invite-page">
      <header className="rs-topbar">
        <button className="rs-back" onClick={onBackHome} aria-label="home">← {resT(lang, 'back_home')}</button>
        <span className="rs-brand">KINDREDSOULS</span>
      </header>

      {!envelope && <p className="rs-lede">…</p>}
      {envelope && envelope.found === false && (
        <main className="rs-form"><p className="rs-lede">{resT(lang, 'invite_not_found')}</p></main>
      )}

      {envelope && envelope.found !== false && role === 'anonymous' && (
        <main className="rs-envelope" data-testid="rs-envelope">
          <div className="rs-envelope__seal" aria-hidden="true">✦</div>
          <p className="rs-envelope__kicker">{scene ? resT(lang, `scene_${scene}_title`) : resT(lang, 'res_title')}</p>
          <h1 className="rs-title rs-title--sm">{resT(lang, 'invite_hero')}</h1>
          <p className="rs-lede">{resT(lang, 'cta_dual_unlock')}</p>
          <span className="rs-free">{resT(lang, 'invite_free')}</span>
          <button className="rs-cta" data-testid="rs-invite-login" onClick={() => startResonanceLogin('/invite/' + token)}>{resT(lang, 'invite_cta_login')}</button>
        </main>
      )}

      {envelope && envelope.found !== false && role === 'third_party' && (
        <main className="rs-form"><p className="rs-lede">{resT(lang, 'invite_claimed')}</p></main>
      )}

      {envelope && envelope.found !== false && role === 'invitee' && (
        <main className="rs-form">
          <div className="rs-envelope rs-envelope--inline" data-testid="rs-envelope">
            <p className="rs-envelope__kicker">{resT(lang, `scene_${scene}_title`)}</p>
            <h1 className="rs-title rs-title--sm">{resT(lang, 'invite_hero')}</h1>
            <span className="rs-free">{resT(lang, 'invite_free')}</span>
          </div>
          {envelope.paid === false && <p className="rs-lede">{resT(lang, 'invite_unpaid')}</p>}
          {envelope.paid !== false && (
            <>
              {!view?.partnerPrefilled && (
                <>
                  <h2 className="rs-sub">{resT(lang, 'invite_fill_title')}</h2>
                  <PersonBirthForm value={formB} onChange={setFormB} lang={lang} label={resT(lang, 'person_a_label')} namePlaceholder={resT(lang, 'f_name_ph')} />
                </>
              )}
              {error && <p className="rs-error" role="alert">{error}</p>}
              <button className="rs-cta" data-testid="rs-claim" onClick={onClaim} disabled={busy}>{resT(lang, 'invite_cta_claim')}</button>
            </>
          )}
        </main>
      )}

      {envelope && envelope.found !== false && (role === 'payer' || role === 'claimant') && view && (
        <main className="rs-form" data-testid="rs-order-view" data-report-status={view.reportStatus || ''}>
          <p className="rs-envelope__kicker">{resT(lang, `scene_${scene}_title`)}</p>
          {view.reportStatus === 'generating' && <p className="rs-lede" data-testid="rs-generating">{resT(lang, 'generating')}</p>}
          {view.reportStatus === 'failed' && (
            <>
              <p className="rs-error" role="alert">{resT(lang, 'failed')}</p>
              <button className="rs-cta rs-cta--ghost" onClick={loadView}>↻</button>
            </>
          )}
          {role === 'payer' && view.paymentStatus === 'pending' && view.reportStatus !== 'generating' && view.reportStatus !== 'ready' && (
            <>
              {error && <p className="rs-error" role="alert">{error}</p>}
              <button className="rs-cta" data-testid="rs-repay" onClick={onRepay} disabled={busy}>{resT(lang, 'cta_pay')}</button>
              <p className="rs-price">{resT(lang, 'price_line')}</p>
            </>
          )}
          {role === 'payer' && view.paymentStatus === 'paid' && (view.reportStatus === 'awaiting_partner' || view.reportStatus === 'awaiting_payment') && (
            <section className="rs-share" data-testid="rs-share">
              <h1 className="rs-title rs-title--sm">{resT(lang, 'a_share_title')}</h1>
              <p className="rs-lede">{resT(lang, 'cta_dual_unlock')}</p>
              <input className="rs-input" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
              <button className="rs-cta rs-cta--ghost" data-testid="rs-copy" onClick={onCopy}>{resT(lang, copied ? 'invite_copied' : 'invite_copy')}</button>
              <p className="rs-lede">{resT(lang, 'a_wait')}</p>
            </section>
          )}
          {report && (
            <>
              <h1 className="rs-title rs-title--sm">{resT(lang, 'report_a_title')}</h1>
              {report && (report as { precision?: string }).precision === 'date_level' && <span className="rs-degraded">{resT(lang, 'degraded_badge')}</span>}
              <ReportBody report={(view && view.report) as Record<string, unknown>} lang={lang} />
              {cardPayload && <HappinessCardActions payload={cardPayload} lang={lang} fileStem="kindredsouls-resonance" />}
            </>
          )}
        </main>
      )}
    </div>
  );
}

function ReportBody({ report, lang }: { report: Record<string, unknown>; lang: string }) {
  const keywords = Array.isArray(report.keywords) ? (report.keywords as string[]) : [];
  const sections = Array.isArray(report.sections) ? (report.sections as { title: string; body: string }[]) : [];
  return (
    <article className="rs-report" data-testid="rs-report">
      {keywords.length > 0 && (
        <div className="rs-kw">
          <span className="rs-kw__label">{resT(lang, 'keywords_label')}</span>
          <div className="rs-kw__chips">{keywords.map((k, i) => <span key={i} className="rs-kw__chip">{k}</span>)}</div>
        </div>
      )}
      {sections.map((s, i) => (
        <section key={i} className="rs-report__sec"><h3>{s.title}</h3><p>{s.body}</p></section>
      ))}
      {typeof report.closing === 'string' && report.closing && <p className="rs-report__closing">{report.closing}</p>}
    </article>
  );
}
