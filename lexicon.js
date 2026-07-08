/**
 * P1.2 Fixed Lexicon — 6 Language Term Dictionary + Pronoun Lock
 * 
 * Oracle Track  = 神谕轨（先知对用户说话）：高冷、权威、宿命感
 * Affirmation Track = 宣告轨（用户对自己说话）：温暖、坚定、力量感
 * 
 * 铁律：AI 生成文案时，必须根据语境选择对应轨道的人称和语气。
 *       分析/预测段落 → Oracle Track
 *       仪式/咒语/自我肯定段落 → Affirmation Track
 */

export const LEXICON = {
  // ═══════════════════════════════════════════════════════════
  // 中文
  // ═══════════════════════════════════════════════════════════
  zh: {
    pronouns: {
      oracle: {
        firstPerson: '本座',       // 先知自称
        secondPerson: '尔',        // 对用户称呼（高冷）
        possessive: '尔之',        // 你的（高冷）
      },
      affirmation: {
        firstPerson: '我',         // 用户自称（肯定句）
        secondPerson: '你',        // 用户对己称呼
        possessive: '我的',
      },
    },
    planets: {
      Sun: '太阳', Moon: '太阴', Mercury: '水星', Venus: '金星',
      Mars: '火星', Jupiter: '木星', Saturn: '土星', Uranus: '天王星',
      Neptune: '海王星', Pluto: '冥王星',
    },
    signs: {
      Aries: '白羊座', Taurus: '金牛座', Gemini: '双子座', Cancer: '巨蟹座',
      Leo: '狮子座', Virgo: '处女座', Libra: '天秤座', Scorpio: '天蝎座',
      Sagittarius: '射手座', Capricorn: '摩羯座', Aquarius: '水瓶座', Pisces: '双鱼座',
    },
    houses: {
      1: '第一宫（命宫）', 2: '第二宫（财帛宫）', 3: '第三宫（兄弟宫）',
      4: '第四宫（田宅宫）', 5: '第五宫（子女宫）', 6: '第六宫（奴仆宫）',
      7: '第七宫（夫妻宫）', 8: '第八宫（疾厄宫）', 9: '第九宫（迁移宫）',
      10: '第十宫（官禄宫）', 11: '第十一宫（福德宫）', 12: '第十二宫（玄秘宫）',
    },
    elements: { Fire: '火', Earth: '土', Air: '风', Water: '水' },
    aspects: { conjuct: '合相', trine: '三合', square: '方照', opposite: '对冲', sextile: '六合' },
    retrograde: '逆行',
    terms: {
      domicile: '入庙（能量最纯正、最舒适的状态）',
      exaltation: '擢升（能量最巅峰、最闪耀的状态）',
      fall: '落陷（能量受限、需要谨慎的状态）',
      shadow: '阴影自我',
      solarReturn: '太阳返照',
      transit: '行运',
      natal: '本命',
      house: '宫',
    },
    hedge: {
      contractBlackout: '若必须在此期间签约，需引入第三方律所或公证人进行双重审计',
      plutoSquare: '若必须在此期间谈判，请邀请中立第三方调解，避免正面权力对抗',
      mercuryRx: '水逆期间签署的文件易出现条款歧义，建议延至水星顺行后三日再签',
      marsPluto: '此相位易引发权力争夺，避免在公开场合与对方发生直接冲突',
      saturnReturn: '土星回归期宜守不宜攻，聚焦于清理旧债而非扩张新业务',
    },
    chapters: {
      prefix: '第', suffix: '章',
      names: ['年度财富矩阵', '逐月财帛天机', '天命事业征程', '资产护盾与阴影审计', '神谕显化密仪'],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // English
  // ═══════════════════════════════════════════════════════════
  en: {
    pronouns: {
      oracle: {
        firstPerson: 'I',         // The Seer / Oracle
        secondPerson: 'you',      // The initiate
        possessive: 'your',
      },
      affirmation: {
        firstPerson: 'I',
        secondPerson: 'you',
        possessive: 'my',
      },
    },
    planets: {
      Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus',
      Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus',
      Neptune: 'Neptune', Pluto: 'Pluto',
    },
    signs: {
      Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini', Cancer: 'Cancer',
      Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Scorpio',
      Sagittarius: 'Sagittarius', Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces',
    },
    houses: {
      1: '1st House (Self)', 2: '2nd House (Earned Income)', 3: '3rd House (Communication)',
      4: '4th House (Home & Family)', 5: '5th House (Creativity & Romance)', 6: '6th House (Daily Work & Health)',
      7: '7th House (Partnerships)', 8: '8th House (Shared Resources & Transformation)', 9: '9th House (Higher Learning & Travel)',
      10: '10th House (Career & Public Standing)', 11: '11th House (Networks & Hopes)', 12: '12th House (Subconscious & Seclusion)',
    },
    elements: { Fire: 'Fire', Earth: 'Earth', Air: 'Air', Water: 'Water' },
    aspects: { conjuct: 'conjunct', trine: 'trine', square: 'square', opposite: 'opposite', sextile: 'sextile' },
    retrograde: 'retrograde',
    terms: {
      domicile: 'domicile (purest, most comfortable energy)',
      exaltation: 'exaltation (peak, most radiant energy)',
      fall: 'fall (constrained energy requiring caution)',
      shadow: 'Shadow Self',
      solarReturn: 'Solar Return',
      transit: 'transit',
      natal: 'natal',
      house: 'House',
    },
    hedge: {
      contractBlackout: 'If you must sign during this period, engage a third-party legal auditor or notary for double verification',
      plutoSquare: 'If negotiations are unavoidable, invite a neutral mediator to prevent power struggles',
      mercuryRx: 'Documents signed during Mercury retrograde are prone to ambiguous clauses — delay until 3 days after station-direct',
      marsPluto: 'This aspect triggers power struggles — avoid direct confrontation in public settings',
      saturnReturn: 'Saturn return favors consolidation over expansion — focus on clearing old debts',
    },
    chapters: {
      prefix: 'Section ', suffix: '',
      names: ['The Annual Wealth Matrix', 'The 365-Day Monthly Revenue Matrix', 'The Destiny Career Path & Sovereign Tracks', 'The Debt & Risk Shield', "The Oracle's Manifestation Protocol"],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // Español
  // ═══════════════════════════════════════════════════════════
  es: {
    pronouns: {
      oracle: {
        firstPerson: 'Yo',
        secondPerson: 'tú',
        possessive: 'tu',
      },
      affirmation: {
        firstPerson: 'Yo',
        secondPerson: 'tú',
        possessive: 'mi',
      },
    },
    planets: {
      Sun: 'Sol', Moon: 'Luna', Mercury: 'Mercurio', Venus: 'Venus',
      Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano',
      Neptune: 'Neptuno', Pluto: 'Plutón',
    },
    signs: {
      Aries: 'Aries', Taurus: 'Tauro', Gemini: 'Géminis', Cancer: 'Cáncer',
      Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Escorpio',
      Sagittarius: 'Sagitario', Capricorn: 'Capricornio', Aquarius: 'Acuario', Pisces: 'Piscis',
    },
    houses: {
      1: 'Casa 1 (Identidad)', 2: 'Casa 2 (Ingresos)', 3: 'Casa 3 (Comunicación)',
      4: 'Casa 4 (Hogar)', 5: 'Casa 5 (Creatividad)', 6: 'Casa 6 (Trabajo)',
      7: 'Casa 7 (Sociedades)', 8: 'Casa 8 (Recursos Compartidos)', 9: 'Casa 9 (Conocimiento)',
      10: 'Casa 10 (Carrera)', 11: 'Casa 11 (Redes)', 12: 'Casa 12 (Inconsciente)',
    },
    elements: { Fire: 'Fuego', Earth: 'Tierra', Air: 'Aire', Water: 'Agua' },
    aspects: { conjuct: 'conjunción', trine: 'trígono', square: 'cuadratura', opposite: 'oposición', sextile: 'sextil' },
    retrograde: 'retrógrado',
    terms: {
      domicile: 'domicilio (energía más pura)',
      exaltation: 'exaltación (energía más radiante)',
      fall: 'caída (energía restringida)',
      shadow: 'Sombra del Ser',
      solarReturn: 'Retorno Solar',
      transit: 'tránsito',
      natal: 'natal',
      house: 'Casa',
    },
    hedge: {
      contractBlackout: 'Si debe firmar, contrate a un auditor legal externo para doble verificación',
      plutoSquare: 'Si las negociaciones son inevitables, invite a un mediador neutral',
      mercuryRx: 'Los documentos firmados durante Mercurio retrógrado son propensos a ambigüedades — espere 3 días después de la estación directa',
      marsPluto: 'Este aspecto desencadena luchas de poder — evite confrontaciones directas',
      saturnReturn: 'El retorno de Saturno favorece la consolidación sobre la expansión',
    },
    chapters: {
      prefix: 'Sección ', suffix: '',
      names: ['La Matriz de Riqueza Anual', 'La Matriz de Ingresos Mensuales', 'El Camino del Destino Profesional', 'El Escudo de Deuda y Riesgo', 'El Protocolo de Manifestación del Oráculo'],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // Français
  // ═══════════════════════════════════════════════════════════
  fr: {
    pronouns: {
      oracle: {
        firstPerson: 'Je',
        secondPerson: 'vous',
        possessive: 'votre',
      },
      affirmation: {
        firstPerson: 'Je',
        secondPerson: 'vous',
        possessive: 'mon',
      },
    },
    planets: {
      Sun: 'Soleil', Moon: 'Lune', Mercury: 'Mercure', Venus: 'Vénus',
      Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturne', Uranus: 'Uranus',
      Neptune: 'Neptune', Pluto: 'Pluton',
    },
    signs: {
      Aries: 'Bélier', Taurus: 'Taureau', Gemini: 'Gémeaux', Cancer: 'Cancer',
      Leo: 'Lion', Virgo: 'Vierge', Libra: 'Balance', Scorpio: 'Scorpion',
      Sagittarius: 'Sagittaire', Capricorn: 'Capricorne', Aquarius: 'Verseau', Pisces: 'Poissons',
    },
    houses: {
      1: 'Maison 1 (Identité)', 2: 'Maison 2 (Revenus)', 3: 'Maison 3 (Communication)',
      4: 'Maison 4 (Foyer)', 5: 'Maison 5 (Créativité)', 6: 'Maison 6 (Travail)',
      7: 'Maison 7 (Partenariats)', 8: 'Maison 8 (Ressources Partagées)', 9: 'Maison 9 (Savoir)',
      10: 'Maison 10 (Carrière)', 11: 'Maison 11 (Réseaux)', 12: 'Maison 12 (Inconscient)',
    },
    elements: { Fire: 'Feu', Earth: 'Terre', Air: 'Air', Water: 'Eau' },
    aspects: { conjuct: 'conjonction', trine: 'trigone', square: 'carré', opposite: 'opposition', sextile: 'sextile' },
    retrograde: 'rétrograde',
    terms: {
      domicile: 'domicile (énergie la plus pure)',
      exaltation: 'exaltation (énergie la plus rayonnante)',
      fall: 'chute (énergie restreinte)',
      shadow: 'Ombre de Soi',
      solarReturn: 'Révolution Solaire',
      transit: 'transit',
      natal: 'natal',
      house: 'Maison',
    },
    hedge: {
      contractBlackout: 'Si vous devez signer, engagez un notaire tiers pour double vérification',
      plutoSquare: 'Si les négociations sont inévitables, invitez un médiateur neutre',
      mercuryRx: 'Les documents signés pendant Mercure rétrograde sont sujets à ambiguïté — attendez 3 jours après la station directe',
      marsPluto: 'Cet aspect déclenche des luttes de pouvoir — évitez la confrontation publique',
      saturnReturn: 'Le retour de Saturne favorise la consolidation plutôt que l\'expansion',
    },
    chapters: {
      prefix: 'Section ', suffix: '',
      names: ['La Matrice de Richesse Annuelle', 'La Matrice des Revenus Mensuels', 'Le Chemin de Carrière du Destin', 'Le Bouclier de Dette et Risque', 'Le Protocole de Manifestation de l\'Oracle'],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // ภาษาไทย (Thai)
  // ═══════════════════════════════════════════════════════════
  th: {
    pronouns: {
      oracle: {
        firstPerson: 'ข้า',         // 🛡️ 军师神级修正：吾/本座（史诗感）
        secondPerson: 'เจ้า',       // 尔/你（古风/高冷）
        possessive: 'ของเจ้า',
      },
      affirmation: {
        firstPerson: 'ตัวฉัน',      // 🛡️ 军师神级修正：自我本尊锚定感
        secondPerson: 'คุณ',
        possessive: 'ของฉัน',
      },
    },
    planets: {
      Sun: 'พระอาทิตย์', Moon: 'พระจันทร์', Mercury: 'ดาวพุธ', Venus: 'ดาวศุกร์',
      Mars: 'ดาวอังคาร', Jupiter: 'ดาวพฤหัสบดี', Saturn: 'ดาวเสาร์', Uranus: 'ดาวยูเรนัส',
      Neptune: 'ดาวเนปจูน', Pluto: 'ดาวพลูโต',
    },
    signs: {
      Aries: 'ราศีเมษ', Taurus: 'ราศีพฤษภ', Gemini: 'ราศีมิถุน', Cancer: 'ราศีกรกฏ',
      Leo: 'ราศีสิงห์', Virgo: 'ราศีกันย์', Libra: 'ราศีตุลย์', Scorpio: 'ราศีพิจิก',
      Sagittarius: 'ราศีธนู', Capricorn: 'ราศีมังกร', Aquarius: 'ราศีกุมภ์', Pisces: 'ราศีมีน',
    },
    houses: {
      1: 'ภพที่ 1 (ตนุ)', 2: 'ภพที่ 2 (กตุธน)', 3: 'ภพที่ 3 (สหัชชะ)',
      4: 'ภพที่ 4 (พันธุ)', 5: 'ภพที่ 5 (ปุตตะ)', 6: 'ภพที่ 6 (ริปุ)',
      7: 'ภพที่ 7 (ปัตนิก)', 8: 'ภพที่ 8 (มรณะ)', 9: 'ภพที่ 9 (ธรรมะ)',
      10: 'ภพที่ 10 (กรรม)', 11: 'ภพที่ 11 (ลาภะ)', 12: 'ภพที่ 12 (วินาศ)',
    },
    elements: { Fire: 'ธาตุไฟ', Earth: 'ธาตุดิน', Air: 'ธาตุลม', Water: 'ธาตุน้ำ' },
    aspects: { conjuct: 'มุมเดียวกัน', trine: 'ตรีโกณ', square: 'มุมฉาก', opposite: 'ตรงข้าม', sextile: 'หกเหลี่ยม' },
    retrograde: 'ถอยหลัง',
    terms: {
      domicile: 'ภูมิฐาน (พลังงานบริสุทธิ์ที่สุด)',
      exaltation: 'อุจจน์ (พลังงานสูงสุด)',
      fall: 'นิจจน์ / ตก (พลังงานจำกัด)',
      shadow: 'เงามืด',
      solarReturn: 'Solar Return',
      transit: 'ทรานซิท',
      natal: 'นาทอล',
      house: 'ภพ',
    },
    hedge: {
      // 🛡️ 军师神级修正——高阶泰语商业风控
      contractBlackout: 'เปิดใช้งานการตรวจสอบบัญชีจากผู้เชี่ยวชาญภายนอกทันทีเพื่อสร้างเกราะป้องกันความเสี่ยง',
      plutoSquare: 'หากจำเป็นต้องเจรจา ควรเชิญคนกลางที่เป็นกลาง',
      mercuryRx: 'เอกสารที่เซ็นในช่วงดาวพุธถอยหลังมักมีข้อความคลุมเครือ — รอ 3 วันหลังจากดาวพุธเดินหน้า',
      marsPluto: 'ตำแหน่งนี้ก่อให้เกิดการแย่งชิงอำนาจ — หลีกเลี่ยงการเผชิญหน้าในที่สาธารณะ',
      saturnReturn: 'ดาวเสาร์กลับตำแหน่งเหมาะกับการรวมทรัพย์สินมากกว่าการขยาย',
      // 🛡️ P1.2 军师追加——高阶泰语合规条目
      financialAudit: 'เปิดใช้งานการตรวจสอบบัญชีจากผู้เชี่ยวชาญภายนอกทันทีเพื่อสร้างเกราะป้องกันความเสี่ยง',
      contractHold: 'ระงับการลงนามในสัญญาชั่วคราว ใช้มาตรการชะลอตัวเพื่อทบทวนเงื่อนไขอย่างละเอียด',
      riskIsolation: 'สร้างกำแพงกั้นความเสี่ยง แยกทรัพย์สินส่วนตัวออกจากความผูกพันทางธุรกิจอย่างเด็ดขาด',
    },
    chapters: {
      prefix: 'บทที่ ', suffix: '',
      names: ['เมทริกซ์ความมั่งคั่งประจำปี', 'เมทริกซ์รายได้ 12 เดือน', 'เส้นทางอาชีพแห่งโชคชะตา', 'โล่หนี้สินและความเสี่ยง', 'พิธีกรรมแห่งการดลบันดาล'],
    },
  },

  // ═══════════════════════════════════════════════════════════
  // Tiếng Việt (Vietnamese)
  // ═══════════════════════════════════════════════════════════
  vi: {
    pronouns: {
      oracle: {
        firstPerson: 'Ta',          // 先知自称（高冷、类似 "本座"）
        secondPerson: 'ngươi',      // 对用户称呼（古风/正式）
        possessive: 'của ngươi',
      },
      affirmation: {
        firstPerson: 'Tôi',         // 用户自称（肯定句、现代感）
        secondPerson: 'bạn',
        possessive: 'của tôi',
      },
    },
    planets: {
      Sun: 'Mặt Trời', Moon: 'Mặt Trăng', Mercury: 'Sao Thủy', Venus: 'Sao Kim',
      Mars: 'Sao Hỏa', Jupiter: 'Sao Mộc', Saturn: 'Sao Thổ', Uranus: 'Sao Thiên Vương',
      Neptune: 'Sao Hải Vương', Pluto: 'Sao Diêm Vương',
    },
    signs: {
      Aries: 'Bạch Dương', Taurus: 'Kim Ngưu', Gemini: 'Song Tử', Cancer: 'Cự Giải',
      Leo: 'Sư Tử', Virgo: 'Xử Nữ', Libra: 'Thiên Bình', Scorpio: 'Bọ Cạp',
      Sagittarius: 'Nhân Mã', Capricorn: 'Ma Kết', Aquarius: 'Bảo Bình', Pisces: 'Song Ngư',
    },
    houses: {
      1: 'Nhà 1 (Bản thân)', 2: 'Nhà 2 (Thu nhập)', 3: 'Nhà 3 (Giao tiếp)',
      4: 'Nhà 4 (Gia đình)', 5: 'Nhà 5 (Sáng tạo)', 6: 'Nhà 6 (Công việc)',
      7: 'Nhà 7 (Đối tác)', 8: 'Nhà 8 (Tài chính chung)', 9: 'Nhà 9 (Kiến thức)',
      10: 'Nhà 10 (Sự nghiệp)', 11: 'Nhà 11 (Mạng lưới)', 12: 'Nhà 12 (Tiềm thức)',
    },
    elements: { Fire: 'Hỏa', Earth: 'Thổ', Air: 'Khí', Water: 'Thủy' },
    aspects: { conjuct: 'hợp', trine: 'tam hợp', square: 'vuông góc', opposite: 'đối xung', sextile: 'lục hợp' },
    retrograde: 'nghịch hành',
    terms: {
      domicile: 'Vị trí Nhập Miếu (Năng lượng thuần khiết nhất)',
      exaltation: 'Vị trí Đắc Địa / Thăng Hoa',
      fall: 'Vị trí Hãm Địa (Năng lượng bị kìm hãm)',
      shadow: 'Bản ngã bóng tối',
      solarReturn: 'Solar Return',
      transit: 'chuyển động',
      natal: 'bản mệnh',
      house: 'Nhà',
    },
    hedge: {
      contractBlackout: 'Kích hoạt quy trình kiểm toán từ bên thứ ba ngay lập tức để thiết lập rào chắn rủi ro',
      plutoSquare: 'Nếu buộc phải đàm phán, hãy mời trung gian hòa giải trung lập',
      mercuryRx: 'Hợp đồng ký trong thời gian Sao Thủy nghịch hành dễ có điều khoản mơ hồ — hãy đợi 3 ngày sau khi Sao Thủy thuận hành',
      marsPluto: 'Góc chiếu này dễ gây tranh giành quyền lực — tránh đối đầu công khai',
      saturnReturn: 'Sao Thổ hồi vị thích hợp củng cố hơn là mở rộng — tập trung thanh lý nợ cũ',
      // 🛡️ P1.2 军师追加——高阶商业合规条目
      financialAudit: 'Kích hoạt quy trình kiểm toán từ bên thứ ba ngay lập tức để thiết lập rào chắn rủi ro',
      contractHold: 'Đóng băng mọi hoạt động ký kết; áp dụng thời gian đóng băng để rà soát từng điều khoản',
      debtRestructuring: 'Tái cấu trúc danh mục nợ, triệt để thanh lý các nghĩa vụ tài chính ẩn khuất',
    },
    chapters: {
      prefix: 'Chương ', suffix: '',
      names: ['Ma Trận Tài Lộc Định Mệnh Năm', 'Sa Bàn 12 Tháng Tài Chính', 'Đường Sự Nghiệp Thiên Mệnh', 'Lá Chắn Tài Sản & Kiểm Toán Bóng Tối', 'Nghi Thức Hiển Hóa Tài Lộc'],
    },
  },
};

/**
 * 获取某个语言的人称代词
 * @param {string} lang - 语言代码
 * @param {'oracle'|'affirmation'} track - 轨道
 * @returns {object} 人称代词对象
 */
export function getPronouns(lang, track = 'oracle') {
  const l = LEXICON[lang] || LEXICON.en;
  return l.pronouns[track] || l.pronouns.oracle;
}

/**
 * 获取某个语言的行星名称
 */
export function getPlanetName(lang, planet) {
  const l = LEXICON[lang] || LEXICON.en;
  return l.planets[planet] || planet;
}

/**
 * 获取某个语言的星座名称
 */
export function getSignName(lang, sign) {
  const l = LEXICON[lang] || LEXICON.en;
  return l.signs[sign] || sign;
}

/**
 * 获取宫位描述
 */
export function getHouseName(lang, houseNum) {
  const l = LEXICON[lang] || LEXICON.en;
  return l.houses[houseNum] || `House ${houseNum}`;
}

/**
 * 获取对冲对策
 */
export function getHedgePhrase(lang, key) {
  const l = LEXICON[lang] || LEXICON.en;
  return l.hedge[key] || '';
}

/**
 * 获取章节标题
 */
export function getChapterTitle(lang, chapterIndex) {
  const l = LEXICON[lang] || LEXICON.en;
  const prefix = l.chapters.prefix || '';
  const suffix = l.chapters.suffix || '';
  const name = l.chapters.names[chapterIndex - 1] || '';
  return `${prefix}${chapterIndex}${suffix}: ${name}`;
}
