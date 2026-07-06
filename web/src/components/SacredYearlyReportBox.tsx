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

  // 清洗Markdown符号
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/^\*\s*/g, '')           // 行首 * 列表符号
      .replace(/^-\s*/g, '')            // 行首 - 列表符号
      .replace(/\*\*/g, '')             // ** 粗体标记
      .replace(/\*/g, '')               // 剩余 *
      .replace(/^#{1,3}\s*/g, '')       // ### 标题标记
      .replace(/^>\s*/g, '')            // > 引用标记
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
    
    // 大标题关键词
    const chapterPatterns = [
      '第一章', '第二章', '第三章', '第四章', '第五章', '最终章',
      '年度财富核心', '先知神谕', '天命破局', '消费黑洞', '黄金爆发',
      '财富流月', '宿命财运', '最终财富', '通关密令', '先知天书',
      '年度宏观定调', '财富爆发指数', '资产熔断风险', '天命显化方位',
      '累进财富通道', '阴影消耗黑洞'
    ];
    if (chapterPatterns.some(p => textWithoutIcon.includes(p))) {
      return { type: 'heading', content: cleanMarkdown(textWithoutIcon), icon };
    }
    
    // 月份/年份
    if (t.match(/^(2026年|2027年|\d{4}-\d{4})/)) {
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

  const renderLines = () => {
    if (!rawStreamText) return null;
    return rawStreamText.split('\n').map((line, idx) => {
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
        .dark-scrollbar::-webkit-scrollbar { width: 5px; }
        .dark-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); border-radius: 3px; }
        .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.35); border-radius: 3px; }
        .dark-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.55); }
      `}</style>

      <div style={{
        position: 'relative', borderRadius: '14px',
        border: '1.5px solid rgba(212,175,55,0.3)',
        background: 'linear-gradient(180deg, rgba(12,14,22,0.98) 0%, rgba(6,7,12,0.99) 100%)',
        padding: '20px', 
        boxShadow: '0 0 30px rgba(0,0,0,0.85), inset 0 0 40px rgba(212,175,55,0.015)'
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
            <div>{renderLines()}</div>
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
