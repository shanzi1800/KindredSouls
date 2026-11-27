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
  card_quote_romance: ['真正的吸引，不是占有，而是互为星图。', "True magnetism isn't possession; it is becoming each other's star chart.", "Le véritable magnétisme ne possède pas ; il devient la carte céleste de l'autre.", 'El verdadero magnetismo no posee; se convierte en la carta estelar del otro.', 'แรงดึงดูดที่แท้จริงไม่ใช่การครอบครอง แต่คือการเป็นแผนที่ดาวให้กัน', 'Sức hút đích thực không phải chiếm hữu, mà là trở thành tinh đồ của nhau.'],
  card_quote_business: ['最好的搭档，不必性格相同，只需望向同一方位。', 'The finest allies need not mirror each other—only gaze toward the same horizon.', 'Les meilleurs alliés n\'ont pas à se ressembler, mais à viser le même horizon.', 'Los mejores aliados no necesitan ser iguales, solo mirar el mismo horizonte.', 'คู่หูที่ดีที่สุดไม่จำเป็นต้องเหมือนกัน แค่หันเข็มทิศสู่ขอบฟ้าเดียวกัน', 'Cộng sự lý tưởng chẳng cần giống nhau, chỉ cần cùng hướng về một phương vị.'],
  card_quote_friendship: ['有些相遇自带旧识的松弛，无需证明，只需在场。', 'Some bonds carry the ease of old souls—nothing to prove, only presence.', "Certains liens portent l'aisance des âmes anciennes : rien à prouver, juste être là.", 'Hay vínculos con la calma de almas antiguas: nada que probar, solo estar presentes.', 'บางความสัมพันธ์สบายใจดั่งคนคุ้นเคย ไม่ต้องพิสูจน์ แค่มีกันอยู่ตรงนี้', 'Có những mối giao cảm mang sự an nhiên của cố nhân — chẳng cần chứng minh, chỉ cần hiện diện.'],
  card_wealth_badge: ['丰盛坐标 · 财随善流', 'Abundance Coordinate · Generous Flow', "Coordonnée d'Abondance · Flux Généreux", 'Coordenada de Abundancia · Flujo Generoso', 'พิกัดความมั่งคั่ง · กระแสทรัพย์แห่งคุณค่า', 'Tọa Độ Thịnh Vượng · Dòng Chảy Thiện Tài'],
  card_quote_wealth: ['财富从不追随焦虑的抓取，它只流向丰盛与善意的方位。', 'Wealth never answers anxious grasping; it flows naturally toward abundance and grace.', "La richesse ne cède jamais à l'anxiété ; elle afflue naturellement vers l'abondance et la grâce.", 'La riqueza nunca responde al afán ansioso; fluye con naturalidad hacia la abundancia y la gracia.', 'ความมั่งคั่งไม่เคยวิ่งตามความกังวล แต่จะไหลรินสู่พิกัดแห่งความอุดมสมบูรณ์และความปรารถนาดีเสมอ', 'Tài lộc chẳng chạy theo sự nắm giữ lo âu, mà tự nhiên hội tụ về phương vị của sự đủ đầy và thiện tâm.'],

    err_generic: ['暂时无法完成，请稍后重试', 'Something went wrong. Please try again later', 'Une erreur est survenue. Réessayez plus tard', 'Algo salió mal. Inténtalo más tarde', 'เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง', 'Có lỗi xảy ra. Vui lòng thử lại sau'],
  keywords_label: ['核心契合', 'Core resonance', 'Résonance essentielle', 'Resonancia esencial', 'จุดร่วมแก่น', 'Cộng hưởng cốt lõi'],
  card_title: ['幸福坐标卡', 'Happiness Coordinate Card', 'Carte des Coordonnées du Bonheur', 'Tarjeta de Coordenadas de la Felicidad', 'บัตรพิกัดความสุข', 'Thẻ Tọa Độ Hạnh Phúc'],
  card_save: ['保存坐标卡', 'Save coordinate card', 'Enregistrer la carte', 'Guardar la tarjeta', 'บันทึกบัตรพิกัด', 'Lưu thẻ tọa độ'],
  card_you: ['你', 'You', 'Vous', 'Tú', 'คุณ', 'Bạn'],
  card_partner: ['TA', 'Them', 'L’autre', 'La otra persona', 'เขา', 'Người ấy'],
  degraded_badge: ['日期级 · 上升未知', 'Date-level · Ascendant unknown', 'Niveau date · Ascendant inconnu', 'Nivel fecha · Ascendente desconocido', 'ระดับวัน · ไม่ทราบลัคนา', 'Cấp ngày · Chưa rõ Cung Mọc'],

  /* ── E156（主公军令 2026-11-25）：三场景长在双人输入页 / 黄金漏斗上的新增词条 ── */
  pill_romance: ['情爱坐标', 'Romance', 'Romance', 'Amor', 'ความรัก', 'Lãng mạn'],
  pill_business: ['商道共频', 'Business', 'Affaires', 'Negocios', 'ธุรกิจ', 'Kinh doanh'],
  pill_friendship: ['挚友同频', 'Friendship', 'Amitié', 'Amistad', 'มิตรภาพ', 'Hữu nghị'],
  pill_group: ['关系坐标', 'Relationship coordinate', 'Coordonnée du lien', 'Coordenada del vínculo', 'พิกัดความสัมพันธ์', 'Tọa độ mối quan hệ'],
  name_you: ['你的称呼（选填）', 'Your name (optional)', 'Votre nom (facultatif)', 'Tu nombre (opcional)', 'ชื่อของคุณ (เลือกได้)', 'Tên của bạn (không bắt buộc)'],
  name_ta: ['TA 的称呼（选填）', 'Their name (optional)', 'Son nom (facultatif)', 'Su nombre (opcional)', 'ชื่อของเขา (เลือกได้)', 'Tên người ấy (không bắt buộc)'],
  name_you_ph: ['我', 'Me', 'Moi', 'Yo', 'ฉัน', 'Tôi'],
  name_ta_ph: ['TA', 'Partner', 'Partenaire', 'Pareja', 'เขา', 'Người ấy'],
  /* ── ✦ E158（主公军令 2026-11-26）：三场景主按钮随胶囊换词（情爱不再复用 input.calculate「测算缘分」） ── */
  cta_unlock_romance: ['解锁情爱坐标', 'Unlock Romance Code', 'Déverrouiller Éros · Amour', 'Desbloquear Eros · Amor', 'ปลดล็อกพิกัดความรัก', 'Mở Khóa Tọa Độ Tình Ái'],
  cta_unlock_business: ['解锁商道共频', 'Unlock Alliance Code', 'Déverrouiller Philia · Alliance', 'Desbloquear Philia · Alianza', 'ปลดล็อกคลื่นพันธมิตร', 'Mở Khóa Tọa Độ Đồng Hành'],
  cta_unlock_friendship: ['解锁挚友同频', 'Unlock Kindred Code', 'Déverrouiller Storgê · Complicité', 'Desbloquear Storgé · Afinidad', 'ปลดล็อกคลื่นกัลยาณมิตร', 'Mở Khóa Tọa Độ Tri Kỷ'],
  // 情爱四维＝App.tsx DIM_LABELS 逐字镜像（坐标卡关键词用；卡片 9:16 空间紧 ⇒ 取短词）
  dim_romance: [['爱情', '沟通', '默契', '稳定'], ['Love', 'Communication', 'Chemistry', 'Stability'], ['Amour', 'Communication', 'Chimie', 'Stabilité'], ['Amor', 'Comunicación', 'Química', 'Estabilidad'], ['ความรัก', 'ความเข้าใจกัน', 'เคมี', 'รากฐาน'], ['Tình yêu', 'Thấu hiểu', 'Sức hút', 'Nền tảng']],
  dim_business: [['共振', '互补', '决策', '稳健'], ['Resonance', 'Complement', 'Decisions', 'Steadiness'], ['Résonance', 'Complémentarité', 'Décisions', 'Stabilité'], ['Resonancia', 'Complemento', 'Decisiones', 'Estabilidad'], ['ความร่วมชะตา', 'ความสมดุล', 'การตัดสินใจ', 'ความมั่นคง'], ['Cộng hưởng', 'Bổ trợ', 'Quyết đoán', 'Vững vàng']],
  dim_friendship: [['默契', '信任', '松弛', '长久'], ['Chemistry', 'Trust', 'Ease', 'Longevity'], ['Complicité', 'Confiance', 'Légèreté', 'Durabilité'], ['Complicidad', 'Confianza', 'Soltura', 'Durabilidad'], ['ความเข้าใจกัน', 'ความไว้ใจ', 'ความสบายใจ', 'ความยั่งยืน'], ['Đồng điệu', 'Tin cậy', 'Thoải mái', 'Bền lâu']],
  feat_business: [
    ['🌑 事业磁极共振分析', '🔥 角色分工与决策互补', '🌟 未来6个月合作窗口', '💫 共赢避坑校准建议（3条）'],
    ['🌑 Career-magnet resonance analysis', '🔥 Role split & decision complement', '🌟 6-month cooperation windows', '💫 Win-win pitfall calibration (3 tips)'],
    ['🌑 Analyse de résonance des aimants de carrière', '🔥 Répartition des rôles et décisions complémentaires', '🌟 Fenêtres de coopération sur 6 mois', '💫 Calibration gagnant-gagnant (3 conseils)'],
    ['🌑 Análisis de resonancia de polos profesionales', '🔥 Reparto de roles y decisiones complementarias', '🌟 Ventanas de cooperación a 6 meses', '💫 Calibración de riesgos win-win (3 consejos)'],
    ['🌑 วิเคราะห์การสั่นพ้องของขั้วอาชีพ', '🔥 การแบ่งบทบาทและการตัดสินใจที่เกื้อหนุนกัน', '🌟 หน้าต่างความร่วมมือ 6 เดือนข้างหน้า', '💫 คำแนะนำปรับจูน win-win 3 ข้อ'],
    ['🌑 Phân tích cộng hưởng hạt nhân sự nghiệp', '🔥 Phân vai và quyết định bổ trợ', '🌟 Khung hợp tác 6 tháng tới', '💫 3 lời khuyên hiệu chỉnh đôi bên cùng có lợi'],
  ],
  feat_friendship: [
    ['🌑 灵魂松弛与同频解析', '🔥 精神共鸣与情绪托底', '🌟 未来6个月相处气象', '💫 长久同频校准建议（3条）'],
    ['🌑 Soul ease & in-sync analysis', '🔥 Spiritual resonance & emotional anchoring', '🌟 6-month companionship weather', '💫 Long-term in-sync calibration (3 tips)'],
    ['🌑 Analyse de l’aisance et de la synergie des âmes', '🔥 Résonance d’esprit et soutien émotionnel', '🌟 Météo de compagnie sur 6 mois', '💫 Calibration durable de synergie (3 conseils)'],
    ['🌑 Análisis de soltura y sintonía del alma', '🔥 Resonancia espiritual y sostén emocional', '🌟 Clima de convivencia a 6 meses', '💫 Calibración de sintonía duradera (3 consejos)'],
    ['🌑 วิเคราะห์ความสบายใจและความตรงกันของจิตวิญญาณ', '🔥 การสั่นพ้องทางจิตใจและการรองรับอารมณ์', '🌟 สภาพอากาศการอยู่ร่วมกัน 6 เดือน', '💫 คำแนะนำปรับจูนให้ตรงกันอย่างยั่งยืน 3 ข้อ'],
    ['🌑 Phân tích sự an nhiên và đồng điệu của tâm hồn', '🔥 Cộng hưởng tinh thần và điểm tựa cảm xúc', '🌟 Khí tượng bầu bạn 6 tháng tới', '💫 3 lời khuyên hiệu chỉnh đồng điệu lâu dài'],
  ],
  /* ✦ E158（主公军令 2026-11-26）：月/年报按钮摒弃「姻缘月报/年报」「关系月报/年报」⇒ 三场景一一对应；
     旧 btn_monthly_scene / btn_yearly_scene / al_monthly_scene / al_yearly_scene 四键退役。 */
  btn_monthly_romance: ['解锁情爱月报', 'Unlock Romance Monthly', 'Mensuel · Amour', 'Mensual · Amor', 'ปลดล็อกรายเดือนความรัก', 'Báo Cáo Tháng Tình Ái'],
  btn_annual_romance: ['解锁情爱年报', 'Unlock Romance Annual', 'Annuel · Amour', 'Anual · Amor', 'ปลดล็อกรายปีความรัก', 'Báo Cáo Năm Tình Ái'],
  btn_monthly_business: ['解锁商道月报', 'Unlock Alliance Monthly', 'Mensuel · Alliance', 'Mensual · Alianza', 'ปลดล็อกรายเดือนพันธมิตร', 'Báo Cáo Tháng Đồng Hành'],
  btn_annual_business: ['解锁商道年报', 'Unlock Alliance Annual', 'Annuel · Alliance', 'Anual · Alianza', 'ปลดล็อกรายปีพันธมิตร', 'Báo Cáo Năm Đồng Hành'],
  btn_monthly_friendship: ['解锁挚友月报', 'Unlock Kindred Monthly', 'Mensuel · Complicité', 'Mensual · Afinidad', 'ปลดล็อกรายเดือนกัลยาณมิตร', 'Báo Cáo Tháng Tri Kỷ'],
  btn_annual_friendship: ['解锁挚友年报', 'Unlock Kindred Annual', 'Annuel · Complicité', 'Anual · Afinidad', 'ปลดล็อกรายปีกัลยาณมิตร', 'Báo Cáo Năm Tri Kỷ'],
  // 付费墙「今日限时加赠 · 实时塔罗牌阵」副标题按场景微调（情爱沿用 PaywallCard 既有词条 bonusDetail）
  tarot_bonus_detail_business: ['洞察此刻合作局势的隐性变量', 'See the hidden variables in your current alliance', 'Lisez les variables cachées de votre alliance actuelle', 'Detecta las variables ocultas de tu alianza actual', 'มองเห็นตัวแปรแฝงในการร่วมมือ ณ ตอนนี้', 'Thấy những biến số ẩn trong mối đồng hành hiện tại'],
  tarot_bonus_detail_friendship: ['洞悉此刻朋友间没说出口的心事', 'Sense what your friend leaves unsaid right now', 'Percevez ce que votre ami tait en ce moment', 'Siente lo que tu amigo no dice ahora mismo', 'รับรู้สิ่งที่เพื่อนไม่ได้พูดออกมาในตอนนี้', 'Cảm nhận điều người bạn chưa nói ra lúc này'],
  // 单活手风琴：收起态折叠条右侧「展开重温」标签（报告标题由 btn_* 键去动词前缀派生，零重复词条）
  report_unlocked_reopen: ['已解锁 · 点击展开重温', 'Unlocked · Tap to Reopen', 'Débloqué · Rouvrir', 'Desbloqueado · Reabrir', 'ปลดล็อกแล้ว · แตะเพื่ออ่านอีกครั้ง', 'Đã mở khóa · Chạm để xem lại'],
  scene_switch: ['切换坐标', 'Switch coordinate', 'Changer de coordonnée', 'Cambiar de coordenada', 'สลับพิกัด', 'Đổi tọa độ'],
  /* ✦ E158-刀三：坐标卡唯一保存/分享按钮（/result 坐标卡预览下方黄色重复按钮退役；原「保存命盘金卡」位更名） */
  btn_save_share_card: ['保存 / 分享幸福坐标卡', 'Save / Share Coordinate Card', 'Enregistrer / Partager la Carte', 'Guardar / Compartir Tarjeta', 'บันทึก / แชร์การ์ดพิกัดความสุข', 'Lưu / Chia Sẻ Thẻ Tọa Độ'],
  card_wealth_keywords: [['天赋溢出', '丰盛流向', '松弛风控', '善财圆融'], ['Talent overflow', 'Abundant flow', 'Relaxed risk control', 'Generous wealth'], ['Débordement de talent', 'Flux d’abondance', 'Risques en douceur', 'Richesse généreuse'], ['Talento en abundancia', 'Flujo de abundancia', 'Riesgo sereno', 'Riqueza generosa'], ['พรสวรรค์ล้นเอบ', 'กระแสความมั่งคั่ง', 'ความเสี่ยงแบบสบายใจ', 'ทรัพย์แห่งคุณค่า'], ['Thiên phú tràn đầy', 'Dòng chảy thịnh vượng', 'Kiểm soát rủi ro an nhiên', 'Tài lộc thiện lành']],
  card_preview_title: ['幸福坐标卡预览', 'Happiness Coordinate Card preview', 'Aperçu de la carte du bonheur', 'Vista previa de la tarjeta de felicidad', 'ตัวอย่างบัตรพิกัดความสุข', 'Xem trước thẻ tọa độ hạnh phúc'],

  /* ── ⚖️ E157（主公军令 2026-11-26）：澳洲与国际合规护栏 · 军令钦定六语字典（逐字；严禁机翻） ──
     🔴 称呼去真名化引导（placeholder 专用；坐标卡缺省称呼仍取 name_you_ph / name_ta_ph ＝「我 / TA」）、
        合规定位声明（三处常驻小字）、协议禁限条款（Terms 末章；正文取 tos_prohibited_use_notice）。 */
  nickname_self_placeholder: ['你的昵称或代号（选填）', 'Your nickname (optional)', 'Votre surnom (facultatif)', 'Tu apodo (opcional)', 'ชื่อเล่นของคุณ (ไม่บังคับ)', 'Biệt danh của bạn (tùy chọn)'],
  nickname_partner_placeholder: ['TA 的昵称或代号（选填）', 'Their nickname (opt.)', 'Surnom (facultatif)', 'Su apodo (opc.)', 'ชื่อเล่นอีกฝ่าย (ไม่บังคับ)', 'Biệt danh họ (tùy chọn)'],
  // ✦ E159-刀六（主公军令 2026-11-27）：三场景易经标题 ＋ 年鉴已解锁直达态（六语逐字，严禁机翻）
  iching_heading_romance: ['姻缘解读', 'Romance Reading', 'Lecture Amour', 'Lectura de Amor', 'คำทำนายความรัก', 'Luận Giải Tình Ái'],
  iching_heading_business: ['商道解读', 'Alliance Reading', 'Lecture Alliance', 'Lectura de Alianza', 'คำทำนายพันธมิตร', 'Luận Giải Đồng Hành'],
  iching_heading_friendship: ['挚友解读', 'Kindred Reading', 'Lecture Complicité', 'Lectura de Afinidad', 'คำทำนายกัลยาณมิตร', 'Luận Giải Tri Kỷ'],
  btn_unlocked_view: ['已解锁 · 点击查看', 'Unlocked · View', 'Débloqué · Voir', 'Desbloqueado · Ver', 'ปลดล็อกแล้ว · เปิดอ่าน', 'Đã mở khóa · Xem'],
  /* ✦ E158（主公军令 2026-11-26 裁决）：placeholder 缩短措辞（不撑宽输入框）——六语零截断且保留「昵称/选填」引导 */
  consent_continue_note: ['点击上方按钮即表示你同意服务条款和隐私政策。', 'By continuing, you agree to our Terms of Service and Privacy Policy.', 'En continuant, vous acceptez nos Conditions et notre Politique de confidentialité.', 'Al continuar, aceptas nuestros Términos y Política de Privacidad.', 'การดำเนินการต่อถือว่าคุณยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว', 'Tiếp tục đồng nghĩa bạn đồng ý với Điều khoản và Chính sách bảo mật.'],
  tarot_gate_hint: ['请先解锁 $4.99 深度坐标报告，即可开启今日塔罗', 'Unlock the $4.99 full report first to access Today\'s Tarot', 'Débloquez d\'abord le rapport à 4,99 $ pour le Tarot du jour', 'Desbloquea primero el informe de $4.99 para el Tarot de hoy', 'ปลดล็อกรายงาน $4.99 ก่อน เพื่อเปิดไพ่ทาโรต์ประจำวัน', 'Mở khóa báo cáo $4.99 trước để xem Tarot hôm nay'],
  compliance_disclaimer_short: ['仅供文化探索、娱乐与自我觉察参考，不构成任何商业决策、金融、法律或人力资源建议。', 'For cultural exploration, entertainment, and personal reflection only. Not business, financial, legal, or HR advice.', 'À des fins d\'exploration culturelle, de divertissement et de réflexion personnelle uniquement. Ne constitue pas un conseil commercial, financier, juridique ou RH.', 'Solo para exploración cultural, entretenimiento y reflexión personal. No constituye asesoramiento comercial, financiero, legal ni de RR. HH.', 'เพื่อการสำรวจเชิงวัฒนธรรม ความบันเทิง และการทบทวนตนเองเท่านั้น ไม่ถือเป็นคำแนะนำทางธุรกิจ การเงิน กฎหมาย หรือการบริหารบุคคล', 'Chỉ nhằm mục đích khám phá văn hóa, giải trí và chiêm nghiệm bản thân; không cấu thành tư vấn kinh doanh, tài chính, pháp lý hay nhân sự.'],
  tos_prohibited_use_title: ['禁止用途与分享责任', 'Prohibited Uses & Sharing Responsibility', 'Usages interdits et responsabilité de partage', 'Usos prohibidos y responsabilidad al compartir', 'การห้ามใช้และความรับผิดชอบในการแชร์', 'Cấm sử dụng và trách nhiệm chia sẻ'],
  tos_prohibited_use_notice: ['本平台报告及坐标卡严禁用于招聘筛选、解雇、绩效考核、信贷评估或正式尽职调查；内容仅供本人私密参考，若自行对外转发或公开分享，相关责任由用户自行承担。', 'Reports and Coordinate Cards must not be used for hiring, termination, performance evaluation, credit scoring, or due diligence. Content is for personal reference only; users assume full responsibility for any third-party sharing or disclosure.', "Les rapports et Cartes de Coordonnées ne doivent pas être utilisés pour le recrutement, le licenciement, l'évaluation professionnelle, l'évaluation de crédit ou la diligence raisonnable. Contenu réservé à un usage personnel ; l'utilisateur assume l'entière responsabilité de tout partage avec des tiers.", 'Los informes y Tarjetas de Coordenadas no deben usarse para contratación, despido, evaluación laboral, evaluación crediticia ni debida diligencia. El contenido es solo para referencia personal; el usuario asume toda responsabilidad por compartirlo con terceros.', 'ห้ามนำรายงานและการ์ดพิกัดไปใช้ในการคัดเลือกพนักงาน เลิกจ้าง ประเมินผลงาน พิจารณาสินเชื่อ หรือการตรวจสอบสถานะทางธุรกิจ เนื้อหามีไว้เพื่อการอ้างอิงส่วนบุคคลเท่านั้น ผู้ใช้ต้องรับผิดชอบต่อการเผยแพร่หรือส่งต่อให้บุคคลที่สามด้วยตนเอง', 'Nghiêm cấm sử dụng báo cáo và Thẻ Tọa Độ cho tuyển dụng, sa thải, đánh giá nhân sự, thẩm định tín dụng hoặc thẩm định pháp lý. Nội dung chỉ mang tính tham khảo cá nhân; người dùng tự chịu hoàn toàn trách nhiệm khi chia sẻ cho bên thứ ba.'],
};

/** 取词：缺键/缺语种 ⇒ zh 兜底再 ⇒ 键名（绝不机翻） */
export function resT(lang, key) {
  const L = String(lang || 'zh').toLowerCase().split('-')[0];
  const row = D[key];
  if (!row) return key;
  const i = RES_LANGS.indexOf(L);
  return (i !== -1 && row[i]) ? row[i] : row[0];
}

/* ── ✦ E158（主公军令 2026-11-26）派生助手：月/年报按钮＝场景名＋价格后缀（价格永驻，E85-② 沿革）；
      fr/es 小数逗号与 paywallPriceContract 同口径；折叠条标题＝去动词前缀。零新增词条。 ── */
const E158_PRICE = Object.freeze({
  monthly: Object.freeze({ zh: ' $2.99/月', en: ' $2.99/mo', fr: ' $2,99/mois', es: ' $2,99/mes', th: ' $2.99/เดือน', vi: ' $2.99/tháng' }),
  yearly: Object.freeze({ zh: ' $29.99/年', en: ' $29.99/yr', fr: ' $29,99/an', es: ' $29,99/año', th: ' $29.99/ปี', vi: ' $29.99/năm' }),
});
const E158_LANG = (lang) => { const i = RES_LANGS.indexOf(String(lang || 'zh').toLowerCase().split('-')[0]); return i === -1 ? 0 : i; };
const E158_SCENE = (scene) => (scene === 'business' || scene === 'friendship') ? scene : 'romance';
const E158_KIND = (kind) => (kind === 'yearly' || kind === 'annual') ? 'annual' : 'monthly';

/** 场景月/年报按钮文案（含价格）：解锁情爱月报 $2.99/月 */
export function resReportBtn(lang, scene, kind) {
  const k = E158_KIND(kind);
  return resT(lang, `btn_${k}_${E158_SCENE(scene)}`) + E158_PRICE[k === 'annual' ? 'yearly' : 'monthly'][RES_LANGS[E158_LANG(lang)]];
}
/** 年鉴区按钮（📅 月报 / 👑 年报；纯金额、不带周期后缀——与情爱档 L_ALMANAC_BTN 同形） */
export function resAlmanacBtn(lang, scene, kind) {
  const k = E158_KIND(kind);
  const price = E158_PRICE[k === 'annual' ? 'yearly' : 'monthly'][RES_LANGS[E158_LANG(lang)]];
  return `${k === 'annual' ? '👑' : '📅'} ${resT(lang, `btn_${k}_${E158_SCENE(scene)}`)}${price.split('/')[0]}`;
}
/** 折叠条标题：去「解锁」动词前缀 ⇒ 情爱月报 / Romance Monthly / Mensuel · Amour … */
export function resReportTitle(lang, scene, kind) {
  const k = E158_KIND(kind);
  const btn = resT(lang, `btn_${k}_${E158_SCENE(scene)}`);
  return btn.replace(/^(解锁|Unlock\s+|ปลดล็อก)/, '').trim();
}
/** 同意句切分：返回 [前段, 条款标签, 中段, 隐私标签, 尾段]（链接标签按语种在句中定位；定位失败 ⇒ null，调用方渲染纯文本） */
const E158_LEGAL_LINKS = Object.freeze({
  zh: ['服务条款', '隐私政策'], en: ['Terms of Service', 'Privacy Policy'],
  fr: ['Conditions', 'Politique de confidentialité'], es: ['Términos', 'Política de Privacidad'],
  th: ['ข้อกำหนด', 'นโยบายความเป็นส่วนตัว'], vi: ['Điều khoản', 'Chính sách bảo mật'],
});
export function splitConsentNote(lang) {
  const note = resT(lang, 'consent_continue_note');
  const labels = E158_LEGAL_LINKS[String(lang || 'zh').toLowerCase().split('-')[0]] || E158_LEGAL_LINKS.en;
  const a = note.indexOf(labels[0]);
  const b = note.indexOf(labels[1], a + 1);
  if (a === -1 || b === -1) return null;
  return [note.slice(0, a), labels[0], note.slice(a + labels[0].length, b), labels[1], note.slice(b + labels[1].length)];
}

/** 折叠条文案切分：'已解锁 · 点击展开重温' ⇒ ['已解锁', '展开重温 ▼']（刀八字典单值拆两截；
 *  zh 去「点击」口语前缀；其余语种按「 · 」切分；切分失败 ⇒ [原文, '▼']） */
export function splitReopenLabel(lang) {
  const raw = resT(lang, 'report_unlocked_reopen');
  const parts = String(raw).split(' · ');
  if (parts.length < 2) return [raw, '▼'];
  const L = String(lang || 'zh').toLowerCase().split('-')[0];
  let reopen = parts.slice(1).join(' · ');
  if (L === 'zh' && reopen.startsWith('点击')) reopen = reopen.slice(2);
  return [parts[0], `${reopen} ▼`];
}

/** 军令钦定键集（闸门镜像用） */
export const RESONANCE_MANDATED_KEYS = Object.freeze([
  'res_title', 'scene_romance_title', 'scene_romance_sub', 'scene_business_title', 'scene_business_sub',
  'scene_friendship_title', 'scene_friendship_sub', 'card_quote_romance', 'card_quote_business',
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
