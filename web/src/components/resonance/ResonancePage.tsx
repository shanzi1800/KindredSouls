import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
// @ts-ignore —— 纯 JS 逻辑核（E155 闸门守备）
import { createResonanceApi, personSubmittable, saveResonanceIntent, takeResonanceIntent, RESONANCE_PLAN } from '../../lib/resonanceClient.mjs';
// @ts-ignore —— 六语字典单源
import { resT } from '../../lib/resonanceI18n.mjs';
import { runResonanceCheckout } from './resonanceCheckoutFlow';
import PersonBirthForm, { emptyPerson, personDraftToProfile, type PersonDraft } from './PersonBirthForm';
import '../../resonance.css';

type Session = { access_token: string } | null;

export function useResonanceSession(): [Session] {
  const [session, setSession] = useState<Session>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session && data.session.access_token ? { access_token: data.session.access_token } : null));
  }, []);
  return [session];
}

/** 语种（与全站 i18n 同源；'zh-CN' ⇒ 'zh'） */
export function useResonanceLang(): string {
  const { i18n } = useTranslation();
  return String(i18n.language || 'zh').split('-')[0];
}

/** 登录：整页重定向 OAuth（🔴 严禁 window.open）；意图已先落 localStorage ⇒ 回场续跑 */
export function startResonanceLogin(backPath: string) {
  const redirectUrl = window.location.origin + backPath;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl },
  });
}

export function resonanceApi(getToken: () => Promise<string | null>) {
  return createResonanceApi((...a: Parameters<typeof fetch>) => fetch(...a), getToken);
}

export type Scene = 'romance' | 'business' | 'friendship';
const SCENES: Scene[] = ['romance', 'business', 'friendship'];

/** 三场景选择页 `/resonance`（零独立对话窗/抽屉；灵宠入口单向回首页） */
export default function ResonancePage({ onBackHome }: { onBackHome: () => void }) {
  const lang = useResonanceLang();
  const [session] = useResonanceSession();
  const [scene, setScene] = useState<Scene | null>(null);
  const [mode, setMode] = useState<'known' | 'invite'>('invite');
  const [personA, setPersonA] = useState<PersonDraft>(emptyPerson);
  const [personB, setPersonB] = useState<PersonDraft>(emptyPerson);
  const [busy, setBusy] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

  const api = resonanceApi(async () => (session ? session.access_token : null));

  const unlock = useCallback(async (s: Session, sc: Scene, md: 'known' | 'invite', pa: PersonDraft, pb: PersonDraft) => {
    const a = personSubmittable(pa);
    if (!a.ok) { setError(resT(lang, a.reason === 'time_city' ? 'err_time_city' : 'err_profile')); setBusy(false); return false; }
    let personB: Record<string, unknown> | undefined;
    if (md === 'known') {
      const b = personSubmittable(pb);
      if (!b.ok) { setError(resT(lang, b.reason === 'time_city' ? 'err_time_city' : 'err_profile')); setBusy(false); return false; }
      personB = b.person;
    }
    const out = await api.order({ scene: sc, locale: lang, personA: a.person, personB });
    if (!out.ok || !out.data || !out.data.token) { setError(resT(lang, 'err_generic')); setBusy(false); return false; }
    const token: string = out.data.token;
    const { clear } = takeResonanceIntent();
    clear();
    const co = await runResonanceCheckout(api, token, lang);
    if (co === 'error') { setError(resT(lang, 'err_generic')); setBusy(false); return false; }
  }, [api, lang]);

  // 回场续跑：OAuth 整页重定向归来 ⇒ 会话就绪后按 localStorage 意图自动续建单
  useEffect(() => {
    if (restored || !session) return;
    const { intent, clear } = takeResonanceIntent();
    setRestored(true);
    if (!intent) return;
    if (intent.purpose === 'create') {
      setScene(intent.scene as Scene); setMode(intent.mode);
      setPersonA({ ...emptyPerson(), ...intent.personA, timeUnknown: !intent.personA.birthTime });
      if (intent.personB) setPersonB({ ...emptyPerson(), ...intent.personB, timeUnknown: !intent.personB.birthTime });
      setBusy(true);
      unlock(session, intent.scene as Scene, intent.mode, { ...emptyPerson(), ...intent.personA, timeUnknown: !intent.personA.birthTime },
        intent.personB ? { ...emptyPerson(), ...intent.personB, timeUnknown: !intent.personB.birthTime } : emptyPerson());
    }
    clear();
  }, [session, restored, unlock]);

  const onUnlockClick = () => {
    if (!scene) return;
    setBusy(true); setError('');
    if (session) { unlock(session, scene, mode, personA, personB); return; }
    saveResonanceIntent({ purpose: 'create', scene, mode, locale: lang, personA: personDraftToProfile(personA), personB: mode === 'known' ? personDraftToProfile(personB) : undefined });
    setBusy(false);
    setNeedLogin(true);
  };

  const onLogin = async () => {
    setBusy(true);
    const back = '/resonance';
    try { await startResonanceLogin(back); } catch { setBusy(false); setError(resT(lang, 'err_generic')); }
  };

  return (
    <div className="rs-root rs-root--resonance" data-testid="rs-resonance-page">
      <header className="rs-topbar">
        <button className="rs-back" onClick={onBackHome} aria-label="home">← {resT(lang, 'back_home')}</button>
        <span className="rs-brand">KINDREDSOULS</span>
      </header>

      {!scene && (
        <main className="rs-scene-select">
          <h1 className="rs-title">{resT(lang, 'res_title')}</h1>
          <p className="rs-lede">{resT(lang, 'cta_dual_unlock')}</p>
          <div className="rs-scene-grid">
            {SCENES.map((sc) => (
              <button key={sc} className={`rs-scene-card rs-scene-card--${sc}`} data-testid={`rs-scene-${sc}`} onClick={() => setScene(sc)}>
                <span className="rs-scene-card__emblem" aria-hidden="true" />
                <span className="rs-scene-card__title">{resT(lang, `scene_${sc}_title`)}</span>
                <span className="rs-scene-card__sub">{resT(lang, `scene_${sc}_sub`)}</span>
              </button>
            ))}
          </div>
          <p className="rs-price">{resT(lang, 'price_line')}</p>
        </main>
      )}

      {scene && (
        <main className="rs-form">
          <button className="rs-back rs-back--inline" onClick={() => setScene(null)}>← {resT(lang, `scene_${scene}_title`)}</button>
          <h1 className="rs-title rs-title--sm">{resT(lang, `scene_${scene}_title`)}</h1>
          <p className="rs-lede">{resT(lang, `scene_${scene}_sub`)}</p>

          <div className="rs-modes" role="radiogroup">
            <button role="radio" aria-checked={mode === 'invite'} className={`rs-mode ${mode === 'invite' ? 'is-on' : ''}`} data-testid="rs-mode-invite" onClick={() => setMode('invite')}>
              <strong>{resT(lang, 'mode_invite_title')}</strong><span>{resT(lang, 'mode_invite_sub')}</span>
            </button>
            <button role="radio" aria-checked={mode === 'known'} className={`rs-mode ${mode === 'known' ? 'is-on' : ''}`} data-testid="rs-mode-known" onClick={() => setMode('known')}>
              <strong>{resT(lang, 'mode_known_title')}</strong><span>{resT(lang, 'mode_known_sub')}</span>
            </button>
          </div>

          <PersonBirthForm value={personA} onChange={setPersonA} lang={lang} label={resT(lang, 'person_a_label')} namePlaceholder={resT(lang, 'f_name_ph')} />
          {mode === 'known' && <PersonBirthForm value={personB} onChange={setPersonB} lang={lang} label={resT(lang, 'person_b_label')} namePlaceholder={resT(lang, 'f_name_ph')} />}

          {error && <p className="rs-error" role="alert">{error}</p>}
          {needLogin && !session && (
            <div className="rs-loginwall">
              <p>{resT(lang, 'err_need_login')}</p>
              <button className="rs-cta rs-cta--ghost" onClick={onLogin} disabled={busy}>{resT(lang, 'invite_cta_login')}</button>
            </div>
          )}
          <button className="rs-cta" data-testid="rs-unlock" onClick={onUnlockClick} disabled={busy || (needLogin && !session)}>
            {busy ? resT(lang, 'cta_creating') : resT(lang, 'cta_pay')}
          </button>
          <p className="rs-price">{resT(lang, 'price_line')}</p>
        </main>
      )}
    </div>
  );
}
