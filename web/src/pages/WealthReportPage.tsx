import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import WealthDataGrid from '../components/WealthDataGrid';
import WealthPaywall from '../components/WealthPaywall';
import WealthInsightCard from '../components/WealthInsightCard';
import { supabase } from '../lib/supabase';

// ── Loading Spinner ──
const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: '#080810',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: '3px solid rgba(212,175,55,0.15)',
      borderTop: '3px solid #D4AF37',
      borderRadius: '50%',
      animation: 'ks-spin 0.7s linear infinite',
      marginBottom: 16,
    }} />
    <p style={{ color: '#8B8778', fontSize: 14 }}>{message}</p>
    <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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

// 🛡️ KindredSouls 战时黄金文案防弹装甲：6国语言至尊跃迁提示
const UPGRADE_HINTS: Record<string, string> = {
  zh: "您的至尊全通通道已开启。由于您已成功解锁基础格局，现可获得直接跃迁【$99.99/年 终极 VIP】的宇宙特权，全盘解锁未来 12 个月『宇宙生日年鉴』与所有高阶算法。",
  en: "Your supreme all-access channel is active. Having unlocked your basic chart, you now hold the cosmic privilege to upgrade directly to [$99.99/Year Ultimate VIP], fully revealing the next 12 months of your 'Solar Return Almanac' and all high-tier algorithms.",
  fr: "Votre canal d'accès suprême est activé. Ayant débloqué votre thème de base, vous disposez du privilège cosmique de passer directement au [VIP Ultime à 99,99 $/an], révélant l'Almanach du Retour Solaire des 12 prochains mois.",
  es: "Su canal supremo de acceso total está activo. Habiendo desbloqueado su carta básica, ahora tiene el privilegio cósmico de actualizar directamente a [VIP Definitivo de $99.99/año], revelando su Almanaque de Retorno Solar.",
  th: "ช่องทางเข้าถึงระดับสูงสุดของคุณเปิดใช้งานแล้ว ข้อมูลพื้นฐานได้รับการปลดล็อกแล้ว ตอนนี้คุณได้รับสิทธิ์ในการอัปเกรดเป็น [$99.99/ปี Ultimate VIP] เพื่อเปิดเผย 'สมุดบันทึกโซลาร์รีเทิร์น' ในอีก 12 เดือนข้างหน้า",
  vi: "Kênh truy cập tối cao của bạn đã được kích hoạt. Sau khi mở khóa lá số cơ bản, bạn có đặc quyền vũ trụ để nâng cấp trực tiếp lên [VIP Tối Thượng $99.99/Năm], tiết lộ 'Niên Giám Solar Return' cho 12 tháng tới.",
};

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
  const [authChecking, setAuthChecking] = useState(true);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [paidPlans, setPaidPlans] = useState<any>(null);
  const [wealthReportText, setWealthReportText] = useState<string>('');
  const [reportLoading, setReportLoading] = useState<string>('');
  const loadingRef = useRef(false);

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let birth = params.get('birth');
    const langParam = params.get('lang');

    if (!birth) {
      birth = sessionStorage.getItem('wealth_birth') || '';
      if (!birth) {
        onNavigate('/wealth');
        return;
      }
    }

    sessionStorage.setItem('wealth_birth', birth);
    sessionStorage.setItem('wealth_lang', langParam || i18n.language || 'en');

    setBirthDate(birth);
    setLang(langParam || i18n.language || 'en');

    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment') === 'success';
    const intentCheckout = urlParams.get('intent') === 'checkout';
    const intentPlan = urlParams.get('plan') || '';
    
    if (intentCheckout && intentPlan && !paymentSuccess) {
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', true, intentPlan);
    } else {
      checkAuthAndLoad(birth, langParam || i18n.language || 'en', paymentSuccess);
    }

    setTimeout(() => setAuthChecking(false), 10000);
  }, []);

  const checkAuthAndLoad = async (birth: string, lang: string, forceRecheck = false, pendingPlan?: string) => {
    let token: string | undefined;
    try {
      const hash = window.location.hash;
      const hashTokenMatch = hash.match(/access_token=([^&]+)/);
      if (hashTokenMatch) {
        token = hashTokenMatch[1];
      }

      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } else {
        // 有 token from hash，但不在这里清理 URL
      }

      if (token) {
        setCurrentToken(token);
        const cleanUrl = window.location.pathname + '?birth=' + encodeURIComponent(birth) + '&lang=' + lang;
        window.history.replaceState({}, '', cleanUrl);

        if (pendingPlan) {
          await handlePurchase(pendingPlan as any, token);
        } else {
          await checkPaidStatus();
        }
      } else if (forceRecheck) {
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 500));
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (s2?.access_token) {
            token = s2.access_token;
            setCurrentToken(token);
            await checkPaidStatus();
            break;
          }
        }
        if (!token) {
          setIsUnlocked(false);
          setShowPaywall(true);
        }
      } else {
        setIsUnlocked(false);
        setShowPaywall(true);
      }
    } catch (err) {
      console.error('[WealthReport] Auth check failed:', err);
      setIsUnlocked(false);
      setShowPaywall(true);
    }

    setAuthChecking(false);
    await loadWealthData(birth, lang, token);
  };

  const checkPaidStatus = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const { data: profiles, error: dbError } = await supabase
        .from('user_profiles')
        .select('paid_plans')
        .eq('user_id', user.id)
        .limit(1);

      if (dbError) {
        console.error('[WealthReport] DB query error:', dbError);
        setIsUnlocked(false);
        setShowPaywall(true);
        return;
      }

      const rawPlans = profiles?.[0]?.paid_plans;
      const now = Date.now();

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

      const isWealthPaid = (() => {
        if (planMap.wealth_once === true) return true;
        if (planMap.wealth_yearly_report === true) return true;
        if (planMap.wealth_monthly_report === true) return true;

        const ap = planMap.all_pass_yearly;
        if (ap) {
          const expiresAt = ap.expires_at || ap.all_pass_expires_at;
          if (!expiresAt || new Date(expiresAt).getTime() > now) return true;
        }

        const sv = planMap.star_monthly_vip;
        if (sv) {
          let used: number, allowance: number, resetsAt: string | undefined;
          if (typeof sv === 'object') {
            used = sv.star_monthly_wealth_used ?? 0;
            allowance = sv.star_monthly_wealth_allowance;
            resetsAt = sv.resets_at ?? sv.star_monthly_resets_at;
          } else {
            used = planMap.star_monthly_wealth_used ?? 0;
            allowance = planMap.star_monthly_wealth_allowance;
            resetsAt = planMap.star_monthly_resets_at;
          }
          if (typeof allowance === 'number' && used < allowance && (!resetsAt || new Date(resetsAt).getTime() > now)) {
            return true;
          }
        }

        return false;
      })();

      setPaidPlans(rawPlans);

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
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
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
      loadingRef.current = false;
    }
  };

  const handlePurchase = async (plan: 'star_monthly_vip' | 'all_pass_yearly' | 'wealth_once' | 'wealth_monthly_report' | 'wealth_yearly_report', forceToken?: string) => {
    let token = forceToken || currentToken;

    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthReturn = urlParams.get('intent') === 'checkout';
      if (isOAuthReturn) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token || null;
        if (token) setCurrentToken(token);
      }
    }

    if (!token) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('intent', 'checkout');
      currentUrl.searchParams.set('plan', plan);
      const redirectUrl = currentUrl.toString();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { hl: lang === 'zh' ? 'zh-CN' : lang, access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) {
        setError('Login failed. Please try again.');
        setAuthChecking(false);
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
        if (reportData && !reportData.insight) {
          loadWealthData(birthDate, lang, token);
        }
      } else {
        setError(data.detail || data.error || 'Checkout failed');
        setAuthChecking(false);
      }
    } catch (err) {
      console.error('[WealthReport] Purchase error:', err);
      setError('Network error. Please check your connection.');
      setAuthChecking(false);
    }
  };

  const handleTriggerInsight = async () => {
    if (!currentToken || !reportData) return;
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;

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
    } finally {
      loadingRef.current = false;
    }
  };

  const generateWealthReport = async (type: 'monthly' | 'yearly') => {
    if (!currentToken) return;
    setReportLoading(type === 'monthly' ? 'wealth_monthly' : 'wealth_yearly');
    setWealthReportText('');
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
          reportType: type,
          includeInsight: false,
        }),
      });
      if (!res.ok) {
        if (res.status === 402) {
          await handlePurchase(
            type === 'monthly' ? 'wealth_monthly_report' : 'wealth_yearly_report',
            currentToken
          );
          return;
        }
        throw new Error('API error: ' + res.status);
      }
      const data = await res.json();
      setWealthReportText(data.report || data.insight || '');
    } catch (err) {
      console.error('[WealthReport] generateWealthReport error:', err);
      setWealthReportText(currentLang === 'zh' ? '生成报告失败，请重试。' : 'Failed to generate report.');
    } finally {
      setReportLoading('');
    }
  };

  const currentLang = (lang || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

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
    <>
      {authChecking && <LoadingOverlay message={currentLang === 'zh' ? '正在验证...' : 'Verifying...'} />}

      <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #080810 0%, #0D0D1A 100%)',
      padding: '56px 16px 60px',
      position: 'relative',
    }}>
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

        <WealthDataGrid
          bazi={baziField}
          zodiac={zodiacField}
          iching={ichingField}
          tarot={tarotField}
          lang={currentLang}
        />

        {!authChecking && !isUnlocked && showPaywall && (
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

        {isUnlocked && reportData && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(212,175,55,0.06)', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.25)' }}>
            <div style={{ fontSize: '13px', color: '#D4AF37', fontWeight: 700, marginBottom: '8px' }}>
              📊 {currentLang === 'zh' ? '财富年鉴' : currentLang === 'en' ? 'Wealth Almanac' : currentLang === 'es' ? 'Almanaque de Riqueza' : currentLang === 'fr' ? 'Almanach de Richesse' : currentLang === 'th' ? 'ปฏิทินความมั่งคั่ง' : 'Niên Ký Tài Lộc'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(212,175,55,0.6)', marginBottom: '8px' }}>
              {currentLang === 'zh' ? '基于您的先天财富格局，推演未来运势曲线' : currentLang === 'en' ? 'Based on your innate wealth blueprint, project future fortune trends.' : currentLang === 'es' ? 'Basado en tu plan de riqueza innato, proyecta tendencias futuras.' : currentLang === 'fr' ? 'Basé sur votre plan de richesse inné, projete des tendences futures.' : currentLang === 'th' ? 'อิงจากแผนความมั่งคั่งตามธรรมชํติ ทํายนนโนมไลน์ความมั่งคั่งในอนาคต' : 'Dựa trên bản đồ tài lộc tiên thiên, dự báo xu hướng tương lai.'}
            </div>
            {paidPlans?.all_pass_yearly === true ? (
              <>
                <button onClick={() => generateWealthReport('monthly')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading === 'wealth_monthly' ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading === 'wealth_monthly' ? '⏳...' : (currentLang === 'zh' ? '📅 生成财富月报' : '📅 Monthly Wealth Report')}
                </button>
                <button onClick={() => generateWealthReport('yearly')} disabled={!!reportLoading} style={{ marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)', background: reportLoading === 'wealth_yearly' ? '#444' : 'rgba(129,216,208,0.1)', color: '#81D8D0', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  {reportLoading === 'wealth_yearly' ? '⏳...' : (currentLang === 'zh' ? '📆 生成财富年报' : '📆 Yearly Wealth Report')}
                </button>
                <div style={{ fontSize: '10px', color: '#81D8D0', marginTop: '6px' }}>✨ {currentLang === 'zh' ? 'VIP 尊享，点击免费生成' : 'VIP free access'}</div>
              </>
            ) : (
              <>
                <button onClick={() => handlePurchase('wealth_monthly_report')} disabled={!!reportLoading} style={{ marginRight: '8px', marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.4)', background: reportLoading ? '#444' : 'rgba(212,175,55,0.1)', color: '#D4AF37', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  📅 {currentLang === 'zh' ? '解锁流月报告 $2.99' : 'Unlock Monthly $2.99'}
                </button>
                <button onClick={() => handlePurchase('wealth_yearly_report')} disabled={!!reportLoading} style={{ marginBottom: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(129,216,208,0.4)', background: reportLoading ? '#444' : 'rgba(129,216,208,0.1)', color: '#81D8D0', fontSize: '12px', fontWeight: 600, cursor: reportLoading ? 'not-allowed' : 'pointer' }}>
                  📆 {currentLang === 'zh' ? '解锁年度报告 $29.99' : 'Unlock Yearly $29.99'}
                </button>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                  💡 {UPGRADE_HINTS[currentLang] || UPGRADE_HINTS['en']}
                </div>
              </>
            )}
            {wealthReportText && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', textAlign: 'left' }}>
                {wealthReportText.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 8px' }}>{para}</p>
                ))}
              </div>
            )}
          </div>
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

        {error && (
          <p style={{ color: '#E05C5C', fontSize: '12px', marginTop: '12px' }}>{error}</p>
        )}
      </div>
    </div>
    </>
  );
};

export default WealthReportPage;
