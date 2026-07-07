// 🛠️ V59: 修复Markdown符号残留+排版优化
import React, { useEffect, useRef } from 'react';

const SacredYearlyReportBox: React.FC<{
  rawStreamText: string;
  yearlyCardsReady: boolean;
  realSunSign?: string;
}> = ({ rawStreamText, yearlyCardsReady }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const tickRef = useRef(0);

  const hasContent = rawStreamText && rawStreamText.trim().length > 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (yearlyCardsReady) {
      autoScrollRef.current = false;
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (hasContent && autoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [rawStreamText, yearlyCardsReady, hasContent, tickRef.current]);

  useEffect(() => {
    if (!yearlyCardsReady && hasContent) {
      const iv = setInterval(() => { tickRef.current += 1; }, 300);
      return () => clearInterval(iv);
    }
  }, [yearlyCardsReady, hasContent]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || yearlyCardsReady) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    autoScrollRef.current = atBottom;
  };

  // 🛠️ V64: 军师天启版洗涤滤网 - 6大穿帮矫正
  const cleanAndInjectChapters = (text: string): string => {
    if (!text) return '';
    let cleaned = text;

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

    // 8. V67: 章节精美化（幂等正则，统一输出【✦ 第X章：xxx ✦】兼容手写渲染）
    const advancedUniversalChapterRegex = /(?:【\s*✦\s*|\[\s*✦\s*|)?(?:第\s*([一二三四五六七八九十\d]+)\s*章|Chapter\s*([A-Za-z]+))[:：]?\s*([^✦【\n\]\s]+)(?:\s*✦\s*】|\s*✦\s*\])?/gi;
    cleaned = cleaned.replace(advancedUniversalChapterRegex, (match, p1, p2, title) => {
      const chapterNum = p1 || p2;
      return '\n\n【✦ 第' + chapterNum + '章：' + title.trim() + ' ✦】\n\n';
    });
    // 最终神谕分界线
    cleaned = cleaned.replace(/最终财富神谕 · 通关密令/g, '【✦ 最终财富神谕 · 通关密令 ✦】');

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

  const parseLine = (line: string): { type: string; content: string; icon?: string } => {
    const t = line.trim();
    if (!t) return { type: 'empty', content: '' };
    
    // 检测图标
    const iconMatch = t.match(/^([🚀⚠️🟢🔴💡✨💰📈📉🎯⭐💎🔮✦🔆🔅🔸🔹◆◇]+)\s*/);
    const icon = iconMatch && iconMatch[1] ? iconMatch[1] : '';
    const textWithoutIcon = icon && iconMatch ? t.slice(iconMatch[0].length) : t;
    
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
      '累进财富通道', '阴影消耗黑洞'
    ];
    const isChapterPattern = chapterPatterns.some(p => textWithoutIcon.includes(p));
    const isSectionNumber = textWithoutIcon.match(/^\d+\.\d+/); // 1.4, 2.1 等
    if (isChapterPattern || isSectionNumber) {
      return { type: 'heading', content: cleanMarkdown(textWithoutIcon), icon };
    }
    
    // 月份/年份/章节编号 (1.4, 1.1 等)
    if (t.match(/^(2026年|2027年|\d{4}-\d{4}|\d+\.\d+)/)) {
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
    
    // 警告/提示
    if (t.match(/^🟢|^🔴|^⚠️|^🚀/)) {
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
    return processedText.split('\n').map((line, idx) => {
      const { type, content, icon } = parseLine(line);
      
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
          【✦ {content} ✦】
        </div>
      );
      
      if (type === 'heading') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '13px', fontWeight: 700,
          textAlign: 'center', margin: '14px 0 10px', letterSpacing: '0.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
        }}>
          {icon && <span>{icon}</span>}
          <span>{content}</span>
        </div>
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
        return (
          <div key={idx} style={{
            color: isG ? 'rgba(16,185,129,0.9)' : isR ? 'rgba(239,68,68,0.9)' : 'rgba(212,175,55,0.85)',
            fontSize: '11px', fontWeight: 600, margin: '6px 0 4px', paddingLeft: '12px'
          }}>
            {content}
          </div>
        );
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
  };

  const SkeletonBar = ({ delay, w }: { delay: number; w: string }) => (
    <div style={{
      height: '12px', width: w, marginBottom: '16px', borderRadius: '6px',
      background: 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
      animation: `sacredPulse 2s ease-in-out ${delay}s infinite`,
    }} />
  );

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px 16px' }}>
      <style>{`
        @keyframes sacredPulse {
          0%, 100% { opacity: 0.12; transform: scaleX(0.97); }
          50% { opacity: 0.7; transform: scaleX(1.02); }
        }
        @keyframes sacredGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .dark-scrollbar::-webkit-scrollbar { width: 6px; border-radius: 3px; }
        .dark-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.5); border-radius: 3px; }
        .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.75); border-radius: 3px; }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.9); }
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
            年度财富报告
          </h3>
        </div>

        {/* 滚动区 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="dark-scrollbar"
          style={{ 
            height: '460px', 
            overflowY: 'auto', 
            paddingRight: '6px', 
            textAlign: 'left',
          }}
        >
          {!hasContent ? (
            <div style={{ padding: '20px 0' }}>
              <SkeletonBar delay={0} w="90%" />
              <SkeletonBar delay={1} w="72%" />
              <SkeletonBar delay={2} w="80%" />
              <SkeletonBar delay={3} w="65%" />
              <SkeletonBar delay={4} w="55%" />
            </div>
          ) : (
            <div>{renderLines(cleanAndInjectChapters(rawStreamText))}</div>
          )}
        </div>

        {/* 底部光晕 */}
        <div style={{
          position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '60px', background: 'rgba(212,175,55,0.12)',
          borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
