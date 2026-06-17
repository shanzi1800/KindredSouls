// Deterministic tarot card from birthdays + today (22 Major Arcana)
type L = Record<string, string>;

export interface TarotCard {
  id: number;
  name: string;
  meaning: string;
  emoji: string;
  orientation: string; // e.g. " (Ngược)" for Vietnamese reversed
}

const CARDS: { id: number; emoji: string; name: L; meaning: L }[] = [
  {id:0, emoji:'🌟', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Fou',th:'คนโง่ประหลาด',vi:'Chàng Khờ'}, meaning:{zh:'踏上未知旅程的勇气，新可能的开启',en:'The courage to embark on an unknown journey — new possibilities await.',es:'El valor para emprender un viaje desconocido — nuevas posibilidades le esperan.',fr:'Le courage de partir vers l\'inconnu — de nouvelles possibilités vous attendent.',th:'ความกล้าที่จะเริ่มต้นการเดินทางแห่งความลึกลับ — โอกาสใหม่รอคุณอยู่',vi:'Can đảm bước vào hành trình chưa biết — những khả năng mới đang chờ.'}},
  {id:1, emoji:'🔮', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'นักมายกล',vi:'Nhà Ảo Thuật'}, meaning:{zh:'创造显化，意志与行动力的觉醒',en:'Manifestation and creation — willpower awakened into action.',es:'Manifestación y creación — la fuerza de voluntad se despierta en acción.',fr:'Manifestation et création — la volonté s\'éveille en action.',th:'การสร้างสรรค์และการแสดงออก — พลังจิตตื่นขึ้นสู่การลงมือ',vi:'Hiện thực hóa và sáng tạo — ý chí thức tỉnh thành hành động.'}},
  {id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'นางพราหมณี',vi:'Nữ Đại Tư Tế'}, meaning:{zh:'直觉与秘密，等待揭晓的答案',en:'Intuition and mystery — the answer waits to be revealed.',es:'Intuición y misterio — la respuesta espera ser revelada.',fr:'Intuition et mystère — la réponse attend d\'être révélée.',th:'สัญชาตญาณและความลับ — คำตอบรอให้ถูกเปิดเผย',vi:'Trực giác và bí ẩn — câu trả lời đang chờ được bật mí.'}},
  {id:3, emoji:'🌺', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'จักรพรรดินี',vi:'Nữ Hoàng'}, meaning:{zh:'丰盛与滋养，爱的温柔绽放',en:'Abundance and nurturing — love blooms gently.',es:'Abundancia y cuidado — el amor florece suavemente.',fr:'Abondance et tendresse — l\'amour fleurit doucement.',th:'ความอุดมสมบูรณ์และการเอื้ออาทร — ความรักเบ่งบานอย่างอ่อนโยน',vi:'Phồn vinh và nâng dưỡng — tình yêu nở rộ nhẹ nhàng.'}},
  {id:4, emoji:'👑', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'จักรพรรดิ',vi:'Hoàng Đế'}, meaning:{zh:'秩序与守护，稳稳托住的力量',en:'Order and protection — a steady, grounding force.',es:'Orden y protección — una fuerza firme y estable.',fr:'Ordre et protection — une force stable et rassurante.',th:'ความเป็นระเบียบและการปกป้อง — พลังที่มั่นคง',vi:'Trật tự và bảo vệ — một sức mạnh vững chãi.'}},
  {id:5, emoji:'⛪', name:{zh:'教皇',en:'The Hierophant',es:'El Sumo Sacerdote',fr:'Le Pape',th:'ประมุขสงฆ์',vi:'Giáo Hoàng'}, meaning:{zh:'指引与信念，灵魂层面的契合',en:'Guidance and faith — souls aligned on a deeper level.',es:'Guía y fe — las almas se alinean en un nivel más profundo.',fr:'Guidance et foi — les âmes s\'alignent au plus profond.',th:'การชี้นำและความศรัทธา — วิญญาณเชื่อมโยงกันในระดับลึก',vi:'Dẫn dắt và niềm tin — tâm hồn kết nối ở tầng sâu hơn.'}},
  {id:6, emoji:'💕', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'คู่รัก',vi:'Tình Nhân'}, meaning:{zh:'抉择与诱惑，关系来到十字路口',en:'A crossroads of choice — your relationship faces a pivotal decision.',es:'Una encrucijada de elección — su relación enfrenta una decisión crucial.',fr:'Un carrefour de choix — votre relation fait face à une décision cruciale.',th:'ทางแยกแห่งการเลือก — ความสัมพันธ์ของคุณเผชิญการตัดสินใจสำคัญ',vi:'Ngã tư của sự lựa chọn — mối quan hệ đối mặt với quyết định quan trọng.'}},
  {id:7, emoji:'🏛️', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'รถศึก',vi:'Cỗ Xe Chiến Thắng'}, meaning:{zh:'意志与征服，携手跨越障碍',en:'Willpower and triumph — overcoming obstacles together.',es:'Fuerza de voluntad y triunfo — superando obstáculos juntos.',fr:'Volonté et triomphe — surmonter les obstacles ensemble.',th:'พลังจิตและชัยชนะ — เอาชนะอุปสรรคไปด้วยกัน',vi:'Ý chí và thắng lợi — vượt qua chướng ngại cùng nhau.'}},
  {id:8, emoji:'💪', name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'พละกำลัง',vi:'Sức Mạnh'}, meaning:{zh:'内在勇气，柔韧却不可战胜',en:'Inner courage — gentle yet invincible.',es:'Coraje interior — suave pero invencible.',fr:'Courage intérieur — doux mais invincible.',th:'ความกล้าภายใน — อ่อนโยนแต่ไร้พ่าย',vi:'Can đảm bên trong — dịu dàng nhưng bất khả chiến bại.'}},
  {id:9, emoji:'🕯️', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'นักบวชเรี่ยมใจ',vi:'Ẩn Sĩ'}, meaning:{zh:'独处与内观，答案在内心深处',en:'Solitude and introspection — the answer lies within.',es:'Soledad e introspección — la respuesta está dentro.',fr:'Solitude et introspection — la réponse est en vous.',th:'ความเงียบและการสำรวจภายใน — คำตอบอยู่ในใจ',vi:'Cô đơn và nội quan — câu trả lời nằm ở sâu bên trong.'}},
  {id:10, emoji:'☸️', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'Rueda de la Fortuna',fr:'Roue de Fortune',th:'วงล้อแห่งโชคชะตา',vi:'Bánh Xe Số Phận'}, meaning:{zh:'转变与循环，命运正在转动',en:'Transformation and cycles — destiny is turning in your favor.',es:'Transformación y ciclos — el destino gira a su favor.',fr:'Transformation et cycles — le destin tourne en votre faveur.',th:'การเปลี่ยนแปลงและวัฏจักร — โชคชะตากำลังหมุนเข้ามา',vi:'Biến đổi và chu kỳ — vận mệnh đang xoay chuyển đến với bạn.'}},
  {id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'ความยุติธรรม',vi:'Công Lý'}, meaning:{zh:'因果与平衡，宇宙在精准回应',en:'Cause and balance — the universe responds with precision.',es:'Causa y equilibrio — el universo responde con precisión.',fr:'Cause et équilibre — l\'univers répond avec précision.',th:'เหตุและสมดุล — จักรวาลตอบสนองอย่างแม่นยำ',vi:'Nhân quả và cân bằng — vũ trụ đáp trả chính xác.'}},
  {id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'คนแขวนหัว',vi:'Kẻ Treo Ngược'}, meaning:{zh:'放下与臣服，另一种视角的智慧',en:'Surrender and release — wisdom from a different perspective.',es:'Rendición y liberación — sabiduría desde otra perspectiva.',fr:'Lâcher-prise et abandon — sagesse d\'une autre perspective.',th:'การยอมแพ้และการปล่อยวาง — ภูมิปัญญาจากมุมมองอื่น',vi:'Buông bỏ và đầu hàng — sự khôn ngoan từ góc nhìn khác.'}},
  {id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เจ้าแห่งความตาย',vi:'Cái Chết'}, meaning:{zh:'结束与蜕变，旧篇章的翻页',en:'Endings and transformation — a new chapter begins.',es:'Finales y transformación — un nuevo capítulo comienza.',fr:'Fins et transformation — un nouveau chapitre commence.',th:'จุดจบและการเปลี่ยนแปลง — บทใหม่เริ่มต้น',vi:'Kết thúc và hoán chuyển — một chương mới bắt đầu.'}},
  {id:14, emoji:'🦋', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'Tempérance',th:'ความสมดุล',vi:'Chừng Mực'}, meaning:{zh:'平衡与调和，在两极间找到节奏',en:'Balance and harmony — finding rhythm between opposites.',es:'Equilibrio y armonía — encontrando ritmo entre opuestos.',fr:'Équilibre et harmonie — trouver le rythme entre les contraires.',th:'สมดุลและความสามัคคี — หาจังหวะระหว่างสองขั้ว',vi:'Cân bằng và hài hòa — tìm thấy nhịp điệu giữa hai thái cực.'}},
  {id:15, emoji:'🔗', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ปีศาจ',vi:'Ác Quỷ'}, meaning:{zh:'束缚与执念，看见阴影才能超越',en:'Bondage and attachment — face the shadow to transcend it.',es:'Atadura y apego — enfrente la sombra para trascenderla.',fr:'Attachement et obsession — affrontez l\'ombre pour la transcender.',th:'พันธนะและความยึดติด — เผชิญหน้ากับเงาเพื่อเลยล้ำ',vi:'Trói buộc và chấp niệm — đối mặt với bóng tối để vượt lên.'}},
  {id:16, emoji:'🗼', name:{zh:'塔',en:'The Tower',es:'La Torre',fr:'La Tour',th:'หอคอย',vi:'Tháp'}, meaning:{zh:'突变的觉醒，打碎幻象见真相',en:'Sudden awakening — illusions shatter to reveal truth.',es:'Despertar repentino — las ilusiones se rompen para revelar la verdad.',fr:'Éveil soudain — les illusions se brisent pour révéler la vérité.',th:'การตื่นรู้ทันใด — ภาพลวงแตกสลายเปิดเผยความจริง',vi:'Tỉnh giác đột ngột — ảo ảnh vỡ tan để lộ ra sự thật.'}},
  {id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ดาว',vi:'Ngôi Sao'}, meaning:{zh:'希望与灵感，宇宙的疗愈之光',en:'Hope and inspiration — cosmic healing light guides you.',es:'Esperanza e inspiración — la luz cósmica de sanación te guía.',fr:'Espoir et inspiration — la lumière de guérison cosmique vous guide.',th:'ความหวังและแรงบันดาลใจ — แสงรักษาจากจักรวาลนำทางคุณ',vi:'Hy vọng và cảm hứng — ánh sáng chữa lành vũ trụ dẫn đường cho bạn.'}},
  {id:18, emoji:'🌙', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ดวงจันทร์',vi:'Mặt Trăng'}, meaning:{zh:'幻象与恐惧，直面内心深处的不安',en:'Illusion and fear — confront the unease within.',es:'Ilusión y miedo — enfrente la inquietud interior.',fr:'Illusion et peur — affrontez l\'inquiétude intérieure.',th:'ภาพลวงและความกลัว — เผชิญหน้ากับความไม่สบายใจภายใน',vi:'Ảo ảnh và nỗi sợ — đối diện với bất an sâu thẳm bên trong.'}},
  {id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ดวงอาทิตย์',vi:'Mặt Trời'}, meaning:{zh:'喜悦与成功，生命力全面绽放',en:'Joy and success — vitality in full bloom.',es:'Alegría y éxito — vitalidad en plena floración.',fr:'Joie et succès — vitalité en pleine floración.',th:'ความสุขและความสำเร็จ — พลังชีวิตเบ่งบานอย่างเต็มที่',vi:'Vui sướng và thành công — sức sống nở rộ trọn vẹn.'}},
  {id:20, emoji:'🔔', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'การพิพากษา',vi:'Phán Xét'}, meaning:{zh:'重生与宽恕，灵魂被唤醒',en:'Rebirth and forgiveness — your soul is being called.',es:'Renacimiento y perdón — tu alma está siendo llamada.',fr:'Renaissance et pardon — votre âme est appelée.',th:'การเกิดใหม่และการอภัย — วิญญาณของคุณถูกเรียก',vi:'Tái sinh và tha thứ — tâm hồn bạn đang được gọi.'}},
  {id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'โลก',vi:'Thế Giới'}, meaning:{zh:'完成与圆满，达成内在的和谐',en:'Completion and fulfillment — inner harmony achieved.',es:'Completitud y plenitud — armonía interior lograda.',fr:'Accomplissement et plénitude — harmonie intérieure atteinte.',th:'ความสมบูรณ์และความเต็มเปี่ยม — ความสามัคคีภายในบรรลุ',vi:'Hoàn thành và viên mãn — hài hòa bên trong đã đạt được.'}},
];

const ORIENT_SUFFIX: Record<string, (reversed: boolean) => string> = {
  zh: (r) => r ? '（逆位）' : '',
  en: (r) => r ? ' (Reversed)' : '',
  es: (r) => r ? ' (Invertido)' : '',
  fr: (r) => r ? ' (Inversé)' : '',
  th: (r) => r ? ' (กลับด้าน)' : '',
  vi: (r) => r ? ' (Ngược)' : '',
};

export function getTarot(d1: string, d2: string, lang: string = 'en'): TarotCard {
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
  const card = CARDS[cardId] || CARDS[0];
  const L = (lang in card.name) ? lang : 'en';
  return {
    id: card.id,
    name: card.name[L] || card.name.en,
    meaning: card.meaning[L] || card.meaning.en,
    emoji: card.emoji,
    orientation: (ORIENT_SUFFIX[L] || ORIENT_SUFFIX['en'])(reversed),
  };
}
