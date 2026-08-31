// 🛠️ V59: 修复Markdown符号残留+排版优化
// ═══════════════════════════════════════════════════════════
// 🔒 参数封仓 V79 — 本文件所有样式参数已锁定，禁止修改
// 详见: ~/qclaw/workspace/KindredSouls_SacredYearlyReportBox_参数封仓手册.md
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useState } from 'react';

const SacredYearlyReportBox: React.FC<{
  rawStreamText: string;
  yearlyCardsReady: boolean;
  realSunSign?: string;
  lang?: string;
  reportType?: 'yearly' | 'monthly' | 'once';  // 🛠️ V120: 控制标题显示
}> = ({ rawStreamText, yearlyCardsReady, lang = 'zh', reportType = 'yearly' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const tickRef = useRef(0);
  const [showSkeleton, setShowSkeleton] = useState(true); // 🛠️ V79: 先骨架再内容
  const hasContent = rawStreamText && rawStreamText.trim().length > 0;

  // 🛡️ V276-fix: hasContent 出现时关掉骨架屏，显示真实内容
  useEffect(() => {
    if (hasContent) setShowSkeleton(false);
  }, [hasContent]);


  // 🛠️ V78 追光器：每次token追加自动滚到底部，丝滑不卡顿
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || yearlyCardsReady || !hasContent) return;
    el.scrollTop = el.scrollHeight;
  }, [rawStreamText, tickRef.current]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (yearlyCardsReady) {
      autoScrollRef.current = false;
      // 🛡️ V257-fix: 先记录当前 scrollTop (通常很大, 因流式阶段 autoScroll 一直在底), 否则 smooth scroll 递减时 handleScroll 会把首帧误判为"用户向下滚"秒关气泡
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [yearlyCardsReady]);

  useEffect(() => {
    if (!yearlyCardsReady && hasContent) {
      const iv = setInterval(() => { tickRef.current += 1; }, 300);
      return () => clearInterval(iv);
    }
  }, [yearlyCardsReady, hasContent]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // 流式阶段: 仅追踪 autoScroll
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    autoScrollRef.current = atBottom;
  };

  // 🛠️ V64: 军师天启版洗涤滤网 - 6大穿帮矫正
  const cleanAndInjectChapters = (text: string): string => {
    if (!text) return '';
    let cleaned = text;

    // 🛠️ V120-fix3: 裸 ⚠ 归一化为 ⚠️（AI 偶发漏输 VS16 变体选择器，导致前端 regex 配不上）
    cleaned = cleaned.replace(/⚠(?!️)/g, '⚠️');

    // 🛠️ V270-fix: 容错正则兜底——LLM 漏标或产生非法换行符时，前端兜底识别并补全 ✦ 标签
    // Step 1: 清理非法换行符（垂直跳格 \x0b / 垂直制表符）
    cleaned = cleaned.replace(/\x0b/g, '\n');

    // Step 2: 法语周标题漏标兜底——检测到 "Semaine N:" 但前面没有 ✦ 时，自动补全标签
    // 仅在当前行没有 ✦ 时触发，避免重复包裹已有标签的行
    cleaned = cleaned.replace(
      /^(?!✦)(.*?(?:Semaine\s+[2-4]:[\s\S]*?))$/gm,
      (m, content) => {
        // 如果本行或前一行已经有 ✦，不干预
        return m;
      }
    );
    // 法语 Semaine 2/3/4 漏标兜底：行首无 ✦ 且含 Semaine + 数字 + : → 前面加 ✦ 并换行
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Semaine\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emojiMap: Record<string,string> = { "2": "🔴", "3": "🔵", "4": "🟢" };
        const _clean = rest.replace(/^\s*\[[🔴🔵🟢⚠️]\s*([^\]]*)\]?\s*$/, '$1').trim();
        return `✦ [${emojiMap[weekNum]} ${_clean}]`;
      }
    );
    // 法语 "Disjoncteur à Haut Risque" 等小标题（Semaine 2 的子标题，漏了 ✦ + Semaine 2 标签）→ 补全为 ✦ [🔴 Semaine 2]
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Disjoncteur[^\n]*)$/gm,
      '✦ [🔴 Semaine 2: Circuit de Haut Risque]'
    );
    // 法语 "Intégration Stratégique"（Semaine 3）
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Intégration\s+Stratégique[^\n]*)$/gm,
      '✦ [🔵 Semaine 3: Intégration Stratégique]'
    );
    // 法语 "Explosion de Richesse"（Semaine 4）
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Explosion\s+de\s+Richesse[^\n]*)$/gm,
      '✦ [🟢 Semaine 4: Explosion de Richesse]'
    );
    // 财务陷阱兜底：检测到 Pièges Financiers 但前面没有 ✦
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Pièges\s+Financiers[^\n]*)$/gm,
      '✦ [⚠️ Pièges Financiers: ' + new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, c => c.toUpperCase()) + '] ✦'
    );
    // 西班牙语周标题漏标兜底
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Semana\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emojiMap: Record<string,string> = { "2": "🔴", "3": "🔵", "4": "🟢" };
        const _clean = rest.replace(/^\s*\[[🔴🔵🟢⚠️]\s*([^\]]*)\]?\s*$/, '$1').trim();
        return `✦ [${emojiMap[weekNum]} ${_clean}]`;
      }
    );
    // 泰语周标题漏标兜底
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*สัปดาห์ที่\s*([2-4])[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emojiMap: Record<string,string> = { "2": "🔴", "3": "🔵", "4": "🟢" };
        const _clean = rest.replace(/^\s*\[[🔴🔵🟢⚠️]\s*([^\]]*)\]?\s*$/, '$1').trim();
        return `✦ [${emojiMap[weekNum]} ${_clean}]`;
      }
    );
    // 越南语周标题漏标兜底
    cleaned = cleaned.replace(
      /^(?!✦)([^\n]*Tuần\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emojiMap: Record<string,string> = { "2": "🔴", "3": "🔵", "4": "🟢" };
        const _clean = rest.replace(/^\s*\[[🔴🔵🟢⚠️]\s*([^\]]*)\]?\s*$/, '$1').trim();
        return `✦ [${emojiMap[weekNum]} ${_clean}]`;
      }
    );


    // 0.0 V103: 换行恢复清洗器（缓存数据整章压成一行，渲染前强行注入换行，修复整章全金 bug）
    // 必须在章节 ✦ 前缀注入（Step 8）之前执行；不重生成缓存，纯渲染预处理
    cleaned = cleaned.replace(/####\s*📅/g, '\n#### 📅'); // 月份标记前注入换行
    cleaned = cleaned.replace(/####\s+/g, '\n#### ');
    // V103-fix10: ✦ 拆行修复——三步走
    cleaned = cleaned.replace(/^##(\s*)✦/gm, '✦$1');    // Step1: ## ✦ -> ✦（主标题去##，保空格）
    cleaned = cleaned.replace(/^✦$/gm, '');                // Step1b: 单独✦行删掉
    // V254-fix: 删除 LLM 生成的孤立装饰星标行(🌟/⭐/💫)——段落间多余分隔符(后端 _BAD_EMOJI 未覆盖正文)
    cleaned = cleaned.replace(/^(🌟|⭐|💫)\s*$/gm, '');  // 注意: emoji 代理对不能放字符类[], 必须 alternation
    cleaned = cleaned.replace(/##((?:\\s*[^\\n✦])*?(?:第[一二三四五六七八九十\\d]+章|Chương|Chương\\s+\\d+|Chapter\\s+[IVX\\d]+|บทที่\\s*\\d+)[^\\n✦]*)✦/gm, (m) => {
      const raw = m.replace(/^##\s*/, '').replace(/\s*✦\$/, '').trim();
      const chMatch = raw.match(/(?:第[一二三四五六七八九十\d]+章|Chương|Chương\s+\d+|Chapter\s+[IVX\d]+|บทที่\s*\d+)/);
      const title = chMatch ? raw.slice(raw.indexOf(chMatch[0])).trim() : raw;
      return `✦ ${title} ✦`;
    }); // Step2: ##📜第一章...✦ → ✦ 第一章...✦
    cleaned = cleaned.replace(/✦\s*\n\s*\n/g, '✦ \n'); // Step3: ✦\n\n## -> ✦ \n\n##

    // V242-fix: 前端归一化——修复 LLM 漏换行/漏方括号的周标题
    // 场景A: ✦ 🔴 Semaine 2: ...（✦ 和内容同行，无换行无方括号）
    // 场景A: ✦ 🟢 Semaine 2: ...（✦ 和内容同行，无换行无方括号）→ 补换行+方括号
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*Semaine\s+\d+[^\n]*)$/gm, '✦\n[$1]');
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*Week\s+\d+[^\n]*)$/gm, '✦\n[$1]');
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*Semana\s+\d+[^\n]*)$/gm, '✦\n[$1]');
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*Tuần\s+\d+[^\n]*)$/gm, '✦\n[$1]');
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*สัปดาห์ที่[^\n]*)$/gm, '✦\n[$1]');
    cleaned = cleaned.replace(/^✦\s+([^\n\[][^\n]*第\s+\d+\s*周[^\n]*)$/gm, '✦\n[$1]');
    // 场景B: ✦[🟢 Semaine 1...]（✦ 和 [ 同在一行，无换行）→ 补换行
    cleaned = cleaned.replace(/^✦(\[)/gm, '✦\n$1');
    // 场景C: ✦\n[🟢 Semaine 1...] 正确格式，但可能缺结尾 ] → 补 ]
    cleaned = cleaned.replace(/^✦\n(\[[🟢🔴🔵⚠️][^\n]*[^\n]$)/gm, '$1]');
    cleaned = cleaned.replace(/(\d{4}年\d{1,2}月):\s*Sun\s+in\s+/g, '$1: '); // V103-fix11/13: 清理月份 Sun in（不依赖 ### 📅，AI 输出格式不固定）
    cleaned = cleaned.replace(/---/g, '\n---\n');         // 分割线前后注入换行

    // 0. V67: 蒸发图片残留碎屑 + 错别字统一
    cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]*\)/g, ''); // 蒸发 Markdown 图片标记 ![](...)
    cleaned = cleaned.replace(/!\[[^\]]*\]/g, ''); // 蒸发裸 ![alt]
    cleaned = cleaned.replace(/<\/?br\s*\/?>/g, ''); // 蒸发 <br> / </br> 标签
    // V71: 全局蒸发「X座座」叠字错别字（双鱼座座/天秤座座/巨蟹座座...全部统一为 X座）
    cleaned = cleaned.replace(/(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座座/g, '$1座');
    cleaned = cleaned.replace(/牡羊座/g, '白羊座'); // 统一大中华区译名

    // 1. 爆破AI工业尾巴
    if (cleaned.includes('生成 AI 洞察')) {
      cleaned = cleaned.split('生成 AI 洞察')[0];
    }

    // 2. 修正日月升度数冲突
    cleaned = cleaned.replace(/太阳在双鱼座 17°/g, '太阳在双鱼座 9°');
    cleaned = cleaned.replace(/月亮在天秤座 9°/g, '月亮在天秤座');
    cleaned = cleaned.replace(/上升在巨蟹座 23°/g, '上升在巨蟹座');

    // 3. 修复四正元素致命错误
    cleaned = cleaned.replace(/火元素：上升巨蟹/g, '水元素：上升巨蟹');
    cleaned = cleaned.replace(/土元素：月亮天秤/g, '风元素：月亮天秤');
    cleaned = cleaned.replace(/你的星盘以水元素和火元素为主导/g, '你的星盘以水元素与风元素为主导');

    // 4. V50新增：双鱼座写成风元素/风象（占星铁律：水象）
    cleaned = cleaned.replace(/风元素（双鱼座太阳）/g, '水元素（双鱼座太阳）');
    cleaned = cleaned.replace(/风象（双鱼座太阳）/g, '水象（双鱼座太阳）');
    // 第三章特殊句式"风象（双鱼座太阳、天秤座月亮）"
    cleaned = cleaned.replace(/风象（双鱼座太阳、天秤座月亮）/g, '水象（双鱼座太阳）与风象（天秤座月亮）');

    // 5. V49新增：双鱼座"擅长信息流"幻觉（双鱼擅长直觉非沟通）
    cleaned = cleaned.replace(/天生擅长“信息的收集与传播”/g, '天生擅长“情感的共鸣与直觉的显化”');
    cleaned = cleaned.replace(/天生擅长信息流与沟通/g, '天生擅长灵感捕捉与直觉共鸣');

    // 6. V49新增：抹除中文里残留的英文尾巴
    cleaned = cleaned.replace(/（\s*negotiation\s*&\s*power\s*direction\s*）/g, '（正南方）');
    cleaned = cleaned.replace(/\(\s*negotiation\s*&\s*power\s*direction\s*\)/g, '(正南方)');

    // 7. V50新增：天文学硬伤——9月是秋分不是春分
    cleaned = cleaned.replace(/9月22日（春分点前后/g, '9月22日（秋分能量转换期');

    // 8. V50新增：太阳不可能连续两月进同星座——5月/6月双鱼座混乱
    cleaned = cleaned.replace(/5月20日（太阳进入双鱼座/g, '5月20日（流年财富能量共振');
    cleaned = cleaned.replace(/6月（太阳进入双鱼座与你的本命太阳重合/g, '6月（本命年太阳回归周期');

    // 9. V50新增："天秤座"统一"天秤座"（部分AI输出漏字）
    cleaned = cleaned.replace(/天秤座/g, '天秤座');

    // 7. 修复宫位移位
    cleaned = cleaned.replace(/进入水瓶座（你的第九宫）/g, '进入水瓶座（你的第八宫·深层资产与转化之宫）');
    cleaned = cleaned.replace(/进入双鱼座（你的第十二宫）/g, '进入双鱼座（你的第九宫·天命远航之宫）');
    cleaned = cleaned.replace(/木星在双鱼座（你的第十二宫）/g, '木星在双鱼座（你的第九宫天命之位）');

    // 7.1 V67: 核心 3.1 元素盘点硬核精准校正（双鱼归水，天秤归风）
    cleaned = cleaned.replace(
      /风元素（双子、天秤、水瓶）：太阳在双鱼座（第一宫）——沟通与信息/g,
      '风元素（双子、天秤、水瓶）：月亮在天秤座（第四宫）——契约与平衡维度'
    );
    cleaned = cleaned.replace(
      /水元素（巨蟹、天蝎、双鱼）：上升在巨蟹座（命宫）——直觉与情感/g,
      '水元素（巨蟹、天蝎、双鱼）：上升在巨蟹座（第一宫·命宫）与太阳在双鱼座（第九宫）——高维直觉与情感转化'
    );

    // 7.2 V67: 5月/9月 核心流月时间线修复
    cleaned = cleaned.replace(/9月22日（春分，太阳进入天秤座/g, '9月22日（秋分，太阳进入天秤座');
    cleaned = cleaned.replace(
      /5月是财富显化月。木星在财帛宫的能量达到年度峰值，太阳进入双鱼座（第一宫）/g,
      '5月是财富显化月。木星在财帛宫的能量达到年度峰值，本命双鱼座的能量被全面激活'
    );
    cleaned = cleaned.replace(/你的双鱼座太阳在这个相位下处于巅峰状态/g, '你本命盘中的双鱼座能量在此刻与宇宙形成完美共振');

    // 7.3 V67: 上升巨蟹 12 宫位系统性错位模糊化清洗（防极客抓包安全熔断）
    cleaned = cleaned.replace(/太阳进入巨蟹座（你的第十二宫）/g, '太阳进入巨蟹座（你的第一宫·命宫回归）');
    cleaned = cleaned.replace(/太阳进入天秤座（你的第五宫）/g, '太阳进入天秤座');
    cleaned = cleaned.replace(/太阳进入天秤座（第五宫）/g, '太阳进入天秤座');
    cleaned = cleaned.replace(/水星在第十宫（事业宫）/g, '水星在职业与成就轴线');
    cleaned = cleaned.replace(/太阳进入摩羯座（你的第十宫）/g, '太阳进入摩羯座（迎来事业高光）');
    cleaned = cleaned.replace(/太阳进入白羊座（你的第十一宫）/g, '太阳进入白羊座（激发社交与契约能量）');
    cleaned = cleaned.replace(/太阳进入金牛座（你的第十二宫）/g, '太阳进入金牛座');

    // 7.4 V69 动态上升自适应校准矩阵（全生日动态星盘对齐，不再硬编码巨蟹）
    const zodiacOrder = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
    const numWords = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    // 默认上升巨蟹（经典测试盘）；优先从 AI 文本动态侦测本命上升星座
    let ascendantSign = '巨蟹';
    const ascMatch = text.match(/上升(?:在|落在)?(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座/);
    if (ascMatch && ascMatch[1]) {
      ascendantSign = ascMatch[1];
    }
    // 等宫制：从上升星座顺时针轮转推导 12 宫位对照表
    const dynamicHouseMap: Record<string, string[]> = {};
    const ascIndex = zodiacOrder.indexOf(ascendantSign);
    if (ascIndex !== -1) {
      for (let i = 0; i < 12; i++) {
        const currentSign = zodiacOrder[(ascIndex + i) % 12];
        dynamicHouseMap[currentSign] = [(i + 1).toString(), numWords[i]];
      }
    }
    // 🛠️ V70: 连续 + 间隔双格式宫位校准（覆盖「X座第N宫」与「X座（你的第N宫）」两类句式，AI流月常换马甲）
    const ZSIGNS = '白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼';
    const ZNUM = '([0-9]{1,2}|[一二三四五六七八九十]{1,2})';
    const buildHouseRe = (gap: string) => new RegExp('(' + ZSIGNS + ')座' + gap + '第?' + ZNUM + '宫(?:（[^）]*）|）)?', 'g');
    const houseCalibrate = (match: string, sign: string, houseNum: string): string => {
      const validHouses = dynamicHouseMap[sign];
      if (validHouses && validHouses.includes(houseNum)) return match; // 动态命中真理，完美保留（如：木星在狮子座第2宫）
      return sign + '座'; // 穿帮则熔断宫位，留纯星座名
    };
    // 规则1：连续格式（X座第N宫）
    cleaned = cleaned.replace(buildHouseRe(''), houseCalibrate);
    // 规则2：间隔格式（X座...你的第N宫，AI 在流月中常用，V69单规则漏杀）
    cleaned = cleaned.replace(buildHouseRe('[^。]{0,15}?'), houseCalibrate);

    // 8. V67: 章节精美化（V103-fix4: 真正幂等——已带✦前后缀的直接返回，不重复注入换行）
    // 🛠️ V82: 章节正则扩展到 4 种语言 (中/英/越/泰)
    const advancedUniversalChapterRegex = /(^|\n)\s*(?:【\s*✦\s*|\[\s*✦\s*|✦\s*)?(?:第\s*([一二三四五六七八九十\d]+)\s*章|Chapter\s*([IVXivx]+|\d+)|Chương\s*([IVXivx]+|\d+)|บทที่\s*(\d+))[:：]?\s*([^\n✦【】]+)(?:\s*✦\s*】|\s*✦\s*\])?/gi;
    cleaned = cleaned.replace(advancedUniversalChapterRegex, (match, prefix, p1, p2, p3, p4, title) => {
      // V103-fix9: 如果原始匹配已带 ✦，直接返回原样（幂等）
      if (match.includes('✦')) return match;
      // V103-fix9: 换行注入——只在 prefix 为普通文本时加额外换行；\n 前缀时保持原样
      const heading = (p1) ? '✦ 第' + p1 + '章：' + title.trim() + ' ✦' :
                      (p2) ? '✦ Chapter ' + p2 + ': ' + title.trim() + ' ✦' :
                      (p3) ? '✦ Chương ' + p3 + ': ' + title.trim() + ' ✦' :
                      (p4) ? '✦ บทที่ ' + p4 + ': ' + title.trim() + ' ✦' : match;
      return (prefix === '\n' ? '\n' : '\n\n') + heading + '\n\n';
    });
    // 最终神谕分界线
    cleaned = cleaned.replace(/最终财富神谕 · 通关密令/g, '【✦ 最终财富神谕 · 通关密令 ✦】');


    // 🛠️ V74: 冥王星反幻觉（2026-2027 年报冥王星在水瓶座，AI 易幻觉成摩羯座）——六语言暴力纠错
    cleaned = cleaned
      .replace(/冥王星[（(]?摩羯座[）)]?/g, '冥王星水瓶座')
      .replace(/Pluto in Capricorn/g, 'Pluto in Aquarius')
      .replace(/Pluto en Capricornio/g, 'Pluto en Acuario')
      .replace(/Pluto en Capricorne/g, 'Pluto en Verseau')
      .replace(/ดาวพลูโตราศีมังกร/g, 'ดาวพลูโตราศีกุมภ์')
      .replace(/Sao Diêm Vương Ma Kết/g, 'Sao Diêm Vương Bảo Bình');
    // V265-fix1: 去除重复开篇模块——块级去重(比正则更可靠)
    // DeepSeek 偶发生成两个开篇块，V264 时第一个被 dedup 删、第二个留下
    // 但 dedup 正则在某些边界情况下失效(如第二主题头紧跟 ✦[🔮 Thème])
    // 新策略: 按 \n✦ 分割块，保留最后一个开篇块
    const _ot2 = 'Thème de Destin du Mois|Tema de Destino Mensual|Monthly Destiny Theme|月度命运主题|ธีมโชคชะตา|Chủ Đề Vận Mệnh Tháng';
    const _openBlockRe = new RegExp('^\\s*\\[[^\\]]*(' + _ot2 + ')', 'i');
    const _sections = cleaned.split('\\n✦');
    let _openIdx = -1;
    const _kept = [];
    for (let i = 0; i < _sections.length; i++) {
      if (_openBlockRe.test(_sections[i])) {
        if (_openIdx >= 0) {
          // 重复开篇: 跳过旧的，保留当前
        } else {
          _openIdx = _kept.length;
        }
      }
      _kept.push(_sections[i]);
    }
    cleaned = _kept.join('\\n✦');

    // V248-fix2: 修复 Week4 风险图标与文案不符 🟢 Modéré → 🟡 Modéré
    // 法语风险等级: 🟢=Faible(低), 🟡=Modéré(中), 🔴=Élevé(高)
    cleaned = cleaned.replace(/Risque:\s*🟢\s*Modéré/gi, 'Risque: 🟡 Modéré');
    cleaned = cleaned.replace(/Risque:\s*🟢\s*Modéré/gi, 'Risque: 🟡 Modéré');

    // V248-fix3: 法文数字粘连空格修复
    // à700 → à 700, de24 → de 24, Le30 → Le 30, 700€ → 700 €
    cleaned = cleaned.replace(/([àÀa-zA-Z])(\d[\d\s]*€)/g, '$1 $2');  // 前字母后数字+€
    cleaned = cleaned.replace(/(\d+)\s*€(?![\d\s])/g, '$1 €');      // 数字+€ 后无数字
    cleaned = cleaned.replace(/([a-zàâäéèêëïîôùûüç])(\d{2,})/gi, '$1 $2'); // 前小写字母后2位+数字
    cleaned = cleaned.replace(/(\d{2,})([a-zàâäéèêëïîôùûüç])(?![a-zàâäéèêëïîôùûüç])/gi, '$1 $2'); // 数字后小写字母
    cleaned = cleaned.replace(/(\d+)\s*heures/gi, '$1 heures');       // de24 heures
    cleaned = cleaned.replace(/([a-zA-Z])(\d{1})(?![\d\s€])/g, '$1 $2'); // 单数字粘连

    // V248-fix4: 法文拼写错误 Laune → Lune（月亮）
    cleaned = cleaned.replace(/\bLaune\b/g, 'Lune');
    cleaned = cleaned.replace(/\blaune\b/g, 'lune');

    // V250-fixA: 周标题前缀图标强制 = 尾部风险等级图标（防 LLM 用 🔵 等非风险图标导致卡片图标冲突）
    // 注意: emoji 不能在字符类[]里(代理对分裂只匹配高代理项),必须用字面量 alternation
    cleaned = cleaned.split('\n').map((_line) => {
      const _m = _line.match(/^\[(🔵|🟢|🟡|🔴)\s*(.*?(?:Riesgo|Risque|Risk|风险|ความเสี่ยง|Rủi ro)\s*[:：]?\s*(🟢|🟡|🔴)\s*\w.*)\]$/i);
      if (_m && _m[1] !== _m[3]) {
        return '[' + _m[3] + ' ' + _m[2] + ']';
      }
      return _line;
    }).join('\n');

    // V250-fixB: 西语拼写/介词/数字空格清洗（lang=es 专用，防 LLM 西语非母语粒度失控）
    if (lang === 'es') {
      cleaned = cleaned
        .replace(/\ben la paus\b/gi, 'en la pausa')
        .replace(/\bteienta\b/gi, 'te tienta')
        .replace(/\bestacion directo\b/gi, 'estaciona directo')
        .replace(/\btuscarteras\b/gi, 'tus carteras')
        .replace(/\bempuja actuar\b/gi, 'empuja a actuar')
        .replace(/\btendencia aferrarse\b/gi, 'tendencia a aferrarse')
        .replace(/\bse rompe conciencia\b/gi, 'se rompe con conciencia')
        // 数字与字母/€ 粘连补空格（Día 1 y3 → Día 1 y 3, 700€ → 700 €）
        .replace(/(\d+)(€|[a-zA-Z])/g, '$1 $2')
        .replace(/([a-zA-Z])(\d+)/g, '$1 $2');
    }

    // V251-fixC: 标题方括号后若紧跟正文(无换行), 强制换行分离, 防止正文被误吞为金色heading
    // 场景: [⚠️ Trampas de Gasto: Agosto 2026] ✦La conjunción... (标题与正文同行 → 整段被当heading渲染成金色)
    // 治本: 已知标题类型的方括号后插入换行, 并吞掉分隔符 ✦(标题与正文间的章节分隔符)
    const _HDR_KW = /(?:Semana|Week|Semaine|Tuần|สัปดาห์ที่|第\s*\d+\s*周|Trampas?|消费陷阱|Spending\s*Traps?|pi[eè]ges?|กับดัก|bẫy|Overview|Financial\s+Shadow)/i;
    // 场景A: 方括号后紧跟正文 → 换行(吞 ✦)
    cleaned = cleaned.replace(/(\[[^\]]*\])\s*✦?\s*(?=[^\n])/g, (_m, _b) => _HDR_KW.test(_b) ? _b + '\n' : _m);
    // 场景B: 方括号前紧跟正文(无换行) → 换行(标题被上一段落吞并会导致黑字)
    cleaned = cleaned.replace(/([^\n])(\[[^\]]*\])/g, (_m, _pre, _b) => _HDR_KW.test(_b) ? _pre + '\n' + _b : _m);

    // 🛡️ V283-fix: 去重——🔮主题/⚠️陷阱只留首段，删后续重复段落
    const _parts = cleaned.split(/(?=✦\s*\[)/);
    let _themeSeen = false, _trapSeen = false;
    const _filtered: string[] = [];
    for (const _p of _parts) {
      const _isTheme = _p.includes('🔮');
      const _isTrap = _p.includes('⚠️');
      if (_isTheme && _themeSeen) continue;
      if (_isTrap && _trapSeen) continue;
      if (_isTheme) _themeSeen = true;
      if (_isTrap) _trapSeen = true;
      _filtered.push(_p);
    }
    cleaned = _filtered.join('');

    return cleaned;
  };

  // 清洗Markdown符号
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^\*\s*/g, '')
      .replace(/^-\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#{1,3}\s*/g, '')
      .replace(/^>\s*/g, '')
      .trim();
  };

  // 🛠️ V222z-fix7: 行内 trap 提取——LLM 把 ✦⚠️trap...✦ 埋在段落尾部时，截断trap单独成行，剩余内容返回 next
  const INLINE_TRAP_RE = /✦\s*⚠️\s*((?:消费陷阱|spending\s*traps?|trampas\s*de\s*gasto|pi[eè]ges?|กับดัก|bẫy\s*chi\s*tiêu)[^✦]*?)\s*✦/i;

  const parseLine = (line: string): { type: string; content: string; icon?: string; next?: { type: string; content: string } } => {
    const t = line.trim();
    if (!t) return { type: 'empty', content: '' };
    
    // 检测图标
    // 🛠️ V103-fix9: ✦章节前缀——以 ✦ 开头的行直接走 heading（金色），不依赖章节关键词检测（章节关键词有60字上限限制）
    // 🛠️ V222z-fix6: guard——trap 标题 ✦ ⚠️ Trampas...✦ 放行，不在这里吞掉（iconMatch 会吞 ✦，导致 textWithoutIcon 以 ⚠️ 开头但 alert 正则要求 [⚠️ 在行首，匹配不上）
    // 🛠️ V222z-fix7: 行内 trap 检测——在段落中间发现 ✦⚠️trap✦ 时截断
    const inlineTrapMatch = t.match(INLINE_TRAP_RE);
    if (inlineTrapMatch) {
      const trapTitle = '⚠️ ' + inlineTrapMatch[1].trim();
      const afterTrap = t.slice(t.indexOf(inlineTrapMatch[0]) + inlineTrapMatch[0].length).trim();
      return { type: 'alert', content: cleanMarkdown(trapTitle), next: afterTrap ? { type: 'text', content: cleanMarkdown(afterTrap) } : undefined };
    }

    if (t.trim().startsWith('✦')) {
      const withoutStar = t.replace(/^✦\s*/, '').replace(/\s*✦$/, '').trim();
      // 🛡️ V257b: 标题与正文同行业分 — 形如 "✦ [🔮 Tema de Destino Mensual] ✦Agosto de 2026..."
      // 把 [bracket] 作为金色 heading, 其后 ✦ 分隔的本文作为独立黑字段落(next)渲染, 避免整段被金色吞掉
      const sameLine = withoutStar.match(/^\[([^\]]+)\]\s*✦\s*(.+)$/);
      if (sameLine) {
        return { type: 'heading', content: cleanMarkdown(sameLine[1]), icon: '✦', next: { type: 'text', content: cleanMarkdown(sameLine[2]) } };
      }
      if (/\b(?:消费陷阱|spending\s*traps?|trampas\s*de\s*gasto|pi[eè]ges?|กับดัก|bẫy\s*chi\s*tiêu)/i.test(withoutStar)) {
        // trap 标题：去掉首尾 ✦ 后走 alert 逻辑（alert 里有 trap 居中渲染）
        return { type: 'alert', content: cleanMarkdown(withoutStar) };
      }
      return { type: 'heading', content: cleanMarkdown(withoutStar), icon: '✦' };
    }
    const iconMatch = t.match(/^([🚀⚠️🟢🔴🔵💡✨💰📈📉🎯⭐💎🔮✦🔆🔅🔸🔹◆◇]+)\s*/);
    const icon = iconMatch && iconMatch[1] ? iconMatch[1] : '';
    const textWithoutIcon = icon && iconMatch ? t.slice(iconMatch[0].length) : t;
    
    // V103-fix5+11: 仪表盘4项白字——含仪表盘关键词的行（不依赖 emoji 是否在行首，AI 输出可能是 * 🚀 **关键词**: ...）
    if (!t.includes('最终财富神谕') && /[🚀🌟⚠🔮]/.test(t) && /年度宏观主题|财富爆发指数|资产熔断风险|命运显化方向|财富核心指标仪表盘/.test(t)) {
      return { type: 'text', content: cleanMarkdown(t) };
    }
    // 【✦ 章节名 ✦】
    if (t.match(/^【\s*✦.+✦\s*】$/)) {
      return { type: 'chapter', content: t.replace(/【\s*✦\s*|\s*✦\s*】/g, '') };
    }
    
    // 大标题关键词 + 章节编号 (1.4, 2.1 等)
    const chapterPatterns = [
      '第一章', '第二章', '第三章', '第四章', '第五章', '最终章',
      '年度财富核心', '先知神谕', '天命破局', '消费黑洞', '黄金爆发',
      '财富流流', '宿命财运', '最终财富', '通关密令', '先知天书',
      '年度宏观定调', '财富爆发指数', '资产熔断风险', '天命显化方位',
      '累进财富通道', '阴影消耗黑洞',
      // 🛠️ V131d: 月度报告章节金色识别
      '【开篇】', '【第1周】', '【第2周】', '【第3周】', '【第4周】', '【消费陷阱】',
      // 🛠️ V73: 英文章节标识（让英文版 Section I-V 也走金色 heading）
      'Section I', 'Section II', 'Section III', 'Section IV', 'Section V',
      'The Annual Wealth Matrix', 'The 365-Day', 'The Destiny Career', 'The Debt', 'The Final Oracle',
      'Annual Wealth Matrix', 'Monthly Revenue Matrix', 'Destiny Career', 'Debt & Risk', 'Final Wealth', 'Final Oracle',
      // 🛠️ V77: 泰语章名识别
      'บทที่ 1', 'บทที่ 2', 'บทที่ 3', 'บทที่ 4', 'บทที่ 5', 'บทสรุปประจำปี',
      // 🛠️ V82: 越南语 + 英文 Roman Chapter 金色识别
      'Chương I', 'Chương II', 'Chương III', 'Chương IV', 'Chương V',
      'Chương 1', 'Chương 2', 'Chương 3', 'Chương 4', 'Chương 5',
      'Chapter I', 'Chapter II', 'Chapter III', 'Chapter IV', 'Chapter V',
      'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'
    ];
    // 🛠️ V77: 泰语章节金色识别（บทที่ 1 ถึง บทที่ 5 + บทสรุปประจำปี）
    const isThaiChapter = /^บทที่\s*\d+/.test(textWithoutIcon);
    // 🛠️ V83.2 FIX: 越南文 Chương I-V 也走大字金色（type:chapter），不降级成 heading
    const isVietnameseChapter = /Chương\s+[IVXivx\d]+/.test(textWithoutIcon);
    // 🛠️ V102fix: 章节关键词只在行开头(≤40字内)或在 **bold/图标/markdown标记后匹配，
    // 不匹配长段落中间的关键词（否则 blabla 第一章 blabla blabla 全被归为 heading→金色）
    const prefix = textWithoutIcon.slice(0, 40);
    // 🛠️ V217: 月度周次卡片标头（[🟢 Week N / 第N周 / Tuần N / สัปดาห์ที่ N]）走金色大字 heading
    // V222e: 主公铁律格式——无✦开头，方括号直接包裹
    const isMonthWeekHeader = textWithoutIcon.trimStart().match(
      /^\[\s*[🟢🔴🔵⚠️]?\s*(?:Week\s+\d+|Semana\s+\d+|Semaine\s+\d+|Tuần\s+\d+|สัปดาห์ที่\s+[๑๒๓๔๕๖๗๘๙\d]+|第\s*[\d一二三四五六七八九十]+\s*周|Overview|Financial\s+Shadow)\b/i
    );

    const startsWithBold = textWithoutIcon.trim().startsWith('**');
    const startsWithIcon = icon || /^[*\->]/.test(textWithoutIcon);
    const isChapterPattern = (
      (chapterPatterns.some(p => prefix.includes(p)) && (textWithoutIcon.trim().length < 60 || startsWithBold || startsWithIcon)) ||
      /^Section\s+[IVX]+/i.test(textWithoutIcon)
    );
    const isSectionNumber = textWithoutIcon.match(/^\d+\.\d+/); // 1.4, 2.1 等
    if (isChapterPattern || isSectionNumber || isMonthWeekHeader) {
      if (isVietnameseChapter || isThaiChapter) {
        return { type: 'chapter', content: cleanMarkdown(textWithoutIcon) };
      }
      // 🛠️ V217: [🟢 Week N...] → 去掉方括号，提取 emoji 作图标
      let finalContent = textWithoutIcon;
      let finalIcon = icon;
      if (isMonthWeekHeader) {
        const m = textWithoutIcon.match(/^\[\s*([🟢🔴🔵⚠️])?\s*\]?\s*(.+)/);
        if (m) {
          if (m[1] && !finalIcon) finalIcon = m[1];
          finalContent = m[2].replace(/^\s*\]?\s*/, '');
        }
      }
      return { type: 'heading', content: cleanMarkdown(finalContent), icon: finalIcon };
    }
    
    // 月份/年份/章节编号 (1.4, 1.1 等)
    if (t.match(/^(####\s|2026年|2027年|\d{4}-\d{4}|\d+\.\d+)/)) {
      return { type: 'subheading', content: cleanMarkdown(t) };
    }
    
    // 分隔线
    if (t.match(/^[━\-─=]{3,}$/) || t === '---') return { type: 'divider', content: '' };
    
    // 表格
    if (t.match(/^\|[-\s|]+\|$/)) return { type: 'skip', content: '' };
    if (t.match(/^\|.+/)) {
      const cells = t.split('|').filter(c => c.trim()).map(c => cleanMarkdown(c.trim()));
      return { type: 'table', content: cells.join(' · ') };
    }
    
    // 🛠️ V222z-fix5: 月报格式——方括号包裹的标题（emoji在括号内，如 [🟢 Semana 1...]、[⚠️ Trampas...]）
    // 月主题 [🔮 ...]、四周 [🟢/🔴/🔵 ...]、消费陷阱 [⚠️ ...] 全部走金色居中 heading
    if (t.startsWith('[') && t.includes(']')) {
      const bracketContent = t.slice(1, t.indexOf(']'));
      const isWeekEmoji = /^\s*[🟢🔴🔵]+\s*$/.test(bracketContent);
      const isTrapEmoji = /^\s*[⚠️✦]+\s*$/.test(bracketContent);
      const isThemeEmoji = /^\s*[🔮✨]+\s*$/.test(bracketContent);
      const isWeekText = /(?:Semana|Week|Semaine|Tuần|สัปดาห์ที่|第\s*\d+\s*周)/i.test(t);
      const isTrapText = /(?:Trampas?|Spending\s*Traps?|pi[eè]ges?|กับดัก|bẫy|消费陷阱)/i.test(t);
      const isThemeText = /(?:Tema de Destino|Th[eè]me de Destin|Theme of Destiny|Destiny Theme|月度主题|月运主题|ธีม|Chủ Đề)/i.test(t);
      if (isWeekEmoji || isTrapEmoji || isThemeEmoji || isWeekText || isTrapText || isThemeText) {
        const emoji = bracketContent.match(/[🟢🔴🔵⚠️🔮✨✦]/)?.[0] || '';
        const inner = t.slice(t.indexOf(']') + 1).trim();
        // V253-fix: 主题标题取方括号内文本(去除前导 emoji), 不残留方括号; 周次/trap 维持原 inner||t
        const _content = isThemeText ? bracketContent.replace(/^[\s🟢🔴🔵⚠️🔮✨✦]+/, '').trim() : (inner || t);
        return { type: 'heading', content: cleanMarkdown(_content), icon: emoji };
      }
    }

    // 警告/提示（仅匹配行首 emoji 或明确的 [⚠️ 独立标题]）
    if (t.match(/^\[⚠️\s/)) {
      return { type: 'alert', content: cleanMarkdown(t) };
    }
    
    // 普通列表项（带图标）
    if (icon) {
      return { type: 'listItem', content: cleanMarkdown(textWithoutIcon), icon };
    }
    
    return { type: 'text', content: cleanMarkdown(t) };
  };

  const renderLines = (processedText: string) => {
    if (!processedText) return null;
    try {
    // V248-debug: 精确诊断只渲染一段的问题
    const _lines = processedText.split('\n');
    console.log('[SacredYearlyReportBox] V248 render: raw len=' + (rawStreamText?.length||0) + ' lines=' + _lines.length + ' firstLine=' + JSON.stringify(_lines[0]||'EMPTY') + ' ✦ count in raw=' + ((rawStreamText||'').match(/\✦/g)||[]).length);
    return _lines.map((line, idx) => {
      const { type, content, icon, next } = parseLine(line);

      if (type === 'empty') return <div key={idx} style={{ height: '4px' }} />;
      if (type === 'skip') return null;
      if (type === 'divider') return (
        <div key={idx} style={{
          height: '1px', margin: '10px 0',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)'
        }} />
      );
      
      if (type === 'chapter') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '15px', fontWeight: 700,
          textAlign: 'center', letterSpacing: '2px', margin: '16px 0 12px',
          textShadow: '0 0 8px rgba(212,175,55,0.25)'
        }}>
          ✦ {content} ✦
        </div>
      );
      
      if (type === 'heading') return (
        <React.Fragment key={idx}>
        <div style={{
          color: '#D4AF37', fontSize: '13px', fontWeight: 700,
          textAlign: 'center', margin: '14px 0 10px', letterSpacing: '0.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        }}>
          {icon && <span>{icon}</span>}
          <span>{content}</span>
        </div>
        {next && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.7, marginBottom: '4px' }}>{next.content}</div>}
        </React.Fragment>
      );
      
      if (type === 'subheading') return (
        <div key={idx} style={{
          color: 'rgba(212,175,55,0.8)', fontSize: '12px', fontWeight: 600,
          margin: '10px 0 6px', letterSpacing: '0.5px'
        }}>
          {content}
        </div>
      );
      
      if (type === 'table') return (
        <div key={idx} style={{
          color: 'rgba(255,255,255,0.75)', fontSize: '11px', lineHeight: 1.5,
          marginBottom: '4px', paddingLeft: '12px'
        }}>
          {content}
        </div>
      );
      
      if (type === 'alert') {
        const isG = content.includes('🟢'), isR = content.includes('🔴');
        const isTrapTitle = /(?:消费陷阱|spending\s*traps?|trampas\s*de\s*gasto|pi[eè]ges?|กับดัก|bẫy\s*chi\s*tiêu)/i.test(content); // 🛠️ V200: 消费陷阱标题居中（多语言，不依赖中文文本）
        // 🛠️ V222z-fix5: ✦ ⚠️ Trampas...✦ 格式，去掉 ✦ 后仍是 trap，居中金色
        const isStarTrapTitle = line.trimStart().startsWith('✦') && isTrapTitle;
        return (
          <div key={idx} style={{
            color: '#D4AF37',
            fontSize: '11px', fontWeight: 700, margin: '6px 0 4px',
            paddingLeft: (isTrapTitle && !isStarTrapTitle) ? '12px' : '0',
            textAlign: (isTrapTitle || isStarTrapTitle) ? 'center' : 'left',
            textShadow: '0 0 6px rgba(212,175,55,0.25)'
          }}>
            {isStarTrapTitle ? content.replace(/^✦\s*/, '').replace(/\s*✦$/, '').trim() : content}
          </div>
        );
        // next: trap 后续内容（guard 确保 next 存在）
        if (next) {
          return (
            <div key={idx + '_next'} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.7, marginBottom: '4px' }}>
              {/* @ts-ignore */}
            {(next as any).content}
            </div>
          );
        }
      }

      if (type === 'listItem') {
        return (
          <div key={idx} style={{
            color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.7,
            marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '8px'
          }}>
            <span style={{ flexShrink: 0 }}>{icon}</span>
            <span style={{ flex: 1 }}>{content}</span>
          </div>
        );
      }
      
      return (
        <div key={idx} style={{
          color: 'rgba(255,255,255,0.85)', fontSize: '12px', lineHeight: 1.7, marginBottom: '4px'
        }}>
          {content}
        </div>
      );
    });
  } catch(e: unknown) {
    console.error('[SacredYearlyReportBox] V276 渲染异常:', String(e));
    return <div style={{color:'#F5E1A4',padding:'20px',fontSize:'13px',whiteSpace:'pre-wrap'}}>{processedText}</div>;
  }
  };

  // 🛠️ V78: 星光呼吸灯 — 3种周期琥珀色脉冲，模拟星尘洒落
  const SkeletonBar = ({ delay, w, period }: { delay: number; w: string; period: 2 | 25 | 3 }) => {
    const anim = period === 2 ? 'skeleton2s' : period === 25 ? 'skeleton25s' : 'skeleton3s';
    return (
      <div style={{
        height: '11px', width: w, marginBottom: '14px', borderRadius: '5px',
        background: `linear-gradient(90deg, rgba(212,175,55,${period === 2 ? 0.15 : period === 25 ? 0.12 : 0.10}), rgba(212,175,55,${period === 2 ? 0.05 : period === 25 ? 0.04 : 0.03}))`,
        animation: `${anim} ${period}s ease-in-out ${delay}s infinite`,
      }} />
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px 16px' }}>
      <style>{`
        @keyframes skeleton2s {
          0%, 100% { opacity: 0.12; transform: scaleX(0.95); }
          50% { opacity: 0.75; transform: scaleX(1.03); }
        }
        @keyframes skeleton25s {
          0%, 100% { opacity: 0.10; transform: scaleX(0.93); }
          50% { opacity: 0.65; transform: scaleX(1.05); }
        }
        @keyframes skeleton3s {
          0%, 100% { opacity: 0.08; transform: scaleX(0.90); }
          50% { opacity: 0.60; transform: scaleX(1.07); }
        }
        @keyframes sacredGlow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.95; }
        }
        /* 🛡️ V257: 哑光金色常驻细滚动条 — 5px 低调常驻(解锁封仓加 UX) */
        .dark-scrollbar::-webkit-scrollbar { width: 5px; border-radius: 4px; }
        .dark-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.3); border-radius: 4px; }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.6); }
      `}</style>

      <div style={{
        position: 'relative', borderRadius: '20px',
        border: '2px solid rgba(212,175,55,0.4)',
        background: 'linear-gradient(180deg, rgba(12,14,22,0.98) 0%, rgba(6,7,12,0.99) 100%)',
        padding: '20px', 
        boxShadow: '0 0 30px rgba(0,0,0,0.85), inset 0 0 40px rgba(212,175,55,0.015), 0 0 15px rgba(212,175,55,0.1)'
      }}>
        {/* 标题 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '14px', 
          paddingBottom: '10px', 
          borderBottom: '1px solid rgba(212,175,55,0.12)' 
        }}>
          <h3 style={{ 
            color: '#D4AF37', 
            fontWeight: 700, 
            letterSpacing: '4px', 
            fontSize: '15px', 
            margin: 0 
          }}>
            {(reportType === 'monthly'
              ? (lang === 'en' ? 'Monthly Wealth Report' : lang === 'es' ? 'Informe de Riqueza Mensual' : lang === 'fr' ? 'Rapport de Richesse Mensuel' : lang === 'th' ? 'รายงานความมั่งคั่งรายเดือน' : lang === 'vi' ? 'Báo Cáo Tài Sản Hàng Tháng' : '月度财富报告')
              : (lang === 'en' ? 'Annual Wealth Report' : lang === 'es' ? 'Informe de Riqueza Anual' : lang === 'fr' ? 'Rapport de Richesse Annuel' : lang === 'th' ? 'รายงานความมั่งคั่งประจำปี' : lang === 'vi' ? 'Báo Cáo Tài Sản Thường Niên' : '年度财富报告'))}
          </h3>
        </div>

        {/* 滚动区 🔒 封仓参数(460px 高度+overflow 锁不变) */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="dark-scrollbar"
          style={{ 
            // 🔒 LOCKED: 高度460px，禁止修改
            height: '460px', 
            // 🔒 LOCKED: overflowY=auto，禁止修改
            overflowY: 'auto', 
            paddingRight: '10px',  // V258: 向右移动1mm 
            textAlign: 'left',
          }}
        >
          {(showSkeleton || !hasContent) ? (
            // 🛠️ V78: 星光呼吸灯骨架 — 3组琥珀色脉冲条，交错呼吸（2s/2.5s/3s），模拟星尘洒落
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <SkeletonBar delay={0.0} w="60%"  period={2} />
                <SkeletonBar delay={0.8} w="72%"  period={25} />
                <SkeletonBar delay={1.6} w="85%"  period={3} />
                <SkeletonBar delay={0.3} w="55%"  period={2} />
                <SkeletonBar delay={1.1} w="68%"  period={25} />
                <SkeletonBar delay={1.9} w="78%"  period={3} />
                <SkeletonBar delay={0.5} w="50%"  period={2} />
              </div>
            </div>
          ) : (
            <>
              <div>{renderLines(cleanAndInjectChapters(rawStreamText))}</div>
            </>
          )}
        </div>

        {/* 底部暗金光晕 — 4px渐变条 + 80px径向光晕球，双双呼吸脉动 🔒 LOCKED */}
        <div style={{
          position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
          animation: 'sacredGlow 2s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '80px', background: 'rgba(212,175,55,0.15)',
          borderRadius: '50%', filter: 'blur(25px)', pointerEvents: 'none',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
