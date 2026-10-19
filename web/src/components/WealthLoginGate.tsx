import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E73（主公军令 2026-10-19）: 登录方式选择门
// 病根：未登录点购买直接整页跳 Google —— 国内手机网络对 accounts.google.com 常不可达，
//      且 supabase signInWithOAuth 的 authorize 请求无超时 ⇒ 静默挂起 ⇒「点了没反应」。
// 治法：未登录购买先弹本门（全在页面内，零跳转即可完成登录）——
//      ① Google 整页重定向（E72 链路保留，父层 12s 超时回传改道提示）；
//      ② 邮箱验证码 OTP（signInWithOtp → verifyOtp，全程留在本页，国内可用）。
// 铁律：任何通道绝不静默失败 —— 忙碌态、超时、错误一律显式呈现。
// ═══════════════════════════════════════════════════════════════════════

export type WealthGatePlan =
  | 'wealth_once'
  | 'star_monthly_vip'
  | 'all_pass_yearly'
  | 'wealth_monthly_report'
  | 'wealth_yearly_report';

interface WealthLoginGateProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  googleBusy?: boolean;
  googleErr?: string | null;
  onClose: () => void;
  onGoogle: () => void;
  onEmailVerified: (token: string) => void;
}

const I18N = {
  zh: {
    title: '登录后继续支付',
    sub: '登录成功将自动回到支付流程',
    google: '🔑 Google 登录',
    email: '✉️ 邮箱验证码登录（国内推荐）',
    emailPh: 'you@example.com',
    send: '发送验证码',
    sending: '发送中…',
    sent: '验证码已发送，请查收邮箱（含垃圾箱）',
    codePh: '输入 6 位验证码',
    verify: '验证并继续支付',
    verifying: '验证中…',
    redirecting: '正在跳转 Google 登录…',
    timeout: 'Google 连接超时（当前网络可能无法访问 Google）—— 请改用邮箱验证码登录',
    close: '稍后再说',
    resend: '重新发送',
    err: '出错',
    noSession: '登录未完成，请重试',
  },
  en: {
    title: 'Sign in to continue',
    sub: "You'll return to checkout automatically after signing in",
    google: '🔑 Sign in with Google',
    email: '✉️ Email code sign-in (recommended)',
    emailPh: 'you@example.com',
    send: 'Send code',
    sending: 'Sending…',
    sent: 'Code sent — check your inbox (and spam)',
    codePh: 'Enter 6-digit code',
    verify: 'Verify & continue',
    verifying: 'Verifying…',
    redirecting: 'Redirecting to Google sign-in…',
    timeout: 'Google connection timed out (network unreachable) — use the email code sign-in',
    close: 'Later',
    resend: 'Resend',
    err: 'Error',
    noSession: 'Sign-in incomplete, please retry',
  },
  es: {
    title: 'Inicia sesión para continuar',
    sub: 'Volverás al pago automáticamente tras iniciar sesión',
    google: '🔑 Iniciar sesión con Google',
    email: '✉️ Código por email (recomendado)',
    emailPh: 'tu@ejemplo.com',
    send: 'Enviar código',
    sending: 'Enviando…',
    sent: 'Código enviado — revisa tu bandeja (y spam)',
    codePh: 'Código de 6 dígitos',
    verify: 'Verificar y continuar',
    verifying: 'Verificando…',
    redirecting: 'Redirigiendo a Google…',
    timeout: 'Tiempo agotado con Google (red inaccesible) — usa el código por email',
    close: 'Más tarde',
    resend: 'Reenviar',
    err: 'Error',
    noSession: 'Inicio incompleto, reintenta',
  },
  fr: {
    title: 'Connectez-vous pour continuer',
    sub: 'Retour automatique au paiement après connexion',
    google: '🔑 Connexion avec Google',
    email: '✉️ Code par e-mail (recommandé)',
    emailPh: 'vous@exemple.com',
    send: 'Envoyer le code',
    sending: 'Envoi…',
    sent: 'Code envoyé — vérifiez votre boîte (et les spams)',
    codePh: 'Code à 6 chiffres',
    verify: 'Vérifier et continuer',
    verifying: 'Vérification…',
    redirecting: 'Redirection vers Google…',
    timeout: 'Délai dépassé avec Google (réseau inaccessible) — utilisez le code e-mail',
    close: 'Plus tard',
    resend: 'Renvoyer',
    err: 'Erreur',
    noSession: 'Connexion incomplète, réessayez',
  },
  th: {
    title: 'เข้าสู่ระบบเพื่อชำระเงิน',
    sub: 'หลังเข้าสู่ระบบจะกลับมาชำระเงินอัตโนมัติ',
    google: '🔑 เข้าสู่ระบบด้วย Google',
    email: '✉️ รหัสทางอีเมล (แนะนำ)',
    emailPh: 'you@example.com',
    send: 'ส่งรหัส',
    sending: 'กำลังส่ง…',
    sent: 'ส่งรหัสแล้ว — ตรวจกล่องจดหมาย (และสแปม)',
    codePh: 'รหัส 6 หลัก',
    verify: 'ยืนยันและดำเนินการต่อ',
    verifying: 'กำลังตรวจสอบ…',
    redirecting: 'กำลังไปที่ Google…',
    timeout: 'หมดเวลาเชื่อมต่อ Google (เครือข่ายไม่ถึง) — ใช้รหัสอีเมลแทน',
    close: 'ภายหลัง',
    resend: 'ส่งใหม่',
    err: 'ข้อผิดพลาด',
    noSession: 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่',
  },
  vi: {
    title: 'Đăng nhập để tiếp tục',
    sub: 'Sau khi đăng nhập sẽ tự quay lại thanh toán',
    google: '🔑 Đăng nhập bằng Google',
    email: '✉️ Mã qua email (khuyên dùng)',
    emailPh: 'ban@vidu.com',
    send: 'Gửi mã',
    sending: 'Đang gửi…',
    sent: 'Đã gửi mã — kiểm tra hộp thư (cả spam)',
    codePh: 'Mã 6 chữ số',
    verify: 'Xác minh và tiếp tục',
    verifying: 'Đang xác minh…',
    redirecting: 'Đang chuyển tới Google…',
    timeout: 'Hết thời gian kết nối Google (mạng không tới) — dùng mã email',
    close: 'Để sau',
    resend: 'Gửi lại',
    err: 'Lỗi',
    noSession: 'Chưa hoàn tất, thử lại',
  },
} as const;

const _gateTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | 'timeout'> =>
  Promise.race([p, new Promise<'timeout'>((res) => setTimeout(() => res('timeout'), ms))]);

const WealthLoginGate: React.FC<WealthLoginGateProps> = ({
  lang,
  googleBusy = false,
  googleErr = null,
  onClose,
  onGoogle,
  onEmailVerified,
}) => {
  const t = I18N[lang] || I18N.en;
  const [step, setStep] = useState<'choose' | 'code'>('choose');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const _emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSendCode = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await _gateTimeout(
        supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        }),
        12000
      );
      if (r === 'timeout') {
        setErr(t.timeout);
      } else if (r.error) {
        setErr(`${t.err}: ${r.error.message}`);
      } else {
        setSent(true);
        setStep('code');
      }
    } catch (e: any) {
      setErr(`${t.err}: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await _gateTimeout(
        supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' }),
        12000
      );
      if (r === 'timeout') {
        setErr(t.timeout);
        return;
      }
      if (r.error) {
        setErr(`${t.err}: ${r.error.message}`);
        return;
      }
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.access_token) {
        onEmailVerified(s.access_token);
      } else {
        setErr(t.noSession);
      }
    } catch (e: any) {
      setErr(`${t.err}: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 12px',
    borderRadius: '10px',
    border: '1px solid rgba(212,175,55,0.35)',
    background: 'rgba(13,13,26,0.85)',
    color: '#E8E4D9',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(212,175,55,0.45)',
    background: 'rgba(212,175,55,0.1)',
    color: '#D4AF37',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <div
      data-testid="wealth-login-gate"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5,5,14,0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy && !googleBusy) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          background: 'linear-gradient(180deg, #14142a, #0d0d1a)',
          border: '1px solid rgba(212,175,55,0.4)',
          borderRadius: '16px',
          padding: '22px 18px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.55)',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 800, color: '#D4AF37', textAlign: 'center' }}>
          🔐 {t.title}
        </div>
        <div style={{ fontSize: '12px', color: '#a0a0c0', textAlign: 'center', margin: '6px 0 16px' }}>
          {t.sub}
        </div>

        {step === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button data-testid="gate-google" onClick={onGoogle} disabled={googleBusy} style={{ ...btnStyle, opacity: googleBusy ? 0.6 : 1 }}>
              {googleBusy ? `⏳ ${t.redirecting}` : t.google}
            </button>
            {googleErr && (
              <div style={{ fontSize: '12px', color: '#ff9d9d', lineHeight: 1.5 }}>
                ⚠️ {googleErr === 'timeout' ? t.timeout : googleErr}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#666688', fontSize: '11px' }}>
              <span style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.18)' }} />OR<span style={{ flex: 1, height: '1px', background: 'rgba(212,175,55,0.18)' }} />
            </div>
            <input
              data-testid="gate-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={t.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              data-testid="gate-send-code"
              onClick={handleSendCode}
              disabled={busy || !_emailOk}
              style={{ ...btnStyle, opacity: busy || !_emailOk ? 0.55 : 1 }}
            >
              {busy ? t.sending : t.email}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: '#81D8D0', lineHeight: 1.5 }}>📬 {t.sent}</div>
            <input
              data-testid="gate-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder={t.codePh}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
            />
            <button
              data-testid="gate-verify"
              onClick={handleVerify}
              disabled={busy || code.trim().length < 6}
              style={{ ...btnStyle, opacity: busy || code.trim().length < 6 ? 0.55 : 1 }}
            >
              {busy ? t.verifying : t.verify}
            </button>
            <button
              onClick={handleSendCode}
              disabled={busy}
              style={{ background: 'transparent', border: 'none', color: '#8888aa', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t.resend}
            </button>
          </div>
        )}

        {err && <div style={{ fontSize: '12px', color: '#ff9d9d', marginTop: '10px', lineHeight: 1.5 }}>⚠️ {err}</div>}

        <button
          onClick={onClose}
          disabled={busy || googleBusy}
          style={{
            marginTop: '14px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#777799',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};

export default WealthLoginGate;
