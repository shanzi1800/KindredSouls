import { supabase } from '../lib/supabase';
import { useState } from 'react';

interface AuthButtonProps {
  onAuthSuccess?: () => void;
  lang?: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    signIn: 'Sign In to Unlock',
    google: 'Continue with Google',
    email: 'Continue with Email',
    emailPlaceholder: 'your@email.com',
    sendMagicLink: 'Send Magic Link',
    sending: 'Sending...',
    checkEmail: 'Check your inbox! ✨',
  },
  zh: {
    signIn: '登录解锁',
    google: '使用 Google 登录',
    email: '使用邮箱登录',
    emailPlaceholder: '你的邮箱地址',
    sendMagicLink: '发送魔法链接',
    sending: '发送中...',
    checkEmail: '请查收邮箱！✨',
  },
};

export default function AuthButton({ onAuthSuccess: _onAuthSuccess, lang = 'en' }: AuthButtonProps) {
  const t = i18n[lang] || i18n.en;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // ✅ 正确方案：redirectTo 用【干净 URL】（不含 hash）
      // Google OAuth 会吞掉 # 号及后面的内容，所以不能把 #/result 传进去
      const redirectUrl = window.location.origin;  // 例如：https://www.kindredsouls.com.au
      
      // ✅ 存完整 URL（含 hash）到 localStorage
      // Google OAuth 会吞掉 # 号，所以必须存完整 URL，回调后手动跳回去
      localStorage.setItem('ks_return_url', window.location.href);
      localStorage.setItem('ks_return_to_result', 'true');  // 标志位
      console.log('[KindredSouls] Saved return URL:', window.location.href);
      
      console.log('[KindredSouls Debug] Google login redirectTo (clean):', redirectUrl);
      console.log('[KindredSouls Debug] Saved to sessionStorage:', window.location.href);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      // OAuth 跳转中，当前页面会卸载，无需处理后续
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Email login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-paywall" style={{
      background: 'rgba(20, 25, 60, 0.98)',
      borderRadius: '16px',
      padding: '28px 24px',
      textAlign: 'center',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(212,175,55,0.5)',
      maxWidth: '380px',
      margin: '20px auto',
      boxShadow: '0 8px 32px rgba(212,175,55,0.15), 0 0 60px rgba(212,175,55,0.08)',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: '#D4AF37', marginBottom: '6px', textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
        🔮 {t.signIn}
      </div>
      <div style={{ fontSize: '14px', color: '#bbb', marginBottom: '20px', lineHeight: 1.5 }}>
        {lang === 'zh' 
          ? '解锁 AI 洞察 · 获取专属情感解读' 
          : 'Unlock AI Insight · Get Your Personalized Reading'}
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.25)',
          background: loading ? '#333' : '#fff',
          color: loading ? '#666' : '#1a1a1a',
          fontSize: '15px',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '12px',
          transition: 'all 0.25s',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? t.sending : t.google}
      </button>

      {/* Email Login Toggle */}
      {!magicLinkSent && !showEmailInput && (
        <>
          <div style={{ fontSize: '13px', color: '#888', margin: '12px 0' }}>
            ── or ──
          </div>
          <button
            onClick={() => setShowEmailInput(true)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(212,175,55,0.3)',
              background: 'transparent',
              color: '#D4AF37',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📧 {t.email}
          </button>
        </>
      )}

      {/* Email Input Form */}
      {showEmailInput && !magicLinkSent && (
        <form onSubmit={handleEmailLogin} style={{ marginTop: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '10px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? '#444' : 'linear-gradient(135deg, #D4AF37, #B8860B)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? t.sending : t.sendMagicLink}
          </button>
        </form>
      )}

      {/* Magic Link Sent Confirmation */}
      {magicLinkSent && (
        <div style={{
          padding: '16px',
          background: 'rgba(80,200,120,0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(80,200,120,0.3)',
        }}>
          <div style={{ fontSize: '15px', color: '#50C878', fontWeight: 600 }}>
            ✉️ {t.checkEmail}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
            {lang === 'zh'
              ? '点击邮件中的链接即可自动登录'
              : 'Click the link in the email to sign in automatically'}
          </div>
        </div>
      )}
    </div>
  );
}
