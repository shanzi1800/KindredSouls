/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 E104（主公军令 2026-10-30）：六语玄学真值全局字典（唯一真源）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（主公《六语真值对照字典归仓指令》＋军令 E104 三刀）：
 *   ① 封堵 LLM 推理阶段自由造词——产品线/相位/干支合冲刑害/四大卦象/三张塔罗/
 *      UI 锚点七类术语，六语（zh/en/fr/es/th/vi）逐键锁定；
 *   ② 卦 15 防天地颠倒：upperTrigram 恒 Khôn/坤/地、lowerTrigram 恒 Cấn/艮/山；
 *   ③ 拔除带调拼音（Qian2/Fu1）与非 en 语系英文组合（Fire trine/Dragon-Dog 等）。
 *
 * 🔴 取值口径（单一真源律）：
 *   · tarot 域 ≡ web/src/lib/tarot.ts 牌名真源（闸门 parity 锁定，防漂移）；
 *   · 正逆位 ≡ api/ai-advisor.js ORIENT_MAP 六语口径；
 *   · hexagrams 域 ≡ server.js _e100IchingHexLine 四钦定卦（15/24/45/13）军令钦定行；
 *   · bazi 域 ≡ server.js _e96LocalizeCompatBaziLock 军令钦定关系模板（E103-①）；
 *   · ui 域 ≡ locales/PaywallCard 已落地文案基词（去 emoji/价格的纯术语形态）；
 *   · ✦ SOUL OS 为六语恒值印章（终章签名行唯一真源，任何语种零改写）。
 *   server.js 自持同口径常量（VM 抽取铁律——server 不 import 前端模块），
 *   双侧同步由闸门 audit-e104 parity 断言强制（漂移即红）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 六语支持语种（与 i18n supportedLngs 同源） */
export type SupportedLocale = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

/** 六语词条记录（readonly 不可篡改） */
export type TermRecord = Readonly<Record<SupportedLocale, string>>;

/** 周易钦定卦条目（外卦/内卦恒锁——防天地颠倒） */
export interface IChingCanonicalEntry {
  /** King Wen 卦序号（15/24/45/13 军令钦定四卦） */
  readonly hexagramNumber: number;
  /** 传统结构名（如「地山谦」——外上内下读法） */
  readonly traditionalName: TermRecord;
  /** 拼音基名（拔除带调数字尾：Qian 而非 Qian2） */
  readonly pinyinKey: string;
  /** 卦名（fr/es 军令钦定「Qian (L'Humilité / La Modestia)」格式） */
  readonly name: TermRecord;
  /** 外卦（上卦）——恒 Khôn/坤/地（卦 15 严锁：Khôn 必在上） */
  readonly upperTrigram: TermRecord;
  /** 内卦（下卦）——恒 Cấn/艮/山（卦 15 严锁：Cấn 必在下） */
  readonly lowerTrigram: TermRecord;
  /** 卦意精髓一行 */
  readonly essence: TermRecord;
}

/** 塔罗钦定牌条目（正逆位六语） */
export interface TarotEntry {
  /** tarot.ts 牌 id（真源 parity 锚） */
  readonly cardId: number;
  /** 大阿卡纳罗马数字（II/IV/IX） */
  readonly number: string;
  /** 牌名（≡ tarot.ts name 六语） */
  readonly name: TermRecord;
  /** 正位关键词（≡ ai-advisor ORIENT_MAP） */
  readonly upright: TermRecord;
  /** 逆位关键词（≡ ai-advisor ORIENT_MAP；es 阴性大牌 Invertida 由朝向层分流） */
  readonly reversed: TermRecord;
}

/** 真值表整体 schema（products/aspects/bazi/hexagrams/tarot/ui 六域） */
export interface MetaphysicsTruthTableSchema {
  readonly products: Readonly<Record<string, TermRecord>>;
  readonly aspects: Readonly<Record<string, TermRecord>>;
  readonly bazi: Readonly<Record<string, TermRecord>>;
  readonly hexagrams: Readonly<Record<number, IChingCanonicalEntry>>;
  readonly tarot: Readonly<Record<string, TarotEntry>>;
  readonly ui: Readonly<Record<string, TermRecord>>;
}

/** 六语恒值：✦ SOUL OS 终章印章（任何语种零改写——E100 终章闭环钦定） */
export const SOUL_OS_SIGNATURE = '✦ SOUL OS' as const;

export const METAPHYSICS_TRUTH_TABLE: MetaphysicsTruthTableSchema = {
  /* ── 一、产品线（SOUL OS 核心产品六语恒值）────────────────────────── */
  products: {
    basic_insight: {
      zh: '基础洞察',
      en: 'Basic Insight',
      fr: 'Insight Fondamental',
      es: 'Insight Fundamental',
      th: 'ความเห็นเชิงลึกพื้นฐาน',
      vi: 'Insight Cơ Bản',
    },
    monthly_report: {
      zh: '姻缘月报',
      en: 'Love Monthly',
      fr: 'Rapport Mensuel',
      es: 'Informe Mensual',
      th: 'รายงานรายเดือน',
      vi: 'Báo Cáo Tháng',
    },
    yearly_report: {
      zh: '姻缘年报',
      en: 'Love Annual',
      fr: 'Rapport Annuel',
      es: 'Informe Anual',
      th: 'รายงานรายปี',
      vi: 'Báo Cáo Năm',
    },
    natal_wealth_vault: {
      zh: '先天财库',
      en: 'Natal Wealth Vault',
      fr: 'Coffre de Richesse Natal',
      es: 'Bóveda de Riqueza Natal',
      th: 'คลังทรัพย์ชะตากำเนิด',
      vi: 'Kho Báu Thiên Ban',
    },
    cosmic_birthday_almanac: {
      zh: '宇宙生日年鉴',
      en: 'Cosmic Birthday Almanac',
      fr: 'Almanach Cosmique d\'Anniversaire',
      es: 'Almanaque Cósmico de Cumpleaños',
      th: 'ปฏิทินวันเกิดจักรวาล',
      vi: 'Niên Giám Sinh Nhật Vũ Trụ',
    },
    soul_imprint: {
      zh: '灵魂印记',
      en: 'Soul Imprint',
      fr: 'Empreinte d\'Âme',
      es: 'Huella del Alma',
      th: 'รอยจารึกวิญญาณ',
      vi: 'Dấu Ấn Linh Hồn',
    },
  },

  /* ── 二、相位（合盘天体相位六语）──────────────────────────────────── */
  aspects: {
    conjunction: {
      zh: '合相',
      en: 'conjunction',
      fr: 'conjonction',
      es: 'conjunción',
      th: 'มุมรวม',
      vi: 'hợp chiếu',
    },
    sextile: {
      zh: '六合',
      en: 'sextile',
      fr: 'sextile',
      es: 'sextil',
      th: 'มุมหกสิบ',
      vi: 'lục phân',
    },
    trine: {
      zh: '三合',
      en: 'trine',
      fr: 'trigone',
      es: 'trígono',
      th: 'มุมร้อยยี่สิบ',
      vi: 'tam hợp',
    },
    square: {
      zh: '刑',
      en: 'square',
      fr: 'carré',
      es: 'cuadratura',
      th: 'มุมเก้าสิบ',
      vi: 'vuông góc',
    },
    opposition: {
      zh: '冲',
      en: 'opposition',
      fr: 'opposition',
      es: 'oposición',
      th: 'มุมสวนทาง',
      vi: 'đối xung',
    },
    harmony_ratio: {
      zh: '调和占比',
      en: 'harmony ratio',
      fr: 'part harmonieuse',
      es: 'proporción armónica',
      th: 'สัดส่วนมุมสมาน',
      vi: 'tỷ lệ hòa hợp',
    },
  },

  /* ── 三、干支合冲刑害（八字关系军令钦定口径）──────────────────────── */
  bazi: {
    day_master: {
      zh: '日主',
      en: 'Day Master',
      fr: 'Maître du Jour',
      es: 'Maestro del Día',
      th: 'ธาตุวันเกิด',
      vi: 'Nhật Chủ',
    },
    fire_trine: {
      zh: '寅午戌火局',
      en: 'Fire trine (Tiger-Horse-Dog)',
      fr: 'Trigone élémentaire de Feu (Tigre-Cheval-Chien)',
      es: 'Trígono elemental de Fuego (Tigre-Caballo-Perro)',
      th: 'ไตรภาคีธาตุไฟ (ขาล-มะเมีย-จอ)',
      vi: 'Tam hợp Hỏa cục (Dần–Ngọ–Tuất)',
    },
    metal_trine: {
      zh: '巳酉丑金局',
      en: 'Metal trine (Snake-Rooster-Ox)',
      fr: 'Trigone élémentaire de Métal (Serpent-Coq-Bœuf)',
      es: 'Trígono elemental de Metal (Serpiente-Gallo-Buey)',
      th: 'ไตรภาคีธาตุทอง (มะเส็ง-ระกา-ฉลู)',
      vi: 'Tam hợp Kim cục (Tỵ–Dậu–Sửu)',
    },
    metal_half_combination: {
      zh: '巳丑半合',
      en: 'half-combination of the Metal trine (Si-Chou)',
      fr: 'Demi-combinaison de Métal (Chou-Si)',
      es: 'Semialianza de Metal (Chou-Si)',
      th: 'ครึ่งไตรภาคีธาตุทอง (มะเส็ง-ฉลู)',
      vi: 'bán hợp Kim cục (Tỵ–Sửu)',
    },
    same_branch_kinship: {
      zh: '同气伏吟',
      en: 'same-branch kinship (Chou-Chou), not a combination',
      fr: 'même branche (Chou-Chou)\u00a0: énergie semblable, pas une combinaison',
      es: 'misma rama (Chou-Chou): energía afín, no es una combinación',
      th: 'สาขาเดียวกัน (ฉลู-ฉลู) มิใช่การรวม',
      vi: 'đồng khí tương ứng (Sửu–Sửu), không phải hợp hóa',
    },
    dragon_dog_clash: {
      zh: '辰戌冲',
      en: 'Chen-Xu (Dragon-Dog) clash',
      fr: 'Opposition Chen-Xu (Dragon-Chien)',
      es: 'Oposición Chen-Xu (Dragón-Perro)',
      th: 'การปะทะ Chen-Xu (มะโรง-จอ)',
      vi: 'Thìn–Tuất tương xung',
    },
    snake_pig_clash: {
      zh: '巳亥冲',
      en: 'Si-Hai (Snake-Pig) clash',
      fr: 'Opposition Si-Hai (Serpent-Cochon)',
      es: 'Oposición Si-Hai (Serpiente-Cerdo)',
      th: 'การปะทะ Si-Hai (มะเส็ง-กุน)',
      vi: 'Tỵ–Hợi tương xung',
    },
    ox_dog_friction: {
      zh: '丑戌刑',
      en: 'Chou-Xu (Ox-Dog) friction',
      fr: 'Friction Chou-Xu',
      es: 'Fricción Chou-Xu',
      th: 'แรงเสียดทาน Chou-Xu (ฉลู-จอ)',
      vi: 'Sửu–Tuất tương hình',
    },
  },

  /* ── 四、四大钦定卦（15 谦/24 复/45 萃/13 同人——外内卦恒锁）────────── */
  hexagrams: {
    15: {
      hexagramNumber: 15,
      traditionalName: { zh: '地山谦', en: 'Qian (Modesty)', fr: "Qian (L'Humilité)", es: 'Qian (La Modestia)', th: 'เคียม (ดินเหนือภูเขา)', vi: 'Khiêm (Địa Sơn Khiêm)' },
      pinyinKey: 'Qian',
      name: { zh: '谦', en: 'Modesty', fr: "Qian (L'Humilité)", es: 'Qian (La Modestia)', th: 'ความถ่อมตน', vi: 'Khiêm' },
      upperTrigram: { zh: '坤（地）', en: 'Khôn (Earth)', fr: 'Khôn (La Terre)', es: 'Khôn (La Tierra)', th: 'Khôn (ดิน)', vi: 'Khôn (Đất)' },
      lowerTrigram: { zh: '艮（山）', en: 'Cấn (Mountain)', fr: 'Cấn (La Montagne)', es: 'Cấn (La Montaña)', th: 'Cấn (ภูเขา)', vi: 'Cấn (Núi)' },
      essence: { zh: '谦逊之道，山藏于地', en: 'The way of humility — the mountain nestles within the earth', fr: 'La voie de l\'humilité — la montagne se blottit dans la terre', es: 'La senda de la modestia — la montaña se anida en la tierra', th: 'หนทางแห่งความถ่อมตน — ภูเขาซ่อนอยู่ในดิน', vi: 'Con đường khiêm nhường — núi ẩn trong đất' },
    },
    24: {
      hexagramNumber: 24,
      traditionalName: { zh: '地雷复', en: 'Fu (Return)', fr: 'Fu (Le Retour)', es: 'Fu (El Retorno)', th: 'ผู้ (ดินเหนือฟ้าร้อง)', vi: 'Phục (Địa Lôi Phục)' },
      pinyinKey: 'Fu',
      name: { zh: '复', en: 'Return', fr: 'Fu (Le Retour)', es: 'Fu (El Retorno)', th: 'การหวนคืนสู่จุดเริ่มต้น', vi: 'Phục' },
      upperTrigram: { zh: '坤（地）', en: 'Khôn (Earth)', fr: 'Khôn (La Terre)', es: 'Khôn (La Tierra)', th: 'Khôn (ดิน)', vi: 'Khôn (Đất)' },
      lowerTrigram: { zh: '震（雷）', en: 'Chấn (Thunder)', fr: 'Chấn (Le Tonnerre)', es: 'Chấn (El Trueno)', th: 'Chấn (ฟ้าร้อง)', vi: 'Chấn (Sấm)' },
      essence: { zh: '回归之道，一阳来复', en: 'The way of return — one yang light is reborn', fr: 'La voie du retour — une lumière yang renaît', es: 'La senda del retorno — una luz yang renace', th: 'หนทางแห่งการหวนคืน — แสงหยางหนึ่งดวงเกิดใหม่', vi: 'Con đường hồi phục — một dương quang tái sinh' },
    },
    45: {
      hexagramNumber: 45,
      traditionalName: { zh: '泽地萃', en: 'Cui (Gathering)', fr: 'Cui (Le Rassemblement)', es: 'Cui (La Reunión)', th: 'สุ่ย (ทะเลสาบเหนือดิน)', vi: 'Tụy (Trạch Địa Tụy)' },
      pinyinKey: 'Cui',
      name: { zh: '萃', en: 'Gathering Together', fr: 'Cui (Le Rassemblement)', es: 'Cui (La Reunión)', th: 'การชุมนุมแห่งดวงใจ', vi: 'Tụy' },
      upperTrigram: { zh: '兑（泽）', en: 'Đoài (Lake)', fr: 'Đoài (Le Lac)', es: 'Đoài (El Lago)', th: 'Đoài (ทะเลสาบ)', vi: 'Đoài (Hồ)' },
      lowerTrigram: { zh: '坤（地）', en: 'Khôn (Earth)', fr: 'Khôn (La Terre)', es: 'Khôn (La Tierra)', th: 'Khôn (ดิน)', vi: 'Khôn (Đất)' },
      essence: { zh: '荟萃之道，聚而成势', en: 'The way of gathering — unity becomes momentum', fr: 'La voie du rassemblement — l\'union devient élan', es: 'La senda de la reunión — la unión se vuelve impulso', th: 'หนทางแห่งการรวมใจ — ความสามัคคีกลายเป็นพลัง', vi: 'Con đường hội tụ — hợp nhất thành thế mạnh' },
    },
    13: {
      hexagramNumber: 13,
      traditionalName: { zh: '天火同人', en: 'Tongren (Fellowship)', fr: 'Tongren (La Fraternité)', es: 'Tongren (La Comunidad)', th: 'ถงเหริน (ฟ้าเหนือไฟ)', vi: 'Đồng Nhân (Thiên Hỏa Đồng Nhân)' },
      pinyinKey: 'Tongren',
      name: { zh: '同人', en: 'Fellowship', fr: 'Tongren (La Fraternité)', es: 'Tongren (La Comunidad)', th: 'ความสามัคคีของดวงใจ', vi: 'Đồng Nhân' },
      upperTrigram: { zh: '乾（天）', en: 'Càn (Heaven)', fr: 'Càn (Le Ciel)', es: 'Càn (El Cielo)', th: 'Càn (ฟ้า)', vi: 'Càn (Trời)' },
      lowerTrigram: { zh: '离（火）', en: 'Ly (Fire)', fr: 'Ly (Le Feu)', es: 'Ly (El Fuego)', th: 'Ly (ไฟ)', vi: 'Ly (Lửa)' },
      essence: { zh: '同人之道，志同道合', en: 'The way of fellowship — kindred hearts share one aim', fr: 'La voie de la fraternité — des cœurs affins partagent un même but', es: 'La senda de la comunidad — corazones afines comparten un mismo fin', th: 'หนทางแห่งสามัคคี — ดวงใจร่วมอุดมการณ์เดียวกัน', vi: 'Con đường đồng nhân — tâm hợp chung một chí hướng' },
    },
  },

  /* ── 五、三张钦定塔罗（皇帝 IV/女祭司 II/隐士 IX——≡ tarot.ts 真源）── */
  tarot: {
    emperor: {
      cardId: 4,
      number: 'IV',
      name: { zh: '皇帝', en: 'The Emperor', fr: 'L\'Empereur', es: 'El Emperador', th: 'จักรพรรดิ', vi: 'Hoàng Đế' },
      upright: { zh: '正位', en: 'Upright', fr: 'À l\'endroit', es: 'Derecho', th: 'ตั้งตรง', vi: 'Xuôi' },
      reversed: { zh: '逆位', en: 'Reversed', fr: 'Inversé', es: 'Invertido', th: 'กลับด้าน', vi: 'Ngược' },
    },
    high_priestess: {
      cardId: 2,
      number: 'II',
      name: { zh: '女祭司', en: 'The High Priestess', fr: 'La Grande Prêtresse', es: 'La Gran Sacerdotisa', th: 'ไพ่นักบวชหญิง', vi: 'Nữ Đại Tư Tế' },
      upright: { zh: '正位', en: 'Upright', fr: 'À l\'endroit', es: 'Derecho', th: 'ตั้งตรง', vi: 'Xuôi' },
      reversed: { zh: '逆位', en: 'Reversed', fr: 'Inversé', es: 'Invertido', th: 'กลับด้าน', vi: 'Ngược' },
    },
    hermit: {
      cardId: 9,
      number: 'IX',
      name: { zh: '隐士', en: 'The Hermit', fr: 'L\'Ermite', es: 'El Ermitaño', th: 'นักบวชเรี่ยมใจ', vi: 'Ẩn Sĩ' },
      upright: { zh: '正位', en: 'Upright', fr: 'À l\'endroit', es: 'Derecho', th: 'ตั้งตรง', vi: 'Xuôi' },
      reversed: { zh: '逆位', en: 'Reversed', fr: 'Inversé', es: 'Invertido', th: 'กลับด้าน', vi: 'Ngược' },
    },
  },

  /* ── 六、UI 锚点（付费墙/收银台/品牌印记六语恒值）────────────────── */
  ui: {
    unlock_now: {
      zh: '立即解锁',
      en: 'Unlock Now',
      fr: 'Débloquer Maintenant',
      es: 'Desbloquear Ahora',
      th: 'ปลดล็อกเลย',
      vi: 'Mở khóa ngay',
    },
    sandbox_pay: {
      zh: '一键模拟支付',
      en: 'Simulate Payment',
      fr: 'Simuler le Paiement',
      es: 'Simular Pago',
      th: 'จำลองชำระเงิน',
      vi: 'Mô Phỏng Thanh Toán',
    },
    yearly_upgrade: {
      zh: '升阶解锁',
      en: 'Unlock Upgrade',
      fr: 'Débloquer la Montée',
      es: 'Desbloquear Superior',
      th: 'ปลดล็อกรุ่นสูง',
      vi: 'Mở Khóa Nâng Cấp',
    },
    promo_badge: {
      zh: '今日限时加赠',
      en: 'Limited Time Bonus',
      fr: 'Bonus à Durée Limitée',
      es: 'Bonus por Tiempo Limitado',
      th: 'ของแถมจำกัดเวลา',
      vi: 'Quà tặng Thời hạn',
    },
    permanent_seal: {
      zh: '永久封存',
      en: 'Permanently Sealed',
      fr: 'Scellé à Perpétuité',
      es: 'Sellado Permanentemente',
      th: 'ผนึกตลอดกาล',
      vi: 'Niêm Phong Vĩnh Viễn',
    },
    star_orbit_link: {
      zh: '星轨连接',
      en: 'Star Orbit Link',
      fr: 'Lien d\'Orbite Stellaire',
      es: 'Enlace Orbital Estelar',
      th: 'เส้นโคจรดวงดาวเชื่อม',
      vi: 'Liên Kết Quỹ Đạo Sao',
    },
    dual_core_seal: {
      zh: '双核印鉴',
      en: 'Dual-Core Seal',
      fr: 'Sceau des Deux Noyaux',
      es: 'Sello de Doble Núcleo',
      th: 'ตราประทับแกนคู่',
      vi: 'Con Dấu Song Nhân',
    },
    soul_os_signature: {
      zh: SOUL_OS_SIGNATURE,
      en: SOUL_OS_SIGNATURE,
      fr: SOUL_OS_SIGNATURE,
      es: SOUL_OS_SIGNATURE,
      th: SOUL_OS_SIGNATURE,
      vi: SOUL_OS_SIGNATURE,
    },
  },
} as const;

/** 军令 E104-刀二：统一寻址函数——封堵 LLM 推理阶段自由造词的唯一入口
 *  （结构化条目 hexagrams/tarot 寻址 name 域；扁平域直接六语取词；
 *    缺键/缺语种 ⇒ 返回 '' fail-closed，绝不猜测回退） */
export function getMetaphysicsTerm(
  category: keyof MetaphysicsTruthTableSchema,
  key: string | number,
  locale: SupportedLocale,
): string {
  const cat = (METAPHYSICS_TRUTH_TABLE as unknown as Record<string, Record<string, unknown>>)[category];
  const entry = cat ? cat[String(key)] : undefined;
  if (!entry || typeof entry !== 'object') return '';
  const rec = entry as Record<string, unknown>;
  const direct = rec[locale];
  if (typeof direct === 'string') return direct;
  const nameRec = rec.name;
  if (nameRec && typeof nameRec === 'object' && typeof (nameRec as Record<string, unknown>)[locale] === 'string') {
    return (nameRec as Record<string, string>)[locale];
  }
  return '';
}
