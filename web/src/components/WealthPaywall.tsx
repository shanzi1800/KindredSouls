import React from 'react';

// ── Types ──
interface WealthPaywallProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  onPurchase: (plan: 'monthly' | 'yearly') => void;
  loading?: boolean;
}

// ── i18n ──
const I18N = {
  zh: {
    title: '🔒 AI 深度洞察',
    subtitle: '解锁你180天内的财富密码',
    preview: '你的财富运势和事业能量场存在特殊的共振模式……这种配置在人群中仅占 5%。',
    monthly: '$7.99 / 月',
    yearly: '$79.99 / 年',
    yearlyBadge: '省33%',
    unlock: '解锁完整报告 + 无限次生成',
    already: '已有账户？登录',
    secure: '安全支付',
    instant: '即时生成',
    refund: '支持退款',
  },
  en: {
    title: '🔒 AI Deep Insight',
    subtitle: 'Unlock your wealth code for the next 180 days',
    preview: 'Your wealth trajectory and career energy field show a rare resonance pattern… This configuration appears in only 5% of people.',
    monthly: '$7.99 / month',
    yearly: '$79.99 / year',
    yearlyBadge: 'Save 33%',
    unlock: 'Unlock full report + unlimited generations',
    already: 'Already have an account? Log in',
    secure: 'Secure payment',
    instant: 'Instant generation',
    refund: 'Refundable',
  },
  es: {
    title: '🔒 Perspectiva AI Profunda',
    subtitle: 'Desbloquea tu código de riqueza para los próximos 180 días',
    preview: 'Tu trayectoria de riqueza y campo de energía profesional muestran un patrón de resonancia raro… Esta configuración aparece en solo el 5% de las personas.',
    monthly: '$7.99 / mes',
    yearly: '$79.99 / año',
    yearlyBadge: 'Ahorra 33%',
    unlock: 'Desbloquea informe completo + generaciones ilimitadas',
    already: '¿Ya tienes una cuenta? Inicia sesión',
    secure: 'Pago seguro',
    instant: 'Generación instantánea',
    refund: 'Reembolsable',
  },
  fr: {
    title: '🔒 Perspective IA Profonde',
    subtitle: 'Débloquez votre code de richesse pour les 180 prochains jours',
    preview: 'Votre trajectoire de richesse et champ d\'énergie professionnel montrent un pattern de résonance rare… Cette configuration apparaît chez seulement 5% des personnes.',
    monthly: '$7.99 / mois',
    yearly: '$79.99 / an',
    yearlyBadge: 'Économise 33%',
    unlock: 'Débloquez rapport complet + générations illimitées',
    already: 'Déjà un compte ? Connectez-vous',
    secure: 'Paiement sécurisé',
    instant: 'Génération instantanée',
    refund: 'Remboursable',
  },
  th: {
    title: '🔒 ไอคิวซีกลับลึก',
    subtitle: 'ปลดล็อกรหัสความร่ำรวยของคุณสำหรับ 180 วันข้างหน้า',
    preview: 'เส้นทางความร่ำรวยและสนามพลังงานอาชีพของคุณแสดงรูปแบบการสั่นพ้องที่หายาก… การกำหนดค่านี้ปรากฏในเพียง 5% ของประชาชน',
    monthly: '$7.99 / เดือน',
    yearly: '$79.99 / ปี',
    yearlyBadge: 'ประหยัด 33%',
    unlock: 'ปลดล็อกรายงานเต็ม + สร้างได้ไม่จำกัด',
    already: 'มีบัญชีแล้ว? เข้าสู่ระบบ',
    secure: 'การชำระเงินที่ปลอดภัย',
    instant: 'สร้างทันที',
    refund: 'ขอคืนเงินได้',
  },
  vi: {
    title: '🔒 Phân tích AI Sâu',
    subtitle: 'Mở khóa mã tài lộc của bạn cho 180 ngày tới',
    preview: 'Quỹ đạo tài lộc và trường năng lượng sự nghiệp của bạn cho thấy một mẫu hình cộng hưởng hiếm thấy… Cấu hình này chỉ xuất hiện ở 5% mọi người.',
    monthly: '$7.99 / tháng',
    yearly: '$79.99 / năm',
    yearlyBadge: 'Tiết kiệm 33%',
    unlock: 'Mở khóa báo cáo đầy đủ + tạo không giới hạn',
    already: 'Đã có tài khoản? Đăng nhập',
    secure: 'Thanh toán an toàn',
    instant: 'Tạo ngay lập tức',
    refund: 'Hoàn tiền được',
  },
} as const;

// ── Stripe Price IDs (replace with actual IDs from Stripe Dashboard) ──
// const PRICE_IDS = {
//   monthly: 'price_wealth_monthly',  // TODO: Replace with actual Stripe price ID
//   yearly: 'price_wealth_yearly',   // TODO: Replace with actual Stripe price ID
// } as const;

// ── Component ──
const WealthPaywall: React.FC<WealthPaywallProps> = ({ lang, onPurchase, loading = false }) => {
  const t = I18N[lang] || I18N.en;

  return (
    <div style={{
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      margin: '20px 0',
    }}>
      {/* Blurred preview background */}
      <div style={{
        filter: 'blur(10px)',
        opacity: 0.35,
        padding: '20px 16px',
        background: 'rgba(212, 175, 55, 0.04)',
        borderRadius: '16px',
        border: '1px solid rgba(212, 175, 55, 0.12)',
        position: 'absolute',
        inset: 0,
      }}>
        <p style={{ fontSize: '13px', lineHeight: 1.7 }}>{t.preview}</p>
      </div>

      {/* Paywall overlay */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
        }}>
          {/* Lock icon */}
          <div style={{
            fontSize: '48px',
            marginBottom: '12px',
            filter: 'drop-shadow(0 0 16px rgba(212, 175, 55, 0.6))',
          }}>🔮</div>

          {/* Title */}
          <div style={{
            fontSize: '19px',
            fontWeight: 800,
            color: '#D4AF37',
            marginBottom: '8px',
          }}>
            {t.title}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '13px',
            color: '#a0a0c0',
            marginBottom: '6px',
            lineHeight: 1.6,
          }}>
            {t.subtitle}
          </div>

          {/* Features */}
          <div style={{
            fontSize: '12px',
            color: '#8888aa',
            marginBottom: '24px',
          }}>
            💰 财富密码 · 🔥 事业能量 · 🌟 180天运势
          </div>

          {/* Pricing */}
          <div style={{ marginBottom: '20px' }}>
            {/* Monthly */}
            <button
              onClick={() => onPurchase('monthly')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: '2px solid rgba(212, 175, 55, 0.4)',
                background: 'rgba(212, 175, 55, 0.08)',
                color: '#E8E4D9',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#D4AF37';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
              }}
            >
              {loading ? '⏳ Processing...' : t.monthly}
            </button>

            {/* Yearly (recommended) */}
            <button
              onClick={() => onPurchase('yearly')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
                color: '#1a1a2e',
                fontSize: '15px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.35)',
                position: 'relative',
                overflow: 'hidden',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: '#1a1a2e',
                color: '#D4AF37',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '8px',
              }}>{t.yearlyBadge}</span>
              {loading ? '⏳ Processing...' : t.yearly}
              <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>{t.unlock}</div>
            </button>
          </div>

          {/* Trust badges */}
          <div style={{
            fontSize: '10px',
            color: '#666',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
          }}>
            <span>{t.secure}</span>
            <span>·</span>
            <span>{t.instant}</span>
            <span>·</span>
            <span>{t.refund}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthPaywall;
