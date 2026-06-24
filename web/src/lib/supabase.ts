import { createClient } from '@supabase/supabase-js';

// ── OAuth Pre-capture（必须在 createClient 之前！）──
// Supabase SDK 在 createClient 时就会消费并清理 URL hash，
// 所以必须在此之前先把 OAuth 回调标志存到 sessionStorage。
if (typeof window !== 'undefined') {
  const _hadOAuthHash = window.location.hash.includes('access_token=') || window.location.hash.includes('type=');
  const _hadOAuthCode = window.location.search.includes('code=');
  if (_hadOAuthHash || _hadOAuthCode) {
    sessionStorage.setItem('ks_oauth_in_progress', '1');
    console.log('[KindredSouls Auth] Pre-captured OAuth in supabase.ts (before createClient)');
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_v4T_OvG7eZp48NJH4ALQzA_GVd0SsJv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce', autoRefreshToken: true, persistSession: true },
});
