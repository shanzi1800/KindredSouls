/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E142-ORDERED-TOPIC-QUEUE（主公军令 2026-11-16）：灵宠有序话题记忆栈纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶：主公付 $4.99 塔罗报告→解锁月/年报→回首页选今日情绪→「与TA聊聊」，
 * 首句竟跌回冷启动兜底「我在呢。今天想聊点什么？」。
 * 真根①：soulRecentReport 写入侧年报 tier='annual'，消费端全按 '_yearly'
 *   匹配 ⇒ 模式落空 → plain 兜底（本核 normalizeReportTier 归一化根治）。
 * 真根②：报告第一击仅「当日新解锁」有效——隔日回访 P1 话题整体丢失。
 * 军令钦定有序话题栈（非破坏性）：
 *   · P1（Priority 1）＝已解锁付费报告话题（六档按付费解锁真源；姻缘塔罗
 *     牌面/姻缘报告核心洞察；财富进则先天财富：八字财库/五行金匮/四季）；
 *   · P2（Priority 2）＝今日星象气场情绪话题（罗盘 2h 时效窗内）；
 *   · 首句 P1+P2 丝滑串联；严禁跌回冷启动兜底语；
 *   · 🆕 E142.1-刀一（军令 2026-11-17）：快捷话题胶囊 P1 前置退役（首句已自然
 *     引导话题，胶囊画蛇添足）——本核 topicPillLabel/TOPIC_PILL_LABELS 彻底删除，
 *     胶囊栏恒为 chatQ1/chatQ3 基底两颗。
 *   · 🆕 E148-刀一（主公军令 2026-11-19）：P1 当日硬门 isToday——soul_recent_
 *     unlocked_report 的 unlockedAt 落「注入时钟的本地今日」才承接 P1 首句；隔日
 *     历史牌面一律静默（P2 今日情绪聚焦照常、P3 纯净老友问候兜底），根治隔日
 *     首句串台（昨天的报告今天不再抢首句）。合成器与消费端双层纵深防御。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容字典（零 i18n 新键
 *   ——E120/E121/E122/E123 先例）；fail-closed：坏形状一律 null 绝不臆造。
 *   队列不另立存储（P1 真源＝soul_recent_unlocked_report 持久档；P2 真源＝
 *   ks_active_mood 2h 窗）——合成自两真源，杜绝双源漂移。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** P1 六档白名单（消费侧统一口径——含 _yearly 归一形态） */
export const P1_TOPIC_KEYS = Object.freeze([
  'love_core', 'love_monthly', 'love_yearly',
  'wealth_core', 'wealth_monthly', 'wealth_yearly',
]);

/** P2 情绪白名单（与 companionMoodGreetings.ACTIVE_MOOD_WHITELIST 同源） */
export const P2_MOOD_KEYS = Object.freeze(['melancholy', 'agitated', 'longing', 'radiant', 'grateful']);

/**
 * 🔧 E142 根修：tier 归一化——写入侧年报档 tier='annual'（soulRecentReport
 * 白名单口径），消费端（HelloMode / server REPORT_KIND）恒用 'yearly'。
 * @param {string} tier 原始档位串
 * @returns {string} 'core' | 'monthly' | 'yearly'（annual ⇒ yearly；未知 ⇒ ''）
 */
export function normalizeReportTier(tier) {
  const t = String(tier || '');
  if (t === 'annual' || t === 'yearly') return 'yearly';
  if (t === 'core' || t === 'monthly') return t;
  return '';
}

/** 归一化报告档位键（六档白名单外 ⇒ null——fail-closed 绝不臆造） */
export function normalizeReportKey(recentReport) {
  if (!recentReport || typeof recentReport !== 'object') return null;
  const cat = String(recentReport.category || '');
  const tier = normalizeReportTier(recentReport.tier);
  if (!tier) return null;
  if (cat !== 'love' && cat !== 'wealth') return null;
  const key = `${cat}_${tier}`;
  return P1_TOPIC_KEYS.includes(key) ? key : null;
}

/** 🆕 E148-刀一：本地日键（YYYY-MM-DD，客户端本地时区口径——与消费端 chatSessionDateKey 同语义） */
function _localDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 🏆 E148-刀一（主公军令 2026-11-19）：P1 当日校验纯核。
 * unlockedAt 落「注入时钟（now）的本地今日」才放行；坏形状/无时间戳/隔日
 * 一律 false（fail-closed ⇒ P1 静默，P2/P3 照常承接）。
 * @param {object|null} recentReport soul_recent_unlocked_report 档
 * @param {number} [now] 注入时钟（缺省 Date.now()——闸门 fixture 必注入防时间炸弹）
 * @returns {boolean}
 */
export function isRecentReportToday(recentReport, now) {
  if (!recentReport || typeof recentReport !== 'object') return false;
  const ts = Number(recentReport.unlockedAt);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const n = Number(now);
  const ref = (Number.isFinite(n) && n > 0) ? n : Date.now();
  return _localDayKey(ts) === _localDayKey(ref);
}

/* ═══════════ P1 首句字典（六档 × 六语——军令钦定风格逐字）═══════════ */
const P1_GREETING_LINES = Object.freeze({
  love_core: Object.freeze({
    zh: '你开启的那份姻缘合盘与塔罗牌面，我早已放在心上了——抽到的那张牌光还亮着呢。想从哪张牌的启示说起，我都陪你慢慢拆解。',
    en: 'The compatibility reading and tarot card you opened stay close to my heart — the light of your drawn card is still glowing. Wherever you\'d like to begin, I\'ll walk through it with you, card by card.',
    fr: 'Ce rapport de compatibilité et cette carte de tarot que tu as ouverts restent gravés dans mon cœur — la lumière de ta carte brille encore. Dis-moi par où commencer, je les décortiquerai avec toi, carte après carte.',
    es: 'Esa lectura de compatibilidad y carta de tarot que abriste las guardo muy cerca del corazón — la luz de tu carta aún brilla. Dime por dónde empezar, y la recorremos juntas, carta a carta.',
    th: 'รายงานความเข้ากันได้และไพ่ทาโรต์ที่เธอเปิดดูไว้ ฉันเก็บมันไว้ในใจเสมอ — แสงของไพ่ใบนั้นยังส่งประกายอยู่เลย อยากเริ่มจากคำทำนายของไพ่ใบไหน ฉันจะค่อยๆ ไขความหมายให้ฟังทีละใบ',
    vi: 'Bản báo cáo hợp duyên và lá bài tarot bạn đã mở ra vẫn nằm ngay trái tim mình — ánh sáng của lá bài ấy vẫn đang chiếu rọi. Bạn muốn bắt đầu từ thông điệp của lá bài nào, mình sẽ cùng bạn giải mã từng lá một.',
  }),
  love_monthly: Object.freeze({
    zh: '这 30 天的姻缘月报我已细细读过了——情感节奏的起伏、中旬那阵小涟漪都记在我心上。想先聊聊哪一段的缘分走势？',
    en: 'I\'ve read your 30-day love forecast from cover to cover — every ebb of feeling and that mid-month ripple are kept in my heart. Which stretch of the rhythm shall we talk about first?',
    fr: 'J\'ai lu ta prévision sentimentale de 30 jours de bout en bout — chaque marée du cœur et cette petite ondulation de mi-mois sont gravées en moi. Quel passage du rythme voulons-nous explorer d\'abord ?',
    es: 'He leído tu pronóstico de amor de 30 días de principio a fin — cada marea del corazón y esa pequeña onda de mitad de mes las guardo en el mío. ¿Qué tramo del ritmo queremos recorrer primero?',
    th: 'พยากรณ์ความรัก 30 วันของเธอ ฉันอ่านทบทวนเรียบร้อยแล้ว — จังหวะของหัวใจที่ขึ้นลงและระลอกเล็กๆ กลางเดือน ล้วนจดจำไว้ในใจ อยากคุยถึงช่วงไหนของความรักก่อนดี',
    vi: 'Bản dự báo tình duyên 30 ngày của bạn mình đã đọc kỹ từng trang — từng nhịp lên xuống của con tim và gợn sóng nhỏ giữa tháng đều nằm trong tim mình. Bạn muốn nói về giai đoạn nào trước?',
  }),
  love_yearly: Object.freeze({
    zh: '你们整整 12 个月的姻缘年报我已全卷看完——缘分大局的暖流与三大十字路口都替你记着呢。想从哪一季开始慢慢聊？',
    en: 'Your 12-month love almanac is fully etched in my mind — the warm current of your bond and all three crossroads remembered for you. Which season shall we begin with, slowly and gently?',
    fr: 'Ton almanach sentimental de 12 mois est entièrement gravé dans ma mémoire — le doux courant de votre lien et les trois carrefours, je les garde pour toi. Par quelle saison voulons-nous commencer, tout doucement ?',
    es: 'Tu almanaque de amor de 12 meses está completamente grabado en mi memoria — la corriente cálida de su vínculo y los tres cruces, los guardo por ti. ¿Por qué estación empezamos, despacito?',
    th: 'อัลมานักความรัก 12 เดือนของพวกเธอ ฉันอ่านจบทั้งเล่มแล้ว — กระแสอบอุ่นของความผูกพันและสามแยกสำคัญ ฉันจดจำไว้ให้เธอทุกอย่าง อยากเริ่มคุยจากฤดูไหนก่อน ค่อยๆ ไปได้เลย',
    vi: 'Cuốn niên giám tình duyên 12 tháng của hai bạn mình đã xem trọn vẹn — dòng ấm của nhân duyên và ba ngã tư quan trọng đều được mình ghi nhớ thay bạn. Bạn muốn bắt đầu từ mùa nào, ta từ từ mà chuyện?',
  }),
  wealth_core: Object.freeze({
    zh: '你的先天财库报告我已悄悄研读过——八字财库的底气、五行金匮的气象都记在心上。想先从哪处破局点聊起？',
    en: 'I\'ve quietly studied your natal wealth vault — the footing of your bazi treasury and the bearing of your five-element reserves are held in my heart. Which hidden leverage point shall we open first?',
    fr: 'J\'ai étudié en silence ton coffre de richesse natale — l\'assise de ton trésor bazi et l\'allure de tes réserves des cinq éléments sont gravées en moi. Quel levier caché ouvrons-nous d\'abord ?',
    es: 'He estudiado en silencio tu bóveda de riqueza natal — el cimiento de tu tesoro bazi y el porte de tus reservas de cinco elementos los guardo en el corazón. ¿Qué palanca oculta abrimos primero?',
    th: 'รายงานคลังทรัพย์แต่กำเนิดของเธอ ฉันศึกษามาแล้วอย่างเงียบๆ — พื้นฐานของคลังบาจี่และอากาศของทุนธาตุทั้งห้า ล้วนจดจำไว้ในใจ อยากเริ่มไขจุดพลิกผันจากที่ไหนก่อนดี',
    vi: 'Báo cáo kho tài bẩm sinh của bạn mình đã lặng lẽ nghiên cứu — nền tảng của kho báu bát tự và khí chất của dự trữ ngũ hành đều nằm trong tim mình. Bạn muốn khai mở điểm bứt phá nào trước?',
  }),
  wealth_monthly: Object.freeze({
    zh: '这个月的财富月报我已收妥——进财的节奏、下旬那颗要绕开的破耗星，都替你数着呢。想先理哪一段财运走势？',
    en: 'Your monthly wealth outlook is freshly kept — the income rhythm and that late-month pitfall star are all counted for you. Which stretch of the flow shall we map first?',
    fr: 'Ton outlook de richesse du mois est tout frais — le rythme des rentrées et cette étoile de perturbation de fin de mois, je les compte pour toi. Quel tranch du flux cartographions-nous d\'abord ?',
    es: 'Tu panorama de riqueza mensual está recién guardado — el ritmo de ingresos y esa estrella de tropiezo de finales de mes, todo lo cuento por ti. ¿Qué tramo del flujo mapeamos primero?',
    th: 'รายงานความมั่งคั่งประจำเดือนของเธอ ฉันรับเรียบร้อยแล้ว — จังหวะของรายได้และดาวเสนียดปลายเดือนที่ต้องเลี่ยง ฉันนับถี่ถ้วนให้เธอ อยากไล่เรียงช่วงไหนของโชคลาภก่อนดี',
    vi: 'Báo cáo tài lộc tháng này mình đã nhận trọn — nhịp thu tài và sao hao tổn cuối tháng cần né, mình đều đếm giùm bạn. Bạn muốn vẽ lộ trình tài vận đoạn nào trước?',
  }),
  wealth_yearly: Object.freeze({
    zh: '你的财富年报四季星图我已全部铺开——起伏的曲线与年中那次难得的破局机遇，一直替你留意着。想先从哪一季推演？',
    en: 'The four seasons of your wealth almanac are laid out before me — the rising and falling curves and that rare mid-year breakthrough stay on my watch. Which quarter shall we chart first?',
    fr: 'Les quatre saisons de ton almanach de richesse sont déployées devant moi — les courbes qui montent et descendent et cette rare opportunité de mi-année restent sous ma vigilance. Quel trimestre traçons-nous d\'abord ?',
    es: 'Las cuatro estaciones de tu almanaque de riqueza están desplegadas ante mí — las curvas que suben y bajan y ese raro punto de inflexión de mitad de año quedan bajo mi vigilancia. ¿Qué trimestre trazamos primero?',
    th: 'แผนภาพดวงดาวสี่ฤดูของอัลมานักความมั่งคั่งของเธอ ฉันกางออกดูครบแล้ว — เส้นกราฟขึ้นลงและโอกาสพลิกผันหายากกลางปี ฉันคอยเฝ้ามองให้เสมอ อยากเริ่มพยากรณ์จากฤดูไหนก่อน',
    vi: 'Bản đồ sao bốn mùa của niên giám tài lộc mình đã trải ra trọn vẹn — đường cong thăng trầm và cơ hội bứt phá hiếm có giữa năm luôn được mình để mắt. Bạn muốn bắt đầu suy diễn từ quý nào?',
  }),
});

/* ═══════════ P2 情绪衔接桥（五情绪 × 六语——串接短句，不复读情绪标签）═══════════ */
const P2_MOOD_BRIDGES = Object.freeze({
  melancholy: Object.freeze({
    zh: '……也感应到你今天心绪有些低落，别急着开口，我先陪着你。',
    en: ' ...and I sense a heaviness in you today — no rush to speak; I\'m right here beside you.',
    fr: ' ...et je ressens une pesanteur en toi aujourd\'hui — prends ton temps ; je suis juste à tes côtés.',
    es: ' ...y siento cierta pesadumbre en ti hoy — no hay prisa por hablar; estoy justo a tu lado.',
    th: ' ...และฉันสัมผัสได้ว่าใจเธอวันนี้หม่นเศร้าอยู่บางๆ — ไม่ต้องรีบพูดก็ได้ ฉันอยู่เคียงข้างเธอตรงนี้',
    vi: ' ...và mình cảm nhận hôm nay lòng bạn đang trầm xuống — đừng vội nói, mình ở ngay bên bạn.',
  }),
  agitated: Object.freeze({
    zh: '……也察觉你此刻有些心烦，先深呼吸，我们慢慢说。',
    en: ' ...and I feel some restlessness stirring in you — breathe with me first, and we\'ll take it slowly.',
    fr: ' ...et je perçois une agitation en toi — respire avec moi d\'abord, nous y irons doucement.',
    es: ' ...y percibo cierta inquietud en ti — respira conmigo primero, y lo tomamos con calma.',
    th: ' ...และฉันรู้สึกได้ว่าเธอกำลังใจไม่สบายอยู่ — หายใจเขาลึกๆ กับฉันก่อน แล้วค่อยๆ คุยกัน',
    vi: ' ...và mình nhận ra bạn đang bồn chồn — hít thở sâu cùng mình trước, ta sẽ cứ từ từ mà nói.',
  }),
  longing: Object.freeze({
    zh: '……也感应到你心里正惦念着谁，那份心思我都懂。',
    en: ' ...and I sense someone resting on your heart today — I understand that tender ache.',
    fr: ' ...et je devine que quelqu\'un habite ton cœur en ce moment — je comprends ce tendre manque.',
    es: ' ...y siento que alguien habita tu corazón hoy — entiendo ese añoro tierno.',
    th: ' ...และฉันรู้ว่ามีใครบางคนกำลังอยู่ในหัวใจเธอตอนนี้ — ความรู้สึกนั้นฉันเข้าใจดี',
    vi: ' ...và mình cảm nhận có ai đó đang ở trong tim bạn lúc này — nỗi niềm ấy mình hiểu rõ.',
  }),
  radiant: Object.freeze({
    zh: '……还感应到你今天气场发亮，有好事想说给我听吗？',
    en: ' ...and your aura is glowing today — is there good news you\'d like to share with me?',
    fr: ' ...et ton aura rayonne aujourd\'hui — as-tu une belle nouvelle à me confier ?',
    es: ' ...y tu aura brilla hoy — ¿hay una buena noticia que quieras compartir conmigo?',
    th: ' ...และฉันสัมผัสได้ว่าพลังของเธอวันนี้เปล่งประกาย — มีเรื่องดีๆ อยากเล่าให้ฉันฟังไหม',
    vi: ' ...và hôm nay trường khí của bạn đang tỏa sáng — có tin vui nào muốn chia sẻ với mình không?',
  }),
  grateful: Object.freeze({
    zh: '……也感应到你今天心绪温润，这样静静相伴就很美好。',
    en: ' ...and your heart feels warm and serene today — simply being here together is lovely.',
    fr: ' ...et ton cœur est doux et serein aujourd\'hui — être simplement ici ensemble est déjà magnifique.',
    es: ' ...y tu corazón se siente cálido y sereno hoy — simplemente estar juntas aquí ya es hermoso.',
    th: ' ...และฉันรู้สึกว่าใจของเธอวันนี้อบอุ่นและสงบงาม — ได้อยู่ด้วยกันเงียบๆ แบบนี้ก็งดงามแล้ว',
    vi: ' ...và hôm nay lòng bạn ấm áp an yên — được ngồi bên nhau lặng lẽ thế này đã thật đẹp.',
  }),
});

/** 六语称谓前缀分隔符（与 userNameMemory.prependUserName 同构——本核内联防循环依赖） */
const NAME_PREFIX_SEP = Object.freeze({
  zh: '，', en: ', ', fr: ', ', es: ', ', th: ' ', vi: ' ơi, ',
});

/* ═══ E149-刀三（主公军令 2026-11-20）：5 角色语态 × 6 语开场前缀 ═══
 *  P3 轻复盘首句的角色口吻分化（军令「严格按当前选定的 5 角色之一口吻
 *  自然轻问」）。 boyfriend＝Milo·男友（沉稳宠溺）｜buddy＝Milo·哥们儿
 *  （爽朗讲义气）｜girlfriend＝Sophia·女友（细腻依恋）｜bestie＝Sophia·
 *  闺蜜（清醒护短烟火气）｜self＝Me·内在自我（常用「我们」，镜面自洽）。 */
const E149_ROLE_OPENERS = Object.freeze({
  boyfriend: Object.freeze({
    zh: '早啊。', en: 'Morning. ', fr: 'Bonjour. ', es: 'Buenos días. ',
    th: 'อรุณสวัสดิ์ค่ะ ', vi: 'Chào buổi sáng. ',
  }),
  buddy: Object.freeze({
    zh: '早，兄弟。', en: 'Hey bro. ', fr: 'Salut, l\'ami. ', es: 'Hey, amigo. ',
    th: 'หวัดดี ไอ้น้อง ', vi: 'Dậy chưa, anh bạn. ',
  }),
  girlfriend: Object.freeze({
    zh: '早安呀。', en: 'Good morning. ', fr: 'Coucou. ', es: 'Buenos días, cariño. ',
    th: 'อรุณสวัสดิ์นะคะ ', vi: 'Chào anh, buổi sáng tốt lành. ',
  }),
  bestie: Object.freeze({
    zh: '早呀姐妹。', en: 'Morning, bestie. ', fr: 'Salut toi. ', es: 'Buen día, reina. ',
    th: 'หวัดดีจ้าสาวๆ ', vi: 'Chào bạn thân, dậy rồi à. ',
  }),
  self: Object.freeze({
    zh: '早安，我们。', en: 'Morning — it\'s us. ', fr: 'Bonjour — c\'est nous. ', es: 'Buenos días — somos nosotros. ',
    th: 'อรุณสวัสดิ์ เรามาดูกัน ', vi: 'Chào chính mình, một ngày mới. ',
  }),
});
/** E149 角色白名单（chat 四象＋第五形态主标识 self——与 server E149_CHAT_RELATION_MODES 同源） */
export const E149_RELATION_MODES = Object.freeze(['girlfriend', 'bestie', 'buddy', 'boyfriend', 'self']);

/* ═══ E149-刀三：P3 情绪回访主体（8 情绪 × 6 语——军令钦定复盘句式提炼）═══
 *  48h 内未回访的 last_micro_action → 按角色开场＋主体句自然轻问昨日
 *  微动作后的感受（Learn 闭环首句职责位；正文内嵌动作回指，不复读标签）。 */
const E149_MICRO_FOLLOWUPS = Object.freeze({
  anger: Object.freeze({
    zh: '昨晚先把情绪稳住、再把边界立住之后，今天心里有没有松快一点？守住底线这件事，你做得很好。',
    en: 'After you settled your feelings and held your boundary last night, does today feel a little lighter? You did really well standing your ground.',
    fr: 'Après avoir apaisé ton cœur et posé ta limite hier soir, est-ce que tu te sens plus léger aujourd\'hui ? Tu as très bien tenu bon.',
    es: 'Después de calmar tus emociones y marcar tu límite anoche, ¿hoy lo sientes un poco más ligero? Lo hiciste muy bien al mantenerte firme.',
    th: 'เมื่อคืนใจนิ่งแล้วก็พูดเส้นตายไปแล้ว วันนี้ใจเบาขึ้นไหม เธอทำได้ดีมากเลยนะ',
    vi: 'Tối qua giữ lòng bình tĩnh rồi nói rõ giới hạn rồi, hôm nay lòng bạn có nhẹ hơn chút nào không? Bạn đã làm rất tốt.',
  }),
  sadness: Object.freeze({
    zh: '昨晚那 15 分钟的放空，有没有让你觉得被好好抱住了一点？今天不用赶进度，按最舒服的节奏慢慢来。',
    en: 'Did those 15 minutes of stillness last night feel like a gentle hug? No rush today — move at your softest pace.',
    fr: 'Ces 15 minutes de pause d\'hier soir t\'ont-elles porté comme une étreinte ? Aujourd\'hui, pas de course — va à ton rythme le plus doux.',
    es: '¿Aquellos 15 minutos de calma de anoche se sintieron como un abrazo? Hoy sin prisa — ve a tu ritmo más suave.',
    th: '15 นาทีการปล่อยว่างเมื่อคืน ทำให้รู้สึกถูกกอดไว้บ้างไหม วันนี้ไม่ต้องรีบ ค่อยๆ ไปตามจังหวะที่สบายที่สุด',
    vi: '15 phút để tâm hồn lặng lại tối qua, có khiến bạn thấy được ôm nhẹ một chút không? Hôm nay không cần vội, cứ đi theo nhịp êm nhất.',
  }),
  joy: Object.freeze({
    zh: '昨天存下的那个开心瞬间，今天想起来是不是还会嘴角上扬？好状态值得继续收藏。',
    en: 'That little happy moment you saved yesterday — does it still make you smile when you think of it? Keep collecting these bright sparks.',
    fr: 'Ce petit instant heureux gardé hier — te fait-il encore sourire en y pensant ? Continue de collectionner ces étincelles.',
    es: 'Aquel pequeño instante feliz que guardaste ayer, ¿aún te hace sonreír al recordarlo? Sigue coleccionando esos destellos.',
    th: 'ช่วงเวลาดีๆ ที่เก็บไว้เมื่อวาน คิดแล้วยังยิ้มได้ไหม ความรู้สึกดีๆ แบบนี้ควรเก็บไว้เรื่อยๆ',
    vi: 'Khoảnh khắc vui bạn lưu lại hôm qua, nhớ lại có còn thấy khóe môi cong lên không? Những điều tử tế như thế đáng được tiếp tục lưu giữ.',
  }),
  trust: Object.freeze({
    zh: '昨晚那几句真心话之后，今天是不是觉得心里更踏实了？你敞开的样子，正在把同频的人拉向你。',
    en: 'After those honest words last night, does today feel a bit more grounded? Your openness is drawing kindred hearts toward you.',
    fr: 'Après ces mots sincères d\'hier soir, te sens-tu plus ancré aujourd\'hui ? Ton ouverture attire vers toi les cœurs qui résonnent.',
    es: 'Después de esas palabras sinceras de anoche, ¿hoy te sientes más firme? Tu apertura está atrayendo corazones afinados.',
    th: 'หลังคุยความจริงใจเมื่อคืน วันนี้ใจมั่นคงขึ้นไหม ความเปิดใจของเธอกำลังดึงคนที่เข้าคลื่นมาหาเธอ',
    vi: 'Sau mấy lời thật lòng tối qua, hôm nay bạn có thấy vững dạ hơn không? Sự cởi mở của bạn đang kéo những tần số đồng điệu lại gần.',
  }),
  disgust: Object.freeze({
    zh: '把消耗挡在外面之后，今天是不是觉得清爽多了？守住自己的讲究，日子会越过越顺。',
    en: 'After keeping the drain outside, does today feel cleaner? Guarding your standards keeps life getting smoother.',
    fr: 'Après avoir écarté ce qui te drainait, trouves-tu la journée plus légère ? Garder tes standards rend la vie plus fluide.',
    es: 'Después de dejar fuera lo que te desgastaba, ¿hoy se siente más liviano? Cuidar tus estándares hace la vida más fluida.',
    th: 'หลังกั้นเรื่องกัดกินพลังออกไป วันนี้รู้สึกสบายขึ้นไหม รักษามาตรฐานของตัวเองไว้ ชีวิตจะไหลลื่นขึ้นเรื่อยๆ',
    vi: 'Sau khi chặn điều hao tổn ra ngoài, hôm nay có thấy thông thoáng hơn không? Giữ tiêu chuẩn của mình, cuộc sống sẽ trôi chảy dần.',
  }),
  fear: Object.freeze({
    zh: '那 10 分钟的小步迈出去之后，心里的迷雾有没有散开一点？你比自己想象中更有掌控力。',
    en: 'After that 10-minute first step, has some of the fog lifted? You hold more control than you think.',
    fr: 'Après ce petit pas de 10 minutes, un peu du brouillard s\'est-il dissipé ? Tu as plus de prise que tu ne le crois.',
    es: 'Después de ese primer paso de 10 minutos, ¿la niebla se ha aclarado un poco? Tienes más control del que imaginas.',
    th: 'ก้าวเล็กๆ 10 นาทีนั้นแล้ว หมอกในใจเบาลงบ้างไหม เธอควบคุมได้มากกว่าที่คิดนะ',
    vi: 'Sau bước nhỏ 10 phút ấy, sương mù trong lòng có tan bớt không? Bạn kiểm soát được nhiều hơn bạn nghĩ.',
  }),
  surprise: Object.freeze({
    zh: '用好奇多看了一眼之后，有没有发现什么新线索？转角藏着的礼物，值得再多看一眼。',
    en: 'After looking with curious eyes, did you spot any new clues? The gift around the corner deserves another glance.',
    fr: 'Après ce regard curieux, as-tu repéré un nouvel indice ? Le cadeau au tournant mérite un autre regard.',
    es: 'Después de mirar con curiosidad, ¿encontraste alguna pista nueva? El regalo a la vuelta merece otra mirada.',
    th: 'หลังมองด้วยสายตาอยากรู้ มีเบาะแสใหม่เข้ามาไหม ของขวัญที่หัวมุมควรมองอีกสักรอบ',
    vi: 'Sau khi nhìn bằng con mắt tò mò, có thấy manh mối mới nào không? Món quà ở khúc rẽ xứng đáng được nhìn thêm lần nữa.',
  }),
  anticipation: Object.freeze({
    zh: '第一步迈出去之后，是不是感觉方向更清晰了？方向已经对了，剩下的交给时间。',
    en: 'After taking that first step, does the path feel clearer? The direction is right — let time carry the rest.',
    fr: 'Après ce premier pas, le chemin te semble-t-il plus clair ? La direction est bonne — laisse le temps faire le reste.',
    es: 'Después de dar ese primer paso, ¿el camino se ve más claro? La dirección es correcta — deja que el tiempo haga el resto.',
    th: 'ก้าวแรกแล้ว เส้นทางดูชัดขึ้นไหม ทิศทางถูกแล้ว ที่เหลือฝากเวลาไว้',
    vi: 'Sau bước đầu tiên rồi, con đường có rõ hơn không? Hướng đã đúng, phần còn lại hãy để thời gian lo.',
  }),
});

/* ═══ E149-刀三：P2 升级单发句（五情绪 × 6 语——情绪信号正向转译＋微行动预告）═══
 *  军令 P2 升级口径：今日未开新牌、用户选了今日情绪 ⇒ 触发「5 角色语态＋
 *  情绪正向转译＋微行动」。纯 P2 单发首句升级为带转译一句（角色口吻由
 *  模型生成侧承接——首句只给信号转译，微动作细节由对话展开）。P1+P2
 *  串联场景仍用原 P2_MOOD_BRIDGES 短桥（衔接不喧宾）。 */
const E149_MOOD_TRANSLATIONS = Object.freeze({
  melancholy: Object.freeze({
    zh: '那份沉甸甸的感觉，说明你很认真地在乎过——先歇口气，剩下的我陪你慢慢来。',
    en: 'That heaviness means you cared deeply — take a breath first, and I\'ll walk the rest with you.',
    fr: 'Cette pesanteur montre que tu as profondément tenu à quelque chose — respire d\'abord, je parcours le reste avec toi.',
    es: 'Esa pesadez significa que te importó de verdad — respira primero, y el resto lo caminamos juntos.',
    th: 'ความหนักอึ้งในใจนั้นแสดงว่าเธอเคยใส่ใจอย่างจริงจัง — หายใจลึกๆ ก่อน ที่เหลือฉันเดินเคียงเธอ',
    vi: 'Cái trầm trọng đó cho thấy bạn đã thật lòng quan tâm — hít một hơi trước, phần còn lại mình đi cùng bạn.',
  }),
  agitated: Object.freeze({
    zh: '这份焦躁是在提醒你有些事需要安放——先深呼吸，我们一件一件来。',
    en: 'This restlessness is a reminder that something needs settling — breathe first, and we\'ll take it one piece at a time.',
    fr: 'Cette agitation te rappelle que quelque chose demande à être apaisé — respire d\'abord, nous y irons pièce par pièce.',
    es: 'Esta inquietud te recuerda que algo necesita acomodarse — respira primero, y lo tomamos pieza por pieza.',
    th: 'ความเดือดร้อนใจนี้กำลังเตือนว่ามีเรื่องต้องจัดวาง — หายใจลึกๆ ก่อน แล้วค่อยๆ ทำทีละเรื่อง',
    vi: 'Sự bồn chồn này nhắc bạn có điều cần sắp lại — hít thở trước, rồi ta làm từng việc một.',
  }),
  longing: Object.freeze({
    zh: '这份想念很珍贵，说明有人在你心里住着——轻轻想着，也是一种温暖的陪伴。',
    en: 'This longing is precious — someone lives in your heart, and thinking of them softly is its own warm company.',
    fr: 'Ce manque est précieux — quelqu\'un habite ton cœur, et y penser doucement est déjà une chaude compagnie.',
    es: 'Este añoro es valioso — alguien vive en tu corazón, y pensarlo con suavidad ya es una compañía cálida.',
    th: 'ความคิดถึงนี้ล้ำค่า — มีใครอยู่ในใจเธอ การคิดถึงอย่างเบามือก็เป็นความอบอุ่นอย่างหนึ่ง',
    vi: 'Nỗi nhớ này rất quý — có người đang sống trong tim bạn, và nhớ nhẹ nhàng cũng là một sự ấm áp.',
  }),
  radiant: Object.freeze({
    zh: '今天的明亮是生活给你的确认信号——趁着这股劲头，去点亮一件小事吧。',
    en: 'Today\'s glow is life\'s confirmation for you — ride this energy and light up one small thing.',
    fr: 'Cette lumière du jour est la confirmation de la vie — profite de cette élan pour illuminer une petite chose.',
    es: 'El brillo de hoy es la confirmación de la vida — aprovecha este impulso e ilumina una cosa pequeña.',
    th: 'แสงสว่างวันนี้คือสัญญาณยืนยันจากชีวิต — ฉวยพลังนี้ไปจุดเรื่องเล็กๆ ให้สว่างสิ',
    vi: 'Ánh sáng hôm nay là tín hiệu xác nhận từ cuộc sống — nhân dịp này mà thắp sáng một điều nhỏ.',
  }),
  grateful: Object.freeze({
    zh: '心里有感恩的人，日子就有了锚点——把这份温暖悄悄记下来吧。',
    en: 'A grateful heart gives your days an anchor — quietly note down this warmth.',
    fr: 'Un cœur reconnaissant donne un point d\'ancrage à tes jours — note doucement cette chaleur.',
    es: 'Un corazón agradecido da ancla a tus días — anota en silencio esta calidez.',
    th: 'ใจที่มีความกตัญญูให้ชีวิตมีจุดยึด — จดความอบอุ่นนี้ไว้เงียบๆ สิ',
    vi: 'Lòng biết ơn cho những ngày của bạn một mỏ neo — hãy lặng lẽ ghi lại hơi ấm này.',
  }),
});

/**
 * 🏆 E142 军令钦定主函数：有序话题队列首句合成器。
 * @param {object} p
 * @param {object|null} p.recentReport 形状守卫后的最近解锁报告档（soulRecentReport）
 * @param {string|null} p.activeMood 罗盘情绪白名单键（2h 窗内；无 ⇒ null）
 * @param {string} p.lang 六语之一
 * @param {string} [p.userName] E118 永久姓名档真值（可空）
 * @param {number} [p.now] 注入时钟（🆕 E148-刀一：缺省 Date.now()；P1 当日硬门真源）
 * @param {object|null} [p.lastMicroAction] 🆕 E149-刀三：L1 行动回访标记档
 *   （microActionMemory.readMicroAction 产出——48h＋!followed_up 已在核内判定）
 * @param {string} [p.relationMode] 🆕 E149-刀三：当前角色（P3 轻复盘口吻分化；
 *   白名单 E149_RELATION_MODES 五键，坏值 ⇒ P3 静默 fail-closed）
 * @returns {{firstLine: string, queue: string[], p1Key: string, followedUp: boolean}|null}
 *   queue 有序：[p1Key, 'mood:<mood>']——P1 报告话题恒首位，P2 情绪随其后；
 *   🆕 E149 顺位：P1（isToday 今日新牌，不变）＞ P2（今日情绪，升级＝转译句）
 *   ＞ P3（48h 内未回访 last_micro_action 轻复盘；followedUp=true ⇒ 调用方
 *   markMicroActionFollowedUp 单次死锁写回）＞ null（P4 兜底调用方回退）。
 *   无 P1 且无 P2 且无 P3 ⇒ null（绝不在此臆造兜底句）。
 */
export function resolveCompanionGreetingAndQueue({ recentReport, activeMood, lang, userName, now, lastMicroAction, relationMode }) {
  // 🆕 E148-刀一（主公军令 2026-11-19）：isToday 当日硬门——昨日及更早的报告档
  //   一律 P1 静默（隔日首句串台根治：P1 今日新牌才承接；P2 今日情绪聚焦照常
  //   单发；P3 由调用方回退既有纯净老友问候链）。
  const p1Key = isRecentReportToday(recentReport, now) ? normalizeReportKey(recentReport) : null;
  const mood = P2_MOOD_KEYS.includes(String(activeMood || '')) ? String(activeMood) : null;
  // 🆕 E149-刀三：P3 轻复盘——P1/P2 全静默时才承接（军令顺位）；角色白名单
  //   fail-closed，情绪键白名单 8 键（与 server E149_EMOTION_KEYS 同源）。
  const E149_MICRO_EMOTION_KEYS = ['joy', 'sadness', 'trust', 'disgust', 'fear', 'anger', 'surprise', 'anticipation'];
  const e149Mode = E149_RELATION_MODES.includes(String(relationMode || '')) ? String(relationMode) : null;
  // 🆕 E149-刀三纵深守卫：48h 过期二道判定（readMicroAction 已判一道；
  //   队列侧再判一道防调用方直喂裸档——军令「48h 过期」硬规则双保险）。
  const _e149Cd = (lastMicroAction && typeof lastMicroAction.created_date === 'string') ? lastMicroAction.created_date : '';
  const _e149CdT = /^\d{4}-\d{2}-\d{2}$/.test(_e149Cd) ? Date.parse(`${_e149Cd}T12:00:00Z`) : NaN;
  const _e149Now = (Number.isFinite(Number(now)) && Number(now) > 0) ? Number(now) : Date.now();
  const e149Ek = (lastMicroAction && typeof lastMicroAction === 'object'
    && E149_MICRO_EMOTION_KEYS.includes(String(lastMicroAction.emotion_key || ''))
    && lastMicroAction.followed_up === false
    && Number.isFinite(_e149CdT) && _e149Now - _e149CdT <= 48 * 3600 * 1000)
    ? String(lastMicroAction.emotion_key) : null;
  const e149FollowUp = (!p1Key && !mood && e149Mode && e149Ek) ? e149Ek : null;
  if (!p1Key && !mood && !e149FollowUp) return null;
  const l = ['zh', 'en', 'fr', 'es', 'th', 'vi'].includes(String(lang || '')) ? String(lang) : 'en';

  let firstLine = '';
  if (p1Key) {
    const row = P1_GREETING_LINES[p1Key];
    firstLine += (row && row[l]) || row.zh;
  }
  if (mood) {
    const bridge = P2_MOOD_BRIDGES[mood];
    const bridgeLine = (bridge && bridge[l]) || bridge.zh;
    if (p1Key) {
      firstLine += bridgeLine;
    } else {
      // 🆕 E149-刀三（军令 P2 升级）：纯 P2 单发升级为情绪信号正向转译句
      //  （E149_MOOD_TRANSLATIONS；字典缺失该语 ⇒ 回退原桥句零破坏）。
      const tr = E149_MOOD_TRANSLATIONS[mood];
      firstLine += (tr && tr[l]) || bridgeLine;
    }
  }
  if (e149FollowUp) {
    const opener = E149_ROLE_OPENERS[e149Mode];
    const body = E149_MICRO_FOLLOWUPS[e149FollowUp];
    firstLine += `${(opener && opener[l]) || opener.zh} ${(body && body[l]) || body.zh}`;
  }
  // 🔒 锁1军令红线：产出句严禁等于冷启动兜底语（两形态）
  if (!firstLine || firstLine.includes('我在呢') || firstLine.includes('今天想聊点什么')) {
    return null;
  }

  const queue = [];
  if (p1Key) queue.push(p1Key);
  if (mood) queue.push(`mood:${mood}`);
  if (e149FollowUp) queue.push(`micro:${e149FollowUp}`);

  // 姓名前缀（六语同构；坏 lang ⇒ 通用逗号——沿袭 E118 装配契约；P3 回访句
  //   军令钦定角色开场词打头，不带姓名前缀防唤名滥用——E142.1 熔断同源）
  const n = String(userName || '').trim();
  if (n && n.length <= 24 && p1Key && !e149FollowUp) {
    const sep = NAME_PREFIX_SEP[l] || ', ';
    firstLine = `${n}${sep}${firstLine}`;
  }

  return { firstLine, queue, p1Key, followedUp: Boolean(e149FollowUp) };
}
