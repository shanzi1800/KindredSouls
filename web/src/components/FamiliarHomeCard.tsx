/**
 * FamiliarHomeCard.tsx —— 灵宠「首页座位卡」（主公特赦令 · 前端呈现线 · E46）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公令（2026-10-14）：「灵宠的认领环节和生成灵宠后再首页呈现的形态都需要实现」。
 *
 * 现状（落码前已勘察）：认领入口已有**两处**（付费墙 FamiliarPicker ＋ 报告尾 AdoptFamiliarCTA），
 *   但**首页毫无呈现**（FamiliarOverlay 是未挂载的 Stub）⇒ 认领完就再也见不到灵宠。
 *   本组件即补齐「首页呈现」这一空白，并把认领环节在首页也开出一处轻量入口。
 *
 * 🔴 三态（主公钦定）：
 *   ① collapsed 未认领折叠条 —— 一行轻提示 ＋ 「去认领」，不占版面；
 *   ② form      出生信息 ＋ 四象关系认领 —— 选一位伙伴即认领；
 *   ③ seat      已认领座位卡 —— 内置 CSS 占位立绘（呼吸 ＋ 瞳随指动）＋
 *                名字 / IP / 关系 / 五维性格条 / 星源三真相 / 降级告知 / 今日寄语。
 *
 * 🔴 两条硬约束（勘察所得，非可选）：
 *   A. **首页拿不到出生真值**（全站无任何 localStorage 键存用户生日）⇒ 本卡**自己承接**采集，
 *      并优先从三重来源只读抽取（当前 URL ⇒ `ks_last_wealth_report` ⇒ `ks_oauth_back_url`）；
 *   B. **`CitySearchInput` 挂载即拉 6.6MB `cities.json`** ⇒ 城市搜索框**只在 form 态渲染**
 *      （折叠态与座位卡态零网络），保住首屏。
 *
 * 🔴 E34 D5 红线：认领入参只许出生时空 ＋ 关系模式六键，经 `buildFamiliarAdoptPayload()`
 *   **白名单构造** ＋ `isCleanFamiliarAdoptPayload()` 自检；自检失败 ⇒ 宁可不发（fail-closed）。
 *   且**四件不全**（日期 / 成对坐标 / 时区）时绝不提交 —— 禁以默认盘（曼谷）冒充出生地。
 *
 * 🔴 呈现纪律：占位立绘**纯 CSS**（零 Spine/PixiJS/Live2D/Rive/Three，包体积零增长）；
 *   降级/缺真值一律如实告知，绝不伪造配色或星座。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RELATION_CARDS, FAMILIAR_LS_KEY, type FamiliarProfile } from './FamiliarPicker';
import { CitySearchInput } from './CitySearchInput';
import { TimeInput } from './TimeInput';
import { supabase } from '../lib/supabase';
import type { CityRecord } from '../hooks/useCitySearch';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { buildFamiliarAdoptPayload, isCleanFamiliarAdoptPayload, FAMILIAR_ADOPT_PATH } from '../lib/sandboxCheckout.mjs';
// @ts-ignore —— familiarHome.mjs 为纯 JS 逻辑核（形状由 E46 灵宠首页闸门守备）
import { FAMILIAR_HOME_TESTID, FAMILIAR_HOME_BAR_TESTID, FAMILIAR_HOME_FORM_TESTID, FAMILIAR_HOME_SEAT_TESTID, FAMILIAR_HOME_AVATAR_TESTID, readFamiliarRecord, writeFamiliarRecord, clearFamiliarRecord, personalityAxes, familiarPalette, triadTruth, hasDegradation, whisperIndex, localDateKey, extractBirthTruth, isPlausibleBirthDate } from '../lib/familiarHome.mjs';

const GOLD = '#D4AF37';
const WHISPER_COUNT = 5;

const SAFE: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 };

type Phase = 'collapsed' | 'form' | 'seat';

interface HomeRecord {
  profile: FamiliarProfile;
  triad: Record<string, unknown> | null;
  persisted: boolean;
  adoptedAt: string;
}

function latLonText(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${la}, ${lo}`;
}

/** 内置 CSS 占位立绘：呼吸 ＋ 瞳随指动（未来经 renderAvatar 插槽换 Spine，契约不变） */
const PetAvatar: React.FC<{ primary: string; secondary: string; crystal: string; eye: string }> = ({
  primary, secondary, crystal, eye,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = boxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    setLook({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  }, []);

  /** 瞳孔随指针微移（±3px；不由位次偏移承担定位 —— 定位交给 CSS 类，二者不叠加冲突） */
  const lookShift = (): React.CSSProperties => ({
    transform: `translate(${(look.x * 3).toFixed(2)}px, ${(look.y * 3).toFixed(2)}px)`,
  });

  return (
    <div
      ref={boxRef}
      data-testid={FAMILIAR_HOME_AVATAR_TESTID}
      className="ks-pet-avatar"
      onMouseMove={onMove}
      onMouseLeave={() => setLook({ x: 0, y: 0 })}
      style={{ background: `radial-gradient(circle at 36% 30%, ${crystal}, ${primary})` }}
      aria-hidden="true"
    >
      <span className="ks-pet-avatar-halo" style={{ borderColor: primary }} />
      <span className="ks-pet-eye ks-pet-eye-l" style={{ background: eye }}>
        <i className="ks-pet-pupil" style={lookShift()} />
      </span>
      <span className="ks-pet-eye ks-pet-eye-r" style={{ background: eye }}>
        <i className="ks-pet-pupil" style={lookShift()} />
      </span>
      <span className="ks-pet-mouth" style={{ borderBottomColor: secondary }} />
    </div>
  );
};

const FamiliarHomeCard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = String((i18n.language || 'zh').split('-')[0] || 'zh');

  const [phase, setPhase] = useState<Phase>('collapsed');
  const [rec, setRec] = useState<HomeRecord | null>(null);

  /* 出生真值（form 态用） */
  const [truth, setTruth] = useState<{ birthDate: string; birthTime: string; lat: number; lon: number; tz: string } | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [city, setCity] = useState<CityRecord | null>(null);
  const [editBirth, setEditBirth] = useState(true);

  const [pending, setPending] = useState<string | null>(null);
  const [err, setErr] = useState('');

  /* ── 取词（🔴 全部为**静态字面量**调用 ⇒ i18n 门禁可静态收录，防 key 字面量上屏）── */
  const axisLabel = (key: string): string => (
    key === 'talkative' ? t('familiar.axisTalkative')
      : key === 'clingy' ? t('familiar.axisClingy')
        : key === 'moody' ? t('familiar.axisMoody')
          : key === 'sarcastic' ? t('familiar.axisSarcastic')
            : key === 'healing' ? t('familiar.axisHealing')
              : key
  );
  const whisperText = (i: number): string => (
    i === 0 ? t('familiar.whisper1')
      : i === 1 ? t('familiar.whisper2')
        : i === 2 ? t('familiar.whisper3')
          : i === 3 ? t('familiar.whisper4')
            : i === 4 ? t('familiar.whisper5')
              : ''
  );
  /** 关系模式 ⇒ 标签（与 FamiliarPicker 同源键 familiar.girlfriend/…） */
  const relationLabel = (mode: string): string => t(`familiar.${mode}`);

  /* ── 挂载：读认领档 ⇒ 有档即座位卡；无档则只读抽取出生真值预填 ── */
  useEffect(() => {
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const r = readFamiliarRecord(store, FAMILIAR_LS_KEY);
    if (r) { setRec(r as HomeRecord); setPhase('seat'); return; }
    const search = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
    const tr = extractBirthTruth(search, store);
    if (tr) {
      setTruth({ birthDate: tr.birthDate, birthTime: tr.birthTime, lat: tr.lat, lon: tr.lon, tz: tr.tz });
      setBirthDate(tr.birthDate);
      if (tr.birthTime) setBirthTime(tr.birthTime);
      setEditBirth(false); // 已有可靠出生地 ⇒ 默认收起表单，直接选伙伴
    }
  }, []);

  /* ── 效坐标：用户自选城市优先，其次只读抽取所得（🔴 二者皆无 ⇒ null，绝不退默认盘）── */
  const coords = useMemo(() => {
    if (city) return { lat: city.lat, lon: city.lon, tz: city.tz };
    if (truth) return { lat: truth.lat, lon: truth.lon, tz: truth.tz };
    return null;
  }, [city, truth]);

  const adopt = async (mode: string) => {
    if (pending) return;
    setErr('');
    if (!isPlausibleBirthDate(birthDate)) { setErr(t('familiar.homeNeedDate')); return; }
    if (!coords) { setErr(t('familiar.homeNeedCity')); return; }
    setPending(mode);
    try {
      // 🔴 E34 D5：白名单构造 —— 只出六键，业务线字段在此被物理剔除
      const payload = buildFamiliarAdoptPayload(
        { birthDate, birthTime, lat: coords.lat, lon: coords.lon, tz: coords.tz },
        mode,
      );
      if (!isCleanFamiliarAdoptPayload(payload)) throw new Error('adopt payload not clean'); // 宁可不发

      let authHeader: Record<string, string> = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) authHeader.Authorization = `Bearer ${session.access_token}`;
      } catch (_) { /* 未配 Supabase ⇒ 匿名领养（后端只算不存） */ }

      const res = await fetch(FAMILIAR_ADOPT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data || !data.success || !data.profile) throw new Error(String(res.status));

      const next: HomeRecord = {
        profile: data.profile as FamiliarProfile,
        triad: data.triad || null,
        persisted: !!data.persisted,
        adoptedAt: new Date().toISOString(),
      };
      writeFamiliarRecord(window.localStorage, next, FAMILIAR_LS_KEY);
      setRec(next);
      setPhase('seat');
    } catch (_) {
      setErr(t('familiar.error'));
    } finally {
      setPending(null);
    }
  };

  const reset = () => {
    clearFamiliarRecord(window.localStorage, FAMILIAR_LS_KEY);
    setRec(null);
    setPhase('collapsed');
  };

  /* ═══════════ 三 · 已认领座位卡 ═══════════ */
  if (phase === 'seat' && rec) {
    const profile = rec.profile;
    const pal = familiarPalette(profile);
    const axes = personalityAxes(profile);
    const triad = triadTruth(rec);
    const degraded = hasDegradation(profile);
    const riseUncertain = !!(rec.triad && (rec.triad as Record<string, unknown>).timeUncertain === true);
    const wIdx = whisperIndex(profile, localDateKey(new Date()), WHISPER_COUNT);
    const whisper = wIdx >= 0 ? whisperText(wIdx) : '';

    return (
      <div className="ks-pet-card" data-testid={FAMILIAR_HOME_TESTID}>
        <div className="ks-pet-seat" data-testid={FAMILIAR_HOME_SEAT_TESTID} data-relation={String(profile.relation_mode || '')}>
          <div className="ks-pet-seat-head">
            <span style={{ ...SAFE }}>🐾 {t('familiar.homeTitle')}</span>
            {!rec.persisted && <span className="ks-pet-badge">{t('familiar.homeLocalOnly')}</span>}
          </div>

          <PetAvatar primary={pal.primary} secondary={pal.secondary} crystal={pal.crystal} eye={pal.eye} />

          <div className="ks-pet-name" style={{ color: pal.primary, ...SAFE }}>
            {String(profile.name || '')}
          </div>
          <div className="ks-pet-relation" style={{ ...SAFE }}>
            {relationLabel(String(profile.relation_mode || ''))}
            {triad && triad.rise ? ` · ${t('familiar.homeTriadRise')} ${triad.rise}` : ''}
          </div>

          {/* 五维性格条（只画真有的轴） */}
          {axes.length > 0 && (
            <div className="ks-pet-axes">
              {axes.map((a: { key: string; value: number }) => (
                <div className="ks-pet-axis" key={a.key}>
                  <span className="ks-pet-axis-label" style={{ ...SAFE }}>{axisLabel(a.key)}</span>
                  <span className="ks-pet-axis-track">
                    <i style={{ width: `${a.value}%`, background: `linear-gradient(90deg, ${pal.secondary}, ${pal.primary})` }} />
                  </span>
                  <span className="ks-pet-axis-val">{a.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 星源三真相（缺则整行不渲染） */}
          {triad && (
            <div className="ks-pet-triad">
              {triad.sun && <span>☀️ {t('familiar.homeTriadSun')} {triad.sun}</span>}
              {triad.moon && <span>🌙 {t('familiar.homeTriadMoon')} {triad.moon}</span>}
              {triad.rise && <span>⬆️ {t('familiar.homeTriadRise')} {triad.rise}</span>}
            </div>
          )}

          {whisper && (
            <div className="ks-pet-whisper" style={{ borderColor: pal.primary }}>
              <span className="ks-pet-whisper-tag">{t('familiar.homeToday')}</span>
              <span style={{ ...SAFE }}>{whisper}</span>
            </div>
          )}

          {degraded && <div className="ks-pet-note">{t('familiar.degradedNote')}</div>}
          {riseUncertain && <div className="ks-pet-note">{t('familiar.homeTimeUncertain')}</div>}

          <button type="button" className="ks-pet-reset" onClick={reset}>{t('familiar.homeReset')}</button>
        </div>
      </div>
    );
  }

  /* ═══════════ 二 · 未认领：折叠条 / 认领表单 ═══════════ */
  return (
    <div className="ks-pet-card" data-testid={FAMILIAR_HOME_TESTID}>
      {phase === 'collapsed' ? (
        <button
          type="button"
          className="ks-pet-bar"
          data-testid={FAMILIAR_HOME_BAR_TESTID}
          onClick={() => setPhase('form')}
        >
          <span className="ks-pet-bar-main" style={{ ...SAFE }}>
            <span className="ks-pet-bar-emoji" aria-hidden="true">🐾</span>
            <span>
              <span className="ks-pet-bar-title">{t('familiar.homeEmpty')}</span>
              <span className="ks-pet-bar-sub">{t('familiar.homeEmptyDesc')}</span>
            </span>
          </span>
          <span className="ks-pet-bar-cta">{t('familiar.homeClaim')}</span>
        </button>
      ) : (
        <div className="ks-pet-form" data-testid={FAMILIAR_HOME_FORM_TESTID}>
          <div className="ks-pet-form-head">
            <span className="ks-pet-form-title" style={{ ...SAFE }}>🐾 {t('familiar.homeTitle')}</span>
            <button type="button" className="ks-pet-link" onClick={() => { setErr(''); setPhase('collapsed'); }}>
              {t('familiar.homeCancel')}
            </button>
          </div>

          {editBirth ? (
            <>
              {/* 出生日期 */}
              <div className="ks-pet-field">
                <span className="ks-pet-field-label">{t('familiar.homeBirthDate')}</span>
                <input
                  type="date"
                  className="ks-pet-date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {/* 出生时间（复用 45-B8「绝不吞键」核） */}
              <div className="ks-pet-field">
                <span className="ks-pet-field-label">{t('familiar.homeBirthTime')}</span>
                <TimeInput value={birthTime} onChange={setBirthTime} />
              </div>
              {/* 出生城市（🔴 仅本态渲染 ⇒ 首屏不拉 6.6MB cities.json） */}
              <div className="ks-pet-field">
                <span className="ks-pet-field-label">{t('familiar.homeBirthCity')}</span>
                <CitySearchInput
                  value={city ? city.key : ''}
                  tz={city ? city.tz : ''}
                  lat={city ? city.lat : 0}
                  lon={city ? city.lon : 0}
                  onSelect={(c: CityRecord) => setCity(c)}
                  lang={lang}
                />
              </div>
            </>
          ) : (
            <div className="ks-pet-truth">
              <span style={{ ...SAFE }}>
                {birthDate}{birthTime ? ` · ${birthTime}` : ''}{truth ? ` · ${latLonText(truth.lat, truth.lon)}` : ''}
              </span>
              <button type="button" className="ks-pet-link" onClick={() => setEditBirth(true)}>
                {t('familiar.homeEdit')}
              </button>
            </div>
          )}

          <div className="ks-pet-pick">{t('familiar.homePickRelation')}</div>

          <div className="ks-pet-grid">
            {RELATION_CARDS.map((card) => (
              <button
                key={card.mode}
                type="button"
                onClick={() => adopt(card.mode)}
                disabled={!!pending}
                className="ks-pet-rel"
                style={{
                  borderColor: card.accent,
                  background: `linear-gradient(135deg, ${card.accent}22, ${card.accent2}14)`,
                  opacity: pending && pending !== card.mode ? 0.45 : 1,
                  cursor: pending ? 'not-allowed' : 'pointer',
                }}
              >
                <span className="ks-pet-rel-ip" style={{ color: card.accent }}>{card.ip}</span>
                <span className="ks-pet-rel-name" style={{ color: card.accent, ...SAFE }}>
                  {pending === card.mode ? t('familiar.adopting') : relationLabel(card.mode)}
                </span>
                <span className="ks-pet-rel-desc" style={{ ...SAFE }}>{t(`familiar.${card.mode}Desc`)}</span>
              </button>
            ))}
          </div>

          {err && <div className="ks-pet-err">{err}</div>}
        </div>
      )}
    </div>
  );
};

export default FamiliarHomeCard;
