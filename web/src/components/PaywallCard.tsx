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
        '🔥 Dòng chảy Năng lượng Cảm xúc',
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
      background: 'linear-gradient(170deg, #0e1028 0%, #0a0c1e 40%, #0D0D1A 100%)',
      borderRadius: '22px',
      padding: '28px 22px 14px',
      border: '2px solid rgba(212,175,55,0.45)',
      boxShadow: '0 0 80px rgba(129,216,208,0.06), 0 0 40px rgba(26,31,75,0.4), 0 20px 60px rgba(0,0,0,0.6)',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* 星点装饰 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '22px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        background: [
          'radial-gradient(1.2px 1.2px at 15% 20%, rgba(255,255,255,0.5) 50%, transparent 50%)',
          'radial-gradient(1px 1px at 45% 12%, rgba(129,216,208,0.5) 50%, transparent 50%)',
          'radial-gradient(1.5px 1.5px at 72% 35%, rgba(255,255,255,0.4) 50%, transparent 50%)',
          'radial-gradient(1px 1px at 88% 58%, rgba(212,175,55,0.4) 50%, transparent 50%)',
          'radial-gradient(1.2px 1.2px at 25% 65%, rgba(129,216,208,0.35) 50%, transparent 50%)',
          'radial-gradient(1px 1px at 55% 82%, rgba(255,255,255,0.3) 50%, transparent 50%)',
          'radial-gradient(1.3px 1.3px at 8% 88%, rgba(212,175,55,0.3) 50%, transparent 50%)',
          'radial-gradient(1px 1px at 92% 18%, rgba(129,216,208,0.3) 50%, transparent 50%)',
        ].join(', '),
      }} />

      {/* 内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* 水晶球图标 — 移到外层，这里不再渲染 */}

      {/* 标题 — 薄荷→青蓝渐变 */}
      <div style={{
        fontSize: '18px',
        fontWeight: 800,
        letterSpacing: '-0.3px',
        marginBottom: '2px',
        background: 'linear-gradient(135deg, #81D8D0 0%, #2ECBF7 50%, #81D8D0 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 20px rgba(129,216,208,0.3))',
      }}>{c.title}</div>

      {/* 副标题 — 紫色 */}
      <div style={{
        fontSize: '12px',
        color: '#a855f7',
        fontWeight: 500,
        marginBottom: '16px',
        lineHeight: 1.6,
        textShadow: '0 1px 16px rgba(124,58,237,0.25)',
      }}>{c.subtitle}</div>

      {/* 限时加赠 — 金色边框，等比缩小 */}
      <div style={{
        marginBottom: '14px',
        padding: '6px 10px',
        background: 'rgba(212,175,55,0.04)',
        borderRadius: '12px',
        border: '1px solid rgba(212,175,55,0.45)',
      }}>
        <div style={{ fontSize: '10px', color: '#D4AF37', fontWeight: 700, marginBottom: '2px', letterSpacing: '0.5px' }}>
          ✨ {c.bonus}
        </div>
        <div style={{ fontSize: '12px', color: '#e0e0f0', fontWeight: 600, marginBottom: '1px' }}>
          {c.bonusDesc}
        </div>
        <div style={{ fontSize: '10px', color: '#8888aa', lineHeight: 1.5 }}>
          {c.bonusDetail}
        </div>
      </div>

      {/* 价值点 — 薄荷绿发光点 */}
      <div style={{ textAlign: 'left', marginBottom: '16px' }}>
        {c.features.map((item: string, i: number) => (
          <div key={i} style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.82)',
            fontWeight: 500,
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#81D8D0', flexShrink: 0,
              boxShadow: '0 0 8px rgba(129,216,208,0.4)',
            }} />
            {item}
          </div>
        ))}
      </div>

      {/* 价格 */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
        <span style={{
          fontSize: '32px',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-1px',
        }}>$4.99</span>
        <span style={{ fontSize: '12px', color: '#8888aa' }}>{c.priceLabel}</span>
      </div>

      {/* 主按钮 — 薄荷→青蓝 */}
      <button
        onClick={() => { console.log('[KindredSouls Debug] PaywallCard button clicked, loading:', loading); onPurchase('insight_once'); }}
        onMouseDown={() => console.log('[KindredSouls Debug] PaywallCard mousedown')}
        onTouchStart={() => console.log('[KindredSouls Debug] PaywallCard touchstart')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '13px 24px',
          borderRadius: '14px',
          border: 'none',
          background: loading
            ? '#444'
            : 'linear-gradient(135deg, #2ECBF7 0%, #81D8D0 100%)',
          color: '#0D0D1A',
          fontSize: '16px',
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px',
          transition: 'all 0.25s ease',
          boxShadow: loading ? 'none' : '0 4px 24px rgba(129,216,208,0.35), 0 0 60px rgba(46,203,247,0.1)',
          letterSpacing: '0.3px',
        }}
        onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.transform = 'translateY(0)'; }}
      >
        {loading ? '⏳ ...' : `✨ ${c.unlock}`}
      </button>

      {/* 订阅按钮 — 金色边框 */}
      <button
        onClick={() => onPurchase('monthly')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(212,175,55,0.4)',
          background: 'rgba(212,175,55,0.05)',
          color: '#D4AF37',
          fontSize: '13px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          marginBottom: '12px',
        }}
      >
        💎 $4.99/{c.subscription}
      </button>

      {/* 信任标识 — 提亮与bonusDetail同色 */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.6)',
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        letterSpacing: '0.3px',
        marginTop: '2px',
      }}>
        {c.secure.split(' · ').map((s: string, i: number) => (
          <span key={i}>{s}</span>
        ))}
      </div>

      </div>{/* end content layer */}
    </div>
  );
};

export default PaywallCard;
