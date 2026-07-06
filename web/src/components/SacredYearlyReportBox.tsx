// 🛠️ V57: SacredYearlyReportBox - 全inlineStyle五合一，零CSS类依赖
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

  // 解析行
  const parseLine = (line: string): { type: string; content: string } => {
    const t = line.trim();
    if (!t) return { type: 'empty', content: '' };
    if (t.match(/^\【\s*✦.+\✦\s*】$/)) {
      return { type: 'chapter', content: t.replace(/\【\s*✦\s*|\s*✦\s*\】/g, '') };
    }
    if (t.match(/^#{2,3}\s+/)) {
      return { type: 'heading', content: t.replace(/^#{2,3}\s+/, '') };
    }
    if (t === '━━━━━━━━━━━━━━━━━━' || t === '---') return { type: 'divider', content: '' };
    if (t.match(/^\|[-\s|]+\|$/)) return { type: 'skip', content: '' };
    if (t.match(/^\|.+\|/)) {
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
      if (type === 'chapter') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '14px', fontWeight: 700,
          textAlign: 'center', letterSpacing: '2px', margin: '16px 0 12px'
        }}>
          【✦ {content} ✦】
        </div>
      );
      if (type === 'heading') return (
        <div key={idx} style={{
          color: '#D4AF37', fontSize: '13px', fontWeight: 700,
          textAlign: 'center', margin: '14px 0 10px', letterSpacing: '1px'
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

  // 🌌 星光呼吸灯骨架 (inline style, no CSS class needed)
  const SkeletonBar = ({ delay, w }: { delay: number; w: string }) => (
    <div style={{
      height: '14px', width: w, marginBottom: '20px', borderRadius: '8px',
      background: `linear-gradient(90deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))`,
      border: '1px solid rgba(212,175,55,0.05)',
      animation: `sacredPulse 2s ease-in-out ${delay}s infinite`,
    }} />
  );

  return (
    <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto', padding: '8px 16px' }}>
      {/* 全局keyframes */}
      <style>{`
        @keyframes sacredPulse {
          0%, 100% { opacity: 0.15; transform: scaleX(0.97); }
          50% { opacity: 0.85; transform: scaleX(1.03); }
        }
        @keyframes sacredGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* 暗晶盒子 */}
      <div style={{
        position: 'relative', borderRadius: '16px',
        border: '1px solid rgba(212,175,55,0.2)',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(10,10,15,0.98) 100%)',
        padding: '24px', boxShadow: '0 0 60px rgba(0,0,0,0.95)',
      }}>
        {/* 顶部标题 */}
        <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h3 style={{ color: '#D4AF37', fontWeight: 700, letterSpacing: '2px', fontSize: '15px', margin: 0 }}>
            ✦ 先知天书 · 财富天启 ✦
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '1px', margin: '4px 0 0' }}>
            TARGET: 1995-03-08 | STATE: {yearlyCardsReady ? 'SEALED ✨' : 'STREAMING 🔮'}
          </p>
        </div>

        {/* 滚动区 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ height: '470px', overflowY: 'auto', paddingRight: '4px', textAlign: 'left' }}
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
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)',
          width: '80px', height: '80px', background: 'rgba(212,175,55,0.2)',
          borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none',
          animation: 'sacredGlow 3s ease-in-out infinite',
        }} />
      </div>
    </div>
  );
};

export default SacredYearlyReportBox;
