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
      width: '92%', maxWidth: '340px',
      background: 'linear-gradient(168deg, rgba(26,31,75,0.97) 0%, rgba(18,22,55,0.99) 100%)',
      borderRadius: '18px',
      padding: '28px 22px 22px',
      border: '1px solid rgba(212,175,55,0.35)',
      boxShadow: '0 0 40px rgba(212,175,55,0.12), 0 8px 32px rgba(0,0,0,0.4)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '36px', marginBottom: '10px', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.5))' }}>✨</div>
      <div style={{ fontSize: '16px', fontWeight: 800, color: '#D4AF37', marginBottom: '6px' }}>
        {c.title}
      </div>
      <div style={{ fontSize: '12px', color: '#9a9ab0', marginBottom: '20px', lineHeight: 1.5 }}>
        {c.subtitle}
      </div>
      <AuthButton lang={lang} />
    </div>
  );
};

export default AuthWallCard;
