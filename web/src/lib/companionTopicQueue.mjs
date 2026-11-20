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

/**
 * 🏆 E142 军令钦定主函数：有序话题队列首句合成器。
 * @param {object} p
 * @param {object|null} p.recentReport 形状守卫后的最近解锁报告档（soulRecentReport）
 * @param {string|null} p.activeMood 罗盘情绪白名单键（2h 窗内；无 ⇒ null）
 * @param {string} p.lang 六语之一
 * @param {string} [p.userName] E118 永久姓名档真值（可空）
 * @param {number} [p.now] 注入时钟（🆕 E148-刀一：缺省 Date.now()；P1 当日硬门真源）
 * @returns {{firstLine: string, queue: string[], p1Key: string}|null}
 *   queue 有序：[p1Key, 'mood:<mood>']——P1 报告话题恒首位，P2 情绪随其后；
 *   无 P1 且无 P2 ⇒ null（调用方回退现行为链——绝不在此臆造兜底句）。
 */
export function resolveCompanionGreetingAndQueue({ recentReport, activeMood, lang, userName, now }) {
  // 🆕 E148-刀一（主公军令 2026-11-19）：isToday 当日硬门——昨日及更早的报告档
  //   一律 P1 静默（隔日首句串台根治：P1 今日新牌才承接；P2 今日情绪聚焦照常
  //   单发；P3 由调用方回退既有纯净老友问候链）。
  const p1Key = isRecentReportToday(recentReport, now) ? normalizeReportKey(recentReport) : null;
  const mood = P2_MOOD_KEYS.includes(String(activeMood || '')) ? String(activeMood) : null;
  if (!p1Key && !mood) return null;
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
      // 纯 P2 单发：循环剥离开头省略号（全角「……」＝U+2026 序列）
      let s = bridgeLine;
      for (let i = 0; i < 8 && /^[\u2026.\s]/.test(s); i += 1) {
        s = s.replace(/^[\u2026.\s]+/, '');
      }
      firstLine += (s.trim() || bridgeLine);
    }
  }
  // 🔒 锁1军令红线：产出句严禁等于冷启动兜底语（两形态）
  if (!firstLine || firstLine.includes('我在呢') || firstLine.includes('今天想聊点什么')) {
    return null;
  }

  const queue = [];
  if (p1Key) queue.push(p1Key);
  if (mood) queue.push(`mood:${mood}`);

  // 姓名前缀（六语同构；坏 lang ⇒ 通用逗号——沿袭 E118 装配契约）
  const n = String(userName || '').trim();
  if (n && n.length <= 24 && p1Key) {
    const sep = NAME_PREFIX_SEP[l] || ', ';
    firstLine = `${n}${sep}${firstLine}`;
  }

  return { firstLine, queue, p1Key };
}
