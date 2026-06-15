import { supabase } from '../lib/supabase';
import { useState } from 'react';


// Deterministic tarot card from birthdays + today
function useTarot(d1: string, d2: string, lang: string = 'en') {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const sorted = [d1, d2].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const cardId = Math.abs(hash) % 22;
  const reversed = Math.floor(Math.abs(hash) / 22) % 2 === 1;
  type L = Record<string,string>;
  const cards: { name: L; meaning: L }[] = [
    {name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Fou',th:'คนโง่ประหลาด',vi:'Chàng Khờ'}, meaning:{zh:'踏上未知旅程的勇气，新可能的开启',en:'The courage to embark on an unknown journey — new possibilities await.',es:'El valor para emprender un viaje desconocido — nuevas posibilidades le esperan.',fr:'Le courage de partir vers l\'inconnu — de nouvelles possibilités vous attendent.',th:'ความกล้าที่จะเริ่มต้นการเดินทางแห่งความลึกลับ — โอกาสใหม่รอคุณอยู่',vi:'Can đảm bước vào hành trình chưa biết — những khả năng mới đang chờ.'}},
    {name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'นักมายกล',vi:'Nhà Ảo Thuật'}, meaning:{zh:'创造显化，意志与行动力的觉醒',en:'Manifestation and creation — willpower awakened into action.',es:'Manifestación y creación — la fuerza de voluntad se despierta en acción.',fr:'Manifestation et création — la volonté s\'éveille en action.',th:'การสร้างสรรค์และการแสดงออก — พลังจิตตื่นขึ้นสู่การลงมือ',vi:'Hiện thực hóa và sáng tạo — ý chí thức tỉnh thành hành động.'}},
    {name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'นางพราหมณี',vi:'Nữ Đại Tư Tế'}, meaning:{zh:'直觉与秘密，等待揭晓的答案',en:'Intuition and mystery — the answer waits to be revealed.',es:'Intuición y misterio — la respuesta espera ser revelada.',fr:'Intuition et mystère — la réponse attend d\'être révélée.',th:'สัญชาตญาณและความลับ — คำตอบรอให้ถูกเปิดเผย',vi:'Trực giác và bí ẩn — câu trả lời đang chờ được bật mí.'}},
    {name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'จักรพรรดินี',vi:'Nữ Hoàng'}, meaning:{zh:'丰盛与滋养，爱的温柔绽放',en:'Abundance and nurturing — love blooms gently.',es:'Abundancia y cuidado — el amor florece suavemente.',fr:'Abondance et tendresse — l\'amour fleurit doucement.',th:'ความอุดมสมบูรณ์และการเอื้ออาทร — ความรักเบ่งบานอย่างอ่อนโยน',vi:'Phồn vinh và nâng dưỡng — tình yêu nở rộ nhẹ nhàng.'}},
    {name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'จักรพรรดิ',vi:'Hoàng Đế'}, meaning:{zh:'秩序与守护，稳稳托住的力量',en:'Order and protection — a steady, grounding force.',es:'Orden y protección — una fuerza firme y estable.',fr:'Ordre et protection — une force stable et rassurante.',th:'ความเป็นระเบียบและการปกป้อง — พลังที่มั่นคง',vi:'Trật tự và bảo vệ — một sức mạnh vững chãi.'}},
    {name:{zh:'教皇',en:'The Hierophant',es:'El Sumo Sacerdote',fr:'Le Pape',th:'ประมุขสงฆ์',vi:'Giáo Hoàng'}, meaning:{zh:'指引与信念，灵魂层面的契合',en:'Guidance and faith — souls aligned on a deeper level.',es:'Guía y fe — las almas se alinean en un nivel más profundo.',fr:'Guidance et foi — les âmes s\'alignent au plus profond.',th:'การชี้นำและความศรัทธา — วิญญาณเชื่อมโยงกันในระดับลึก',vi:'Dẫn dắt và niềm tin — tâm hồn kết nối ở tầng sâu hơn.'}},
    {name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'คู่รัก',vi:'Tình Nhân'}, meaning:{zh:'抉择与诱惑，关系来到十字路口',en:'A crossroads of choice — your relationship faces a pivotal decision.',es:'Una encrucijada de elección — su relación enfrenta una decisión crucial.',fr:'Un carrefour de choix — votre relation fait face à une décision cruciale.',th:'ทางแยกแห่งการเลือก — ความสัมพันธ์ของคุณเผชิญการตัดสินใจสำคัญ',vi:'Ngã tư của sự lựa chọn — mối quan hệ đối mặt với quyết định quan trọng.'}},
    {name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'รถศึก',vi:'Cỗ Xe Chiến Thắng'}, meaning:{zh:'意志与征服，携手跨越障碍',en:'Willpower and triumph — overcoming obstacles together.',es:'Fuerza de voluntad y triunfo — superando obstáculos juntos.',fr:'Volonté et triomphe — surmonter les obstacles ensemble.',th:'พลังจิตและชัยชนะ — เอาชนะอุปสรรคไปด้วยกัน',vi:'Ý chí và thắng lợi — vượt qua chướng ngại cùng nhau.'}},
    {name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'พละกำลัง',vi:'Sức Mạnh'}, meaning:{zh:'内在勇气，柔韧却不可战胜',en:'Inner courage — gentle yet invincible.',es:'Coraje interior — suave pero invencible.',fr:'Courage intérieur — doux mais invincible.',th:'ความกล้าภายใน — อ่อนโยนแต่ไร้พ่าย',vi:'Can đảm bên trong — dịu dàng nhưng bất khả chiến bại.'}},
    {name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'นักบวชเรี่ยมใจ',vi:'Ẩn Sĩ'}, meaning:{zh:'独处与内观，答案在内心深处',en:'Solitude and introspection — the answer lies within.',es:'Soledad e introspección — la respuesta está dentro.',fr:'Solitude et introspection — la réponse est en vous.',th:'ความเงียบและการสำรวจภายใน — คำตอบอยู่ในใจ',vi:'Cô đơn và nội quan — câu trả lời nằm ở sâu bên trong.'}},
    {name:{zh:'命运之轮',en:'Wheel of Fortune',es:'Rueda de la Fortuna',fr:'Roue de Fortune',th:'วงล้อแห่งโชคชะตา',vi:'Bánh Xe Số Phận'}, meaning:{zh:'转变与循环，命运正在转动',en:'Transformation and cycles — destiny is turning in your favor.',es:'Transformación y ciclos — el destino gira a su favor.',fr:'Transformation et cycles — le destin tourne en votre faveur.',th:'การเปลี่ยนแปลงและวัฏจักร — โชคชะตากำลังหมุนเข้ามา',vi:'Biến đổi và chu kỳ — vận mệnh đang xoay chuyển đến với bạn.'}},
    {name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'ความยุติธรรม',vi:'Công Lý'}, meaning:{zh:'因果与平衡，宇宙在精准回应',en:'Cause and balance — the universe responds with precision.',es:'Causa y equilibrio — el universo responde con precisión.',fr:'Cause et équilibre — l\'univers répond avec précision.',th:'เหตุและสมดุล — จักรวาลตอบสนองอย่างแม่นยำ',vi:'Nhân quả và cân bằng — vũ trụ đáp trả chính xác.'}},
    {name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'คนแขวนหัว',vi:'Kẻ Treo Ngược'}, meaning:{zh:'放下与臣服，另一种视角的智慧',en:'Surrender and release — wisdom from a different perspective.',es:'Rendición y liberación — sabiduría desde otra perspectiva.',fr:'Lâcher-prise et abandon — sagesse d\'une autre perspective.',th:'การยอมแพ้และการปล่อยวาง — ภูมิปัญญาจากมุมมองอื่น',vi:'Buông bỏ và đầu hàng — sự khôn ngoan từ góc nhìn khác.'}},
    {name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เจ้าแห่งความตาย',vi:'Cái Chết'}, meaning:{zh:'结束与蜕变，旧篇章的翻页',en:'Endings and transformation — a new chapter begins.',es:'Finales y transformación — un nuevo capítulo comienza.',fr:'Fins et transformation — un nouveau chapitre commence.',th:'จุดจบและการเปลี่ยนแปลง — บทใหม่เริ่มต้น',vi:'Kết thúc và hoán chuyển — một chương mới bắt đầu.'}},
    {name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'Tempérance',th:'ความสมดุล',vi:'Chừng Mực'}, meaning:{zh:'平衡与调和，在两极间找到节奏',en:'Balance and harmony — finding rhythm between opposites.',es:'Equilibrio y armonía — encontrando ritmo entre opuestos.',fr:'Équilibre et harmonie — trouver le rythme entre les contraires.',th:'สมดุลและความสามัคคี — หาจังหวะระหว่างสองขั้ว',vi:'Cân bằng và hài hòa — tìm thấy nhịp điệu giữa hai thái cực.'}},
    {name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ปีศาจ',vi:'Ác Quỷ'}, meaning:{zh:'束缚与执念，看见阴影才能超越',en:'Bondage and attachment — face the shadow to transcend it.',es:'Atadura y apego — enfrente la sombra para trascenderla.',fr:'Attachement et obsession — affrontez l\'ombre pour la transcender.',th:'พันธนะและความยึดติด — เผชิญหน้ากับเงาเพื่อเลยล้ำ',vi:'Trói buộc và chấp niệm — đối mặt với bóng tối để vượt lên.'}},
    {name:{zh:'塔',en:'The Tower',es:'La Torre',fr:'La Tour',th:'หอคอย',vi:'Tháp'}, meaning:{zh:'突变的觉醒，打碎幻象见真相',en:'Sudden awakening — illusions shatter to reveal truth.',es:'Despertar repentino — las ilusiones se rompen para revelar la verdad.',fr:'Éveil soudain — les illusions se brisent pour révéler la vérité.',th:'การตื่นรู้ทันใด — ภาพลวงแตกสลายเปิดเผยความจริง',vi:'Tỉnh giác đột ngột — ảo ảnh vỡ tan để lộ ra sự thật.'}},
    {name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ดาว',vi:'Ngôi Sao'}, meaning:{zh:'希望与灵感，宇宙的疗愈之光',en:'Hope and inspiration — cosmic healing light guides you.',es:'Esperanza e inspiración — la luz cósmica de sanación te guía.',fr:'Espoir et inspiration — la lumière de guérison cosmique vous guide.',th:'ความหวังและแรงบันดาลใจ — แสงรักษาจากจักรวาลนำทางคุณ',vi:'Hy vọng và cảm hứng — ánh sáng chữa lành vũ trụ dẫn đường cho bạn.'}},
    {name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ดวงจันทร์',vi:'Mặt Trăng'}, meaning:{zh:'幻象与恐惧，直面内心深处的不安',en:'Illusion and fear — confront the unease within.',es:'Ilusión y miedo — enfrente la inquietud interior.',fr:'Illusion et peur — affrontez l\'inquiétude intérieure.',th:'ภาพลวงและความกลัว — เผชิญหน้ากับความไม่สบายใจภายใน',vi:'Ảo ảnh và nỗi sợ — đối diện với bất an sâu thẳm bên trong.'}},
    {name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ดวงอาทิตย์',vi:'Mặt Trời'}, meaning:{zh:'喜悦与成功，生命力全面绽放',en:'Joy and success — vitality in full bloom.',es:'Alegría y éxito — vitalidad en plena floración.',fr:'Joie et succès — vitalité en pleine floraison.',th:'ความสุขและความสำเร็จ — พลังชีวิตเบ่งบานอย่างเต็มที่',vi:'Vui sướng và thành công — sức sống nở rộ trọn vẹn.'}},
    {name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'การพิพากษา',vi:'Phán Xét'}, meaning:{zh:'重生与宽恕，灵魂被唤醒',en:'Rebirth and forgiveness — your soul is being called.',es:'Renacimiento y perdón — tu alma está siendo llamada.',fr:'Renaissance et pardon — votre âme est appelée.',th:'การเกิดใหม่และการอภัย — วิญญาณของคุณถูกเรียก',vi:'Tái sinh và tha thứ — tâm hồn bạn đang được gọi.'}},
    {name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'โลก',vi:'Thế Giới'}, meaning:{zh:'完成与圆满，达成内在的和谐',en:'Completion and fulfillment — inner harmony achieved.',es:'Completitud y plenitud — armonía interior lograda.',fr:'Accomplissement et plénitude — harmonie intérieure atteinte.',th:'ความสมบูรณ์และความเต็มเปี่ยม — ความสามัคคีภายในบรรลุ',vi:'Hoàn thành và viên mãn — hài hòa bên trong đã đạt được.'}},
  ];
  const card = cards[cardId] || cards[0];
  const L = lang;
  const orient: Record<string,string> = {
    zh: reversed ? '（逆位）' : '',
    en: reversed ? ' (Reversed)' : '',
    es: reversed ? ' (Invertido)' : '',
    fr: reversed ? ' (Inversé)' : '',
    th: reversed ? ' (กลับด้าน)' : '',
    vi: reversed ? ' (Ngược)' : '',
  };
  return {
    name: card.name[L] || card.name.en,
    meaning: card.meaning[L] || card.meaning.en,
    orientation: orient[L] || orient.en
  };
}

interface AuthButtonProps {
  onAuthSuccess?: () => void;
  lang?: 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  dob1?: string;
  dob2?: string;
}

const i18n: Record<string, Record<string, string>> = {
  en: {
    signIn: 'Sign In to Unlock',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    facebook: 'Continue with Facebook',
    tiktok: 'Continue with TikTok',
    email: 'Continue with Email',
    emailPlaceholder: 'your@email.com',
    sendMagicLink: 'Send Magic Link',
    sending: 'Sending...',
    checkEmail: 'Check your inbox! ✨',
  },
  zh: {
    signIn: '登录解锁',
    google: '使用 Google 登录',
    apple: '使用 Apple 登录',
    facebook: '使用 Facebook 登录',
    tiktok: '使用 TikTok 登录',
    email: '使用邮箱登录',
    emailPlaceholder: '你的邮箱地址',
    sendMagicLink: '发送魔法链接',
    sending: '发送中...',
    checkEmail: '请查收邮箱！✨',

    },
    es: {
      signIn: 'Iniciar sesión para desbloquear',
      google: 'Continuar con Google',
      apple: 'Continuar con Apple',
      facebook: 'Continuar con Facebook',
      tiktok: 'Continuar con TikTok',
      email: 'Continuar con Email',
      emailPlaceholder: 'tu@email.com',
      sendMagicLink: 'Enviar Magic Link',
      sending: 'Enviando...',
      checkEmail: '¡Revisa tu bandeja! ✨',
    },
    fr: {
      signIn: 'Connectez-vous pour débloquer',
      google: 'Continuer avec Google',
      apple: 'Continuer avec Apple',
      facebook: 'Continuer avec Facebook',
      tiktok: 'Continuer avec TikTok',
      email: 'Continuer avec Email',
      emailPlaceholder: 'votre@email.com',
      sendMagicLink: 'Envoyer Magic Link',
      sending: 'Envoi en cours...',
      checkEmail: 'Vérifiez votre boîte! ✨',
    },
    th: {
      signIn: 'เข้าสู่ระบบเพื่อปลดล็อก',
      google: 'ทำต่อกับ Google',
      apple: 'ทำต่อกับ Apple',
      facebook: 'ทำต่อกับ Facebook',
      tiktok: 'ทำต่อกับ TikTok',
      email: 'ทำต่อกับอีเมล',
      emailPlaceholder: 'อีเมล@ของคุณ.com',
      sendMagicLink: 'ส่ง Magic Link',
      sending: 'กำลังส่ง...',
      checkEmail: 'เช็คอีเมลของคุณ! ✨',
    },
    vi: {
      signIn: 'Đăng nhập để mở khóa',
      google: 'Tiếp tục với Google',
      apple: 'Tiếp tục với Apple',
      facebook: 'Tiếp tục với Facebook',
      tiktok: 'Tiếp tục với TikTok',
      email: 'Tiếp tục với Email',
      emailPlaceholder: 'email@cua.ban.com',
      sendMagicLink: 'Gửi Magic Link',
      sending: 'Đang gửi...',
      checkEmail: 'Kiểm tra hộp thư! ✨',
    },
  };

// SVG icons for OAuth providers
const googleIcon = <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;

const appleIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.53-3.22 0-1.44.65-2.2.46-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.53-3.74 4.25z"/></svg>;

const facebookIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

const tiktokIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.15a8.16 8.16 0 005.58 2.17v-3.4a4.85 4.85 0 01-4-.11v-.01z"/></svg>;

interface OAuthBtnProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading: boolean;
  dark?: boolean;
}

function OAuthButton({ icon, label, onClick, loading, dark }: OAuthBtnProps) {
  return (
    <button
      onClick={onClick}
      onTouchStart={(e) => { e.preventDefault(); onClick(); }}
      disabled={loading}
      style={{
        padding: '14px 10px',
        borderRadius: '12px',
        border: dark ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.15)',
        background: loading ? '#333' : (dark ? '#1a1a1a' : 'rgba(255,255,255,0.08)'),
        color: loading ? '#666' : '#fff',
        fontSize: '13px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.25s',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        backdropFilter: 'blur(10px)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function AuthButton({ onAuthSuccess: _onAuthSuccess, lang = 'en', dob1, dob2 }: AuthButtonProps) {
  const resultData = (() => {
    try {
      const raw = localStorage.getItem('ks_result_data');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  const d1 = dob1 || (resultData ? resultData.dob1 : '') || '';
  const d2 = dob2 || (resultData ? resultData.dob2 : '') || '';
  const tarot = (d1 && d2) ? useTarot(d1, d2, lang) : null;

  const t = i18n[lang] || i18n.en;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState('');

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'facebook' | 'tiktok') => {
    console.log('[KindredSouls Debug] OAuth login button CLICKED:', provider);
    setLoading(true);
    setError('');
    try {
      const redirectUrl = window.location.origin + '/result?intent=checkout';
      localStorage.setItem('ks_redirect_after_login', redirectUrl);
      localStorage.setItem('ks_return_to_result', 'true');
      console.log('[KindredSouls Debug] OAuth redirectTo:', redirectUrl, 'provider:', provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[KindredSouls Debug] OAuth login ERROR:', provider, err);
      setError(err.message || `${provider} login failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      // 🎯 军师方案：把购买意图挂在 URL 参数里
      const redirectUrl = window.location.origin + '/result?intent=checkout';
      console.log('[KindredSouls Debug] Email login redirectTo (with intent):', redirectUrl);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Email login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-paywall" style={{
      background: 'rgba(20, 25, 60, 0.98)',
      borderRadius: '16px',
      padding: '28px 24px',
      textAlign: 'center',
      backdropFilter: 'blur(20px)',
      border: '2px solid rgba(212,175,55,0.5)',
      maxWidth: '380px',
      margin: '20px auto',
      boxShadow: '0 8px 32px rgba(212,175,55,0.15), 0 0 60px rgba(212,175,55,0.08)',
    }}>
      {tarot && (
        <div style={{
          marginBottom: '16px',
          padding: '14px 12px',
          background: 'rgba(75,45,115,0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(212,175,55,0.3)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#D4AF37', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>
            🔮 {(lang === 'zh' ? '今日塔罗指引' : lang === 'es' ? 'Guía del Día' : lang === 'fr' ? "Guide d'Aujourd'hui" : lang === 'th' ? 'แนวทางไพ่ทาโรต์วันนี้' : lang === 'vi' ? 'Hướng dẫn Tarot hôm nay' : "Today's Tarot Guidance")}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {tarot.name}
          </div>
          <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.5 }}>
            {tarot.meaning}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
            {(lang === 'zh' ? '→ 登录解锁完整AI情感解读' : lang === 'es' ? '→ Inicia sesión para desbloquear' : lang === 'fr' ? '→ Connectez-vous pour débloquer' : lang === 'th' ? '→ เข้าสู่ระบบเพื่อปลดล็อก' : lang === 'vi' ? '→ Đăng nhập để mở khóa' : '→ Sign in to unlock full AI insight')}
          </div>
        </div>
      )}

      <div style={{ fontSize: '20px', fontWeight: 800, color: '#D4AF37', marginBottom: '6px', textShadow: '0 0 20px rgba(212,175,55,0.4)' }}>
        🔮 {t.signIn}
      </div>
      <div style={{ fontSize: '14px', color: '#bbb', marginBottom: '20px', lineHeight: 1.5 }}>
        {lang === 'zh' 
          ? '解锁 AI 洞察 · 获取专属情感解读' 
          : 'Unlock AI Insight · Get Your Personalized Reading'}
      </div>

      {error && (
        <div style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Social Login Buttons - 2x2 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '12px',
      }}>
        {/* Apple */}
        <OAuthButton icon={appleIcon} label={t.apple} onClick={() => handleOAuthLogin('apple')} loading={loading} dark />
        {/* Google */}
        <OAuthButton icon={googleIcon} label={t.google} onClick={() => handleOAuthLogin('google')} loading={loading} />
        {/* Facebook */}
        <OAuthButton icon={facebookIcon} label={t.facebook} onClick={() => handleOAuthLogin('facebook')} loading={loading} />
        {/* TikTok */}
        <OAuthButton icon={tiktokIcon} label={t.tiktok} onClick={() => handleOAuthLogin('tiktok')} loading={loading} />
      </div>

      {/* Email Login Toggle */}
      {!magicLinkSent && !showEmailInput && (
        <>
          <div style={{ fontSize: '13px', color: '#888', margin: '12px 0' }}>
            ── or ──
          </div>
          <button
            onClick={() => setShowEmailInput(true)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(212,175,55,0.3)',
              background: 'transparent',
              color: '#D4AF37',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            📧 {t.email}
          </button>
        </>
      )}

      {/* Email Input Form */}
      {showEmailInput && !magicLinkSent && (
        <form onSubmit={handleEmailLogin} style={{ marginTop: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '10px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: loading ? '#444' : 'linear-gradient(135deg, #D4AF37, #B8860B)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {loading ? t.sending : t.sendMagicLink}
          </button>
        </form>
      )}

      {/* Magic Link Sent Confirmation */}
      {magicLinkSent && (
        <div style={{
          padding: '16px',
          background: 'rgba(80,200,120,0.1)',
          borderRadius: '10px',
          border: '1px solid rgba(80,200,120,0.3)',
        }}>
          <div style={{ fontSize: '15px', color: '#50C878', fontWeight: 600 }}>
            ✉️ {t.checkEmail}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
            {lang === 'zh'
              ? '点击邮件中的链接即可自动登录'
              : 'Click the link in the email to sign in automatically'}
          </div>
        </div>
      )}
    </div>
  );
}
