import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLang } from '../lib/algos/i18n';

// ── Types ──
interface WealthPageProps {
  onNavigate: (path: string) => void;
}

// ── Date Input Component (reused from App.tsx logic) ──
const DateInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onLastFilled?: () => void;
  autoFocus?: boolean;
  shake?: boolean;
  hasError?: boolean;
}> = ({ value, onChange, onLastFilled, autoFocus = false, shake = false, hasError = false }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || '';
  const isZh = lang.startsWith('zh') || lang.includes('Chinese');
  
  const partDefs = isZh
    ? [{ key: 0, max: 4, ph: 'YYYY' }, { key: 1, max: 2, ph: 'MM' }, { key: 2, max: 2, ph: 'DD' }]
    : [{ key: 2, max: 2, ph: 'DD' }, { key: 1, max: 2, ph: 'MM' }, { key: 0, max: 4, ph: 'YYYY' }];

  const parts = (value ? value.split('-') : ['', '', '']).map(s => s || '');
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const update = (idx: number, val: string) => {
    const p = [...parts];
    let cleaned = val.replace(/\D/g, '');
    if (idx === 0) { p[0] = cleaned.slice(0, 4); }
    else if (idx === 1) { p[1] = cleaned.slice(0, 2); }
    else { p[2] = cleaned.slice(0, 2); }
    onChange(p.join('-'));
  };

  const handleFieldChange = (partIdx: number, val: string) => {
    const def = partDefs[partIdx];
    update(def.key, val);
    const digits = val.replace(/\D/g, '').length;
    if (digits === def.max) {
      if (partIdx < partDefs.length - 1) {
        refs[partIdx + 1].current?.focus();
      } else if (onLastFilled) {
        onLastFilled();
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      width: '100%',
      padding: '12px 14px',
      background: 'rgba(255, 255, 255, 0.08)',
      border: `1.5px solid ${hasError ? '#E05C5C' : 'rgba(212, 175, 55, 0.3)'}`,
      borderRadius: '12px',
      animation: shake ? 'shake 0.3s ease' : 'none',
    }}>
      {partDefs.map((def, pi) => (
        <React.Fragment key={def.key}>
          {pi > 0 && <span style={{ color: '#8B8778' }}>/</span>}
          <input
            ref={refs[pi]}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: '#E8E4D9',
              fontSize: '15px',
              textAlign: 'center',
              outline: 'none',
              minWidth: 0,
            }}
            type="text"
            inputMode="numeric"
            maxLength={def.max}
            placeholder={def.ph}
            value={parts[def.key]}
            onChange={e => handleFieldChange(pi, e.target.value)}
            autoFocus={autoFocus && pi === 0}
          />
        </React.Fragment>
      ))}
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
  if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m - 1 || dateObj.getDate() !== d) {
    return t('common.errorInvalidDate');
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (dateObj > now) return t('common.errorFutureDate');
  return '';
};

// ── Component ──
const WealthPage: React.FC<WealthPageProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const [birthDate, setBirthDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = () => {
    setDateError('');
    if (!birthDate) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      return;
    }
    const err = validateDate(birthDate, t);
    if (err) {
      setShaking(true);
      setTimeout(() => setShaking(false), 300);
      return;
    }

    // Navigate to report page with parameters
    const lang = normalizeLang(i18n.language || 'en');
    const params = new URLSearchParams({
      birth: birthDate,
      lang: lang,
    });
    onNavigate(`/wealth/report?${params.toString()}`);
  };

  const lang = (i18n.language || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '56px 16px 60px',
      position: 'relative',
    }}>
      {/* Background stars effect */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(1.5px 1.5px at 20% 30%, rgba(212,175,55,0.3) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 80% 70%, rgba(129,216,208,0.3) 50%, transparent 50%),
          radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.2) 50%, transparent 50%),
          #080810
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        {/* 返回按钮 */}
        <button
          onClick={() => onNavigate('/?showMode=true')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '6px 12px',
            color: '#8B8778',
            fontSize: '12px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← {t('input.back') || (lang === 'zh' ? '返回' : 'Back')}
        </button>

        {/* Title */}
        <h1 style={{
          fontSize: '26px',
          fontWeight: 800,
          color: '#D4AF37',
          marginBottom: '8px',
          textAlign: 'center',
          textShadow: '0 2px 20px rgba(212,175,55,0.4)',
        }}>
          💰 {t('wealthInput.title')}
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#81D8D0',
          fontWeight: 600,
          marginBottom: '32px',
          textAlign: 'center',
        }}>
          {t('wealthInput.subtitle')}
        </p>

        {/* Input Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0e0e1a 0%, #12121f 100%)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '16px',
          padding: '24px 20px',
          marginBottom: '24px',
        }}>
          <label style={{
            display: 'block',
            fontSize: '13px',
            color: '#E8E4D9',
            fontWeight: 700,
            marginBottom: '12px',
          }}>
            {t('wealthInput.birthdayLabel')}
          </label>

          <DateInput
            value={birthDate}
            onChange={setBirthDate}
            autoFocus
            shake={shaking}
            hasError={!!dateError && shaking}
          />

          {dateError && (
            <p style={{ color: '#E05C5C', fontSize: '12px', marginTop: '8px' }}>{dateError}</p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
              color: '#1a1a2e',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: '20px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(212,175,55,0.35)',
            }}
          >
            {t('wealthInput.startBtn')}
          </button>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'rgba(129, 216, 208, 0.08)',
          border: '1px solid rgba(129, 216, 208, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '12px',
          color: '#81D8D0',
          lineHeight: 1.6,
        }}>
          💡 {t('wealthInput.unlockTip')}
        </div>

        {/* ── Legal Footer Disclaimer ── */}
        <p style={{
          fontSize: '10px',
          color: 'rgba(200,195,170,0.9)',
          textAlign: 'center',
          marginTop: '16px',
          lineHeight: 1.5,
        }}>
          {i18n.language && i18n.language.indexOf('zh') === 0 ? <>点击&ldquo;{t('wealthInput.startBtn')}&rdquo;即表示你同意<a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>服务条款</a>和<a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>隐私政策</a>。</> : null}
          {i18n.language && i18n.language.indexOf('es') === 0 ? <>Al hacer clic en &ldquo;{t('wealthInput.startBtn')}&rdquo;, aceptas nuestros <a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>Términos de Servicio</a> y <a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>Política de Privacidad</a>.</> : null}
          {i18n.language && i18n.language.indexOf('fr') === 0 ? <>En cliquant sur &ldquo;{t('wealthInput.startBtn')}&rdquo;, vous acceptez nos <a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>Conditions d'Utilisation</a> et notre <a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>Politique de Confidentialité</a>.</> : null}
          {i18n.language && i18n.language.indexOf('th') === 0 ? <>การคลิก &ldquo;{t('wealthInput.startBtn')}&rdquo; แสดงว่าคุณยอมรับ<a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>ข้อกำหนดในการให้บริการ</a>และ<a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>นโยบายความเป็นส่วนตัว</a>ของเรา</> : null}
          {i18n.language && i18n.language.indexOf('vi') === 0 ? <>Bằng cách nhấp vào &ldquo;{t('wealthInput.startBtn')}&rdquo;, bạn đồng ý với <a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>Điều Khoản Dịch Vụ</a> và <a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>Chính Sách Bảo Mật</a> của chúng tôi.</> : null}
          {!i18n.language || (i18n.language.indexOf('zh') !== 0 && i18n.language.indexOf('es') !== 0 && i18n.language.indexOf('fr') !== 0 && i18n.language.indexOf('th') !== 0 && i18n.language.indexOf('vi') !== 0) ? <>By clicking &ldquo;{t('wealthInput.startBtn')}&rdquo;, you agree to our <a href="/terms-of-service" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/terms-of-service';}}>Terms of Service</a> and <a href="/privacy-policy" style={{color:'rgba(200,195,170,0.9)',textDecoration:'underline'}} onClick={(e)=>{e.preventDefault();window.location.href='/privacy-policy';}}>Privacy Policy</a>.</> : null}
        </p>
      </div>
    </div>
  );
};

export default WealthPage;
