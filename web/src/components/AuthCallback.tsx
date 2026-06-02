import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

/**
 * 专用 OAuth 回调页面
 * - Supabase 把 session 存在 URL hash 里（#access_token=...）
 * - 这个页面让 Supabase 解析 hash，然后跳回原页面
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 从 URL 参数读重定向地址
        const params = new URLSearchParams(window.location.search);
        const nextUrl = params.get('next') || '/';

        console.log('[KindredSouls Debug] OAuth callback, next:', nextUrl);

        // 让 Supabase 解析 URL hash 中的 session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          console.log('[KindredSouls Debug] Session restored, redirecting to:', nextUrl);
          // 跳回原页面（含 #/result）
          window.location.href = decodeURIComponent(nextUrl);
        } else {
          // 没拿到 session，回首页
          console.warn('[KindredSouls Debug] No session found, going home');
          window.location.href = '/';
        }
      } catch (err) {
        console.error('[KindredSouls Debug] OAuth callback error:', err);
        window.location.href = '/';
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <h2>Completing login...</h2>
      <p>Please wait while we redirect you back.</p>
    </div>
  );
}
