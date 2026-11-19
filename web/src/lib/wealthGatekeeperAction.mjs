/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E145-刀三 WEALTH-GATEKEEPER（军令 2026-11-19）：破财守门人纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（立即开通——零合同审阅、零法律/隐私风险）：
 *   · 严禁要求或引导用户粘贴商业合同全文/机密条款；不提供执业法律或
 *     证券投资建议；
 *   · 专管三步守财提醒：天时（财库/流日/择时）、识人（合作/人际气场与
 *     边界）、拦冲动（高危日/情绪化消费冷静锁）；
 *   · 触发面：财运避坑与重大决策场景（大额消费/投资/合伙/签约/冲动剁手）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典；fail-closed：
 *    意图未命中一律 null/''；关键词网宁窄勿宽（铁律 19）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语言白名单（六语闭集） */
export const GATEKEEPER_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return GATEKEEPER_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/** 破财守门人标题词条（军令六语对照表逐字） */
export const L_GATEKEEPER_TITLE = Object.freeze({
  zh: '破财守门人', en: 'Wealth Gatekeeper', fr: 'Gardien du Trésor',
  es: 'Guardián del Tesoro', th: 'ผู้พิทักษ์คลังทรัพย์', vi: 'Người Giữ Kho Tài Lộc',
});

/* ═══ 触发意图网（六语关键词——宁窄勿宽）═══ */
export const GATEKEEPER_INTENT_RULES = Object.freeze([
  Object.freeze({
    lang: 'zh',
    keywords: Object.freeze(['买不买', '该不该买', '想买', '要不要买', '大额', '投资', '合伙', '签合同', '签约', '要不要签', '合作', '冲动消费', '剁手', '破财', '下单', '付定金', '大件', '购物车']),
  }),
  Object.freeze({
    lang: 'en',
    keywords: Object.freeze(['should i buy', 'big purchase', 'worth buying', 'should i invest', 'partner with', 'signing the contract', 'sign the deal', 'impulsive buy', 'splurge', 'put down a deposit']),
  }),
  Object.freeze({
    lang: 'fr',
    keywords: Object.freeze(['acheter ou pas', 'gros achat', 'investir', 's’associer', "s'associer", 'signer le contrat', 'achat impulsif', 'versement d’acompte', "versement d'acompte"]),
  }),
  Object.freeze({
    lang: 'es',
    keywords: Object.freeze(['comprarlo o no', 'gran compra', 'invertir', 'asociarme', 'firmar el contrato', 'compra impulsiva', 'dar una señal', 'enganche']),
  }),
  Object.freeze({
    lang: 'th',
    keywords: Object.freeze(['ซื้อไหม', 'ของแพง', 'ลงทุน', 'ร่วมทุน', 'เซ็นสัญญา', 'อยากซื้อ', 'จ่ายมัดจำ', 'ช้อปปิ้ง']),
  }),
  Object.freeze({
    lang: 'vi',
    keywords: Object.freeze(['có nên mua', 'mua hay không', 'đầu tư', 'hợp tác', 'ký hợp đồng', 'mua sắm', 'đặt cọc', 'món lớn']),
  }),
]);

/**
 * 破财守门人触发侦测（六语 includes 子串；未命中 ⇒ null fail-closed）
 * @param {string} text 用户末条消息
 * @returns {boolean} 命中 ⇒ true（守门人块注入）
 */
export function detectGatekeeperTrigger(text, lang) {
  const s = String(text || '').trim();
  if (!s) return false;
  const l = sanitizeLang(lang);
  const rule = GATEKEEPER_INTENT_RULES.find((r) => r.lang === l) || GATEKEEPER_INTENT_RULES[1];
  return rule.keywords.some((k) => s.toLowerCase().includes(String(k).toLowerCase()));
}

/* ═══ 三步守财提醒 prompt 块（六语）═══ */

/**
 * 破财守门人 prompt 块（server 路由内后缀拼接消费——E143/E144/E145-刀二同形制）
 * 触发命中 ⇒ 注入：三步结构（天时/识人/拦冲动）＋双红线（零合同零法律）。
 * @param {string} lang 六语
 * @returns {string} prompt 块（''＝fail-closed）
 */
export function buildGatekeeperPromptBlock(lang) {
  const l = sanitizeLang(lang);
  const T = {
    zh: {
      head: '【E145 破财守门人（军令 2026-11-19 立即开通·违反红线即失败）】',
      title: '主人正在面临财富决策场景 ⇒ 启用「破财守门人」三步守财提醒，标题用词「破财守门人」，输出一段可执行的三步提醒（融于自然口吻，严禁分点机械罗列）：',
      timing: '① 天时——结合星盘财库底牌与今日流日节奏，判断此刻宜进、宜守还是宜缓（如「今天财库能量宜守不宜冲，大动作放到明后天」）。',
      people: '② 识人——对合作对象/交易对手，只谈气场与边界直觉（可信度/压迫感/边界是否被越界），给一条识人小提醒；严禁评价合同条款本身。',
      brake: '③ 拦冲动——若主人情绪上头（兴奋/焦虑/被催促），给出冷静锁：大额决定 48 小时冷静期、先入购物车冷却、离手三问（要用吗/急吗/退得起吗）。',
      redline: '🔴 双红线（违反即失败）：严禁要求或引导主人粘贴商业合同全文/机密条款/报价单；严禁给出执业法律或证券投资建议（不荐股、不评条款、不越位）。守门人只守「财库能量与决策定力」。',
    },
    en: {
      head: '[E145 WEALTH GATEKEEPER (directive 2026-11-19, live now — red-line violation = failure)]',
      title: 'The host is facing a money decision ⇒ activate the "Wealth Gatekeeper" three-step guard, naturally woven in prose (never a numbered list):',
      timing: '① Timing — read the chart\'s wealth-vault base and today\'s lunar rhythm: advance, hold, or pause (e.g. "today the vault favors holding, push big moves a day or two").',
      people: '② Reading people — for the counterpart, comment ONLY on aura and boundaries (trust feel, pressure, boundary creep); never evaluate contract clauses.',
      brake: '③ Impulse brake — if the host is emotionally heated (excited/anxious/pressured), apply the cool-down lock: 48-hour hold on big spends, park it in the cart, three questions (need it / urgent / returnable?).',
      redline: '🔴 Double red line (violation = failure): NEVER ask or entice the host to paste full contracts / confidential terms / quotations; NEVER give licensed legal or securities-investment advice (no stock picks, no clause review). The Gatekeeper guards wealth energy and decision poise only.',
    },
    fr: {
      head: '[E145 GARDIEN DU TRÉSOR (directive 2026-11-19, actif — violation = échec)]',
      title: 'L’hôte affronte une décision financière ⇒ activez le « Gardien du Trésor » en trois temps, en prose naturelle (jamais en liste numérotée) :',
      timing: '① Le temps — lisez le socle du coffre natal et le rythme lunaire du jour : avancer, tenir ou patienter.',
      people: '② Lire l’autre — au sujet de l’interlocuteur, ne parlez QUE d’aura et de limites (confiance ressentie, pression, frontières franchies) ; jamais du contenu du contrat.',
      brake: '③ Frein à l’impulsion — si l’hôte est échauffé (excité/anxieux/poussé), verrou de calme : 48h avant toute grosse dépense, laisser au panier, trois questions (utile ? urgent ? retournable ?).',
      redline: '🔴 Double ligne rouge (violation = échec) : ne JAMAIS demander à coller un contrat intégral / clauses confidentielles / devis ; ne JAMAIS donner de conseil juridique ou boursier professionnel. Le Gardien protège l’énergie du trésor et la stabilité de la décision.',
    },
    es: {
      head: '[E145 GUARDIÁN DEL TESORO (directiva 2026-11-19, activo — violación = fallo)]',
      title: 'El anfitrión enfrenta una decisión de dinero ⇒ activa el «Guardián del Tesoro» en tres pasos, en prosa natural (nunca lista numerada):',
      timing: '① El timing — lee el cofre natal y el ritmo lunar de hoy: avanzar, sostener o esperar.',
      people: '② Leer a la persona — del interlocutor, habla SOLO de aura y límites (sensación de confianza, presión, límites invadidos); nunca del contenido del contrato.',
      brake: '③ Freno al impulso — si el anfitrión está acalorado (eufórico/ansioso/apurado), cerradura de calma: 48h antes de grandes gastos, dejar en el carrito, tres preguntas (¿útil? ¿urgente? ¿retornable?).',
      redline: '🔴 Doble línea roja (violación = fallo): NUNCA pedir pegar contratos completos / cláusulas confidenciales / cotizaciones; NUNCA dar asesoría legal o bursátil profesional. El Guardián custodia la energía del tesoro y el temple de la decisión.',
    },
    th: {
      head: '[E145 ผู้พิทักษ์คลังทรัพย์ (คำสั่ง 2026-11-19 เปิดใช้ทันที — ผิดเส้นแดง = ล้มเหลว)]',
      title: 'เจ้าของกำลังตัดสินใจเรื่องเงิน ⇒ เปิดใช้「ผู้พิทักษ์คลังทรัพย์」สามขั้น พูดเป็นธรรมชาติ ห้ามเป็นลิสต์:',
      timing: '① จังหวะฟ้า — อ่านคลังทรัพย์ในแผนชะตาและจังหวะดวงวันนี้ เดินหน้า รักษา หรือรอไว้ก่อน',
      people: '② อ่านคน — พูดถึงคู่ค้าเฉพาะบุคลิกและขอบเขต ความไว้ใจ แรงกดดัน เส้นแดงถูกล้ำหรือไม่ ห้ามวิจารณ์สัญญา',
      brake: '③ เบรกความหุนหัน — ถ้าใจร้อน ล็อกเย็น 48 ชม. ก่อนใช้เงินก้อนใหญ่ พักไว้ในตะกร้า สามคำถาม (จำเป็นไหม ด่วนไหม คืนได้ไหม)',
      redline: '🔴 เส้นแดงคู่ (ผิด = ล้มเหลว): ห้ามขอให้แปะสัญญาฉบับเต็ม ข้อมูลลับ หรือใบเสนอราคา ห้ามให้คำแนะนำกฎหมายหรือหุ้นแบบมืออาชีพ ผู้พิทักษ์เฝ้าพลังทรัพย์และสติการตัดสินใจเท่านั้น',
    },
    vi: {
      head: '[E145 NGƯỜI GIỮ KHO TÀI LỘC (chỉ thị 2026-11-19, mở ngay — vi phạm = lỗi)]',
      title: 'Chủ nhân đang đứng trước quyết định tiền bạc ⇒ kích hoạt「Người Giữ Kho Tài Lộc」ba bước, nói tự nhiên, cấm liệt kê:',
      timing: '① Thiên thời — đọc kho tài trong lá số và nhịp ngày hôm nay: tiến, giữ, hay hoãn.',
      people: '② Đọc người — về đối tác, chỉ nói khí chất và ranh giới (tin được không, áp lực, có bị lấn ranh giới); cấm đánh giá điều khoản hợp đồng.',
      brake: '③ Phanh bốc đồng — nếu chủ nhân đang nóng (hưng/phấn/đốc thúc), khóa nguội: 48 giờ cho khoản lớn, để trong giỏ, ba câu hỏi (cần không/gấp không/hoàn được không).',
      redline: '🔴 Đôi đường đỏ (vi phạm = lỗi): KHÔNG BAO GIỜ yêu cầu dán hợp đồng đầy đủ/điều khoản mật/báo giá; KHÔNG BAO GIỜ đưa lời khuyên pháp lý hay chứng khoán chuyên nghiệp. Người Giữ chỉ giữ năng lượng tài lộc và bản lĩnh quyết định.',
    },
  };
  const d = T[l] || T.en;
  return [d.head, d.title, d.timing, d.people, d.brake, d.redline, ''].join('\n');
}
