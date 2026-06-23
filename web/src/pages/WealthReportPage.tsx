import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import WealthDataGrid from '../components/WealthDataGrid';
import WealthPaywall from '../components/WealthPaywall';
import WealthInsightCard from '../components/WealthInsightCard';
import { supabase } from '../lib/supabase';

// ── Types ──
interface WealthOracleResponse {
  success: boolean;
  birthDate: string;
  lang: string;
  data: {
    bazi: { display: string; subDisplay?: string };
    zodiac: { display: string; subDisplay?: string };
    iching: { display: string; subDisplay?: string };
    tarot: { display: string; subDisplay?: string };
  };
  insight: string;
  referrer: string;
}

interface WealthReportPageProps {
  onNavigate: (path: string) => void;
}

// ── Component ──
const WealthReportPage: React.FC<WealthReportPageProps> = ({ onNavigate }) => {
  const { i18n } = useTranslation();
  const [birthDate, setBirthDate] = useState<string>('');
  const [lang, setLang] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<WealthOracleResponse | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let birth = params.get('birth');
    const langParam = params.get('lang');

    if (!birth) {
      // Try session storage (payment return)
      birth = sessionStorage.getItem('wealth_birth') || '';
      if (!birth) {
        onNavigate('/wealth');
        return;
      }
    }

    // Save birth to sessionStorage for payment return flow
    sessionStorage.setItem('wealth_birth', birth);
    sessionStorage.setItem('wealth_lang', langParam || i18n.language || 'en');

    setBirthDate(birth);
    setLang(langParam || i18n.language || 'en');

    // If returning from successful payment, force re-check paid status
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment') === 'success';

    // 🎯 检测 OAuth 返回后的 intent=checkout（用户已登录，需自动触发 Stripe）
    const intentCheckout = urlParams.get('intent') === 'checkout';
    const intentPlan = urlParams.get('plan') || '';

    if (intentCheckout && intentPlan && !paymentSuccess) {
      // 清除 URL 参数避免重复触发
      const cleanUrl = window.location.pathname.split('?')[0];
      window.history.replaceState({}, '', cleanUrl + '?birth=' + birth + '&lang=' + (langParam || i18n.language || 'en'));

      // 检查 session 并自动触发 checkout
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', false, intentPlan);
    } else {
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', paymentSuccess);
    }
  }, []);

  const checkAuthAndLoad = async (birth: string, lang: string, forceRecheck = false, pendingPlan?: string) => {
    let token: string | undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
      if (token) {
        setCurrentToken(token);
        await checkPaidStatus(token);
        // 🎯 有 pendingPlan → 等待 checkPaidStatus 后自动触发 checkout
        if (pendingPlan) {
          setTimeout(() => handlePurchase(pendingPlan as any, token), 100);
        }
      } else if (forceRecheck) {
        // Payment just succeeded but session not ready yet — wait briefly
        await new Promise(r => setTimeout(r, 2000));
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (s2?.access_token) {
          token = s2.access_token;
          setCurrentToken(token);
          await checkPaidStatus(token);
        } else {
          setIsUnlocked(false);
          setShowPaywall(true);
        }
      } else {
        // Not logged in → show paywall
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[WealthReport] Auth check failed:', err);
      setIsUnlocked(false);
      setShowPaywall(true);
    }

    // Always load data (preview is free)
    await loadWealthData(birth, lang, token);
  };

  const checkPaidStatus = async (token: string) => {
    try {
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
      });

      if (!authRes.ok) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const authData = await authRes.json();
      const userId = authData?.id;
      if (!userId) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const dbRes = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans&limit=1`,
        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
      );

      if (!dbRes.ok) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const dbData = await dbRes.json();
      const rawPlans = dbData?.[0]?.paid_plans;
      const now = Date.now();

      // 统一兼容两种存储格式：
      //   数组格式：["wealth_once"] 或 [{"plan":"wealth_once", ...}]
      //   对象格式：{"wealth_once": true, "star_monthly_vip": {...}}
      const planMap: Record<string, any> = {};
      if (Array.isArray(rawPlans)) {
        for (const p of rawPlans) {
          if (typeof p === 'string') {
            planMap[p] = true;
          } else if (typeof p === 'object' && p !== null) {
            const pk = p.plan;
            if (pk) planMap[pk] = p;
          }
        }
      } else if (typeof rawPlans === 'object' && rawPlans !== null) {
        Object.assign(planMap, rawPlans);
      }

      // 兼容性检查（与 create-checkout 服务端逻辑一致）
      const isWealthPaid = (() => {
        // 直接放行：key === true
        if (planMap.wealth_once === true) return true;
        if (planMap.wealth_yearly_report === true) return true;
        if (planMap.wealth_monthly_report === true) return true;

        // all_pass_yearly 检查 expires_at
        const ap = planMap.all_pass_yearly;
        if (ap) {
          const expiresAt = ap.expires_at || ap.all_pass_expires_at;
          if (!expiresAt || new Date(expiresAt).getTime() > now) return true;
        }

        // star_monthly_vip 检查财富配额
        const sv = planMap.star_monthly_vip;
        if (sv && typeof sv === 'object') {
          const used = sv.star_monthly_wealth_used ?? 0;
          const allowance = sv.star_monthly_wealth_allowance;
          const resetsAt = sv.resets_at ?? sv.star_monthly_resets_at;
          if (typeof allowance === 'number' && used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) {
            return true;
          }
        }

        return false;
      })();

      if (isWealthPaid) {
        setIsUnlocked(true);
        setShowPaywall(false);
      } else {
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[WealthReport] Error checking paid status:', err);
      setIsUnlocked(false);
      setShowPaywall(true);
    }
  };

  const loadWealthData = async (birth: string, lang: string, token?: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/wealth-oracle', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          birthDate: birth,
          lang: lang,
          referrer: 'standalone',
        }),
      });

      if (res.status === 402) {
        // Paywall: not paid yet — 但把 preview 数据存起来，四宫格要显示
        try {
          const errData = await res.json();
          if (errData?.data) {
            setReportData({
              success: true,
              birthDate: birth,
              lang,
              data: errData.data,
              insight: errData.preview ? errData.preview : '',
              referrer: 'standalone',
            } as any);
          }
        } catch (_) {}
        setError(null);
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }
      if (!res.ok) {
        // 尝试读取服务器返回的错误详情
        const errBody = await res.text().catch(() => '');
        console.error('[WealthReport] API error body:', res.status, errBody);
        throw new Error(`API error: ${res.status}${errBody ? ' - ' + errBody.substring(0, 200) : ''}`);
      }

      const data: WealthOracleResponse = await res.json();
      
      if (!data.success) {
        throw new Error('API returned failure');
      }

      setReportData(data);
    } catch (err) {
      console.error('[WealthReport] Error loading data:', err);
      setError(
        lang.startsWith('zh') 
          ? '网络开小差，请重试' 
          : 'Network error, please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: 'star_monthly_vip' | 'all_pass_yearly' | 'wealth_once' | 'wealth_monthly_report' | 'wealth_yearly_report', forceToken?: string) => {
    let token = forceToken || currentToken;

    if (!token) {
      // 🎯 来自 OAuth 回调（intent=checkout），currentToken 可能还没更新 → 直接拿 session
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthReturn = urlParams.get('intent') === 'checkout';
      if (isOAuthReturn) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
        if (token) setCurrentToken(token);
      }
    }

    if (!token) {
      // 真没登录 → 保存购买意图到 URL，OAuth 回来后自动触发 Stripe
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('intent', 'checkout');
      currentUrl.searchParams.set('plan', plan);
      const redirectUrl = currentUrl.toString();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { hl: lang === 'zh' ? 'zh-CN' : lang },
        },
      });
      if (error) {
        setError('Login failed. Please try again.');
      }
      return;
    }

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.already_paid) {
        setIsUnlocked(true);
        setShowPaywall(false);
        // Reload insight if needed
        if (reportData && !reportData.insight) {
          loadWealthData(birthDate, lang, token);
        }
      } else {
        setError(data.detail || data.error || 'Checkout failed');
      }
    } catch (err) {
      console.error('[WealthReport] Purchase error:', err);
      setError('Network error. Please check your connection.');
    }
  };

  const handleTriggerInsight = async () => {
    if (!currentToken || !reportData) return;

    try {
      const res = await fetch('/api/wealth-oracle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          birthDate,
          lang,
          referrer: 'standalone',
          includeInsight: true,
        }),
      });

      const data = await res.json();
      if (data.insight) {
        setReportData(prev => prev ? { ...prev, insight: data.insight } : null);
      }
    } catch (err) {
      console.error('[WealthReport] Error triggering insight:', err);
    }
  };

  const currentLang = (lang || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(212, 175, 55, 0.3)',
          borderTopColor: '#D4AF37',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }} />
        <p style={{ color: '#D4AF37', fontSize: '14px' }}>
          {currentLang === 'zh' ? '正在召唤财富密码……' : 'Summoning wealth code...'}
        </p>
      </div>
    );
  }

  // Error state
  if (error && !reportData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <p style={{ color: '#E05C5C', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        <button
          onClick={() => loadWealthData(birthDate, lang, currentToken || undefined)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #D4AF37',
            background: 'transparent',
            color: '#D4AF37',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {currentLang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
    );
  }

  // ── Map API raw data → display/subDisplay for DataGrid ──
  const baziField = reportData?.data?.bazi
    ? (() => {
        const b = reportData.data.bazi as any;
        const sz = b.sizhu;
        const dm = sz?.dayMaster || '';
        const dp = sz?.dayPillar || '';
        const display = dp ? `${b.dayMasterWuxing || dm} · ${dp}` : (dm || '--');
        const wx = b.wuxing;
        const subDisplay = wx
          ? Object.entries(wx).filter(([,v]: any) => (v as number) > 0).map(([k,v]: any) => `${k}${v}`).join(' ')
          : '';
        return { label: '', value: display, subValue: subDisplay };
      })()
    : { label: '', value: '--', subValue: '' };

  const zodiacField = reportData?.data?.zodiac
    ? (() => {
        const z = reportData.data.zodiac as any;
        return { label: '', value: `${z.sunSign} · ${z.sunSignElement}`, subValue: `${z.sunSignMode} · ${z.sunSignRuler}` };
      })()
    : { label: '', value: '--', subValue: '' };

  const ichingField = reportData?.data?.iching
    ? (() => {
        const ic = reportData.data.iching as any;
        return { label: '', value: `${ic.hexName} #${ic.hexNum}`, subValue: `${ic.hexNature} · ${ic.changingLineDesc || ic.changingLine} → ${ic.transformedHexName}` };
      })()
    : { label: '', value: '--', subValue: '' };

  const tarotField = reportData?.data?.tarot
    ? (() => {
        const t = reportData.data.tarot as any;
        return { label: '', value: `${t.emoji || '🃏'} ${t.name}`, subValue: `${t.orientation || ''} · ${t.meaning}` };
      })()
    : { label: '', value: '--', subValue: '' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
      padding: '56px 16px 60px',
      position: 'relative',
    }}>
      {/* Background stars */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(1.5px 1.5px at 20% 30%, rgba(212,175,55,0.3) 50%, transparent 50%),
          radial-gradient(1.5px 1.5px at 80% 70%, rgba(129,216,208,0.3) 50%, transparent 50%),
          #080810
        `,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => onNavigate('/wealth')}
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
            ← {currentLang === 'zh' ? '返回' : 'Back'}
          </button>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#D4AF37',
            marginBottom: '4px',
          }}>
            {currentLang === 'zh' ? '财富解码报告' : 'Wealth Oracle Report'}
          </h1>
          <p style={{ fontSize: '12px', color: '#8B8778' }}>
            {currentLang === 'zh' ? '出生日期: ' : 'Birth Date: '}{birthDate}
          </p>
        </div>

        {/* Data Grid */}
        <WealthDataGrid
          bazi={baziField}
          zodiac={zodiacField}
          iching={ichingField}
          tarot={tarotField}
          lang={currentLang}
        />

        {/* Paywall or Insight */}
        {!isUnlocked && showPaywall && (
          <WealthPaywall
            lang={currentLang}
            onPurchase={handlePurchase}
          />
        )}

        {isUnlocked && reportData?.insight && (
          <WealthInsightCard
            insight={reportData.insight}
          />
        )}

        {isUnlocked && !reportData?.insight && (
          <button
            onClick={handleTriggerInsight}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            ✨ {currentLang === 'zh' ? '生成 AI 洞察' : 'Generate AI Insight'}
          </button>
        )}

        {/* Error display */}
        {error && (
          <p style={{ color: '#E05C5C', fontSize: '12px', marginTop: '12px' }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default WealthReportPage;
