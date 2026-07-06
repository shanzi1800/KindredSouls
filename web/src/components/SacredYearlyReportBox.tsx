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

    // 4. V49新增：双鱼座写成风元素（占星铁律）
    cleaned = cleaned.replace(/风元素（双鱼座太阳）/g, '水元素（双鱼座太阳）');

    // 5. V49新增：双鱼座"擅长信息流"幻觉（双鱼擅长直觉非沟通）
    cleaned = cleaned.replace(/天生擅长“信息的收集与传播”/g, '天生擅长“情感的共鸣与直觉的显化”');
    cleaned = cleaned.replace(/天生擅长信息流与沟通/g, '天生擅长灵感捕捉与直觉共鸣');

    // 6. V49新增：抹除中文里残留的英文尾巴
    cleaned = cleaned.replace(/（\s*negotiation\s*&\s*power\s*direction\s*）/g, '（正南方）');
    cleaned = cleaned.replace(/\(\s*negotiation\s*&\s*power\s*direction\s*\)/g, '(正南方)');

    // 7. 修复宫位移位
    cleaned = cleaned.replace(/进入水瓶座（你的第九宫）/g, '进入水瓶座（你的第八宫·深层资产与转化之宫）');
    cleaned = cleaned.replace(/进入双鱼座（你的第十二宫）/g, '进入双鱼座（你的第九宫·天命远航之宫）');
    cleaned = cleaned.replace(/木星在双鱼座（你的第十二宫）/g, '木星在双鱼座（你的第九宫天命之位）');

    // 8. 章节精美化
    cleaned = cleaned.replace(/现在，让我们踏入第一章。\n第一章：年度宿命财运矩阵/g, '【✦ 第一章：年度宿命财运矩阵 ✦】');
    cleaned = cleaned.replace(/现在，让我们进入每月沙盘.*\n第二章：12个月财富流月精准沙盘/g, '【✦ 第二章：12个月财富流月精准沙盘 ✦】');
    cleaned = cleaned.replace(/第三章：天命破局赛道与副业指南/g, '【✦ 第三章：天命破局赛道与副业指南 ✦】');
    cleaned = cleaned.replace(/第四章：消费黑洞与资产防御盾牌/g, '【✦ 第四章：消费黑洞与资产防御盾牌 ✦】');
    cleaned = cleaned.replace(/第五章：黄金爆发显化锦囊/g, '【✦ 第五章：黄金爆发显化锦囊 ✦】');

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
