import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from '../lib/algos/i18n';
import { CitySearchInput } from '../components/CitySearchInput';
import type { CityRecord } from '../hooks/useCitySearch';

interface WealthPageProps {
  onNavigate: (path: string) => void;
}

// ── Date Input (中文 YYYY/MM/DD，其它语种 DD/MM/YYYY，从左向右自动跳栏) ──
const DateInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}> = ({ value, onChange, hasError = false }) => {
  const { i18n } = useTranslation();
  const isZh = (i18n.language || '').startsWith('zh') || (i18n.language || '').includes('Chinese');

  // 中文：年/月/日；其它语种：日/月/年（国际通用）
  const partDefs = isZh
    ? [{ key: 0, max: 4, ph: 'YYYY' }, { key: 1, max: 2, ph: 'MM' }, { key: 2, max: 2, ph: 'DD' }]
    : [{ key: 2, max: 2, ph: 'DD' }, { key: 1, max: 2, ph: 'MM' }, { key: 0, max: 4, ph: 'YYYY' }];

  const parts = (value ? value.split('-') : ['', '', '']);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handleChange = (pi: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, partDefs[pi].max);
    const p = [...parts];
    p[partDefs[pi].key] = cleaned;
    onChange(p.join('-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
    if (cleaned.length === partDefs[pi].max && pi < partDefs.length - 1) {
      refs[pi + 1].current?.focus();
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '3px',
      width: '100%', padding: '11px 14px',
      background: 'rgba(255,255,255,0.08)',
      border: `1.5px solid ${hasError ? '#E05C5C' : 'rgba(212,175,55,0.3)'}`,
      borderRadius: '10px',
    }}>
      {partDefs.map((def, pi) => (
        <React.Fragment key={def.key}>
          {pi > 0 && <span style={{ color: '#8B8778', fontSize: '14px' }}>/</span>}
          <input
            ref={refs[pi]}
            style={{ flex: 1, border: 'none', background: 'transparent', color: '#E8E4D9', fontSize: '14px', textAlign: 'center', outline: 'none', minWidth: 0 }}
            type="text" inputMode="numeric" maxLength={def.max} placeholder={def.ph}
            value={parts[def.key] || ''}
            onChange={e => handleChange(pi, e.target.value)}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Time Input (紧凑型 HH:MM，24小时制，从左向右自动跳栏) ──
const TimeInput: React.FC<{ value: string; onChange: (v: string) => void; }> = ({ value, onChange }) => {
  const hh = value.split(':')[0] || '';
  const mm = value.split(':')[1] || '';
  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);

  const handleHH = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 2);
    const safe = cleaned ? String(Math.min(parseInt(cleaned, 10), 23)).padStart(2, '0') : '';
    const nextMM = mm || '';
    onChange(safe + (nextMM ? ':' + nextMM : (cleaned.length === 2 ? ':' : '')));
    if (cleaned.length === 2) mmRef.current?.focus();
  };

  const handleMM = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 2);
    const safe = cleaned ? String(Math.min(parseInt(cleaned, 10), 59)).padStart(2, '0') : '';
    onChange((hh || '00') + ':' + safe);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
      width: '100%', padding: '11px 14px',
      background: 'rgba(255,255,255,0.08)',
      border: '1.5px solid rgba(212,175,55,0.3)',
      borderRadius: '10px',
    }}>
      <input
        ref={hhRef}
        style={{ width: '50px', border: 'none', background: 'transparent', color: '#E8E4D9', fontSize: '16px', fontWeight: 600, textAlign: 'center', outline: 'none', padding: '4px 0', cursor: 'text' }}
        type="text" inputMode="numeric" maxLength={2} placeholder="HH"
        value={hh}
        onChange={e => handleHH(e.target.value)}
        onClick={e => (e.target as HTMLInputElement).select()}
      />
      <span style={{ color: '#D4AF37', fontSize: '18px', fontWeight: 700, margin: '0 2px' }}>:</span>
      <input
        ref={mmRef}
        style={{ width: '50px', border: 'none', background: 'transparent', color: '#E8E4D9', fontSize: '16px', fontWeight: 600, textAlign: 'center', outline: 'none', padding: '4px 0', cursor: 'text' }}
        type="text" inputMode="numeric" maxLength={2} placeholder="MM"
        value={mm}
        onChange={e => handleMM(e.target.value)}
        onClick={e => (e.target as HTMLInputElement).select()}
      />
    </div>
  );
};

// ── Validation ──
const validateDate = (val: string, t: (key: string) => string): string => {
  if (!val) return t('common.errorIncomplete');
  const parts = val.split('-');
  if (parts.length !== 3 || parts.some(p => !p)) return t('common.errorFormat');
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return t('common.errorFormat');
  if (y < 1900) return t('common.errorTooOld');
  const dateObj = new Date(y, m - 1, d);
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) return t('common.errorInvalidDate');
  const now = new Date(); now.setHours(0, 0, 0, 0);
  if (dateObj > now) return t('common.errorFutureDate');
  return '';
};

// ── Component ──
const WealthPage: React.FC<WealthPageProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [birthDate, setBirthDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthCity, setBirthCity] = useState<CityRecord | null>(null);

  // 从 URL 读回（替代 sessionStorage）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromReport = params.get('from') === 'report';
    if (fromReport) {
      const b = params.get('birth'); if (b) setBirthDate(b);
      const tp = params.get('birthTime'); if (tp) setBirthTime(tp);
      const k = params.get('birthCity'); const tz = params.get('birthTz');
      const lat = params.get('birthLat'); const lon = params.get('birthLon');
      if (k && tz && lat && lon) {
        setBirthCity({ key: k, tz, lat: parseFloat(lat), lon: parseFloat(lon), search: [k] });
      }
    }
  }, []);

  const handleSubmit = () => {
    setDateError('');
    if (!birthDate) { setShaking(true); setTimeout(() => setShaking(false), 300); return; }
    const err = validateDate(birthDate, t);
    if (err) { setDateError(err); setShaking(true); setTimeout(() => setShaking(false), 300); return; }

    const lang = normalizeLang(i18n.language || 'en');
    const params: Record<string, string> = { birth: birthDate, lang };
    if (birthTime && birthCity) {
      params.birthTime = birthTime;
      params.birthCity = birthCity.key;
      params.birthTz = birthCity.tz;
      params.birthLat = String(birthCity.lat);
      params.birthLon = String(birthCity.lon);
    }
    const urlFreeAccess = new URLSearchParams(window.location.search).get('free_access');
    if (urlFreeAccess === '1') params.free_access = '1';
    onNavigate(`/wealth/report?${new URLSearchParams(params).toString()}`);
  };

  const lang = (i18n.language || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

  const LABEL_TIME = { zh: '出生时间（可选）', en: 'Birth Time (optional)', es: 'Hora de nacimiento (opcional)', fr: 'Heure de naissance (optionnel)', th: 'เวลาเกิด (เลือกได้)', vi: 'Giờ sinh (tùy chọn)' }[lang] || 'Birth Time (optional)';
  const LABEL_CITY = { zh: '出生城市（可选）', en: 'Birth City (optional)', es: 'Ciudad de nacimiento (opcional)', fr: 'Ville de naissance (optionnel)', th: 'เมืองเกิด (เลือกได้)', vi: 'Thành phố sinh (tùy chọn)' }[lang] || 'Birth City (optional)';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '56px 16px 60px', position: 'relative',
    }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(1.5px 1.5px at 20% 30%, rgba(212,175,55,0.3) 50%, transparent 50%), radial-gradient(1.5px 1.5px at 80% 70%, rgba(129,216,208,0.3) 50%, transparent 50%), radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.2) 50%, transparent 50%), #080810', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>

        <button onClick={() => onNavigate('/?showMode=true')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', color: '#8B8778', fontSize: '12px', cursor: 'pointer', marginBottom: '16px' }}>
          ← {t('input.back') || (lang === 'zh' ? '返回' : 'Back')}
        </button>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#D4AF37', marginBottom: '8px', textAlign: 'center', textShadow: '0 2px 20px rgba(212,175,55,0.4)' }}>
          💰 {t('wealthInput.title')}
        </h1>
        <p style={{ fontSize: '14px', color: '#81D8D0', fontWeight: 600, marginBottom: '32px', textAlign: 'center' }}>
          {t('wealthInput.subtitle')}
        </p>

        <div style={{ background: 'linear-gradient(135deg, #0e0e1a 0%, #12121f 100%)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', padding: '24px 20px', marginBottom: '16px' }}>

          {/* 出生城市 - 第1行 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#E8E4D9', fontWeight: 600, marginBottom: '8px' }}>
              {LABEL_CITY}
            </label>
            <CitySearchInput
              value={birthCity?.key || ''}
              tz={birthCity?.tz || 'Asia/Shanghai'}
              lat={birthCity?.lat || 31.23}
              lon={birthCity?.lon || 121.47}
              onSelect={(city) => setBirthCity(city)}
              lang={lang}
            />
          </div>

          {/* 出生时间 - 第2行 */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#E8E4D9', fontWeight: 600, marginBottom: '8px' }}>
              {LABEL_TIME}
            </label>
            <TimeInput value={birthTime} onChange={setBirthTime} />
          </div>

          {/* 出生日期 - 第3行（中文 YYYY/MM/DD，其他 DD/MM/YYYY） */}
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#E8E4D9', fontWeight: 600, marginBottom: '8px' }}>
              {t('wealthInput.birthdayLabel')}
            </label>
            <DateInput value={birthDate} onChange={setBirthDate} hasError={!!dateError} />
            {dateError && <p style={{ color: '#E05C5C', fontSize: '12px', marginTop: '6px' }}>{dateError}</p>}
          </div>

          {/* 🔮 金牌提示：40%精度诱饵 — 提高亮 */}
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.10) 100%)',
            border: '1px solid rgba(212,175,55,0.4)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#F0D060',
            fontWeight: 600,
            lineHeight: 1.55,
            boxShadow: '0 2px 8px rgba(212,175,55,0.15)',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}>
            <span style={{ marginRight: '6px' }}>🔮</span>
            {t('wealthInput.birthTip')}
          </div>

          <button
            onClick={handleSubmit}
            style={{
              width: '100%', padding: '14px 24px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
              color: '#1a1a2e', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
              marginTop: '20px', boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
            }}
          >
            {t('wealthInput.startBtn')}
          </button>
        </div>

        <div style={{ background: 'rgba(129,216,208,0.08)', border: '1px solid rgba(129,216,208,0.2)', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#81D8D0', lineHeight: 1.6 }}>
          💡 {t('wealthInput.unlockTip')}
        </div>

        <p style={{ fontSize: '11px', color: '#FFFFFF', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
          {i18n.language?.startsWith('zh') ? <>点击&ldquo;{t('wealthInput.startBtn')}&rdquo;即表示你同意<a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>服务条款</a>和<a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>隐私政策</a>。</> : null}
          {i18n.language?.startsWith('es') ? <>Al hacer clic en &ldquo;{t('wealthInput.startBtn')}&rdquo;, aceptas nuestros <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Términos de Servicio</a> y <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Política de Privacidad</a>.</> : null}
          {i18n.language?.startsWith('fr') ? <>En cliquant sur &ldquo;{t('wealthInput.startBtn')}&rdquo;, vous acceptez nos <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Conditions d'Utilisation</a> et <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Politique de Confidentialité</a>.</> : null}
          {i18n.language?.startsWith('th') ? <>การคลิก &ldquo;{t('wealthInput.startBtn')}&rdquo; แสดงว่าคุณยอมรับ<a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>ข้อกำหนดในการให้บริการ</a>และ<a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>นโยบายความเป็นส่วนตัว</a>ของเรา</> : null}
          {i18n.language?.startsWith('vi') ? <>Bằng cách nhấp vào &ldquo;{t('wealthInput.startBtn')}&rdquo;, bạn đồng ý với <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Điều Khoản Dịch Vụ</a> và <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Chính Sách Bảo Mật</a>.</> : null}
          {!i18n.language?.startsWith('zh') && !i18n.language?.startsWith('es') && !i18n.language?.startsWith('fr') && !i18n.language?.startsWith('th') && !i18n.language?.startsWith('vi') ? <>By clicking &ldquo;{t('wealthInput.startBtn')}&rdquo;, you agree to our <a href="/terms-of-service" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/terms-of-service'}}>Terms of Service</a> and <a href="/privacy-policy" style={{color:'#FFFFFF',textDecoration:'underline'}} onClick={e=>{e.preventDefault();window.location.href='/privacy-policy'}}>Privacy Policy</a>.</> : null}
        </p>
      </div>
    </div>
  );
};

export default WealthPage;
