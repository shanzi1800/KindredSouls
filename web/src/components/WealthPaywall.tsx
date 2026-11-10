import React from 'react';

// ── Types ──
// ⚖️ E132（主公军令 2026-11-10）：$9.99 全通月订**前端入口退役**（与双引擎星运特权卡
//    同价重复，主公钦定去重保留双引擎）。E129/E130 后端结算能力与在期权益全量留存；
//    「神圣归神圣，商业归商业」，交易动作全部在专门付费墙页面完成。
export type WealthPlan = 'wealth_once' | 'star_monthly_vip' | 'all_pass_monthly' | 'all_pass_yearly';

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
    preview: '🔮 财富格局初判：你的先天能量正处于「明珠蒙尘·蓄势待发」的搞钱质感。命中财星有根，但受流月磁场干扰，变现路径尚在酝酿。这份解码将为你撕开以下核心底牌：',
    once: '$4.99 USD 一次性解锁先天财富大盘',
    onceDesc: '终身可看 · 深度透析你的底层搞钱基因',
    monthly: '$9.99 USD / 月 — 双引擎星运特权卡',
    // ⚖️ E131-C（主公军令 2026-11-09）：肃清已废除的「合婚特权」字眼——军令钦定新文案（六语同步，铁律 15）
    monthlyDesc: '解锁全部月度报告 · 姻缘与财富双模块 AI 深度洞察 · 锁定流月财运预警',
    yearly: '$99.99 USD / 年',
    yearlyBadge: '省17%',
    vipLabel: '✨ 会员特享',
    // ⚖️ E131-C（主公军令 2026-11-09）：$99.99 年卡描述同步换血——军令钦定新文案（六语同步，铁律 15）
    unlock: '解锁全年全部报告（含姻缘/财富双模块月报与年报）· 专属灵宠全长程陪伴特权',
    already: '已有账户？登录',
    secure: '安全支付',
    instant: '即时生成',
    features: '财富密码 · 事业能量 · 先天格局',
    refund: '支持退款',
    usdNote: '* 交易以美元结算，您的银行会自动转换为本地货币扣款',
  },
  en: {
    title: '🔒 AI Deep Insight',
    subtitle: 'Decode Your Innate Wealth Blueprint & Career DNA',
    preview: '🔮 Wealth Blueprint Preview: Your innate energy is in a "Hidden Gem Ready to Shine" state. Your wealth star has deep roots, but monthly magnetic interference keeps the monetization path brewing. This decoding will reveal your core cards:',
    once: '$4.99 USD One-Time — Unlock Your Wealth Blueprint',
    onceDesc: 'Lifetime access · Deep dive into your financial DNA',
    monthly: '$9.99 USD / month — Dual Engine Star VIP Card',
    // ⚖️ E131-C: purged deprecated "compatibility bonus" wording — six-language sync (Iron Rule 15)
    monthlyDesc: 'Unlock all monthly reports · AI deep insights for both love & wealth modules · Monthly fortune alerts',
    yearly: '$99.99 USD / year',
    yearlyBadge: 'Save 17%',
    vipLabel: '✨ VIP Benefits',
    unlock: 'All yearly reports (love & wealth, monthly & yearly) · Dedicated familiar full-journey companionship',
    already: 'Already have an account? Log in',
    secure: 'Secure payment',
    instant: 'Instant generation',
    features: 'Wealth Code · Career Energy · Innate Blueprint',
    refund: 'Refundable',
    usdNote: '* Transactions processed in USD. Your bank converts to your local currency automatically.',
  },
  es: {
    title: '🔒 Perspectiva AI Profunda',
    subtitle: 'Descifra tu patrón innato de riqueza y ADN profesional',
    preview: '🔮 Vista previa del plan de riqueza: Tu energía innata está en un estado de "Gema oculta lista para brillar". Tu estrella de riqueza tiene raíces profundas, pero la interferencia magnética mensual mantiene el camino de monetización en preparación. Esta decodificación revelará tus cartas clave:',
    once: '$4.99 USD Pago Único',
    onceDesc: 'Obtén tu informe completo',
    monthly: '$9.99 USD / mes',
    // ⚖️ E131-C: purged deprecated "compatibilidad" wording — six-language sync (Iron Rule 15)
    monthlyDesc: 'Desbloquea todos los informes mensuales · Perspectivas AI profundas de los módulos de amor y riqueza · Alertas de fortuna mensuales',
    yearly: '$99.99 USD / año',
    yearlyBadge: 'Ahorra 17%',
    vipLabel: '✨ Planes VIP',
    unlock: 'Desbloquea todos los informes del año (amor y riqueza, mensuales y anuales) · Compañía exclusiva de tu familiar en todo el trayecto',
    already: '¿Ya tienes una cuenta? Inicia sesión',
    secure: 'Pago seguro',
    instant: 'Generación instantánea',
    features: 'Código de Riqueza · Energía Profesional · Plano Innato',
    refund: 'Reembolsable',
    usdNote: '* Transacciones procesadas en USD. Tu banco convierte a tu moneda local automáticamente.',
  },
  fr: {
    title: '🔒 Perspective IA Profonde',
    subtitle: 'Décodez votre plan de richesse inné et votre ADN de carrière',
    preview: '🔮 Aperçu du plan de richesse: Votre énergie innée est dans un état "Pierre précieuse cachée prête à briller". Votre étoile de richesse a des racines profondes, mais l\'interférence magnétique mensuelle garde le chemin de monétisation en préparation. Ce décodage révélera vos cartes principales:',
    once: '$4.99 USD Paiement Unique',
    onceDesc: 'Obtenez votre rapport complet',
    monthly: '$9.99 USD / mois',
    // ⚖️ E131-C: purged deprecated "compatibilité" wording — six-language sync (Iron Rule 15)
    monthlyDesc: 'Débloque tous les rapports mensuels · Analyses IA approfondies des modules amour et richesse · Alertes de fortune mensuelles',
    yearly: '$99.99 USD / an',
    yearlyBadge: 'Économisez 17%',
    vipLabel: '✨ Forfaits VIP',
    unlock: 'Débloquez tous les rapports de l\'année (amour et richesse, mensuels et annuels) · Compagnie dédiée de votre familier sur tout le parcours',
    already: 'Déjà un compte ? Connectez-vous',
    secure: 'Paiement sécurisé',
    instant: 'Génération instantanée',
    features: 'Code de Richesse · Énergie Carrière · Plan Inné',
    refund: 'Remboursable',
    usdNote: '* Transactions traitées en USD. Votre banque convertit automatiquement dans votre devise locale.',
  },
  th: {
    title: '🔒 ไอคิวซีกลับลึก',
    subtitle: 'ถอดรหัสแผนทรัพย์สินโดยกำเนิดและดีเอ็นเออาชีพของคุณ',
    preview: '🔮 ภาพรวมแผนทรัพย์สิน: พลังงานโดยกำเนิดของคุณอยู่ในสถานะ "อัญมณีที่ซ่อนอยู่พร้อมเปล่งประกาย" ดาวทรัพย์สินของคุณมีรากลึก แต่การรบกวนสนามแม่เหล็กรายเดือนทำให้เส้นทางการสร้างรายได้ยังคงเก็บงำ การถอดรหัสนี้จะเปิดเผยไพ่หลักของคุณ:',
    once: ' $4.99 USD จ่ายครั้งเดียว',
    onceDesc: 'รับรายงานฉบับเต็ม',
    monthly: '$9.99 USD / เดือน',
    // ⚖️ E131-C: purged deprecated "ความเข้ากันได้" wording — six-language sync (Iron Rule 15)
    monthlyDesc: 'ปลดล็อกรายงานรายเดือนทั้งหมด · ข้อค้นพบ AI เชิงลึกทั้งโมดูลความรักและความมั่งคั่ง · การเตือนดวงการเงินรายเดือน',
    yearly: '$99.99 USD / ปี',
    yearlyBadge: 'ประหยัด 17%',
    vipLabel: '✨ แผน VIP',
    unlock: 'ปลดล็อกรายงานทั้งปี (รวมรายเดือน/รายปีของทั้งโมดูลความรักและความมั่งคั่ง) · สิทธิพิเศษคู่หูของคุณอยู่กับคุณตลอดเส้นทาง',
    already: 'มีบัญชีแล้ว? เข้าสู่ระบบ',
    secure: 'การชำระเงินที่ปลอดภัย',
    instant: 'สร้างทันที',
    features: 'รหัสความร่ำรวย · พลังงานอาชีพ · แผนโดยกำเนิด',
    refund: 'ขอคืนเงินได้',
    usdNote: '* ธุรกรรมดำเนินการเป็น USD ธนาคารของคุณจะแปลงเป็นสกุลเงินท้องถิ่นโดยอัตโนมัติ',
  },
  vi: {
    title: '🔒 Phân tích AI Sâu',
    subtitle: 'Giải mã bản đồ tài lộc bẩm sinh và DNA sự nghiệp của bạn',
    preview: '🔮 Xem trước bản đồ tài lộc: Năng lượng bẩm sinh của bạn đang ở trạng thái "Viên ngọc ẩn giấu sẵn sàng tỏa sáng". Sao tài lộc của bạn có gốc rễ sâu, nhưng nhiễu động từ trường hàng tháng khiến đường dẫn kiếm tiền vẫn đang ủi. Bài giải mã này sẽ tiết lộ các lá bài cốt lõi của bạn:',
    once: '$4.99 USD Một Lần',
    onceDesc: 'Nhận báo cáo đầy đủ',
    monthly: '$9.99 USD / tháng',
    // ⚖️ E131-C: purged deprecated "tương hợp" wording — six-language sync (Iron Rule 15)
    monthlyDesc: 'Mở khóa tất cả báo cáo hàng tháng · Phân tích AI chuyên sâu cả hai mô-đun tình duyên và tài lộc · Cảnh báo tài vận hàng tháng',
    yearly: '$99.99 USD / năm',
    yearlyBadge: 'Tiết kiệm 17%',
    vipLabel: '✨ Gói VIP',
    unlock: 'Mở khóa toàn bộ báo cáo cả năm (bao gồm báo cáo tháng/năm của cả hai mô-đun tình duyên và tài lộc) · Đặc quyền linh thú đồng hành trọn hành trình',
    already: 'Đã có tài khoản? Đăng nhập',
    secure: 'Thanh toán an toàn',
    instant: 'Tạo ngay lập tức',
    features: 'Mã Tài Lộc · Năng Lượng Sự Nghiệp · Bản Đồ Bẩm Sinh',
    refund: 'Hoàn tiền được',
    usdNote: '* Giao dịch được xử lý bằng USD. Ngân hàng của bạn sẽ tự động chuyển đổi sang tiền tệ địa phương.',
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
              textTransform: lang === 'vi' ? 'none' : 'uppercase', /* 🔴 E102-刀四-② vi 禁 uppercase */
            }}>
              {t.vipLabel}
            </div>

            {/* Monthly VIP */}
            <button
              onClick={() => onPurchase('star_monthly_vip')}
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
                marginBottom: '8px',
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
            <div style={{ fontSize: '11px', fontWeight: 400, marginTop: '2px', color: '#b0b0d0' }}>{t.monthlyDesc}</div>
            </button>

            {/* ⚖️ E132（主公军令 2026-11-10）：$9.99 全通月订**前端入口退役** ——
                与「双引擎星运特权卡」同为 $9.99/月，主公钦定去重（保留双引擎）。
                E129 后端结算能力全量留存（WealthPlan 类型/server 闸面不动）；
                全通月订权益在期者不受任何影响（WealthReportPage 整页门照常放行）。 */}

            {/* Yearly VIP (recommended) */}
            <button
              onClick={() => onPurchase('all_pass_yearly')}
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
                marginBottom: '20px',
                transition: 'all 0.3s ease',
                position: 'relative',
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
          <div style={{
            fontSize: '9px',
            color: '#555',
            marginTop: '8px',
            lineHeight: 1.4,
          }}>
            {t.usdNote}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WealthPaywall;
