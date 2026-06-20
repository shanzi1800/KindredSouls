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
    const birth = params.get('birth');
    const langParam = params.get('lang');

    if (!birth) {
      // No birth date provided, redirect to wealth input page
      onNavigate('/wealth');
      return;
    }

    setBirthDate(birth);
    setLang(langParam || i18n.language || 'en');

    // Check auth status
    checkAuthAndLoad(birth, langParam || i18n.language || 'en');
  }, []);

  const checkAuthAndLoad = async (birth: string, lang: string) => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        setCurrentToken(session.access_token);
        // Check paid status
        await checkPaidStatus(session.access_token);
      }

      // Load wealth data (always show preview data)
      await loadWealthData(birth, lang, session?.access_token);
    } catch (err) {
      console.error('[WealthReport] Error checking auth:', err);
      // Still try to load data (might show paywall)
      await loadWealthData(birth, lang);
    }
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
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid&limit=1`,
        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
      );

      if (!dbRes.ok) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const dbData = await dbRes.json();
      const paid = dbData?.[0]?.paid === true;

      if (paid) {
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

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
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

  const handlePurchase = async (plan: 'monthly' | 'yearly') => {
    if (!currentToken) {
      // Need to login first
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
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
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ plan: `wealth_${plan}` }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.already_paid) {
        setIsUnlocked(true);
        setShowPaywall(false);
        // Reload insight if needed
        if (reportData && !reportData.insight) {
          loadWealthData(birthDate, lang, currentToken);
        }
      } else {
        setError(data.error || 'Checkout failed');
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

  // Main report UI
  const baziField = reportData?.data?.bazi
    ? { label: '', value: reportData.data.bazi.display, subValue: reportData.data.bazi.subDisplay }
    : { label: '', value: '--', subValue: '' };

  const zodiacField = reportData?.data?.zodiac
    ? { label: '', value: reportData.data.zodiac.display, subValue: reportData.data.zodiac.subDisplay }
    : { label: '', value: '--', subValue: '' };

  const ichingField = reportData?.data?.iching
    ? { label: '', value: reportData.data.iching.display, subValue: reportData.data.iching.subDisplay }
    : { label: '', value: '--', subValue: '' };

  const tarotField = reportData?.data?.tarot
    ? { label: '', value: reportData.data.tarot.display, subValue: reportData.data.tarot.subDisplay }
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
