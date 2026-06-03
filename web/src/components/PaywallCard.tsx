
interface PaywallCardProps {
  lang: string;
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
      priceLabel: 'one-time',
      unlock: 'Unlock Now',
      subscription: 'mo · Unlimited',
      secure: 'Secure Payment · Instant AI · Refundable',
    },
  };
  const c = t[lang === 'zh' ? 'zh' : 'en'];

  return (
    <div style={{
      width: '92%', maxWidth: '340px',
      background: 'linear-gradient(168deg, rgba(26,31,75,0.97) 0%, rgba(18,22,55,0.99) 100%)',
      borderRadius: '18px',
      padding: '28px 22px 22px',
      border: '1px solid rgba(212,175,55,0.35)',
      boxShadow: '0 0 60px rgba(212,175,55,0.10), 0 8px 32px rgba(0,0,0,0.5)',
      textAlign: 'center',
    }}>
      {/* 图标 */}
      <div style={{
        fontSize: '36px',
        marginBottom: '10px',
        filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))',
      }}>🔮</div>

      {/* 标题 */}
      <div style={{
        fontSize: '17px',
        fontWeight: 800,
        color: '#D4AF37',
        marginBottom: '6px',
        letterSpacing: '0.3px',
      }}>{c.title}</div>

      {/* 副标题 */}
      <div style={{
        fontSize: '12px',
        color: '#9a9ab0',
        marginBottom: '18px',
        lineHeight: 1.5,
      }}>{c.subtitle}</div>

      {/* 价值点 */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        {c.features.map((item, i) => (
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
        onClick={() => onPurchase('insight_once')}
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
        {c.secure.split(' · ').map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </div>
  );
};

export default PaywallCard;
