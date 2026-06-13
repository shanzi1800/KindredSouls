import { supabase } from '../lib/supabase';
import { useState } from 'react';


// Deterministic tarot card from birthdays + today
function useTarot(d1: string, d2: string) {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const sorted = [d1, d2].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const cardId = Math.abs(hash) % 22;
  const reversed = Math.floor(Math.abs(hash) / 22) % 2 === 1;
  const cards = [
    {name:'愚人', meaning:'踏上未知旅程的勇气，新可能的开启'},
    {name:'魔术师', meaning:'创造显化，意志与行动力的觉醒'},
    {name:'女祭司', meaning:'直觉与秘密，等待揭晓的答案'},
    {name:'女皇', meaning:'丰盛与滋养，爱的温柔绽放'},
    {name:'皇帝', meaning:'秩序与守护，稳稳托住的力量'},
    {name:'教皇', meaning:'指引与信念，灵魂层面的契合'},
    {name:'恋人', meaning:'抉择与诱惑，关系来到十字路口'},
    {name:'战车', meaning:'意志与征服，携手跨越障碍'},
    {name:'力量', meaning:'内在勇气，柔韧却不可战胜'},
    {name:'隐士', meaning:'独处与内观，答案在内心深处'},
    {name:'命运之轮', meaning:'转变与循环，命运正在转动'},
    {name:'正义', meaning:'因果与平衡，宇宙在精准回应'},
    {name:'倒吊人', meaning:'放下与臣服，另一种视角的智慧'},
    {name:'死神', meaning:'结束与蜕变，旧篇章的翻页'},
    {name:'节制', meaning:'平衡与调和，在两极间找到节奏'},
    {name:'恶魔', meaning:'束缚与执念，看见阴影才能超越'},
    {name:'塔', meaning:'突变的觉醒，打碎幻象见真相'},
    {name:'星星', meaning:'希望与灵感，宇宙的疗愈之光'},
    {name:'月亮', meaning:'幻象与恐惧，直面内心深处的不安'},
    {name:'太阳', meaning:'喜悦与成功，生命力全面绽放'},
    {name:'审判', meaning:'重生与宽恕，灵魂被唤醒'},
    {name:'世界', meaning:'完成与圆满，达成内在的和谐'},
  ];
  const card = cards[cardId] || cards[0];
  return {
    name: card.name + (reversed ? '（逆位）' : ''),
    meaning: card.meaning,
    orientation: reversed ? '逆位' : '正位'
  };
}

interface AuthButtonProps {
  onAuthSuccess?: () => void;
  lang?: string;
  dob1?: string;
  dob2?: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    signIn: 'Sign In to Unlock',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    facebook: 'Continue with Facebook',
    tiktok: 'Continue with TikTok',
    email: 'Continue with Email',
    emailPlaceholder: 'your@email.com',
    sendMagicLink: 'Send Magic Link',
    sending: 'Sending...',
    checkEmail: 'Check your inbox! ✨',
  },
  zh: {
    signIn: '登录解锁',
    google: '使用 Google 登录',
    apple: '使用 Apple 登录',
    facebook: '使用 Facebook 登录',
    tiktok: '使用 TikTok 登录',
    email: '使用邮箱登录',
    emailPlaceholder: '你的邮箱地址',
    sendMagicLink: '发送魔法链接',
    sending: '发送中...',
    checkEmail: '请查收邮箱！✨',
  },
};

// SVG icons for OAuth providers
const googleIcon = <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;

const appleIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.22 0-1.44.65-2.2.46-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.53-3.74 4.25z"/></svg>;

const facebookIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

const tiktokIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.15a8.16 8.16 0 005.58 2.17v-3.4a4.85 4.85 0 01-4-.11v-.01z"/></svg>;

interface OAuthBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  dark?: boolean;
}

function OAuthButton({ icon, label, onClick, loading, dark }: OAuthBtnProps) {
  return (
    <button
      onClick={onClick}
      onTouchStart={(e) => { e.preventDefault(); onClick(); }}
      disabled={loading}
      style={{
        padding: '14px 10px',
        borderRadius: '12px',
        border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.15)',
        background: loading ? '#333' : (dark ? '#1a1a1a' : 'rgba(255,255,255,0.08)'),
        color: loading ? '#666' : '#fff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.25s',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        backdropFilter: 'blur(10px)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AuthButton({ onAuthSuccess: _onAuthSuccess, lang = 'en', dob1, dob2 }: AuthButtonProps) {
  const resultData = (() => {
    try {
      const raw = localStorage.getItem('ks_result_data');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const d1 = dob1 || (resultData ? resultData.dob1 : '') || '';
  const d2 = dob2 || (resultData ? resultData.dob2 : '') || '';
  const tarot = (d1 && d2) ? useTarot(d1, d2) : null;

  const t = i18n[lang] || i18n.en;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook' | 'tiktok') => {
    console.log('[KindredSouls Debug] OAuth login button CLICKED:', provider);
    setLoading(true);
    setError('');
    try {
      const redirectUrl = window.location.origin + '/result?intent=checkout';
      localStorage.setItem('ks_redirect_after_login', redirectUrl);
      localStorage.setItem('ks_return_to_result', 'true');
      console.log('[KindredSouls Debug] OAuth redirectTo:', redirectUrl, 'provider:', provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[KindredSouls Debug] OAuth login ERROR:', provider, err);
      setError(err.message || `${provider} login failed`);
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
      // 🎯 军师方案：把购买意图挂在 URL 参数里
      const redirectUrl = window.location.origin + '/result?intent=checkout';
      console.log('[KindredSouls Debug] Email login redirectTo (with intent):', redirectUrl);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
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
      {tarot && (
        <div style={{
          marginBottom: '16px',
          padding: '14px 12px',
          background: 'rgba(75,45,115,0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(212,175,55,0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#D4AF37', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>
            🔮 今日塔罗指引
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {tarot.name}
          </div>
          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.5 }}>
            {tarot.meaning}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
            {lang === 'zh' ? '→ 登录解锁完整AI情感解读' : '→ Sign in to unlock full AI insight'}
          </div>
        </div>
      )}

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

      {/* Social Login Buttons - 2x2 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '12px',
      }}>
        {/* Apple */}
        <OAuthButton icon={appleIcon} label={t.apple} onClick={() => handleOAuthLogin('apple')} loading={loading} dark />
        {/* Google */}
        <OAuthButton icon={googleIcon} label={t.google} onClick={() => handleOAuthLogin('google')} loading={loading} />
        {/* Facebook */}
        <OAuthButton icon={facebookIcon} label={t.facebook} onClick={() => handleOAuthLogin('facebook')} loading={loading} />
        {/* TikTok */}
        <OAuthButton icon={tiktokIcon} label={t.tiktok} onClick={() => handleOAuthLogin('tiktok')} loading={loading} />
      </div>

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
