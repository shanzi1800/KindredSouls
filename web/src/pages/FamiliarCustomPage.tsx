/**
 * FamiliarCustomPage.tsx —— 进阶定制 · 灵魂镜像殿堂（E54-4 主公亲令 2026-10-15）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（E54-4）：报告页灵宠认领条升级新增 [ 进阶定制 / 灵魂镜像 ✦ ] ⇒ SPA 路由
 *   直达本独立页（`/familiar/custom`），承载四件事：
 *     ① 【数字孪生 · 镜像自我】基于本命星盘 ⇒ 代表自己潜意识与命理天赋的「本尊元神灵宠」；
 *     ② 【以 TA 之名 · 伴侣/挚友结缘】预留他人出生年月日 / 时辰 / 坐标城市 ⇒ 孵化专属 TA 的灵宠；
 *     ③ 【双宠齐聚 · Max=2】数据层与首页布局完整支持双宠并排趴键（一左一右）；
 *     ④ 【商业变现门禁】皮肤更换 / 音色定制 / 双宠解锁（$99.99 进阶灵契）的个人化收费接口。
 *
 * 🔴 本期交付边界（军令「本期仅预留架构」）：
 *    - 页面 + 路由 + 交互骨架**全部就位**（可浏览、可展示已认领档案）；
 *    - 三处「解锁 / 凝结」行动点一律 **disabled + 即将开启**徽章 —— 支付链路未开，
 *      绝不发任何请求（fail-closed：宁可按钮不响应，也绝不臆造权益）；
 *    - 双宠价位真源 = FamiliarHomeCard 的 FAMILIAR_DUAL_PRICE_USD / FAMILIAR_DUAL_SKU /
 *      FAMILIAR_MAX_HOME_SLOTS（单一真源，禁在本页复制字面量）。
 *
 * 🔴 纪律：文字一律六语（本页内联字典，与 DailyDashboard 同源先例）；不引 CelestialBackground
 *   （避免首屏体积），背景用纯 CSS 渐变 + 星点，零新增依赖。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useMemo, useState } from 'react';
import { FAMILIAR_LS_KEY } from '../components/FamiliarPicker';
// 💎 单一真源：双宠商业锚点常量（E53-2 入列，本页只读消费）
import { FAMILIAR_DUAL_PRICE_USD, FAMILIAR_DUAL_SKU, FAMILIAR_MAX_HOME_SLOTS } from '../components/FamiliarHomeCard';
import miloSprite from '../assets/familiar_milo.webp';
import sophiaSprite from '../assets/familiar_sophia.webp';

/** 路由常量（App.tsx 消费；禁在别处复制字面量） */
export const FAMILIAR_CUSTOM_PATH = '/familiar/custom';

const GOLD = '#D4AF37';
const CARD_BG = 'linear-gradient(160deg, rgba(212,175,55,0.09), rgba(168,85,247,0.05))';
const CARD_BD = '1px solid rgba(212,175,55,0.26)';

const SAFE: React.CSSProperties = { overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0 };

/** 六语字典（内联，与 DailyDashboard 先例同源；未知语种回落 zh） */
const T: Record<string, Record<string, string>> = {
  zh: {
    back: '← 返回首页',
    title: '✦ 进阶定制 · 灵魂镜像殿堂 ✦',
    subtitle: '在第一只灵宠之外，为你的命格召唤更深的陪伴',
    mirrorTitle: '数字孪生 · 镜像自我',
    mirrorDesc: '依你的本命星盘与八字，凝结一位代表你潜意识与命理天赋的「本尊元神灵宠」—— 它不说话，却最像你。',
    mirrorReady: '你的本尊元神已就位',
    mirrorNone: '尚未契约第一只灵宠（先解锁报告即可免费契约 1 只）',
    mirrorCta: '唤醒本尊元神',
    partnerTitle: '以 TA 之名 · 伴侣 / 挚友结缘',
    partnerDesc: '输入 TA 的出生年月日、时辰与坐标城市，孵化一只专属于 TA 的灵宠，与你的一左一右同台。',
    partnerDate: '出生年月日',
    partnerTime: '出生时辰',
    partnerCity: '坐标城市',
    partnerCta: '为 TA 凝结灵宠',
    dualTitle: '双宠齐聚 · 骑键同台',
    dualDesc: 'Milo 与 Sophia 一左一右，同时扒在「开始测算」键沿上探头探脑 —— 首页灵宠位上限 2 只。',
    dualSlots: '首页骑键位',
    dualCta: '解锁双宠齐聚',
    skinTitle: '皮肤更换 · 音色定制',
    skinDesc: '为灵宠更换晶簇外壳、毛色与声线（个性化收费接口预留）。',
    upcoming: '即将开启',
    priceNote: '进阶灵契一次性解锁，永久有效',
  },
  en: {
    back: '← Back to Home',
    title: '✦ Advanced Customization · Soul Mirror Hall ✦',
    subtitle: 'Beyond your first familiar — summon a deeper companion for your chart',
    mirrorTitle: 'Digital Twin · Mirror Self',
    mirrorDesc: 'From your natal chart and BaZi, we distill a "natal-spirit familiar" that mirrors your subconscious and innate gifts — it stays silent, yet it is most like you.',
    mirrorReady: 'Your natal spirit is ready',
    mirrorNone: 'No familiar yet — unlock the report to contract your first one for free',
    mirrorCta: 'Awaken My Natal Spirit',
    partnerTitle: 'In Their Name · Lover / Kindred Bond',
    partnerDesc: "Enter their birth date, hour and city to hatch a familiar made for them — standing side by side with yours.",
    partnerDate: 'Birth date',
    partnerTime: 'Birth hour',
    partnerCity: 'Birth city',
    partnerCta: 'Hatch Their Familiar',
    dualTitle: 'Dual Familiars · Sharing the Key',
    dualDesc: 'Milo and Sophia perch left and right at once, peeking over the "Start" button — up to 2 familiars on the home key.',
    dualSlots: 'Home key slots',
    dualCta: 'Unlock Dual Familiars',
    skinTitle: 'Skins · Voice Customization',
    skinDesc: 'Swap crystal crusts, fur tones and voice lines for your familiar (personalization billing reserved).',
    upcoming: 'Coming soon',
    priceNote: 'One-time awakening, yours forever',
  },
  es: {
    back: '← Volver al inicio',
    title: '✦ Personalización Avanzada · Salón del Espejo del Alma ✦',
    subtitle: 'Más allá de tu primera mascota — invoca una compañía más profunda para tu carta',
    mirrorTitle: 'Gemelo Digital · Espejo del Yo',
    mirrorDesc: 'De tu carta natal y BaZi destilamos una "mascota espíritu natal" que refleja tu subconsciente y tus dones — calla, pero se parece más a ti.',
    mirrorReady: 'Tu espíritu natal está listo',
    mirrorNone: 'Aún sin mascota — desbloquea el informe para contratar la primera gratis',
    mirrorCta: 'Despertar mi Espíritu Natal',
    partnerTitle: 'En Su Nombre · Vínculo de Amor / Amistad',
    partnerDesc: 'Introduce su fecha, hora y ciudad de nacimiento para incubar una mascota hecha para esa persona, junto a la tuya.',
    partnerDate: 'Fecha de nacimiento',
    partnerTime: 'Hora de nacimiento',
    partnerCity: 'Ciudad de nacimiento',
    partnerCta: 'Incubar Su Mascota',
    dualTitle: 'Dos Mascotas · Compartiendo la Tecla',
    dualDesc: 'Milo y Sophia se asoman a la vez, izquierda y derecha, sobre el botón «Empezar» — hasta 2 mascotas en la tecla de inicio.',
    dualSlots: 'Ranuras en la tecla',
    dualCta: 'Desbloquear Dos Mascotas',
    skinTitle: 'Aspectos · Personalización de Voz',
    skinDesc: 'Cambia conchas de cristal, tonos de pelaje y líneas de voz (facturación personalizada reservada).',
    upcoming: 'Próximamente',
    priceNote: 'Despertar único, para siempre',
  },
  fr: {
    back: "← Retour à l'accueil",
    title: '✦ Personnalisation Avancée · Salon du Miroir de l\'Âme ✦',
    subtitle: "Au-delà de votre premier familier — invoquez une présence plus profonde pour votre thème",
    mirrorTitle: 'Jumeau Numérique · Miroir de Soi',
    mirrorDesc: 'À partir de votre thème natal et du BaZi, nous distillons un « familier esprit-natal » qui reflète votre subconscient et vos dons — il se tait, mais vous ressemble le plus.',
    mirrorReady: 'Votre esprit natal est prêt',
    mirrorNone: 'Aucun familier — débloquez le rapport pour en contracter un gratuitement',
    mirrorCta: 'Éveiller mon Esprit Natal',
    partnerTitle: 'En Son Nom · Lien Amoureux / Amical',
    partnerDesc: 'Saisissez sa date, son heure et sa ville de naissance pour faire éclore un familier fait pour cette personne, à côté du vôtre.',
    partnerDate: 'Date de naissance',
    partnerTime: 'Heure de naissance',
    partnerCity: 'Ville de naissance',
    partnerCta: 'Faire éclore son Familier',
    dualTitle: 'Deux Familiers · Même Touche',
    dualDesc: 'Milo et Sophia se penchent ensemble, à gauche et à droite, au-dessus du bouton « Commencer » — jusqu\'à 2 familiers.',
    dualSlots: 'Emplacements sur la touche',
    dualCta: 'Débloquer Deux Familiers',
    skinTitle: 'Apparences · Personnalisation Vocale',
    skinDesc: 'Changez cristaux, teintes de pelage et voix de votre familier (facturation personnalisée réservée).',
    upcoming: 'Bientôt disponible',
    priceNote: 'Éveil unique, à vie',
  },
  th: {
    back: '← กลับหน้าแรก',
    title: '✦ ปรับแต่งขั้นสูง · หอกระจกวิญญาณ ✦',
    subtitle: 'เหนือกว่าเพื่อนคนแรก — เรียกเพื่อนที่ลึกซึ้งกว่าให้ดวงของคุณ',
    mirrorTitle: 'แฝดดิจิทัล · กระจกสะท้อนตัวเอง',
    mirrorDesc: 'จากดวงกำเนิดและปาจื้อของคุณ เรากลั่นเป็น "สัตว์วิญญาณกำเนิด" ที่สะท้อนจิตใต้สำนึกและพรสวรรค์ของคุณ — มันเงียบ แต่เหมือนคุณที่สุด',
    mirrorReady: 'สัตว์วิญญาณกำเนิดของคุณพร้อมแล้ว',
    mirrorNone: 'ยังไม่มีสัตว์วิญญาณ — ปลดล็อกรายงานเพื่อรับฟรีหนึ่งตัว',
    mirrorCta: 'ปลุกสัตว์วิญญาณกำเนิด',
    partnerTitle: 'ในนามของ TA · สายสัมพันธ์คู่รัก/เพื่อนสนิท',
    partnerDesc: 'กรอกวันเกิด ชั่วยาม และเมืองเกิดของ TA เพื่อฟักสัตว์วิญญาณเฉพาะสำหรับ TA ยืนเคียงข้างของคุณ',
    partnerDate: 'วันเดือนปีเกิด',
    partnerTime: 'ชั่วยามเกิด',
    partnerCity: 'เมืองเกิด',
    partnerCta: 'ฟักสัตว์วิญญาณของ TA',
    dualTitle: 'สองสัตว์วิญญาณ · ร่วมกันเกาะปุ่ม',
    dualDesc: 'Milo และ Sophia เกาะซ้าย-ขวาพร้อมกันบนปุ่ม "เริ่มทำนาย" — รองรับสูงสุด 2 ตัว',
    dualSlots: 'ช่องบนปุ่มหน้าแรก',
    dualCta: 'ปลดล็อกสองสัตว์วิญญาณ',
    skinTitle: 'เปลี่ยนผิว · ปรับแต่งเสียง',
    skinDesc: 'เปลี่ยนเปลือกคริสตัล สีขน และเสียงของสัตว์วิญญาณ (ระบบเก็บค่าปรับแต่งเตรียมไว้)',
    upcoming: 'เร็ว ๆ นี้',
    priceNote: 'ปลุกครั้งเดียว ใช้ได้ตลอด',
  },
  vi: {
    back: '← Về trang chủ',
    title: '✦ Tùy Biến Nâng Cao · Điện Gương Linh Hồn ✦',
    subtitle: 'Vượt trên linh thú đầu tiên — triệu hồi người bạn đồng hành sâu sắc hơn cho lá số của bạn',
    mirrorTitle: 'Bản Sao Số · Gương Phản Chiếu Bản Ngã',
    mirrorDesc: 'Từ lá số bản mệnh và Bát Tự, chúng tôi chưng cất một "linh thú nguyên thần" phản chiếu tiềm thức và thiên phú của bạn — nó im lặng, nhưng giống bạn nhất.',
    mirrorReady: 'Nguyên thần của bạn đã sẵn sàng',
    mirrorNone: 'Chưa có linh thú — mở khóa báo cáo để nhận miễn phí một linh thú',
    mirrorCta: 'Đánh Thức Nguyên Thần',
    partnerTitle: 'Nhân Danh Người Ấy · Kết Duyên Người Thương / Tri Kỷ',
    partnerDesc: 'Nhập ngày, giờ và thành phố sinh của người ấy để ấp một linh thú dành riêng cho họ, sánh vai cùng bạn.',
    partnerDate: 'Ngày sinh',
    partnerTime: 'Giờ sinh',
    partnerCity: 'Thành phố sinh',
    partnerCta: 'Ấp Linh Thú Cho Người Ấy',
    dualTitle: 'Song Linh Thú · Cùng Đậu Phím',
    dualDesc: 'Milo và Sophia cùng nghiêng mình trái phải trên nút "Bắt đầu" — tối đa 2 linh thú.',
    dualSlots: 'Số vị trí trên phím',
    dualCta: 'Mở Khóa Song Linh Thú',
    skinTitle: 'Đổi Da · Tùy Biến Giọng',
    skinDesc: 'Đổi vỏ pha lê, sắc lông và giọng nói cho linh thú (hệ thống thu phí tùy biến đã dự phòng).',
    upcoming: 'Sắp ra mắt',
    priceNote: 'Đánh thức một lần, dùng trọn đời',
  },
};

interface Props {
  /** SPA 路由直跳（App.tsx 注入；缺省回落 location.href） */
  onNavigate?: (path: string) => void;
  lang?: string;
}

const FamiliarCustomPage: React.FC<Props> = ({ onNavigate, lang = 'zh' }) => {
  const L = String(lang || 'zh').slice(0, 2).toLowerCase();
  const d = T[L] || T.zh;
  const tr = (k: string) => d[k] || T.zh[k] || '';

  /** 已认领档（只读；本页不做认领/更换 —— 那些仍归报告页付费流） */
  const [adoptedName, setAdoptedName] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAMILIAR_LS_KEY);
      if (!raw) return;
      const rec = JSON.parse(raw);
      const n = rec && rec.profile && rec.profile.name;
      if (typeof n === 'string' && n) setAdoptedName(n);
    } catch (_) { /* 隐私模式忽略 */ }
  }, []);

  const go = (p: string) => {
    if (onNavigate) onNavigate(p);
    else { try { window.location.href = p; } catch (_) { /* noop */ } }
  };

  const price = useMemo(() => `$${FAMILIAR_DUAL_PRICE_USD.toFixed(2)}`, []);

  /* 🔒 E54-4 收费接口骨架：本期 **绝不发请求**（fail-closed）——
     未来实现：POST /api/checkout { plan: FAMILIAR_DUAL_SKU } ⇒ 回执交
     sandboxCheckout.mjs 的 dispatchCheckoutRoute 分流（沙盘截断 / 真金外跳）。
     皮肤/音色同理：各自 SKU 入列后再接。 */
  const reservedAction = () => { /* 预留：拍卖付链路未开，按钮保持 disabled */ };

  const card: React.CSSProperties = {
    padding: '16px 16px 14px', borderRadius: '16px', background: CARD_BG,
    border: CARD_BD, minWidth: 0, ...SAFE,
  };
  const ctaBtn = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', borderRadius: '10px', border: 'none',
    background: primary ? `linear-gradient(135deg, ${GOLD} 0%, #F0D060 100%)` : 'rgba(255,255,255,0.06)',
    color: primary ? '#0D0D1A' : 'rgba(255,255,255,0.55)',
    fontSize: '12.5px', fontWeight: 800, cursor: 'not-allowed',
    opacity: 0.72, letterSpacing: '0.2px', ...SAFE,
  });
  const badge: React.CSSProperties = {
    fontSize: '10px', padding: '2px 8px', borderRadius: '999px',
    border: '1px solid rgba(212,175,55,0.5)', color: GOLD,
    background: 'rgba(212,175,55,0.10)', whiteSpace: 'nowrap',
  };
  const inputPh: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.65)', fontSize: '12.5px', outline: 'none',
  };

  return (
    <div
      data-testid="familiar-custom-page"
      style={{
        minHeight: '100vh', boxSizing: 'border-box', padding: '22px 18px 48px',
        background: 'radial-gradient(1200px 600px at 50% -10%, rgba(120,70,200,0.28), transparent 60%), radial-gradient(900px 500px at 85% 105%, rgba(212,175,55,0.12), transparent 62%), #0A0914',
        color: '#EDE7DA',
      }}
    >
      <div style={{ maxWidth: '520px', margin: '0 auto', minWidth: 0 }}>
        <button
          type="button"
          data-testid="familiar-custom-back"
          onClick={() => go('/')}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '9px', padding: '7px 13px', color: '#BDB6A6', fontSize: '12px', cursor: 'pointer',
          }}
        >
          {tr('back')}
        </button>

        <h1 style={{ textAlign: 'center', fontSize: '19px', margin: '20px 0 6px', color: GOLD, fontWeight: 800, ...SAFE }}>
          {tr('title')}
        </h1>
        <p style={{ textAlign: 'center', fontSize: '12.5px', color: 'rgba(237,231,218,0.62)', lineHeight: 1.6, margin: '0 0 20px', ...SAFE }}>
          {tr('subtitle')}
        </p>

        {/* ① 数字孪生 · 镜像自我 */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '19px' }} aria-hidden="true">🪞</span>
            <span style={{ fontSize: '14.5px', fontWeight: 800, color: GOLD, ...SAFE }}>{tr('mirrorTitle')}</span>
            <span style={{ marginLeft: 'auto', ...badge }}>{tr('upcoming')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(237,231,218,0.66)', lineHeight: 1.65, marginBottom: '10px', ...SAFE }}>
            {tr('mirrorDesc')}
          </div>
          <div style={{ fontSize: '11.5px', color: adoptedName ? '#81D8D0' : 'rgba(255,255,255,0.42)', marginBottom: '12px', ...SAFE }}>
            {adoptedName ? `${tr('mirrorReady')} · ${adoptedName}` : tr('mirrorNone')}
          </div>
          <button type="button" disabled style={ctaBtn(true)} onClick={reservedAction}>🪞 {tr('mirrorCta')}</button>
        </div>

        {/* ② 以 TA 之名 · 伴侣/挚友结缘 */}
        <div style={{ ...card, marginTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '19px' }} aria-hidden="true">💞</span>
            <span style={{ fontSize: '14.5px', fontWeight: 800, color: GOLD, ...SAFE }}>{tr('partnerTitle')}</span>
            <span style={{ marginLeft: 'auto', ...badge }}>{tr('upcoming')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(237,231,218,0.66)', lineHeight: 1.65, marginBottom: '12px', ...SAFE }}>
            {tr('partnerDesc')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input style={inputPh} placeholder={tr('partnerDate')} disabled aria-label={tr('partnerDate')} />
            <input style={inputPh} placeholder={tr('partnerTime')} disabled aria-label={tr('partnerTime')} />
          </div>
          <input style={{ ...inputPh, marginBottom: '12px' }} placeholder={tr('partnerCity')} disabled aria-label={tr('partnerCity')} />
          <button type="button" disabled style={ctaBtn(false)} onClick={reservedAction}>💞 {tr('partnerCta')}</button>
        </div>

        {/* ③ 双宠齐聚 · Max=2 */}
        <div style={{ ...card, marginTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '19px' }} aria-hidden="true">🐾</span>
            <span style={{ fontSize: '14.5px', fontWeight: 800, color: GOLD, ...SAFE }}>{tr('dualTitle')}</span>
            <span style={{ marginLeft: 'auto', ...badge }}>{tr('upcoming')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(237,231,218,0.66)', lineHeight: 1.65, marginBottom: '12px', ...SAFE }}>
            {tr('dualDesc')}
          </div>
          {/* 双宠并排示意（一左一右 · 与首页骑键布局同序） */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '14px', marginBottom: '6px' }}>
            <img src={miloSprite} alt="" width={78} draggable={false} style={{ display: 'block' }} />
            <img src={sophiaSprite} alt="" width={78} draggable={false} style={{ display: 'block' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>
            {tr('dualSlots')}：1 / {FAMILIAR_MAX_HOME_SLOTS}
          </div>
          <button type="button" disabled data-testid="familiar-dual-unlock" style={ctaBtn(true)} onClick={reservedAction}>
            🐾 {tr('dualCta')} · {price}
          </button>
          <div style={{ marginTop: '8px', fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', ...SAFE }}>
            {tr('priceNote')} · SKU <code style={{ color: 'rgba(212,175,55,0.75)' }}>{FAMILIAR_DUAL_SKU}</code>
          </div>
        </div>

        {/* ④ 皮肤 / 音色 个性化收费接口（预留） */}
        <div style={{ ...card, marginTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', minWidth: 0 }}>
            <span style={{ fontSize: '19px' }} aria-hidden="true">🎨</span>
            <span style={{ fontSize: '14.5px', fontWeight: 800, color: GOLD, ...SAFE }}>{tr('skinTitle')}</span>
            <span style={{ marginLeft: 'auto', ...badge }}>{tr('upcoming')}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(237,231,218,0.66)', lineHeight: 1.65, ...SAFE }}>
            {tr('skinDesc')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamiliarCustomPage;
