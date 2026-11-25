// 🤝 E155-刀五（主公军令 2026-11-25）：Resonance Code 缘分密码 · 六语权威字典（单源）
//   🔴 军令钦定键逐字写入（res_title / scene_* / cta_dual_unlock / card_quote_* / card_wealth_badge），
//      严禁机翻；「密码」一律作 Code / Clé 语义的 Resonance，绝不译作 Password。
//   🔴 内联单源形制（GoldCardExporter 先例）⇒ 零 i18n 键数扰动；语种序恒 [zh,en,fr,es,th,vi]。
//   纯 JS：服务端（报告语言名）与前端（页面 / 坐标卡）共用同一物理文件。

export const RES_LANGS = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

const D = {
  /* ── 军令钦定（逐字）── */
  res_title: ['缘分密码 · 关系坐标', 'Resonance Code · Relationship Blueprint', 'Code de Résonance · Cartographie Relationnelle', 'Código de Resonancia · Mapa Relacional', 'รหัสคลื่นชะตา · แผนที่ความสัมพันธ์', 'Mật Mã Nhân Duyên · Tọa Độ Tương Giao'],
  scene_romance_title: ['情爱坐标', 'Eros · Romance', 'Éros · Amour', 'Eros · Amor', 'เอโรส · ความรัก', 'Eros · Tình Ái'],
  scene_romance_sub: ['面对面，看见彼此的光', "Face to face, witnessing each other's light", "Face à face, révéler l'éclat de l'autre", 'Frente a frente, contemplando la luz del otro', 'สบตาตรงหน้า เพื่อมองเห็นแสงในกันและกัน', 'Đối diện nhau, soi rọi ánh sáng của riêng hai người'],
  scene_business_title: ['商道共频', 'Philia · Alliance', 'Philia · Alliance', 'Philia · Alianza', 'ฟีเลีย · พันธมิตร', 'Philia · Đồng Hành'],
  scene_business_sub: ['肩并肩，校准同一方位', 'Side by side, aligned toward one horizon', 'Côte à côte, calibrés vers le même horizon', 'Hombro con hombro, alineados hacia un mismo horizonte', 'เคียงบ่าเคียงไหล่ ปรับเข็มทิศสู่ขอบฟ้าเดียวกัน', 'Sát cánh bên nhau, hiệu chỉnh về cùng một phương vị'],
  scene_friendship_title: ['挚友同频', 'Storge · Kindred', 'Storgê · Complicité', 'Storgé · Afinidad', 'สตอร์เก · กัลยาณมิตร', 'Storge · Tri Kỷ'],
  scene_friendship_sub: ['无需设防，何时何地一见如故', 'Unarmored warmth, timelessly familiar anywhere', 'Une chaleur sans armure, familière en tout lieu', 'Calidez sin defensas, afines en cualquier lugar', 'อบอุ่นไร้เกราะกำบัง คุ้นเคยดั่งรู้จักกันมาเนิ่นนาน', 'Ấm áp không phòng bị, bất cứ đâu cũng như cố nhân'],
  cta_dual_unlock: ['一人解锁，双方各得专属坐标报告', 'Unlock once — both receive a bespoke coordinate report', 'Un seul accès — chacun reçoit son rapport de coordonnées dédié', 'Un solo desbloqueo — ambos reciben su informe de coordenadas', 'ปลดล็อกครั้งเดียว รับรายงานพิกัดเฉพาะตัวครบทั้งสองฝ่าย', 'Mở khóa một lần — cả hai cùng nhận báo cáo tọa độ riêng biệt'],
  card_quote_romance: ['真正的吸引，不是占有，而是互为星图。', "True magnetism isn't possession; it is becoming each other's star chart.", "Le véritable magnétisme ne possède pas ; il devient la carte céleste de l'autre.", 'El verdadero magnetismo no posee; se convierte en la carta estelar del otro.', 'แรงดึงดูดที่แท้จริงไม่ใช่การครอบครอง แต่คือการเป็นแผนที่ดาวให้กัน', 'Sức hút đích thực không phải chiếm hữu, mà là trở thành tinh đồ của nhau.'],
  card_quote_business: ['最好的搭档，不必性格相同，只需望向同一方位。', 'The finest allies need not mirror each other—only gaze toward the same horizon.', 'Les meilleurs alliés n\'ont pas à se ressembler, mais à viser le même horizon.', 'Los mejores aliados no necesitan ser iguales, solo mirar el mismo horizonte.', 'คู่หูที่ดีที่สุดไม่จำเป็นต้องเหมือนกัน แค่หันเข็มทิศสู่ขอบฟ้าเดียวกัน', 'Cộng sự lý tưởng chẳng cần giống nhau, chỉ cần cùng hướng về một phương vị.'],
  card_quote_friendship: ['有些相遇自带旧识的松弛，无需证明，只需在场。', 'Some bonds carry the ease of old souls—nothing to prove, only presence.', "Certains liens portent l'aisance des âmes anciennes : rien à prouver, juste être là.", 'Hay vínculos con la calma de almas antiguas: nada que probar, solo estar presentes.', 'บางความสัมพันธ์สบายใจดั่งคนคุ้นเคย ไม่ต้องพิสูจน์ แค่มีกันอยู่ตรงนี้', 'Có những mối giao cảm mang sự an nhiên của cố nhân — chẳng cần chứng minh, chỉ cần hiện diện.'],
  card_wealth_badge: ['丰盛坐标 · 财随善流', 'Abundance Coordinate · Generous Flow', "Coordonnée d'Abondance · Flux Généreux", 'Coordenada de Abundancia · Flujo Generoso', 'พิกัดความมั่งคั่ง · กระแสทรัพย์แห่งคุณค่า', 'Tọa Độ Thịnh Vượng · Dòng Chảy Thiện Tài'],
  card_quote_wealth: ['财富从不追随焦虑的抓取，它只流向丰盛与善意的方位。', 'Wealth never answers anxious grasping; it flows naturally toward abundance and grace.', "La richesse ne cède jamais à l'anxiété ; elle afflue naturellement vers l'abondance et la grâce.", 'La riqueza nunca responde al afán ansioso; fluye con naturalidad hacia la abundancia y la gracia.', 'ความมั่งคั่งไม่เคยวิ่งตามความกังวล แต่จะไหลรินสู่พิกัดแห่งความอุดมสมบูรณ์และความปรารถนาดีเสมอ', 'Tài lộc chẳng chạy theo sự nắm giữ lo âu, mà tự nhiên hội tụ về phương vị của sự đủ đầy và thiện tâm.'],

  /* ── 页面词条 ── */
  scene_pick_title: ['选择你们的关系坐标', 'Choose the coordinate of your bond', 'Choisissez la coordonnée de votre lien', 'Elige la coordenada de vuestro vínculo', 'เลือกพิกัดของความสัมพันธ์', 'Chọn tọa độ cho mối duyên của hai người'],
  mode_known_title: ['我知道 TA 的生辰', "I know their birth details", 'Je connais ses données de naissance', 'Conozco sus datos de nacimiento', 'ฉันทราบข้อมูลวันเกิดของเขา', 'Tôi biết ngày sinh của người ấy'],
  mode_known_sub: ['即刻生成，双方各得一份专属坐标报告', 'Generate instantly — each of you receives a bespoke report', 'Génération immédiate — chacun reçoit son rapport dédié', 'Generación inmediata — cada uno recibe su informe dedicado', 'สร้างทันที แต่ละคนได้รายงานเฉพาะตัว', 'Tạo ngay — mỗi người nhận một báo cáo riêng'],
  mode_invite_title: ['让 TA 自己填写（推荐）', 'Let them fill it in (recommended)', 'Laissez-le renseigner lui-même (recommandé)', 'Deja que lo rellene su pareja (recomendado)', 'ให้เขากรอกเอง (แนะนำ)', 'Để người ấy tự điền (khuyến nghị)'],
  mode_invite_sub: ['你先解锁，TA 通过邀请函免费补填', 'You unlock first; they complete it free via the invitation', 'Vous débloquez d’abord ; il complète gratuitement via l’invitation', 'Tú desbloqueas primero; tu pareja lo completa gratis con la invitación', 'คุณปลดล็อกก่อน เขากรอกเพิ่มได้ฟรีผ่านคำเชิญ', 'Bạn mở khóa trước, người ấy bổ sung miễn phí qua thư mời'],
  person_a_label: ['你的信息', 'Your details', 'Vos informations', 'Tus datos', 'ข้อมูลของคุณ', 'Thông tin của bạn'],
  person_b_label: ['TA 的信息', 'Their details', 'Ses informations', 'Sus datos', 'ข้อมูลของเขา', 'Thông tin của người ấy'],
  f_name: ['称呼', 'Name', 'Prénom', 'Nombre', 'ชื่อ', 'Tên gọi'],
  f_name_ph: ['怎么称呼你', 'How should we call you', 'Comment vous appeler', 'Cómo te llamas', 'เรียกคุณว่าอะไร', 'Gọi bạn là gì'],
  f_birth_date: ['出生日期', 'Birth date', 'Date de naissance', 'Fecha de nacimiento', 'วันเกิด', 'Ngày sinh'],
  f_birth_time: ['出生时间（选填）', 'Birth time (optional)', 'Heure de naissance (facultatif)', 'Hora de nacimiento (opcional)', 'เวลาเกิด (ไม่บังคับ)', 'Giờ sinh (không bắt buộc)'],
  f_time_unknown: ['不知道具体时间', 'Time unknown', 'Heure inconnue', 'Hora desconocida', 'ไม่ทราบเวลา', 'Không rõ giờ sinh'],
  f_city: ['出生城市', 'Birth city', 'Ville de naissance', 'Ciudad de nacimiento', 'เมืองที่เกิด', 'Thành phố sinh'],
  f_city_ph: ['输入城市名搜索', 'Type a city to search', 'Saisissez une ville', 'Escribe una ciudad', 'พิมพ์ชื่อเมือง', 'Nhập tên thành phố'],
  degrade_note: ['缺少出生分钟时，上升与宫位将如实标注为未知，绝不臆测。', 'Without a birth minute, the Ascendant and houses are honestly marked unknown — never guessed.', "Sans minute de naissance, l'Ascendant et les maisons sont honnêtement indiqués inconnus — jamais devinés.", 'Sin minuto de nacimiento, el Ascendente y las casas se marcan honestamente como desconocidos; nunca se adivinan.', 'หากไม่ทราบนาทีเกิด ลัคนาและบ้านจะระบุว่าไม่ทราบตามจริง ไม่เดา', 'Thiếu phút sinh, Cung Mọc và các cung sẽ được ghi nhận trung thực là chưa rõ — tuyệt đối không đoán.'],
  price_line: ['$9.99 · 一次解锁', '$9.99 · One-time unlock', '9,99 $ · Déblocage unique', '9,99 $ · Desbloqueo único', '$9.99 · ปลดล็อกครั้งเดียว', '9,99 $ · Mở khóa một lần'],
  cta_pay: ['解锁缘分密码', 'Unlock the Resonance Code', 'Débloquer le Code de Résonance', 'Desbloquear el Código de Resonancia', 'ปลดล็อกรหัสคลื่นชะตา', 'Mở khóa Mật Mã Nhân Duyên'],
  cta_creating: ['正在建立订单…', 'Creating your order…', 'Création de la commande…', 'Creando tu pedido…', 'กำลังสร้างคำสั่ง…', 'Đang tạo đơn…'],
  err_need_login: ['请先登录，再解锁缘分密码', 'Please sign in before unlocking', 'Veuillez vous connecter avant de débloquer', 'Inicia sesión antes de desbloquear', 'กรุณาเข้าสู่ระบบก่อนปลดล็อก', 'Vui lòng đăng nhập trước khi mở khóa'],
  err_profile: ['请补全出生日期', 'Please complete the birth date', 'Veuillez compléter la date de naissance', 'Completa la fecha de nacimiento', 'กรุณากรอกวันเกิดให้ครบ', 'Vui lòng điền đầy đủ ngày sinh'],
  err_time_city: ['填写了出生时间时，请同时填写出生城市', 'A birth city is required when a birth time is given', 'Une ville de naissance est requise avec l’heure', 'Se requiere la ciudad si indicas la hora', 'กรุณากรอกเมืองเมื่อระบุเวลาเกิด', 'Cần nhập thành phố sinh khi đã nhập giờ sinh'],
  err_generic: ['暂时无法完成，请稍后重试', 'Something went wrong. Please try again later', 'Une erreur est survenue. Réessayez plus tard', 'Algo salió mal. Inténtalo más tarde', 'เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง', 'Có lỗi xảy ra. Vui lòng thử lại sau'],
  invite_hero: ['有人为你解锁了一份专属坐标报告', 'Someone unlocked a bespoke coordinate report for you', 'Quelqu’un a débloqué un rapport de coordonnées pour vous', 'Alguien desbloqueó un informe de coordenadas para ti', 'มีคนปลดล็อกรายงานพิกัดเฉพาะตัวให้คุณ', 'Có người đã mở khóa một báo cáo tọa độ riêng dành cho bạn'],
  invite_free: ['免费领取', 'Free to claim', 'À recevoir gratuitement', 'Gratis para reclamar', 'รับฟรี', 'Nhận miễn phí'],
  invite_cta_login: ['登录后领取', 'Sign in to claim', 'Se connecter pour recevoir', 'Inicia sesión para reclamarlo', 'เข้าสู่ระบบเพื่อรับ', 'Đăng nhập để nhận'],
  invite_fill_title: ['补填你的生辰，即刻生成', 'Add your birth details to generate', 'Renseignez votre naissance pour générer', 'Añade tus datos para generar', 'กรอกข้อมูลวันเกิดเพื่อสร้างทันที', 'Bổ sung ngày sinh để tạo ngay'],
  invite_cta_claim: ['领取我的报告', 'Claim my report', 'Recevoir mon rapport', 'Reclamar mi informe', 'รับรายงานของฉัน', 'Nhận báo cáo của tôi'],
  invite_claimed: ['该缘分坐标已被认领', 'This resonance coordinate has already been claimed', 'Ces coordonnées ont déjà été réclamées', 'Estas coordenadas ya fueron reclamadas', 'พิกัดนี้ถูกรับไปแล้ว', 'Tọa độ này đã được nhận'],
  invite_not_found: ['邀请函不存在或已失效', 'This invitation does not exist or has expired', 'Cette invitation est introuvable ou expirée', 'Esta invitación no existe o caducó', 'ไม่พบคำเชิญนี้', 'Lời mời không tồn tại hoặc đã hết hạn'],
  invite_unpaid: ['对方尚未完成解锁，请稍后再来', 'The other person has not completed the unlock yet — please come back later', "L'autre personne n'a pas encore finalisé le déblocage — revenez plus tard", 'La otra persona aún no completó el desbloqueo; vuelve más tarde', 'อีกฝ่ายยังไม่ได้ปลดล็อก กรุณากลับมาภายหลัง', 'Người ấy chưa hoàn tất mở khóa — vui lòng quay lại sau'],
  a_share_title: ['把邀请函发给 TA', 'Send the invitation', 'Envoyez l’invitation', 'Envía la invitación', 'ส่งคำเชิญให้เขา', 'Gửi thư mời cho người ấy'],
  invite_copy: ['复制邀请链接', 'Copy invitation link', 'Copier le lien', 'Copiar el enlace', 'คัดลอกลิงก์คำเชิญ', 'Sao chép liên kết'],
  invite_copied: ['已复制', 'Copied', 'Copié', 'Copiado', 'คัดลอกแล้ว', 'Đã sao chép'],
  a_wait: ['等待 TA 补填生辰…', 'Waiting for them to add their birth details…', 'En attente de ses informations…', 'Esperando sus datos…', 'กำลังรอเขากรอกข้อมูล…', 'Đang chờ người ấy bổ sung…'],
  generating: ['正在校准你们的星历坐标…', 'Calibrating your ephemeris coordinates…', 'Calibrage de vos coordonnées éphémérides…', 'Calibrando sus coordenadas efemérides…', 'กำลังปรับพิกัดปฏิทินดาว…', 'Đang hiệu chỉnh tọa độ lịch thiên…'],
  failed: ['生成失败，请稍后重试', 'Generation failed. Please try again later', 'Échec de la génération. Réessayez plus tard', 'Falló la generación. Inténtalo más tarde', 'สร้างไม่สำเร็จ กรุณาลองใหม่', 'Tạo thất bại. Vui lòng thử lại'],
  report_a_title: ['你的专属坐标报告', 'Your bespoke coordinate report', 'Votre rapport de coordonnées dédié', 'Tu informe de coordenadas dedicado', 'รายงานพิกัดเฉพาะตัวของคุณ', 'Báo cáo tọa độ riêng của bạn'],
  keywords_label: ['核心契合', 'Core resonance', 'Résonance essentielle', 'Resonancia esencial', 'จุดร่วมแก่น', 'Cộng hưởng cốt lõi'],
  card_title: ['幸福坐标卡', 'Happiness Coordinate Card', 'Carte des Coordonnées du Bonheur', 'Tarjeta de Coordenadas de la Felicidad', 'บัตรพิกัดความสุข', 'Thẻ Tọa Độ Hạnh Phúc'],
  card_scene_label: ['场景坐标', 'Scene coordinate', 'Coordonnée de scène', 'Coordenada de escena', 'พิกัดฉาก', 'Tọa độ cảnh'],
  card_save: ['保存坐标卡', 'Save coordinate card', 'Enregistrer la carte', 'Guardar la tarjeta', 'บันทึกบัตรพิกัด', 'Lưu thẻ tọa độ'],
  card_share: ['分享', 'Share', 'Partager', 'Compartir', 'แชร์', 'Chia sẻ'],
  card_you: ['你', 'You', 'Vous', 'Tú', 'คุณ', 'Bạn'],
  card_partner: ['TA', 'Them', 'L’autre', 'La otra persona', 'เขา', 'Người ấy'],
  degraded_badge: ['日期级 · 上升未知', 'Date-level · Ascendant unknown', 'Niveau date · Ascendant inconnu', 'Nivel fecha · Ascendente desconocido', 'ระดับวัน · ไม่ทราบลัคนา', 'Cấp ngày · Chưa rõ Cung Mọc'],
  back_home: ['回首页', 'Back home', 'Retour à l’accueil', 'Volver al inicio', 'กลับหน้าแรก', 'Về trang chủ'],
};

/** 取词：缺键/缺语种 ⇒ zh 兜底再 ⇒ 键名（绝不机翻） */
export function resT(lang, key) {
  const L = String(lang || 'zh').toLowerCase().split('-')[0];
  const row = D[key];
  if (!row) return key;
  const i = RES_LANGS.indexOf(L);
  return (i !== -1 && row[i]) ? row[i] : row[0];
}

/** 军令钦定键集（闸门镜像用） */
export const RESONANCE_MANDATED_KEYS = Object.freeze([
  'res_title', 'scene_romance_title', 'scene_romance_sub', 'scene_business_title', 'scene_business_sub',
  'scene_friendship_title', 'scene_friendship_sub', 'cta_dual_unlock', 'card_quote_romance', 'card_quote_business',
  'card_quote_friendship', 'card_wealth_badge', 'card_quote_wealth',
]);

/** 十二星座（坐标卡星历印记用） */
export const RES_SIGNS = Object.freeze({
  zh: ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
  es: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  th: ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน'],
  vi: ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Thiên Yết', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'],
});

export function resSignName(lang, signEn) {
  const idx = RES_SIGNS.en.indexOf(String(signEn || ''));
  if (idx === -1) return '';
  return RES_SIGNS[String(lang || 'zh').split('-')[0]] ? RES_SIGNS[String(lang || 'zh').split('-')[0]][idx] : RES_SIGNS.zh[idx];
}
