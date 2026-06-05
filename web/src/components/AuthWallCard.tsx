import AuthButton from './AuthButton';

interface AuthWallCardProps {
  lang: string;
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
  };
  const c = t[lang === 'zh' ? 'zh' : 'en'];

  return (
    <div style={{
      width: '94%', maxWidth: '380px',
      background: 'linear-gradient(168deg, rgba(26,31,75,0.97) 0%, rgba(18,22,55,0.99) 100%)',
      borderRadius: '20px',
      padding: '32px 24px 24px',
      border: '1px solid rgba(212,175,55,0.4)',
      boxShadow: '0 0 50px rgba(212,175,55,0.15), 0 12px 40px rgba(0,0,0,0.5)',
      textAlign: 'center',
    }}>
      {/* 星星装饰 */}
      <div style={{ fontSize: '42px', marginBottom: '12px', filter: 'drop-shadow(0 0 16px rgba(212,175,55,0.6))' }}>✨</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: '#D4AF37', marginBottom: '8px', letterSpacing: '0.3px' }}>
        {c.title}
      </div>
      <div style={{ fontSize: '13px', color: '#a0a0c0', marginBottom: '24px', lineHeight: 1.6 }}>
        {c.subtitle}
      </div>
      <AuthButton lang={lang} />
    </div>
  );
};

export default AuthWallCard;
