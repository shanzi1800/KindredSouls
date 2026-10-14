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
 * 🔴 呈现纪律：E51（主公钦定原画 2026-10-14）起，已认领呈现**升维为「破框骑键」**——
 *   Milo / Sophia（主公钦定 Gemini 原画切片，Alpha 透明 WebP）骑在首页「开始测算」
 *   金色大按钮上沿（破框突破卡片边界）；外层 pointer-events:none 物理穿透，
 *   仅头部/爱心宝石命中区保留点击（呼吸微光 + 今日寄语气泡）。
 *   座位卡（E46 CSS 占位立绘版）就此退役；未认领态仍走折叠条/表单，零灵宠呈现（主公裁决）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { RELATION_CARDS, FAMILIAR_LS_KEY, type FamiliarProfile } from './FamiliarPicker';
import { CitySearchInput } from './CitySearchInput';
import { TimeInput } from './TimeInput';
import { supabase } from '../lib/supabase';
import type { CityRecord } from '../hooks/useCitySearch';
// 🐾 E51：主公钦定原画切片（macOS Vision 主体提取 + Alpha 透明 WebP，几何真值见 /tmp/e51_assets/out/geometry.json）
import miloSprite from '../assets/familiar_milo.webp';
import sophiaSprite from '../assets/familiar_sophia.webp';
// @ts-ignore —— sandboxCheckout.mjs 为纯 JS 逻辑核（形状由 Gate 45-B 闸门守备）
import { buildFamiliarAdoptPayload, isCleanFamiliarAdoptPayload, FAMILIAR_ADOPT_PATH } from '../lib/sandboxCheckout.mjs';
// @ts-ignore —— familiarHome.mjs 为纯 JS 逻辑核（形状由 E46 灵宠首页闸门守备）
import { FAMILIAR_HOME_TESTID, FAMILIAR_HOME_BAR_TESTID, FAMILIAR_HOME_FORM_TESTID, readFamiliarRecord, writeFamiliarRecord, clearFamiliarRecord, whisperIndex, localDateKey, extractBirthTruth, isPlausibleBirthDate, familiarChartSig, recordMatchesChart } from '../lib/familiarHome.mjs';

const GOLD = '#D4AF37';
const WHISPER_COUNT = 5;

const SAFE: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 };

type Phase = 'collapsed' | 'form';

/** 🐾 E51：relation_mode ⇒ IP（与服务端 familiar_engine.IP_OF 同源白名单） */
const IP_OF_MODE: Record<string, 'Sophia' | 'Milo'> = {
  girlfriend: 'Sophia', bestie: 'Sophia', buddy: 'Milo', boyfriend: 'Milo',
};

interface HomeRecord {
  profile: FamiliarProfile;
  triad: Record<string, unknown> | null;
  persisted: boolean;
  adoptedAt: string;
  /** 🔒 E49: 星盘签名（birthDate|birthTime|lat|lon|tz 归一）—— 按盘隔离 */
  chartSig?: string;
}

function latLonText(lat: number, lon: number): string {
  const la = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${la}, ${lo}`;
}

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

  /* 🔒 E48（主公亲令 2026-10-14）: 首页认领入口与报告页**同规则**的商业门禁 ——
     未付 $4.99（或非沙箱已购）一律拦截，堵死「首页 form 态免费认领」侧门。
     paidOk 三态：true=已购放行 / false=未购拦截 / null=判定中（fail-closed 同拦截） */
  const [paidOk, setPaidOk] = useState<boolean | null>(null);
  const [homeToast, setHomeToast] = useState<string | null>(null);
  const homeToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 🔒 E48: 权益自检（与 WealthReportPage::isWealthPaid 同源谓词，简化版同语义） */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        // 💳 E50: 绿道去粘性 —— 只认当前 URL 显式 free_access=1（同 WealthReportPage E50 整改）
        if (params.get('free_access') === '1') {
          if (alive) setPaidOk(true);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { if (alive) setPaidOk(false); return; }
        const { data: profiles, error: dbErr } = await supabase
          .from('user_profiles')
          .select('paid_plans')
          .eq('user_id', session.user.id)
          .limit(1);
        if (dbErr) { if (alive) setPaidOk(false); return; }
        const raw = profiles?.[0]?.paid_plans;
        const planMap: Record<string, any> = {};
        if (Array.isArray(raw)) {
          for (const p of raw) {
            if (typeof p === 'string') planMap[p] = true;
            else if (p && typeof p === 'object' && p.plan) planMap[p.plan] = p;
          }
        } else if (raw && typeof raw === 'object') {
          Object.assign(planMap, raw);
        }
        const now = Date.now();
        let ok = planMap.wealth_once === true
          || planMap.wealth_monthly_report === true
          || planMap.wealth_yearly_report === true;
        if (!ok && planMap.all_pass_yearly) {
          const ap = planMap.all_pass_yearly;
          const exp = (ap && (ap.expires_at || ap.all_pass_expires_at)) || planMap.all_pass_expires_at;
          ok = !exp || new Date(exp).getTime() > now;
        }
        if (!ok && planMap.star_monthly_vip) {
          const sv = typeof planMap.star_monthly_vip === 'object' ? planMap.star_monthly_vip : planMap;
          const used = Number(sv.star_monthly_wealth_used ?? 0) || 0;
          const allow = Number(sv.star_monthly_wealth_allowance ?? 0) || 0;
          ok = allow > 0 && used < allow; // 与后端同源：只看余量
        }
        if (alive) setPaidOk(!!ok);
      } catch (_) {
        if (alive) setPaidOk(false); // fail-closed：判不了 ⇒ 视同未购
      }
    })();
    return () => { alive = false; };
  }, []);

  /* ── 取词（🔴 全部为**静态字面量**调用 ⇒ i18n 门禁可静态收录，防 key 字面量上屏）── */
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

  /* ── 挂载：读认领档 ⇒ 有档即座位卡；无档则只读抽取出生真值预填 ──
     🔒 E49（主公亲令 2026-10-14）: ① URL ?reset=1 ⇒ 一进页自洁灵宠档；
        ② 星盘绑定校验 —— 有当前盘真值且签名不匹配（或旧档无签名）⇒ 即弃即清，
        换生日后严禁串出上一张盘的灵宠；无真值可校验（纯首页会话）⇒ 保留呈现。 */
  useEffect(() => {
    const store = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : null;
    const search = (typeof window !== 'undefined' && window.location) ? window.location.search : '';
    const _rp = new URLSearchParams(search).get('reset');
    if (_rp === '1' || _rp === 'true') clearFamiliarRecord(store, FAMILIAR_LS_KEY);
    const r = readFamiliarRecord(store, FAMILIAR_LS_KEY);
    const tr = extractBirthTruth(search, store);
    if (r) {
      if (tr && !recordMatchesChart(r, { birthDate: tr.birthDate, birthTime: tr.birthTime || '', lat: tr.lat, lon: tr.lon, tz: tr.tz })) {
        clearFamiliarRecord(store, FAMILIAR_LS_KEY); // 串味旧档 ⇒ 清洗，落回待选态
      } else {
        setRec(r as HomeRecord); // 🐾 E51: 有档 ⇒ 破框骑键（render 由 rec 短路，不再有 seat 卡）
        return;
      }
    }
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
    // 🔒 E48（主公亲令 2026-10-14）: 未付费一律拦截 —— 严禁写入领养状态、严禁触达 adopt 端点
    if (paidOk !== true) {
      setHomeToast(t('familiar.needUnlock'));
      if (homeToastTimerRef.current) clearTimeout(homeToastTimerRef.current);
      homeToastTimerRef.current = setTimeout(() => setHomeToast(null), 5000);
      return;
    }
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
        // 🔒 E49: 认领档必带星盘签名（按盘隔离，禁全局裸存串味）
        chartSig: familiarChartSig({ birthDate, birthTime, lat: coords.lat, lon: coords.lon, tz: coords.tz }),
      };
      writeFamiliarRecord(window.localStorage, next, FAMILIAR_LS_KEY);
      setRec(next);
      setPhase('collapsed'); // 🐾 E51: 认领成功 ⇒ rec 短路进破框骑键层
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

  /* 🔒 E49（主公亲令 2026-10-14）: 沙箱/管理员态一键重置 —— 清本机灵宠档 + 服务端该账号绑定 */
  const [sandboxMode, setSandboxMode] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/sandbox/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && j.sandbox === true) setSandboxMode(true); })
      .catch(() => { /* live 态 ⇒ 静默不显示 */ });
    return () => { alive = false; };
  }, []);
  const purgeTestFamiliar = async () => {
    clearFamiliarRecord(window.localStorage, FAMILIAR_LS_KEY);
    setRec(null);
    setPhase('collapsed');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/sandbox/reset-familiar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: '{}',
        });
      }
    } catch (_) { /* 本机已清 ⇒ 服务端清理失败不阻断 */ }
  };

  /* ═══════════ 三 · 已认领 ⇒ E51 破框骑键（主公裁决：取代座位卡，2026-10-14）═══════════
     🔒 E50 门禁：paidOk!==true（含判定中 / 查库失败）一律不呈现 —— fail-closed。
     物理穿透（军令铁律）：容器 pointer-events:none，灵宠身体与爪子区域 100% 让路给
     「开始测算」按钮；仅头部 / 爱心宝石命中区保留点击（呼吸微光 + 今日寄语气泡）。 */
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setAnchorEl(document.getElementById('ks-familiar-anchor'));
  }, []);
  const [famPulse, setFamPulse] = useState(false);
  const famPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [famBubble, setFamBubble] = useState<{ name: string; sub: string; line: string } | null>(null);
  const famBubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tapFamiliar = useCallback((rec0: HomeRecord) => {
    const profile = rec0.profile;
    const mode = String(profile.relation_mode || '');
    const name = String(profile.name || '') || (IP_OF_MODE[mode] ?? 'Sophia');
    setFamPulse(true);
    if (famPulseTimer.current) clearTimeout(famPulseTimer.current);
    famPulseTimer.current = setTimeout(() => setFamPulse(false), 1500);
    const wIdx = whisperIndex(profile, localDateKey(new Date()), WHISPER_COUNT);
    setFamBubble({ name, sub: relationLabel(mode), line: wIdx >= 0 ? whisperText(wIdx) : '' });
    if (famBubbleTimer.current) clearTimeout(famBubbleTimer.current);
    famBubbleTimer.current = setTimeout(() => setFamBubble(null), 6500);
  }, [relationLabel, whisperText]);

  if (rec) {
    const mode = String(rec.profile.relation_mode || '');
    const ip = IP_OF_MODE[mode] ?? 'Sophia';
    const showBreakout = paidOk === true; // 🔒 E50: fail-closed（判定中也不显）
    return (
      <div className="ks-pet-card" data-testid={FAMILIAR_HOME_TESTID}>
        {anchorEl && showBreakout && createPortal(
          <div
            className={`ks-fam-breakout ks-fam-${ip.toLowerCase()}${famPulse ? ' ks-fam-pulse' : ''}`}
            data-testid="familiar-breakout"
            data-ip={ip}
          >
            <div className="ks-fam-breathe" aria-hidden="true">
              <img className="ks-fam-img" src={ip === 'Milo' ? miloSprite : sophiaSprite} alt="" draggable={false} />
            </div>
            {/* 仅头部 / 爱心宝石保留点击（tabIndex=-1 + aria-hidden：纯装饰，不入 a11y 树） */}
            <button type="button" className="ks-fam-zone ks-fam-zone-head" onClick={() => tapFamiliar(rec)} aria-hidden="true" tabIndex={-1} />
            <button type="button" className="ks-fam-zone ks-fam-zone-gem" onClick={() => tapFamiliar(rec)} aria-hidden="true" tabIndex={-1} />
            {famBubble && (
              <div className="ks-fam-bubble" aria-hidden="true">
                <span className="ks-fam-bubble-name" style={{ ...SAFE }}>{famBubble.name} · {famBubble.sub}</span>
                {famBubble.line && <span className="ks-fam-bubble-line" style={{ ...SAFE }}>{famBubble.line}</span>}
              </div>
            )}
            <button type="button" className="ks-fam-chip" onClick={reset} title={t('familiar.homeReset')} aria-label={t('familiar.homeReset')}>↺</button>
            {sandboxMode && (
              <button
                type="button"
                className="ks-fam-chip ks-fam-chip-test"
                data-testid="familiar-home-purge"
                onClick={purgeTestFamiliar}
                title={lang === 'zh' ? '重置测试数据 / 清除领养状态' : 'Reset Test Familiar'}
              >
                🧪
              </button>
            )}
          </div>,
          anchorEl,
        )}
      </div>
    );
  }

  /* ═══════════ 二 · 未认领：折叠条 / 认领表单 ═══════════ */
  return (
    <div className="ks-pet-card" data-testid={FAMILIAR_HOME_TESTID}>
      {/* 🔒 E48: 未付费拦截 Toast（首页侧门同规则；5s 自动消散） */}
      {homeToast && (
        <div
          onClick={() => { setHomeToast(null); }}
          style={{
            position: 'fixed', top: '18px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, maxWidth: 'min(92vw, 480px)', width: 'max-content',
            padding: '10px 18px', borderRadius: '12px',
            background: 'rgba(20, 18, 12, 0.94)', border: '1px solid rgba(212, 175, 55, 0.55)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
            color: '#F0E6C8', fontSize: '13px', fontWeight: 600, lineHeight: 1.55,
            cursor: 'pointer', textAlign: 'center', pointerEvents: 'auto',
          }}
        >
          {homeToast}
        </div>
      )}
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
