import React from 'react';

// ── Types ──
export type WealthPlan = 'wealth_once' | 'star_monthly_vip' | 'all_pass_yearly';

interface WealthPaywallProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  onPurchase: (plan: WealthPlan) => void;
  loading?: boolean;
}

// ── i18n ──
const I18N = {
  zh: {
    title: '🔒 AI 深度洞察',
    subtitle: '终极破译你的先天财富格局与事业基因',
    preview: '你的财富运势和事业能量场存在特殊的共振模式……这种配置在人群中仅占 5%。',
    once: '$4.99 一次性解锁先天财富大盘',
    onceDesc: '终身可看 · 深度透析你的底层搞钱基因',
    monthly: '$9.99 / 月 — 双引擎星运特权卡',
    monthlyDesc: '每月 5 次财富 AI 动态洞察 + 1 次合婚特权 · 锁定流月财运预警',
    yearly: '$99.99 / 年',
    yearlyBadge: '省17%',
    vipLabel: '✨ 会员特享',
    unlock: '解锁全部报告 · 每月 5 次财富洞察 · 附赠合婚特权',
    already: '已有账户？登录',
    secure: '安全支付',
    instant: '即时生成',
    features: '财富密码 · 事业能量 · 先天格局',
    refund: '支持退款',
  },
  en: {
    title: '🔒 AI Deep Insight',
    subtitle: 'Decode Your Innate Wealth Blueprint & Career DNA',
    preview: 'Your wealth trajectory and career energy field show a rare resonance pattern… This configuration appears in only 5% of people.',
    once: '$4.99 One-Time — Unlock Your Wealth Blueprint',
    onceDesc: 'Lifetime access · Deep dive into your financial DNA',
    monthly: '$9.99 / month — Dual Engine Star VIP Card',
    monthlyDesc: '5 monthly wealth AI insights + 1 monthly compatibility · Monthly fortune alerts',
    yearly: '$99.99 / year',
    yearlyBadge: 'Save 17%',
    vipLabel: '✨ VIP Benefits',
    unlock: 'Full reports · 5 monthly wealth insights · 1 free compatibility',
    already: 'Already have an account? Log in',
    secure: 'Secure payment',
    instant: 'Instant generation',
    features: 'Wealth Code · Career Energy · Innate Blueprint',
    refund: 'Refundable',
  },
  es: {
    title: '🔒 Perspectiva AI Profunda',
    subtitle: 'Descifra tu patrón innato de riqueza y ADN profesional',
    preview: 'Tu trayectoria de riqueza y campo de energía profesional muestran un patrón de resonancia raro… Esta configuración aparece en solo el 5% de las personas.',
    once: '$4.99 Pago Único',
    onceDesc: 'Obtén tu informe completo',
    monthly: '$9.99 / mes',
    monthlyDesc: 'VIP ilimitado (incluye compatibilidad)',
    yearly: '$99.99 / año',
    yearlyBadge: 'Ahorra 17%',
    vipLabel: '✨ Planes VIP',
    unlock: 'Desbloquea informe completo + generaciones ilimitadas',
    already: '¿Ya tienes una cuenta? Inicia sesión',
    secure: 'Pago seguro',
    instant: 'Generación instantánea',
    features: 'Código de Riqueza · Energía Profesional · Plano Innato',
    refund: 'Reembolsable',
  },
  fr: {
    title: '🔒 Perspective IA Profonde',
    subtitle: 'Décodez votre plan de richesse inné et votre ADN de carrière',
    preview: 'Votre trajectoire de richesse et champ d\'énergie professionnel montrent un pattern de résonance rare… Cette configuration apparaît chez seulement 5% des personnes.',
    once: '$4.99 Paiement Unique',
    onceDesc: 'Obtenez votre rapport complet',
    monthly: '$9.99 / mois',
    monthlyDesc: 'VIP illimité (inclut la compatibilité)',
    yearly: '$99.99 / an',
    yearlyBadge: 'Économisez 17%',
    vipLabel: '✨ Forfaits VIP',
    unlock: 'Débloquez rapport complet + générations illimitées',
    already: 'Déjà un compte ? Connectez-vous',
    secure: 'Paiement sécurisé',
    instant: 'Génération instantanée',
    features: 'Code de Richesse · Énergie Carrière · Plan Inné',
    refund: 'Remboursable',
  },
  th: {
    title: '🔒 ไอคิวซีกลับลึก',
    subtitle: 'ถอดรหัสแผนทรัพย์สินโดยกำเนิดและดีเอ็นเออาชีพของคุณ',
    preview: 'เส้นทางความร่ำรวยและสนามพลังงานอาชีพของคุณแสดงรูปแบบการสั่นพ้องที่หายาก… การกำหนดค่านี้ปรากฏในเพียง 5% ของประชาชน',
    once: ' $4.99 จ่ายครั้งเดียว',
    onceDesc: 'รับรายงานฉบับเต็ม',
    monthly: '$9.99 / เดือน',
    monthlyDesc: 'VIP ไม่จำกัด (รวมความเข้ากันได้)',
    yearly: '$99.99 / ปี',
    yearlyBadge: 'ประหยัด 17%',
    vipLabel: '✨ แผน VIP',
    unlock: 'ปลดล็อกรายงานเต็ม + สร้างได้ไม่จำกัด',
    already: 'มีบัญชีแล้ว? เข้าสู่ระบบ',
    secure: 'การชำระเงินที่ปลอดภัย',
    instant: 'สร้างทันที',
    features: 'รหัสความร่ำรวย · พลังงานอาชีพ · แผนโดยกำเนิด',
    refund: 'ขอคืนเงินได้',
  },
  vi: {
    title: '🔒 Phân tích AI Sâu',
    subtitle: 'Giải mã bản đồ tài lộc bẩm sinh và DNA sự nghiệp của bạn',
    preview: 'Quỹ đạo tài lộc và trường năng lượng sự nghiệp của bạn cho thấy một mẫu hình cộng hưởng hiếm thấy… Cấu hình này chỉ xuất hiện ở 5% mọi người.',
    once: '$4.99 Một Lần',
    onceDesc: 'Nhận báo cáo đầy đủ',
    monthly: '$9.99 / tháng',
    monthlyDesc: 'VIP không giới hạn (bao gồm tương hợp)',
    yearly: '$99.99 / năm',
    yearlyBadge: 'Tiết kiệm 17%',
    vipLabel: '✨ Gói VIP',
    unlock: 'Mở khóa báo cáo đầy đủ + tạo không giới hạn',
    already: 'Đã có tài khoản? Đăng nhập',
    secure: 'Thanh toán an toàn',
    instant: 'Tạo ngay lập tức',
    features: 'Mã Tài Lộc · Năng Lượng Sự Nghiệp · Bản Đồ Bẩm Sinh',
    refund: 'Hoàn tiền được',
  },
} as const;

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
            marginBottom: '20px',
          }}>
            💰 {t.features}
          </div>

          {/* Pricing */}
          <div style={{ marginBottom: '20px' }}>
            {/* $4.99 One-Time (primary) */}
            <button
              onClick={() => onPurchase('wealth_once')}
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
              {loading ? '⏳ Processing...' : t.once}
              <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '2px', color: '#b0b0d0' }}>{t.onceDesc}</div>
            </button>

            {/* VIP section label */}
            <div style={{
              fontSize: '11px',
              color: '#7777aa',
              marginBottom: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              {t.vipLabel}
            </div>

            {/* Monthly VIP */}
            <button
              onClick={() => onPurchase('star_monthly_vip')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                background: 'rgba(212, 175, 55, 0.02)',
                color: '#C8C4D9',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '8px',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.02)';
              }}
            >
              {loading ? '⏳ Processing...' : t.monthly}
            <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '2px', color: '#b0b0d0' }}>{t.monthlyDesc}</div>
            </button>

            {/* Yearly VIP (recommended) */}
            <button
              onClick={() => onPurchase('all_pass_yearly')}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(212, 175, 55, 0.15)',
                background: 'rgba(212, 175, 55, 0.02)',
                color: '#C8C4D9',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '20px',
                transition: 'all 0.3s ease',
                position: 'relative',
                opacity: loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)';
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.02)';
              }}
            >
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '8px',
                background: '#1a1a2e',
                color: '#D4AF37',
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px',
              }}>{t.yearlyBadge}</span>
              {loading ? '⏳ Processing...' : t.yearly}
            <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '2px', color: '#b0b0d0' }}>{t.unlock}</div>
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
