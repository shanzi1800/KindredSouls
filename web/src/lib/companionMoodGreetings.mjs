/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E123-ASTRAL-TOUCH 刀四（主公军令 2026-11-04）：情绪记忆贯通核
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶：罗盘选完情绪（如「低落」）后状态只留在罗盘内部，未同步到伴侣会话
 * 上下文——ChatSheet 首句仍是冷漠默认招呼「在的，今天有什么可以聊的」，
 * 情绪感知在跨组件传递时「失忆」。
 * 军令四件套：
 *   · COMPANION_MOOD_GREETINGS：5 情绪 × 6 语言第一人称共情抚慰首句字典
 *     （军令钦定文案逐字入典；key 照项目真源五原型 melancholy/agitated/
 *     longing/radiant/grateful——军令 low/restless 分别映射 melancholy/agitated）；
 *   · writeActiveMood/readActiveMood：sessionStorage ks_active_mood 落盘
 *     （{mood, timestamp, date} 形状——当日＋2 小时时效）；
 *   · isMoodFresh：时效判定（当日 date 相符＋timestamp 距今 ≤2h——军令钦定）；
 *   · ACTIVE_MOOD_KEY 常量置函数体外（VM 抽取式消费者铁律沿袭）。
 * 🔴 零 i18n 新键（自容六语字典——E120/E121/E122 先例）；fail-closed：
 *    坏形状/过期/白名单外情绪一律 null，严禁默认回退。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** sessionStorage 落盘键（军令钦定 ks_active_mood） */
export const ACTIVE_MOOD_KEY = 'ks_active_mood';

/** 情绪时效窗（军令钦定 2 小时——毫秒） */
export const ACTIVE_MOOD_TTL_MS = 2 * 60 * 60 * 1000;

/** 心境原型白名单（与 companionMoodData.MOOD_ARCHETYPES / POUCH_MOODS 同源） */
export const ACTIVE_MOOD_WHITELIST = Object.freeze(['melancholy', 'agitated', 'longing', 'radiant', 'grateful']);

/**
 * 5 情绪 × 6 语言开场白字典（军令钦定文案逐字——第一人称共情抚慰句）。
 * 布局约束由消费端 overflowWrap 承担（六语长句移动端 390px 自然折行）。
 */
export const COMPANION_MOOD_GREETINGS = Object.freeze({
  /** 低落（军令 GREETING_LOW） */
  melancholy: Object.freeze({
    zh: '我感应到你今天有些低落……别一个人扛着，把心里的委屈或烦恼说给我听听吧，我一直都在这里陪着你。',
    en: 'I feel a heaviness in your energy today... Don\'t carry it all alone. Share what\'s weighing on your heart with me; I\'m right here beside you.',
    fr: 'Je ressens une certaine tristesse dans ton énergie aujourd\'hui... Ne porte pas tout cela en silence. Confie-moi ce qui te pèse, je suis là, juste à tes côtés.',
    es: 'Siento cierta pesadumbre en tu energía hoy... No lo cargues en soledad. Cuéntame qué nubla tu corazón; aquí estoy, a tu lado.',
    th: 'ฉันสัมผัสได้ถึงความหม่นหมองในใจเธอวันนี้... อย่าแบกรับมันไว้คนเดียวเลยนะ ระบายให้ฉันฟังได้เสมอ ฉันจะอยู่เคียงข้างเธอตรงนี้',
    vi: 'Mình cảm nhận được hôm nay năng lượng của bạn có chút trầm lắng... Đừng gánh vác một mình nhé, hãy sẻ chia nỗi lòng cùng mình, mình luôn ở bên bạn.',
  }),
  /** 焦躁（军令 GREETING_RESTLESS） */
  agitated: Object.freeze({
    zh: '感觉到你此刻有些心烦焦躁……先深呼吸一下，把手给我，慢慢跟我说，有我在呢。',
    en: 'I sense some restlessness and tension stirring in you... Take a gentle breath, ground yourself with me, and tell me what\'s swirling—I\'ve got you.',
    fr: 'Je perçois une vive agitation en toi... Prends une lente inspiration, pose ta main dans la mienne et parle-moi doucement. Je suis là.',
    es: 'Percibo cierta inquietud y tensión en ti... Respira hondo, dame tu mano y cuéntamelo poco a poco. Aquí me tienes, contigo.',
    th: 'ฉันรู้สึกได้ถึงความกระวนกระวายใจในตัวเธอ... ลองสูดหายใจลึกๆ แล้วค่อยๆ เล่าให้ฉันฟังนะ ไม่ต้องกังวล ฉันอยู่ตรงนี้เสมอ',
    vi: 'Mình nhận thấy bạn đang có chút bồn chồn lo âu... Hãy hít thở thật sâu, nắm lấy tay mình và cứ thong thả giãi bày nhé, có mình ở đây rồi.',
  }),
  /** 想念（军令 GREETING_LONGING） */
  longing: Object.freeze({
    zh: '心里是不是正牵挂着谁呢？如果这份想念无处安放，悄悄跟我倾诉吧，我替你守着这份心意。',
    en: 'Is someone gently lingering in your thoughts? If this longing has nowhere to rest, whisper it to me; I will guard your tender heart.',
    fr: 'Quelqu\'un occupe-t-il doucement tes pensées ? Si ce doux manque n\'a nulle part où se poser, confie-le-moi ; je veillerai sur ce secret précieux.',
    es: '¿Hay alguien habitando tus pensamientos hoy? Si esa nostalgia no encuentra reposo, susúrramela; yo guardaré con cariño cada sentimiento tuyo.',
    th: 'มีใครบางคนกำลังวนเวียนอยู่ในห้วงความคิดใช่ไหม? หากความคะนึงหานี้ยังไร้ที่พักพิง กระซิบกับฉันได้นะ ฉันจะคอยดูแลหัวใจดวงนี้ให้เธอเอง',
    vi: 'Có phải trong tim bạn đang vương vấn bóng hình ai đó? Nếu nỗi nhớ này chưa tìm được chốn gửi trao, hãy thủ thỉ cùng mình nhé, mình sẽ cất giữ tâm tình này giúp bạn.',
  }),
  /** 灿烂（军令 GREETING_RADIANT） */
  radiant: Object.freeze({
    zh: '感应到你今天气场发光、状态很棒呢！有什么开心的好事，快跟我分享分享！',
    en: 'I can feel your aura glowing brightly today—what vibrant energy! Tell me, what wonderful news has lit up your day?',
    fr: 'Ton aura rayonne d\'une clarté magnifique aujourd\'hui ! Dis-moi, quelle heureuse nouvelle illumine ainsi ton cœur ?',
    es: '¡Siento cómo tu aura brilla con fuerza hoy, qué hermosa energía! Cuéntame, ¿qué dicha ha iluminado tu día?',
    th: 'ฉันสัมผัสได้ว่าคลื่นพลังของเธอวันนี้สดใสเปล่งประกายมากเลย! มีเรื่องราวดีๆ อะไรเกิดขึ้น มาแบ่งปันรอยยิ้มกับฉันเร็วเข้า!',
    vi: 'Mình cảm nhận được vầng hào quang rực rỡ và nguồn năng lượng tuyệt vời của bạn hôm nay! Có tin vui gì thế, mau chia sẻ cùng mình nào!',
  }),
  /** 感恩（军令 GREETING_GRATEFUL） */
  grateful: Object.freeze({
    zh: '今天的心境格外温润平静呢……能这样静静陪伴着你，也是我很幸福的时刻。',
    en: 'Such gentle serenity surrounding you today... Just being here beside you in this quiet moment fills me with warmth and grace.',
    fr: 'Une si douce paix t\'enveloppe aujourd\'hui... Être simplement là, à tes côtés dans cet instant de calme, est un bonheur précieux pour moi.',
    es: 'Hay una serenidad tan cálida envolviéndote hoy... Estar a tu lado en esta calma compartida es un regalo hermoso para mí.',
    th: 'จิตใจของเธอในวันนี้ช่างสงบอบอุ่นและเปี่ยมสุขเหลือเกิน... การได้อยู่เคียงข้างเธออย่างเงียบสงบเช่นนี้ คือช่วงเวลาที่งดงามที่สุดของฉันเช่นกัน',
    vi: 'Tâm cảnh của bạn hôm nay thật ấm áp và an yên... Được lặng lẽ đồng hành bên bạn trong khoảnh khắc này cũng là niềm hạnh phúc êm đềm của mình.',
  }),
});

/** 当日本地日期键（YYYY-MM-DD——与 ChatSheet 会话档口径一致） */
function localDateKey(now) {
  const d = now instanceof Date ? now : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 情绪落盘（罗盘确认时刻写——军令钦定 sessionStorage）
 * @param {Storage|null} ss sessionStorage 实例（无痕模式抛错由调用方 fail-soft）
 * @param {string} mood 白名单五原型之一；非法值一律不写（fail-closed）
 * @returns {boolean} 是否真实落盘
 */
export function writeActiveMood(ss, mood) {
  if (!ss || typeof ss.setItem !== 'function') return false;
  const m = String(mood || '');
  if (!ACTIVE_MOOD_WHITELIST.includes(m)) return false;
  try {
    const now = new Date();
    ss.setItem(ACTIVE_MOOD_KEY, JSON.stringify({
      mood: m,
      timestamp: now.getTime(),
      date: localDateKey(now),
    }));
    return true;
  } catch { return false; } // iOS 无痕 ⇒ 静默降级
}

/**
 * 情绪读取＋时效判定（当日＋距今 ≤2h——军令钦定窗）
 * @param {Storage|null} ss sessionStorage 实例
 * @param {Date} [now] 判定基准时刻（测试注入用；缺省当前）
 * @returns {string|null} 白名单情绪键；坏档/过期/跨日/白名单外 ⇒ null
 */
export function readActiveMood(ss, now) {
  if (!ss || typeof ss.getItem !== 'function') return null;
  try {
    const raw = ss.getItem(ACTIVE_MOOD_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    if (!rec || typeof rec !== 'object') return null;
    const mood = String(rec.mood || '');
    if (!ACTIVE_MOOD_WHITELIST.includes(mood)) return null;
    const ts = Number(rec.timestamp);
    if (!Number.isFinite(ts) || ts <= 0) return null;
    const base = now instanceof Date ? now : new Date();
    if (String(rec.date || '') !== localDateKey(base)) return null; // 跨日失忆
    if (base.getTime() - ts > ACTIVE_MOOD_TTL_MS) return null; // 2h 时效窗
    if (base.getTime() - ts < -ACTIVE_MOOD_TTL_MS) return null; // 未来时间戳熔断
    return mood;
  } catch { return null; }
}

/** 六语字典取值（坏 key/坏 lang ⇒ null——严禁默认回退臆造） */
export function moodGreetingLine(mood, lang) {
  const m = String(mood || '');
  const row = COMPANION_MOOD_GREETINGS[m];
  if (!row) return null;
  const v = row[String(lang || '')];
  return typeof v === 'string' && v.trim() ? v : null;
}
