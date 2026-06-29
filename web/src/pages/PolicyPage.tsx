import React from 'react';
import { useTranslation } from 'react-i18next';

interface PolicyPageProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const PrivacyPolicyContent: React.FC<{ lang: string }> = ({ lang }) => {
  const t = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: { zh: '隐私政策', en: 'Privacy Policy', es: 'Política de Privacidad', fr: 'Politique de Confidentialité', th: 'นโยบายความเป็นส่วนตัว', vi: 'Chính sách Bảo mật' },
      lastUpdated: { zh: '最后更新', en: 'Last Updated', es: 'Última actualización', fr: 'Dernière mise à jour', th: 'อัปเดตล่าสุด', vi: 'Cập nhật lần cuối' },
      section1Title: { zh: '我们收集什么', en: 'What We Collect', es: 'Lo que recopilamos', fr: 'Ce que nous collectons', th: 'สิ่งที่เราเก็บรวบรวม', vi: 'Những gì chúng tôi thu thập' },
      section1: { zh: '当您使用 KindredSouls 时，我们仅收集您主动提供的信息，包括出生日期（用于生成星盘和命理报告）。我们不会收集您的全名、身份证号、财务信息或精确位置。', en: 'When you use KindredSouls, we only collect information you voluntarily provide, including your birth date (used solely to generate star charts and fortune reports). We do not collect your full name, ID number, financial information, or precise location.', es: 'Cuando usa KindredSouls, solo recopilamos la información que usted proporciona voluntariamente, incluida su fecha de nacimiento (utilizada únicamente para generar cartas natales e informes de fortuna). No recopilamos su nombre completo, número de identificación, información financiera ni ubicación precisa.', fr: 'Lorsque vous utilisez KindredSouls, nous collectons uniquement les informations que vous fournissez volontairement, y compris votre date de naissance (utilisée uniquement pour générer des thèmes astraux et des rapports de fortune). Nous ne collectons pas votre nom complet, votre numéro d\'identification, vos informations financières ni votre localisation précise.', th: 'เมื่อคุณใช้ KindredSouls เราจะเก็บรวบรวมเฉพาะข้อมูลที่คุณให้มาด้วยความสมัครใจ รวมถึงวันเกิดของคุณ (ใช้เพื่อสร้างดวงชะตาและรายงานโชคลาภเท่านั้น) เราไม่เก็บรวบรวมชื่อเต็ม หมายเลขบัตรประจำตัว ข้อมูลทางการเงิน หรือตำแหน่งที่แม่นยำ', vi: 'Khi bạn sử dụng KindredSouls, chúng tôi chỉ thu thập thông tin bạn chủ động cung cấp, bao gồm ngày sinh (được sử dụng để tạo lá số và báo cáo tài lộc). Chúng tôi không thu thập họ tên đầy đủ, số CMND, thông tin tài chính hay vị trí chính xác.' },
      section2Title: { zh: '数据使用与不转售声明', en: 'Data Use & Non-Resale Statement', es: 'Uso de datos y declaración de no reventa', fr: 'Utilisation des données et déclaration de non-revente', th: 'การใช้ข้อมูลและการไม่ขายต่อ', vi: 'Sử dụng dữ liệu & cam kết không bán lại' },
      section2: { zh: '我们珍视您的隐私。您的生日信息严格加密，仅用于计算星盘和生成个性化报告。KindredSouls 绝不会将您的个人身份或星盘数据出售、出租或共享给任何第三方广告商。您的数据仅用于为您提供命理服务，绝不用于广告定向或任何商业推广目的。', en: 'We value your privacy. Your birth details (date, time, location) are strictly encoded and used solely for calculating star charts and generating your personalized reports. KindredSouls never sells, rents, or shares your personal identity or celestial data with third-party advertisers. Your data is used solely to provide you with metaphysical services, never for ad targeting or commercial promotion.', es: 'Valoramos su privacidad. Sus datos de nacimiento (fecha, hora, ubicación) están estrictamente codificados y se utilizan únicamente para calcular cartas natales y generar sus informes personalizados. KindredSouls nunca vende, alquila ni comparte su identidad personal o datos celestiales con anunciantes externos. Sus datos se utilizan únicamente para proporcionarle servicios metafísicos, nunca para segmentación publicitaria.', fr: 'Nous respectons votre vie privée. Vos données de naissance (date, heure, lieu) sont strictement codées et utilisées uniquement pour calculer les thèmes astraux et générer vos rapports personnalisés. KindredSouls ne vend, ne loue ni ne partage jamais votre identité personnelle ou vos données célestes avec des annonceurs externes. Vos données sont utilisées uniquement pour vous fournir des services métaphysiques.', th: 'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ รายละเอียดวันเกิดของคุณถูกเข้ารหัสอย่างเข้มงวดและใช้เพื่อคำนวณดวงชะตาและสร้างรายงานส่วนบุคคลของคุณเท่านั้น KindredSouls ไม่เคยขาย เช่า หรือแบ่งปันข้อมูลตัวตนหรือข้อมูลดวงดาวของคุณกับนักการตลาดบุคคลที่สาม ข้อมูลของคุณใช้เพื่อให้บริการเมตาฟิสิกส์แก่คุณเท่านั้น ไม่เคยใช้เพื่อการกำหนดเป้าหมายโฆษณา', vi: 'Chúng tôi trân trọng quyền riêng tư của bạn. Thông tin sinh nhật của bạn được mã hóa nghiêm ngặt và chỉ được sử dụng để tính toán lá số và tạo báo cáo cá nhân hóa. KindredSouls không bao giờ bán, cho thuê hay chia sẻ danh tính cá nhân hay dữ liệu tử vi của bạn với bên quảng cáo thứ ba. Dữ liệu của bạn chỉ được dùng để cung cấp dịch vụ tâm linh cho bạn.' },
      section3Title: { zh: '娱乐免责', en: 'Entertainment Disclaimer', es: 'Exención de responsabilidad de entretenimiento', fr: 'Avertissement de divertissement', th: 'ข้อจำกัดความรับผิดชอบด้านความบันเทิง', vi: 'Tuyên bố miễn trừ giải trí' },
      section3: { zh: 'KindredSouls 生成的报告、星盘和预测均由人工智能和宇宙算法处理，仅用于娱乐和心理疏导目的。我们不保证 100% 准确性，这些报告不应作为专业财务、法律、医疗建议的替代品。所有内容均属娱乐性质，如有疑问请咨询专业人士。', en: 'All reports, horoscopes, and predictions generated by KindredSouls are processed by artificial intelligence and cosmic algorithms for entertainment and psychological guidance purposes only. We do not guarantee 100% accuracy, and the reports should not be used as professional financial, legal, or medical advice. All content is for entertainment purposes; please consult a qualified professional for serious concerns.', es: 'Todos los informes, horóscopos y predicciones generados por KindredSouls son procesados por inteligencia artificial y algoritmos cósmicos únicamente con fines de entretenimiento y orientación psicológica. No garantizamos una precisión del 100% y los informes no deben utilizarse como sustituto de asesoramiento financiero, legal o médico profesional.', fr: 'Tous les rapports, horoscopes et prédictions générés par KindredSouls sont traités par intelligence artificielle et algorithmes cosmiques à des fins de divertissement et d\'orientation psychologique uniquement. Nous ne garantissons pas une précision à 100% et les rapports ne doivent pas être utilisés comme substitut à des conseils professionnels financiers, juridiques ou médicaux.', th: 'รายงาน ดวงชะตา และการทำนายทั้งหมดที่ KindredSouls สร้างขึ้นจะถูกประมวลผลโดยปัญญาประดิษฐ์และอัลกอริทึมจักรวาลเพื่อวัตถุประสงค์ด้านความบันเทิงและการแนะนำทางจิตวิทยาเท่านั้น เราไม่รับประกันความแม่นยำ 100% และไม่ควรใช้รายงานเหล่านี้เป็นการแทนที่คำแนะนำด้านการเงิน กฎหมาย หรือการแพทย์', vi: 'Tất cả các báo cáo, lá số và dự đoán do KindredSouls tạo ra đều được xử lý bởi trí tuệ nhân tạo và thuật toán vũ trụ chỉ nhằm mục đích giải trí và hướng dẫn tâm lý. Chúng tôi không đảm bảo độ chính xác 100% và các báo cáo không nên được sử dụng như lời khuyên tài chính, pháp lý hoặc y tế chuyên nghiệp.' },
      section4Title: { zh: 'Cookies 与追踪', en: 'Cookies & Tracking', es: 'Cookies y seguimiento', fr: 'Cookies et suivi', th: 'คุกกี้และการติดตาม', vi: 'Cookie & Theo dõi' },
      section4: { zh: '我们可能使用必要的功能性 Cookies 来维持服务运行。我们不使用第三方广告追踪像素或行为分析工具。如有任何疑问，请通过 support@kindredsouls.com.au 联系我们。', en: 'We may use essential functional cookies to maintain service operation. We do not use third-party ad tracking pixels or behavioral analytics tools. For any questions, please contact us at support@kindredsouls.com.au.', es: 'Podemos usar cookies funcionales esenciales para mantener el funcionamiento del servicio. No usamos píxeles de seguimiento publicitario de terceros ni herramientas de análisis de comportamiento. Para cualquier pregunta, contáctenos en support@kindredsouls.com.au.', fr: 'Nous pouvons utiliser des cookies fonctionnels essentiels pour maintenir le fonctionnement du service. Nous n\'utilisons pas de pixels de suivi publicitaire tiers ni d\'outils d\'analyse comportementale. Pour toute question, contactez-nous à support@kindredsouls.com.au.', th: 'เราอาจใช้คุกกี้ที่จำเป็นเพื่อรักษาการทำงานของบริการ เราไม่ใช้พิกเซลติดตามโฆษณาของบุคคลที่สามหรือเครื่องมือวิเคราะห์พฤติกรรม หากมีคำถามใด ๆ โปรดติดต่อเราที่ support@kindredsouls.com.au', vi: 'Chúng tôi có thể sử dụng cookie chức năng cần thiết để duy trì hoạt động dịch vụ. Chúng tôi không sử dụng pixel theo dõi quảng cáo của bên thứ ba hay công cụ phân tích hành vi. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi tại support@kindredsouls.com.au.' },
      section5Title: { zh: '联系我们', en: 'Contact Us', es: 'Contáctenos', fr: 'Nous contacter', th: 'ติดต่อเรา', vi: 'Liên hệ' },
      section5: { zh: '如对本政策有任何疑问，请联系：support@kindredsouls.com.au', en: 'For questions about this policy, contact: support@kindredsouls.com.au', es: 'Para preguntas sobre esta política, contacte: support@kindredsouls.com.au', fr: 'Pour toute question concernant cette politique, contactez : support@kindredsouls.com.au', th: 'สำหรับคำถามเกี่ยวกับนโยบายนี้ ติดต่อ: support@kindredsouls.com.au', vi: 'Nếu có câu hỏi về chính sách này, liên hệ: support@kindredsouls.com.au' },
    };
    const l = texts[key]?.[lang] || texts[key]?.['en'] || key;
    return l;
  };

  return (
    <div className="policy-content">
      <h2>{t('section1Title')}</h2>
      <p>{t('section1')}</p>
      <h2>{t('section2Title')}</h2>
      <p>{t('section2')}</p>
      <h2>{t('section3Title')}</h2>
      <p>{t('section3')}</p>
      <h2>{t('section4Title')}</h2>
      <p>{t('section4')}</p>
      <h2>{t('section5Title')}</h2>
      <p>{t('section5')}</p>
    </div>
  );
};

const TermsContent: React.FC<{ lang: string }> = ({ lang }) => {
  const t = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: { zh: '服务条款', en: 'Terms of Service', es: 'Términos de Servicio', fr: "Conditions d'Utilisation", th: 'ข้อกำหนดการให้บริการ', vi: 'Điều khoản Dịch vụ' },
      section1Title: { zh: '服务说明', en: 'Description of Service', es: 'Descripción del servicio', fr: 'Description du service', th: 'คำอธิบายบริการ', vi: 'Mô tả Dịch vụ' },
      section1: { zh: 'KindredSouls 是一款基于人工智能和宇宙算法的命理娱乐应用，提供星座、八字、易经等个性化报告生成服务。我们持续改进服务，保留在不事先通知的情况下修改或中断服务的权利。', en: 'KindredSouls is a metaphysical entertainment app powered by AI and cosmic algorithms, providing personalized reports based on Western astrology, BaZi, and I Ching. We continuously improve our service and reserve the right to modify or discontinue it without prior notice.', es: 'KindredSouls es una aplicación de entretenimiento metafísico impulsada por IA y algoritmos cósmicos, que proporciona informes personalizados basados en astrología occidental, BaZi e I Ching. Mejoramos continuamente nuestro servicio y nos reservamos el derecho de modificarlo o discontinuarlo sin previo aviso.', fr: 'KindredSouls est une application de divertissement métaphysique alimentée par l\'IA et les algorithmes cosmiques, fournissant des rapports personnalisés basés sur l\'astrologie occidentale, le BaZi et l\'I Ching. Nous améliorons continuellement notre service et nous réservons le droit de le modifier ou de l\'interrompre sans préavis.', th: 'KindredSouls เป็นแอปความบันเทิงเมตาฟิสิกส์ที่ขับเคลื่อนด้วย AI และอัลกอริทึมจักรวาล โดยให้รายงานส่วนบุคคลตามดวงชะตาตะวันตก BaZi และอี้จิง เราปรับปรุงบริการของเราอย่างต่อเนื่องและขอสงวนสิทธิ์ในการเปลี่ยนแปลงหรือยุติบริการโดยไม่ต้องแจ้งล่วงหน้า', vi: 'KindredSouls là ứng dụng giải trí tâm linh được hỗ trợ bởi AI và thuật toán vũ trụ, cung cấp báo cáo cá nhân hóa dựa trên chiêm tinh học phương Tây, Bát Tự và Kinh Dịch. Chúng tôi liên tục cải thiện dịch vụ và bảo lưu quyền thay đổi hoặc ngừng cung cấp dịch vụ mà không cần thông báo trước.' },
      section2Title: { zh: '娱乐至上免责', en: 'Entertainment Only Disclaimer', es: 'Exención de responsabilidad de entretenimiento', fr: 'Avertissement de divertissement', th: 'ข้จำกัดความรับผิดชอบด้านความบันเทิง', vi: 'Tuyên bố miễn trừ giải trí' },
      section2: { zh: 'KindredSouls 生成的所有报告、星盘和预测均由人工智能和宇宙算法处理，仅用于娱乐和心理疏导目的。我们不保证 100% 准确性，这些报告不应作为专业财务、法律、医疗建议的替代品。所有内容均属娱乐性质，如有疑问请咨询专业人士。', en: 'All reports, horoscopes, and predictions generated by KindredSouls are processed by artificial intelligence and cosmic algorithms for entertainment and psychological guidance purposes only. We do not guarantee 100% accuracy, and the reports should not be used as professional financial, legal, or medical advice. All content is for entertainment purposes; please consult a qualified professional for serious concerns.', es: 'Todos los informes, horóscopos y predicciones generados por KindredSouls son procesados por inteligencia artificial y algoritmos cósmicos únicamente con fines de entretenimiento y orientación psicológica. No garantizamos una precisión del 100% y los informes no deben utilizarse como sustituto de asesoramiento financiero, legal o médico profesional.', fr: 'Tous les rapports, horoscopes et prédictions générés par KindredSouls sont traités par intelligence artificielle et algorithmes cosmiques à des fins de divertissement et d\'orientation psychologique uniquement. Nous ne garantissons pas une précision à 100% et les rapports ne doivent pas être utilisés comme substitut à des conseils professionnels financiers, juridiques ou médicaux.', th: 'รายงาน ดวงชะตา และการทำนายทั้งหมดที่ KindredSouls สร้างขึ้นจะถูกประมวลผลโดยปัญญาประดิษฐ์และอัลกอริทึมจักรวาลเพื่อวัตถุประสงค์ด้านความบันเทิงและการแนะนำทางจิตวิทยาเท่านั้น เราไม่รับประกันความแม่นยำ 100% และไม่ควรใช้รายงานเหล่านี้เป็นการแทนที่คำแนะนำด้านการเงิน กฎหมาย หรือการแพทย์', vi: 'Tất cả các báo cáo, lá số và dự đoán do KindredSouls tạo ra đều được xử lý bởi trí tuệ nhân tạo và thuật toán vũ trụ chỉ nhằm mục đích giải trí và hướng dẫn tâm lý. Chúng tôi không đảm bảo độ chính xác 100% và các báo cáo không nên được sử dụng như lời khuyên tài chính, pháp lý hoặc y tế chuyên nghiệp.' },
      section3Title: { zh: '退款政策熔断', en: 'Refund Policy', es: 'Política de reembolso', fr: 'Politique de remboursement', th: 'นโยบายการคืนเงิน', vi: 'Chính sách Hoàn tiền' },
      section3: { zh: '由于数字产品和即时 AI 报告生成的性质，所有 $4.99 单次报告、$2.99 月刊和 $99.99 年度全通卡的购买，一经生成报告，概不退款。如遇支付问题，请联系 support@kindredsouls.com.au。', en: 'Due to the nature of digital products and instant AI computing generation, all sales for $4.99 Single Reports, $2.99 Monthly Magazines, and $99.99 Annual All-Passes are final and non-refundable once the report has been rendered. For payment issues, contact support@kindredsouls.com.au.', es: 'Debido a la naturaleza de los productos digitales y la generación instantánea de informes de IA, todas las ventas de Informes Simples a $4.99, Revistas Mensuales a $2.99 y Pases Anuales a $99.99 son definitivas y no reembolsables una vez que el informe se haya generado.', fr: "En raison de la nature des produits numériques et de la génération instantanée de rapports par IA, tous les achats de Rapports Simples à 4,99$, Magazines Mensuels à 2,99$ et Passes Annuels à 99,99$ sont finals et non remboursables dès que le rapport a été généré.", th: 'เนื่องจากลักษณะของผลิตภัณฑ์ดิจิทัลและการสร้างรายงาน AI ทันที การซื้อทั้งหมดสำหรับรายงานเดียว $4.99 วารสารรายเดือน $2.99 และพาสรายปี $99.99 ถือเป็นที่สุดและไม่สามารถขอคืนเงินได้เมื่อรายงานถูกสร้างแล้ว', vi: 'Do tính chất của sản phẩm kỹ thuật số và tạo báo cáo AI tức thì, tất cả các giao dịch mua Báo cáo Đơn $4.99, Tạp chí Hàng tháng $2.99 và Thẻ Toàn quyền Hàng năm $99.99 đều là giao dịch cuối cùng và không được hoàn tiền sau khi báo cáo đã được tạo.' },
      section4Title: { zh: '知识产权', en: 'Intellectual Property', es: 'Propiedad intelectual', fr: 'Propriété intellectuelle', th: 'ทรัพย์สินทางปัญญา', vi: 'Sở hữu trí tuệ' },
      section4: { zh: 'KindredSouls 的所有内容、设计、标识和软件均为本公司财产，受版权法保护。未经授权，禁止复制、分发或衍生任何内容。', en: 'All content, design, logos, and software of KindredSouls are company property protected by copyright law. Reproduction, distribution, or creation of derivative works without authorization is prohibited.', es: 'Todo el contenido, diseño, logotipos y software de KindredSouls son propiedad de la empresa protegidos por la ley de derechos de autor. Se prohíbe la reproducción, distribución o creación de obras derivadas sin autorización.', fr: 'Tout le contenu, design, logos et logiciels de KindredSouls sont la propriété de l\'entreprise protégés par le droit d\'auteur. La reproduction, la distribution ou la création d\'œuvres dérivées sans autorisation est interdite.', th: 'เนื้อหา การออกแบบ โลโก้ และซอฟต์แวร์ทั้งหมดของ KindredSouls เป็นทรัพย์สินของบริษัทที่ได้รับความคุ้มครองตามกฎหมายลิขสิทธิ์ ห้ามทำซ้ำ เผยแพร่ หรือสร้างงานดัดแปลงโดยไม่ได้รับอนุญาต', vi: 'Tất cả nội dung, thiết kế, logo và phần mềm của KindredSouls đều là tài sản của công ty được bảo vệ bởi luật bản quyền. Nghiêm cấm sao chép, phân phối hoặc tạo tác phẩm phái sinh khi chưa được ủy quyền.' },
      section5Title: { zh: '服务变更', en: 'Changes to Service', es: 'Cambios al servicio', fr: 'Modifications du service', th: 'การเปลี่ยนแปลงบริการ', vi: 'Thay đổi Dịch vụ' },
      section5: { zh: '我们保留随时修改服务条款的权利。修改后的条款将在本页发布。继续使用服务即表示您接受修改后的条款。', en: 'We reserve the right to modify these terms at any time. Modified terms will be posted on this page. Continued use of the service constitutes acceptance of the modified terms.', es: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los términos modificados se publicarán en esta página. El uso continuado del servicio constituye la aceptación de los términos modificados.', fr: 'Nous nous réservons le droit de modifier ces conditions à tout moment. Les conditions modifiées seront publiées sur cette page. L\'utilisation continue du service constitue l\'acceptation des conditions modifiées.', th: 'เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงข้อกำหนดเหล่านี้ได้ตลอดเวลา ข้อกำหนดที่แก้ไขจะโพสต์ในหน้านี้ การใช้บริการต่อไปถือว่ายอมรับข้อกำหนดที่แก้ไขแล้ว', vi: 'Chúng tôi bảo lưu quyền thay đổi các điều khoản này bất cứ lúc nào. Các điều khoản sửa đổi sẽ được đăng trên trang này. Việc tiếp tục sử dụng dịch vụ đồng nghĩa với việc bạn chấp nhận các điều khoản đã sửa đổi.' },
      section6Title: { zh: '联系我们', en: 'Contact Us', es: 'Contáctenos', fr: 'Nous contacter', th: 'ติดต่อเรา', vi: 'Liên hệ' },
      section6: { zh: '如有任何疑问，请联系：support@kindredsouls.com.au', en: 'For questions, contact: support@kindredsouls.com.au', es: 'Para preguntas, contacte: support@kindredsouls.com.au', fr: 'Pour toute question, contactez : support@kindredsouls.com.au', th: 'สำหรับคำถาม ติดต่อ: support@kindredsouls.com.au', vi: 'Nếu có câu hỏi, liên hệ: support@kindredsouls.com.au' },
    };
    const l = texts[key]?.[lang] || texts[key]?.['en'] || key;
    return l;
  };

  return (
    <div className="policy-content">
      <h2>{t('section1Title')}</h2>
      <p>{t('section1')}</p>
      <h2>{t('section2Title')}</h2>
      <p>{t('section2')}</p>
      <h2>{t('section3Title')}</h2>
      <p>{t('section3')}</p>
      <h2>{t('section4Title')}</h2>
      <p>{t('section4')}</p>
      <h2>{t('section5Title')}</h2>
      <p>{t('section5')}</p>
      <h2>{t('section6Title')}</h2>
      <p>{t('section6')}</p>
    </div>
  );
};

const PolicyPage: React.FC<PolicyPageProps> = ({ type, onBack }) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').split('-')[0] as 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';
  const isZh = lang === 'zh';

  return (
    <div className="page policy-page">
      <div className="policy-container">
        <button className="policy-back-btn" onClick={onBack}>
          ← {isZh ? '返回' : 'Back'}
        </button>
        <h1 className="policy-title">
          {type === 'privacy' ? (
            lang === 'zh' ? '隐私政策' : lang === 'es' ? 'Política de Privacidad' : lang === 'fr' ? 'Politique de Confidentialité' : lang === 'th' ? 'นโยบายความเป็นส่วนตัว' : lang === 'vi' ? 'Chính sách Bảo mật' : 'Privacy Policy'
          ) : (
            lang === 'zh' ? '服务条款' : lang === 'es' ? 'Términos de Servicio' : lang === 'fr' ? "Conditions d'Utilisation" : lang === 'th' ? 'ข้อกำหนดการให้บริการ' : lang === 'vi' ? 'Điều khoản Dịch vụ' : 'Terms of Service'
          )}
        </h1>
        <p className="policy-date">
          {isZh ? '最后更新：2026年6月27日' : 'Last Updated: June 27, 2026'}
        </p>
        {type === 'privacy' ? <PrivacyPolicyContent lang={lang} /> : <TermsContent lang={lang} />}
      </div>
    </div>
  );
};

export default PolicyPage;
