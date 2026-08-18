import AuthButton from './AuthButton';

interface AuthWallCardProps {
  lang: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
}

const AuthWallCard = ({ lang }: AuthWallCardProps) => {
  const t = {
    zh: {
      title: '登录后解锁 AI 洞察',
      subtitle: '使用 Google 或邮箱登录，即可购买 AI 深度解读',
    },
    en: {
      title: 'Sign in to Unlock AI Insight',
      subtitle: 'Continue with Google or email to purchase AI deep reading',
    },
    es: {
      title: 'Inicia sesión para desbloquear IA',
      subtitle: 'Usa Google o email para comprar lectura profunda de IA',
    },
    fr: {
      title: 'Connectez-vous pour débloquer l\'IA',
      subtitle: 'Utilisez Google ou email pour acheter une lecture IA profonde',
    },
    th: {
      title: 'เข้าสู่ระบบเพื่อปลดล็อก AI',
      subtitle: 'ใช้ Google หรืออีเมลเพื่อซื้อการวิเคราะห์ AI เชิงลึก',
    },
    vi: {
      title: 'Đăng nhập để mở khóa AI',
      subtitle: 'Sử dụng Google hoặc email để mua góc nhìn AI chuyên sâu',
    },
  };
  const c = t[lang] || t.en;

  return (
    <div style={{
      width: '94%', maxWidth: '380px',
      background: 'linear-gradient(170deg, #0e1028 0%, #0a0c1e 40%, #0D0D1A 100%)',
      borderRadius: '22px',
      padding: '36px 26px 28px',
      border: '2px solid rgba(212,175,55,0.45)',
      boxShadow: '0 0 80px rgba(129,216,208,0.06), 0 0 40px rgba(26,31,75,0.4), 0 20px 60px rgba(0,0,0,0.6)',
      textAlign: 'center',
      position: 'relative',
    }}>
      {/* 星点装饰 */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '22px', overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(1.2px 1.2px at 15% 20%, rgba(255,255,255,0.5) 50%, transparent 50%), radial-gradient(1px 1px at 45% 12%, rgba(129,216,208,0.5) 50%, transparent 50%), radial-gradient(1.5px 1.5px at 72% 35%, rgba(255,255,255,0.4) 50%, transparent 50%), radial-gradient(1px 1px at 88% 58%, rgba(212,175,55,0.4) 50%, transparent 50%), radial-gradient(1.2px 1.2px at 25% 65%, rgba(129,216,208,0.35) 50%, transparent 50%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 水晶球图标 */}
        <div style={{
          width: '72px', height: '72px', margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 38%, rgba(129,216,208,0.35) 0%, rgba(26,31,75,0.6) 45%, rgba(13,13,26,0.9) 100%)',
          border: '1.5px solid rgba(129,216,208,0.25)',
          boxShadow: '0 0 30px rgba(129,216,208,0.2), 0 0 60px rgba(129,216,208,0.08), inset 0 0 20px rgba(129,216,208,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '32px',
        }}>✨</div>
        {/* 标题 — 薄荷渐变 */}
        <div style={{
          fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', marginBottom: '6px',
          background: 'linear-gradient(135deg, #81D8D0 0%, #2ECBF7 50%, #81D8D0 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 0 20px rgba(129,216,208,0.3))',
        }}>
          {c.title}
        </div>
        {/* 副标题 — 紫色 */}
        <div style={{
          fontSize: '13px', color: '#a855f7', fontWeight: 500,
          marginBottom: '24px', lineHeight: 1.6,
          textShadow: '0 1px 16px rgba(124,58,237,0.25)',
        }}>
          {c.subtitle}
        </div>
        <AuthButton lang={lang} />
      </div>
    </div>
  );
};

export default AuthWallCard;
