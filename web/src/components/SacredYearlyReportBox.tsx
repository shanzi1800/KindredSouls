// 🛠️ V58: SacredYearlyReportBox - 山子大叔9项修改完整版
// 5.章节金色 6.边框金色+滚动条深色 7.按键金色 8.背景深色 9.标题改"年度财富报告"
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

  // 追光器
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

  // 强制刷新tick
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

  // 解析行 - 增强章节名识别
  const parseLine = (line: string): { type: string; content: string } => {
    const t = line.trim();
    if (!t) return { type: 'empty', content: '' };
    
    // 【✦ 章节名 ✦】格式
    if (t.match(/^【\s*✦.+✦\s*】$/)) {
      return { type: 'chapter', content: t.replace(/【\s*✦\s*|\s*✦\s*】/g, '') };
    }
    
    // Markdown标题 ## 第一章：xxx
    if (t.match(/^#{2,3}\s+/)) {
      return { type: 'heading', content: t.replace(/^#{2,3}\s+/, '') };
    }
    
    // AI输出的章节名（无Markdown标记）
    const chapterPatterns = [
      '第一章', '第二章', '第三章', '第四章', '第五章', '最终章',
      '年度财富核心', '先知神谕', '天命破局', '消费黑洞', '黄金爆发',
      '财富流月', '宿命财运', '最终财富', '通关密令', '先知天书',
      '年度宏观定调', '财富爆发指数', '资产熔断风险', '天命显化方位'
    ];
    if (chapterPatterns.some(p => t.includes(p))) {
      return { type: 'heading', content: t };
    }
    
    // 月份标题
    if (t.match(/^(2026年|2027年|\d{4}-\d{4})/)) {
      return { type: 'subheading', content: t };
    }
    
    if (t === '━━━━━━━━━━━━━━━━━━' || t === '---') return { type: 'divider', content: '' };
    if (t.match(/^\|[-\s|]+\|$/)) return { type: 'skip', content: '' };
    if (t.match(/^\|.+/)) {
      const cells = t.split('|').filter(c => c.trim()).map(c => c.trim());
      return { type: 'table', content: cells.join(' · ') };
    }
    if (t.match(/^🟢|^🔴|^⚠️|^🚀/)) return { type: 'alert', content: t };
    return { type: 'text', content: t };
  };

  const renderBold = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <span key={i} style={{ fontWeight: 700, color: '#D4AF37' }}>{p.slice(2, -2)}</span>
        : <span key={i}>{p}</span>
    );
  };

  const renderLines = () => {
    if (!rawStreamText) return null;
    return rawStreamText.split('\n').map((line, idx) => {
      const { type, content } = parseLine(line);
      if (type === 'empty') return <div key={idx} style={{ height: '6px' }} />;
      if (type === 'skip') return null;
      if (type === 'divider') return (
        <div key={idx} style={{
          height: '1px', margin: '12px 0',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)'
        }} />
      );
      // 章节名 - 金色大标题
      if (type === 'chapter') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '15px', fontWeight: 700,
          textAlign: 'center', letterSpacing: '2px', margin: '18px 0 14px',
          textShadow: '0 0 10px rgba(212,175,55,0.3)'
        }}>
          【✦ {content} ✦】
        </div>
      );
      // 标题 - 金色
      if (type === 'heading') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '14px', fontWeight: 700,
          textAlign: 'center', margin: '16px 0 12px', letterSpacing: '1px'
        }}>
          {content}
        </div>
      );
      // 子标题 - 淡金色
      if (type === 'subheading') return (
        <div key={idx} style={{
          color: 'rgba(212,175,55,0.85)', fontSize: '13px', fontWeight: 600,
          margin: '12px 0 8px', letterSpacing: '0.5px'
        }}>
          {content}
        </div>
      );
      if (type === 'table') return (
        <div key={idx} style={{
          color: 'rgba(255,255,255,0.8)', fontSize: '12px', lineHeight: 1.6,
          marginBottom: '4px', borderBottom: '1px solid rgba(212,175,55,0.1)', paddingBottom: '4px'
        }}>
          {content}
        </div>
      );
      if (type === 'alert') {
        const isG = content.includes('🟢'), isR = content.includes('🔴');
        return (
          <div key={idx} style={{
            color: isG ? 'rgba(16,185,129,0.95)' : isR ? 'rgba(239,68,68,0.95)' : 'rgba(212,175,55,0.9)',
            fontSize: '12px', fontWeight: 600, margin: '8px 0 4px'
          }}>
            {renderBold(content)}
          </div>
        );
      }
      return (
        <div key={idx} style={{
          color: 'rgba(255,255,255,0.88)', fontSize: '12.5px', lineHeight: 1.85, marginBottom: '6px'
        }}>
          {renderBold(content)}
        </div>
      );
    });
  };

  // 骨架屏
  const SkeletonBar = ({ delay, w }: { delay: number; w: string }) => (
    <div style={{
      height: '14px', width: w, marginBottom: '20px', borderRadius: '8px',
      background: 'linear-gradient(90deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
      border: '1px solid rgba(212,175,55,0.05)',
      animation: `sacredPulse 2s ease-in-out ${delay}s infinite`,
    }} />
  );

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px 16px' }}>
      <style>{`
        @keyframes sacredPulse {
          0%, 100% { opacity: 0.15; transform: scaleX(0.97); }
          50% { opacity: 0.85; transform: scaleX(1.03); }
        }
        @keyframes sacredGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        /* 深色滚动条 */
        .dark-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .dark-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.3);
          border-radius: 3px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(212,175,55,0.4);
          border-radius: 3px;
        }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212,175,55,0.6);
        }
      `}</style>

      {/* 暗晶盒子 - 金色边框，深色背景 */}
      <div style={{
        position: 'relative', borderRadius: '16px',
        border: '1.5px solid rgba(212,175,55,0.35)',  // 6. 金色边框
        background: 'linear-gradient(180deg, rgba(10,12,20,0.98) 0%, rgba(5,6,10,0.99) 100%)',  // 8. 深色背景
        padding: '24px', 
        boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(212,175,55,0.02)'
      }}>
        {/* 顶部标题 - 9. 改"年度财富报告"，删除英文 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '16px', 
          paddingBottom: '12px', 
          borderBottom: '1px solid rgba(212,175,55,0.15)' 
        }}>
          <h3 style={{ 
            color: '#D4AF37', 
            fontWeight: 700, 
            letterSpacing: '3px', 
            fontSize: '16px', 
            margin: 0 
          }}>
            年度财富报告
          </h3>
        </div>

        {/* 滚动内容区 - 深色滚动条 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="dark-scrollbar"
          style={{ 
            height: '470px', 
            overflowY: 'auto', 
            paddingRight: '8px', 
            textAlign: 'left',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(212,175,55,0.4) rgba(0,0,0,0.3)'
          }}
        >
          {!hasContent ? (
            <div style={{ padding: '24px 0' }}>
              <SkeletonBar delay={0} w="92%" />
              <SkeletonBar delay={1} w="75%" />
              <SkeletonBar delay={2} w="83%" />
              <SkeletonBar delay={3} w="67%" />
              <SkeletonBar delay={4} w="58%" />
            </div>
          ) : (
            <div>{renderLines()}</div>
          )}
        </div>

        {/* 底部暗金光晕 */}
        <div style={{
          position: 'absolute', bottom: '-2px', left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-35px', left: '50%', transform: 'translateX(-50%)',
          width: '100px', height: '70px', background: 'rgba(212,175,55,0.15)',
          borderRadius: '50%', filter: 'blur(25px)', pointerEvents: 'none',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
