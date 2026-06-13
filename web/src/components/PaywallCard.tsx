
interface PaywallCardProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  loading: boolean;
  onPurchase: (plan: string) => void;
}

const PaywallCard = ({ lang, loading, onPurchase }: PaywallCardProps) => {
  const t = {
    zh: {
      title: '解锁你们的灵魂密码',
      subtitle: 'AI 将为你揭示这段关系中被隐藏的真相',
      features: [
        '🌑 灵魂共鸣深度分析',
        '🔥 情感能量流动图谱',
        '🌟 未来6个月关系走向',
        '💫 专属提升建议（3条）',
      ],
      bonus: '🎁 今日限时加赠',
      bonusDesc: '额外解锁【实时塔罗牌阵】',
      bonusDetail: '看透TA此时此刻对你的真实想法',
      priceLabel: '单次',
      unlock: '立即解锁',
      subscription: '月 · 无限次解读',
      secure: '安全支付 · 即时生成 · 支持退款',
    },
    en: {
      title: 'Unlock Your Soul Code',
      subtitle: 'AI reveals the hidden truths of your connection',
      features: [
        '🌑 Soul Resonance Deep Dive',
        '🔥 Emotional Energy Flow Map',
        '🌟 Next 6 Months Trajectory',
        '💫 3 Personalized Growth Tips',
      ],
      bonus: '🎁 Limited Time Bonus',
      bonusDesc: 'Unlock Real-Time Tarot Reading',
      bonusDetail: 'See what they truly think about you now',
      priceLabel: 'one-time',
      unlock: 'Unlock Now',
      subscription: 'mo · Unlimited',
      secure: 'Secure Payment · Instant AI · Refundable',
    },
    es: {
      title: 'Desbloquea Tu Código Alma',
      subtitle: 'La IA revela las verdades ocultas de su conexión',
      features: [
        '🌑 Análisis Profundo de Resonancia Alma',
        '🔥 Mapa de Flujo de Energía Emocional',
        '🌟 Trayectoria de los Próximos 6 Meses',
        '💫 3 Consejos de Crecimiento Personalizados',
      ],
      bonus: '🎁 Bonus por Tiempo Limitado',
      bonusDesc: 'Desbloquea Lectura de Tarot en Tiempo Real',
      bonusDetail: 'Descubre qué piensan realmente de ti ahora',
      priceLabel: 'una vez',
      unlock: 'Desbloquear Ahora',
      subscription: 'mes · Ilimitado',
      secure: 'Pago Seguro · IA Instantánea · Reembolsable',
    },
    fr: {
      title: 'Débloquez Votre Code Âme',
      subtitle: "L'IA révèle les vérités cachées de votre connexion",
      features: [
        '🌑 Analyse Profonde de Résonance Âme',
        '🔥 Carte du Flux d\'Énergie Émotionnelle',
        '🌟 Trajectoire des 6 Prochains Mois',
        '💫 3 Conseils de Croissance Personnalisés',
      ],
      bonus: '🎁 Bonus à Durée Limitée',
      bonusDesc: 'Débloquez la Lecture de Tarot en Temps Réel',
      bonusDetail: 'Découvrez ce qu\'ils pensent vraiment de vous maintenant',
      priceLabel: 'une fois',
      unlock: 'Débloquer Maintenant',
      subscription: 'mois · Illimité',
      secure: 'Paiement Sécurisé · IA Instantanée · Remboursable',
    },
    th: {
      title: 'ปลดล็อกรหัสวิญญาณของคุณ',
      subtitle: 'AI จะเปิดเผยความจริงที่ซ่อนอยู่ในความสัมพันธ์นี้',
      features: [
        '🌑 วิเคราะห์จิตวิญญาณเชิงลึก',
        '🔥 แผนผังพลังงานอารมณ์',
        '🌟 แนวทาง 6 เดือนข้างหน้า',
        '💫 3 คำแนะนำการเติบโตส่วนบุคคล',
      ],
      bonus: '🎁 ของแถมจำกัดเวลา',
      bonusDesc: 'ปลดล็อกการอ่านไพ่ทาโรต์แบบเรียลไทม์',
      bonusDetail: 'ดูสิ่งที่พวกเขาคิดเกี่ยวกับคุณตอนนี้',
      priceLabel: 'ครั้งเดียว',
      unlock: 'ปลดล็อกเลย',
      subscription: 'เดือน · ไม่จำกัด',
      secure: 'ชำระเงินปลอดภัย · AI ทันที · คืนเงินได้',
    },
    vi: {
      title: 'Mở khóa Mật mã Linh hồn',
      subtitle: 'AI sẽ tiết lộ những sự thật ẩn giấu trong mối quan hệ này',
      features: [
        '🌑 Phân tích Cộng hưởng Linh hồn Sâu',
        '🔥 Bản đồ Dòng chảy Năng lượng Cảm xúc',
        '🌟 Quỹ đạo 6 Tháng tới',
        '💫 3 Lời khuyên Phát triển Cá nhân hóa',
      ],
      bonus: '🎁 Quà tặng Thời hạn',
      bonusDesc: 'Mở khóa Góc nhìn Tarot Thời gian thực',
      bonusDetail: 'Xem họ thực sự nghĩ gì về bạn ngay bây giờ',
      priceLabel: 'lần dùng',
      unlock: 'Mở khóa ngay',
      subscription: 'tháng · Không giới hạn',
      secure: 'Thanh toán An toàn · AI Tức thì · Hoàn tiền được',
    },
  };
  const c = t[lang as keyof typeof t] || t.en;

  return (
    <div style={{
      width: '94%', maxWidth: '380px',
      background: 'linear-gradient(168deg, rgba(26,31,75,0.97) 0%, rgba(18,22,55,0.99) 100%)',
      borderRadius: '20px',
      padding: '32px 24px 24px',
      border: '1px solid rgba(212,175,55,0.4)',
      boxShadow: '0 0 60px rgba(212,175,55,0.15), 0 12px 40px rgba(0,0,0,0.5)',
      textAlign: 'center',
    }}>
      {/* 图标 */}
      <div style={{
        fontSize: '42px',
        marginBottom: '12px',
        filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.6))',
      }}>🔮</div>

      {/* 标题 */}
      <div style={{
        fontSize: '19px',
        fontWeight: 800,
        color: '#D4AF37',
        marginBottom: '8px',
        letterSpacing: '0.3px',
      }}>{c.title}</div>

      {/* 副标题 */}
      <div style={{
        fontSize: '13px',
        color: '#a0a0c0',
        marginBottom: '22px',
        lineHeight: 1.6,
      }}>{c.subtitle}</div>

      {/* 限时加赠 */}
      <div style={{
        marginBottom: '16px',
        padding: '10px 14px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(240,208,96,0.04) 100%)',
        borderRadius: '10px',
        border: '1px solid rgba(212,175,55,0.25)',
      }}>
        <div style={{ fontSize: '11px', color: '#D4AF37', fontWeight: 700, marginBottom: '4px' }}>
          ✨ {c.bonus}
        </div>
        <div style={{ fontSize: '12.5px', color: '#e0e0f0', fontWeight: 600, marginBottom: '2px' }}>
          {c.bonusDesc}
        </div>
        <div style={{ fontSize: '11px', color: '#8888aa', lineHeight: 1.5 }}>
          {c.bonusDetail}
        </div>
      </div>

      {/* 价值点 */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        {c.features.map((item: string, i: number) => (
          <div key={i} style={{
            fontSize: '12.5px',
            color: '#c8c8e0',
            padding: '5px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ color: '#D4AF37', fontSize: '11px' }}>✦</span>
            {item}
          </div>
        ))}
      </div>

      {/* 价格 */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.5px',
        }}>$4.99</span>
        <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>{c.priceLabel}</span>
      </div>

      {/* 主按钮 */}
      <button
        onClick={() => { console.log('[KindredSouls Debug] PaywallCard button clicked, loading:', loading); onPurchase('insight_once'); }}
        onMouseDown={() => console.log('[KindredSouls Debug] PaywallCard mousedown')}
        onTouchStart={() => console.log('[KindredSouls Debug] PaywallCard touchstart')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: '12px',
          border: 'none',
          background: loading
            ? '#444'
            : 'linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #D4AF37 100%)',
          color: '#1a1a2e',
          fontSize: '15px',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px',
          transition: 'all 0.25s ease',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(212,175,55,0.35)',
        }}
        onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        {loading ? '⏳ ...' : `✨ ${c.unlock}`}
      </button>

      {/* 订阅按钮 */}
      <button
        onClick={() => onPurchase('monthly')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px 20px',
          borderRadius: '10px',
          border: '1px solid rgba(212,175,55,0.3)',
          background: 'transparent',
          color: '#D4AF37',
          fontSize: '13px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
        }}
      >
        💎 $4.99/{c.subscription}
      </button>

      {/* 信任标识 */}
      <div style={{
        fontSize: '10px',
        color: '#666',
        marginTop: '14px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
      }}>
        {c.secure.split(' · ').map((s: string, i: number) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  );
};

export default PaywallCard;